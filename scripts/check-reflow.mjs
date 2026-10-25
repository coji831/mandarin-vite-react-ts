#!/usr/bin/env node
/**
 * check-reflow.mjs — WCAG 1.4.10 reflow, asserted on the box that actually scrolls.
 *
 * Gate 3 (`design-lead-ruling.md` § Success gate 3) asks for "reflow at 200% and
 * 320px". The assertion the branch first used — `document.scrollingElement
 * .scrollWidth <= clientWidth` — CANNOT FAIL on this app shell: `globals.css`
 * locks `html, body` to `height: 100dvh; overflow: hidden`, so the root has no
 * scrollable overflow by construction. It printed 16/16 while `.app-content` was
 * clipping 388 elements (S8 receipt § 1). A gate that cannot fail is the F8 class.
 *
 * This script measures `.app-content` — the real content box — at a 320px
 * viewport and at a 640px layout viewport (= 200% zoom on a 1280px window,
 * `deviceScaleFactor: 2`), and prints every failure. Pages on the standalone
 * layout (readers) have no `.app-content`; they fall back to `.page-shell` and
 * the box used is printed per row, so no reading is silently taken elsewhere.
 *
 * It is a RATCHET, not a report: it exits 1 while any failure stands. Do not
 * widen the box, do not soften the assertion, do not move the goalposts to the
 * document root. The five 320px failures it prints are N1b/N1c, ruled debt for a
 * future epic (`design-lead-s8-ruling.md` § Debt records E2/E3) — they are SUPPOSED
 * to stay red here until that layout work lands.
 *
 * Usage:
 *   node scripts/check-reflow.mjs                 # boots storybook dev itself
 *   node scripts/check-reflow.mjs --base <url>    # use an already-running Storybook
 *   node scripts/check-reflow.mjs --port 6007
 */
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FRONTEND = path.join(ROOT, "apps", "frontend");
const require = createRequire(path.join(FRONTEND, "package.json"));

const argv = process.argv.slice(2);
const argValue = (name, fallback) => {
  const i = argv.indexOf(name);
  return i === -1 ? fallback : argv[i + 1];
};
const PORT = Number(argValue("--port", "6007"));
const GIVEN_BASE = argValue("--base", null);
const BASE = GIVEN_BASE ?? `http://127.0.0.1:${PORT}`;

/** Both are layout viewports. 640px CSS == 200% zoom on a 1280px window. */
const VIEWPORTS = [
  { label: "320px", width: 320, height: 640, deviceScaleFactor: 1 },
  { label: "200%", width: 640, height: 900, deviceScaleFactor: 2 },
];

/** Content box in priority order; the fallback exists only for the standalone layout. */
const BOXES = [".app-content", ".page-shell", "main", "#storybook-root"];

const inventory = JSON.parse(readFileSync(path.join(ROOT, ".github", "page-inventory.json"), "utf8"));
const ledger = Array.isArray(inventory) ? inventory : (inventory.pages ?? inventory.entries ?? []);
const routeStories = ledger
  .filter((e) => e && e.story && e.route)
  .map((e) => ({
    route: e.route,
    storyFile: e.story,
    key: e.story.includes("/src/") ? e.story.slice(e.story.indexOf("/src/")) : e.story,
  }));

/** States whose content is populated — the ones a reflow reading means anything on. */
const NON_POPULATED = /loading|error|empty/i;

const norm = (p) => p.replace(/\\/g, "/").split("#")[0];

/**
 * Every populated story of a route is measured and the WORST reading is the route's.
 * A single "preferred" state was tried first and under-measured exactly where it
 * matters (`/` fell back to its `Loading` story and printed 245/245 while a populated
 * state overflows at 312): a gate that picks the emptiest state is the same defect as
 * a gate that measures the wrong box.
 */
function storiesFor(entries, key) {
  const all = entries
    .filter((e) => e.type === "story" && norm(e.importPath).endsWith(key))
    .map((e) => ({ id: e.id, name: e.name }));
  const populated = all.filter((s) => !NON_POPULATED.test(s.name));
  return populated.length ? populated : all;
}

async function waitForServer(url, timeoutMs = 180_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const res = await fetch(`${url}/index.json`);
      if (res.ok) return await res.json();
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`storybook did not serve ${url}/index.json within ${timeoutMs}ms`);
}

async function main() {
  const { chromium } = require("playwright");
  let server = null;
  const base = GIVEN_BASE ?? BASE;
  let index;

  if (!GIVEN_BASE) {
    const bin = path.join(path.dirname(require.resolve("storybook/package.json")), "dist/bin/dispatcher.js");
    server = spawn(process.execPath, [bin, "dev", "-p", String(PORT), "--ci", "--quiet", "--no-open"], {
      cwd: FRONTEND,
      stdio: "ignore",
      env: { ...process.env, BROWSER: "none", STORYBOOK_DISABLE_TELEMETRY: "1" },
    });
    index = await waitForServer(base);
  } else {
    index = await waitForServer(base, 15_000);
  }

  const entries = index.entries
    ? Array.isArray(index.entries)
      ? index.entries
      : Object.values(index.entries)
    : [];

  const browser = await chromium.launch();
  const results = [];
  try {
    for (const viewport of VIEWPORTS) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        deviceScaleFactor: viewport.deviceScaleFactor,
      });
      const page = await context.newPage();
      for (const rs of routeStories) {
        const stories = storiesFor(entries, rs.key);
        if (stories.length === 0) {
          results.push({ route: rs.route, viewport: viewport.label, outcome: "no-story" });
          continue;
        }
        let worst = null;
        let unrenderable = 0;
        for (const story of stories) {
          await page.goto(`${base}/iframe.html?id=${story.id}&viewMode=story`, {
            waitUntil: "domcontentloaded",
          });
          let reading = null;
          try {
            await page.waitForFunction(
              () => {
                const root = document.querySelector("#storybook-root");
                return !!root && root.children.length > 0;
              },
              null,
              { timeout: 20_000 },
            );
            await page.evaluate(() => document.fonts?.ready);
            // Settle: deep-linked tabs (`?tab=tones`) swap their panel after data
            // resolves; measuring before that reads the previous panel (a 940px
            // overflow went missing once for exactly this reason).
            await page.waitForTimeout(400);
            reading = await page.evaluate((boxes) => {
              for (const sel of boxes) {
                const el = document.querySelector(sel);
                if (!el) continue;
                return { box: sel, scrollWidth: el.scrollWidth, clientWidth: el.clientWidth };
              }
              return null;
            }, BOXES);
          } catch {
            unrenderable += 1;
            continue;
          }
          if (!reading) {
            unrenderable += 1;
            continue;
          }
          const overflow = reading.scrollWidth - reading.clientWidth;
          if (!worst || overflow > worst.overflow) {
            worst = { ...reading, overflow, story: story.id, name: story.name };
          }
        }
        if (!worst) {
          results.push({ route: rs.route, viewport: viewport.label, outcome: "unrenderable" });
          continue;
        }
        results.push({
          route: rs.route,
          viewport: viewport.label,
          story: worst.story,
          storyName: worst.name,
          box: worst.box,
          scrollWidth: worst.scrollWidth,
          clientWidth: worst.clientWidth,
          worstOf: stories.length,
          unrenderable,
          outcome: worst.overflow <= 0 ? "pass" : "fail",
        });
      }
      await context.close();
    }
  } finally {
    await browser.close();
    if (server) {
      server.kill();
    }
  }

  for (const r of results) {
    if (r.outcome === "pass") {
      console.log(
        `  ${r.route.padEnd(26)} ${r.viewport.padEnd(6)} ${r.scrollWidth}/${r.clientWidth} ok    (worst of ${r.worstOf}: ${r.storyName})`,
      );
    } else if (r.outcome === "fail") {
      console.log(
        `  ${r.route.padEnd(26)} ${r.viewport.padEnd(6)} ${r.scrollWidth}/${r.clientWidth} FAIL  (worst of ${r.worstOf}: ${r.storyName})`,
      );
    } else {
      console.log(`  ${r.route.padEnd(26)} ${r.viewport.padEnd(6)} ${r.outcome.toUpperCase()}`);
    }
  }

  const summary = VIEWPORTS.map((v) => {
    const rows = results.filter((r) => r.viewport === v.label);
    const measured = rows.filter((r) => r.outcome === "pass" || r.outcome === "fail");
    const fails = measured.filter((r) => r.outcome === "fail").map((r) => r.route);
    const broken = rows.filter((r) => r.outcome !== "pass" && r.outcome !== "fail").map((r) => r.route);
    const pass = measured.length - fails.length;
    let out = `${v.label} ${pass}/${measured.length} pass, ${fails.length} FAIL`;
    if (fails.length) out += ` — ${fails.join(", ")}`;
    if (broken.length) out += `  [${broken.length} not measurable — ${broken.join(", ")}]`;
    return out;
  });

  const boxes = [...new Set(results.map((r) => r.box).filter(Boolean))];
  console.log(`\nreflow: box=${boxes.join("|") || "(none)"}  ${summary.join("  ")}`);

  const failed = results.some((r) => r.outcome !== "pass");
  if (failed) {
    console.log(
      "\nreflow: RATCHET RED — the failures above are N1b/N1c debt (design-lead-s8-ruling.md § Debt\n" +
        "records E2/E3). They clear when the layout work lands, not by relaxing this assertion.",
    );
  }
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error(`reflow: ERROR — ${err?.message ?? err}`);
  process.exit(2);
});
