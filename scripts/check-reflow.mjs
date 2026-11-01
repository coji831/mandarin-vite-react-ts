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
 * An empty denominator is not a pass. If the page ledger selects no route to
 * measure, the gate exits 1 before it spawns Storybook and says which ledger it
 * read, how many entries carry `route` and how many carry `story`. It measured
 * nothing, so it proved nothing: staying quiet is the F8 class again, one level
 * up — the gate spent its boot time to report on no pages at all.
 *
 * The same holds per viewport: a viewport that returned no reading prints
 * `0 measured — NOTHING PROVED`, never a fraction, and reddens the run by itself.
 *
 * Exit: 0 = every measured page fits; 1 = a failure stands, or nothing was
 *       measured; 2 = the run itself broke (Storybook never served, browser
 *       failed to launch).
 *
 * Usage:
 *   node scripts/check-reflow.mjs                    # boots storybook dev itself
 *   node scripts/check-reflow.mjs --base <url>       # use an already-running Storybook
 *   node scripts/check-reflow.mjs --port 6007
 *   node scripts/check-reflow.mjs --inventory <path> # read another page ledger
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

/** Fail closed: no reading is not a pass (`check-spine-parity.mjs` uses the same shape). */
const die = (code, message) => {
  console.error(message);
  process.exit(code);
};

/** Ledger is injectable so the guard can be proved against a fixture outside the repo. */
const LEDGER_ARG = argValue("--inventory", null);
const LEDGER_PATH = LEDGER_ARG
  ? path.resolve(ROOT, LEDGER_ARG)
  : path.join(ROOT, ".github", "page-inventory.json");
const LEDGER_REL = path.relative(ROOT, LEDGER_PATH).replace(/\\/g, "/");
/** Name the file actually read: repo-relative inside the repo, absolute outside it. */
const LEDGER_NAME =
  LEDGER_REL === "" || LEDGER_REL.startsWith("..") || path.isAbsolute(LEDGER_REL)
    ? LEDGER_PATH
    : LEDGER_REL;

/** A ledger that cannot be read broke the run, not the pages: exit 2, one line, no trace. */
function readLedger() {
  let raw;
  try {
    raw = readFileSync(LEDGER_PATH, "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") {
      die(2, `❌ reflow: no ledger at ${LEDGER_NAME} — fail closed, nothing was measured.`);
    }
    die(
      2,
      `❌ reflow: cannot read ${LEDGER_NAME} (${error?.code ?? error?.message}) — fail closed.`,
    );
  }
  try {
    return JSON.parse(raw);
  } catch (error) {
    die(2, `❌ reflow: ${LEDGER_NAME} is not valid JSON (${error?.message}) — fail closed.`);
  }
}

const inventory = readLedger();
const ledger = Array.isArray(inventory) ? inventory : (inventory.pages ?? inventory.entries ?? []);
const routeStories = ledger
  .filter((e) => e && e.story && e.route)
  .map((e) => ({
    route: e.route,
    storyFile: e.story,
    key: e.story.includes("/src/") ? e.story.slice(e.story.indexOf("/src/")) : e.story,
  }));

if (routeStories.length === 0) {
  const withRoute = ledger.filter((e) => e && e.route).length;
  const withStory = ledger.filter((e) => e && e.story).length;
  die(
    1,
    [
      `❌ reflow: nothing to measure — ${LEDGER_NAME} has ${ledger.length} entries, ` +
        `${withRoute} carrying \`route\`, ${withStory} carrying \`story\`, 0 selected.`,
      "   Precondition: the selector requires BOTH `story` and `route`; `route` alone selects nothing.",
      "   Cause: page stories were retired on purpose (`scripts/check-page-inventory.mjs` header),",
      "   so no entry carries `story`, none can be selected, and storybook was not started.",
      "   Repair: this ratchet needs a new measurement source — page-level measurement through a",
      "   served app (jsdom has no layout). That is its own batch, not a ledger edit.",
      "   Do NOT silence this by re-adding `story` keys to the ledger: a denominator made green by",
      "   hand proves nothing. No reading is not a pass.",
    ].join("\n"),
  );
}

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
    const bin = path.join(
      path.dirname(require.resolve("storybook/package.json")),
      "dist/bin/dispatcher.js",
    );
    server = spawn(
      process.execPath,
      [bin, "dev", "-p", String(PORT), "--ci", "--quiet", "--no-open"],
      {
        cwd: FRONTEND,
        stdio: "ignore",
        env: { ...process.env, BROWSER: "none", STORYBOOK_DISABLE_TELEMETRY: "1" },
      },
    );
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

  // A fraction over a zero denominator reads as success: "0/0 pass" said "pass" about
  // nothing. A viewport that returned no reading states the zero instead, and reddens the
  // run below — the denominator is part of the claim, so it cannot be left to resolve.
  const perViewport = VIEWPORTS.map((v) => {
    const rows = results.filter((r) => r.viewport === v.label);
    const measured = rows.filter((r) => r.outcome === "pass" || r.outcome === "fail");
    const fails = measured.filter((r) => r.outcome === "fail").map((r) => r.route);
    const broken = rows
      .filter((r) => r.outcome !== "pass" && r.outcome !== "fail")
      .map((r) => r.route);
    const pass = measured.length - fails.length;
    let text =
      measured.length === 0
        ? `${v.label} 0 measured — NOTHING PROVED`
        : `${v.label} ${pass}/${measured.length} pass, ${fails.length} FAIL`;
    if (fails.length) text += ` — ${fails.join(", ")}`;
    if (broken.length) text += `  [${broken.length} not measurable — ${broken.join(", ")}]`;
    return { label: v.label, measured: measured.length, text };
  });

  const boxes = [...new Set(results.map((r) => r.box).filter(Boolean))];
  // The ledger is named here too: with `--inventory`, a green reading is only worth what
  // the file it came from is worth, so the evidence line carries its own source.
  console.log(
    `\nreflow: ledger=${LEDGER_NAME} box=${boxes.join("|") || "(none)"}  ${perViewport.map((v) => v.text).join("  ")}`,
  );

  const failures = results.filter((r) => r.outcome === "fail");
  const failed = results.some((r) => r.outcome !== "pass");
  // The debt note explains N1b/N1c overflows. It must not be printed over rows that
  // never produced a reading: those are a broken instrument, not ruled debt.
  if (failures.length) {
    console.log(
      "\nreflow: RATCHET RED — the failures above are N1b/N1c debt (design-lead-s8-ruling.md § Debt\n" +
        "records E2/E3). They clear when the layout work lands, not by relaxing this assertion.",
    );
  }

  const empty = perViewport.filter((v) => v.measured === 0).map((v) => v.label);
  if (empty.length) {
    console.log(
      `\nreflow: RATCHET RED — ${empty.join(", ")} measured 0 rows, so there is no reading to report\n` +
        "and nothing is proved for that viewport. A viewport with an empty denominator cannot be green.",
    );
  }
  process.exit(failed || empty.length ? 1 : 0);
}

main().catch((err) => {
  console.error(`reflow: ERROR — ${err?.message ?? err}`);
  process.exit(2);
});
