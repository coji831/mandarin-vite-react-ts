#!/usr/bin/env node

/**
 * design-audit-foundation.mjs — the spine design-audit, served in two modes.
 *
 * WHY THIS EXISTS
 *   spine is the source of truth for the design system, including the page-anatomy
 *   law's rules. This script runs spine's own `design-audit` gate (never a local
 *   copy of the rules). It has two modes:
 *
 *   FOUNDATION (default) — fails on the page-anatomy family plus two repo laws:
 *     - missing-layout-token      hardcoded max-width in a page container
 *     - page-scoped-layout-css    hand-rolled `margin: ... auto` page wrapper
 *     - page-scoped-grid          page-defined grid-template-columns
 *     - mode-chrome               ledger mode/chrome consistency + AppLayout
 *                                 wiring (Focus = collapsed rail + recessed
 *                                 top bar; Browse = expanded + standard)
 *     - session-modal             a <Modal> hosting a learning session
 *     - session-route             the session dispatcher reachable only through
 *                                 a routed `detail` page (session = route)
 *   Everything else spine's audit reports (tone, elevation, inline styles, dead CSS,
 *   undefined classes) stays out of this gate: those are feature-level sweeps, and
 *   gating them here would fail every PR on pre-existing debt.
 *   Scope is the foundation, per step 6 of the spine arc: tokens + page anatomy +
 *   enforcement. Per-page restyling and component-by-component migration are NOT
 *   this gate's business.
 *
 *   FULL (`--full`) — spine's gate with NO rule filter. This is what
 *   `npm run design-audit` runs since S6 (2026-10-24): it replaced the 1,866-line
 *   local fork `tools/design-audit.mjs`, which was deleted only after this mode was
 *   proven to reproduce the fork's findings byte for byte (250/436/686, identical
 *   1,381 output lines, S6 receipt).
 *
 * THE STANDING FLOOR (do not re-derive, do not read as a ceiling)
 *   249/436/685 — pinned at S10 (2026-10-25: −1, the utility-duplicate on
 *   .shadow-sm cleared with its map key, see design-lead-s10-precondition-ruling.md § 3.3)
 *   250/436/686 (S3, 2026-10-24: +3 visibility, see design-lead-s3-ruling.md § D3)
 *   That is a pinned, dated, attributed number: it rose from 247 by three rows that
 *   named pre-existing code, not by a regression. It is a ratchet floor, never a
 *   budget — "<= 250" is not a statement this line authorises.
 *
 * USAGE
 *   npm run design-audit              -> --full against apps/frontend/src
 *   npm run design-audit:foundation   -> foundation mode (page-anatomy only)
 *   node tools/design-audit-foundation.mjs [targetDir]          (foundation)
 *   node tools/design-audit-foundation.mjs --full [targetDir]   (full audit)
 *   Flags other than --full (--regenerate-baseline, --check-baseline-shrink) are
 *   forwarded to spine's gate unchanged.
 *
 * ENVIRONMENT
 *   SPINE_ROOT   path to the spine checkout (default C:/CodeProjects/Personal/spine).
 *                spine is a local checkout, not a published package, so a CI runner
 *                without it cannot run this gate; the script says so and exits 2
 *                instead of silently passing.
 *   SPINE_AUDIT_DEFAULT / SPINE_STYLES_DIR / SPINE_AUDIT_BASELINE are set by this
 *   script for both modes; spine documents them in packages/gates/README.md.
 *
 * EXIT CODES
 *   foundation: 0 = no page-anatomy, mode/chrome or session/route findings;
 *               1 = findings; 2 = gate unusable
 *   full:       spine's own exit code (1 whenever any error remains — the assertion
 *               there is the number, not the code); 2 = gate unusable
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SPINE_ROOT = process.env.SPINE_ROOT || "C:/CodeProjects/Personal/spine";
const SPINE_GATE = path.join(SPINE_ROOT, "packages", "gates", "design-audit.mjs");

// spine's descriptions are the stable contract here; the check names are not printed.
const ANATOMY_RULES = [
  { name: "missing-layout-token", prefix: "Hardcoded page measure" },
  { name: "page-scoped-layout-css", prefix: "Page-wrapper auto-centering" },
  { name: "page-scoped-grid", prefix: "Page-defined grid" },
];

if (!fs.existsSync(SPINE_GATE)) {
  console.error(
    [
      "",
      `spine checkout not found at ${SPINE_ROOT}.`,
      "This gate runs spine's own design-audit, so it needs the spine repo present.",
      "Set SPINE_ROOT to the checkout, or wire the spine MCP (see .vscode/mcp.json).",
      "",
    ].join("\n"),
  );
  process.exit(2);
}

const argv = process.argv.slice(2);
const target = argv.find((a) => !a.startsWith("--")) || "apps/frontend/src";
// `--full` is the only flag this wrapper consumes; everything else belongs to
// spine's gate (--regenerate-baseline, --check-baseline-shrink).
const FULL = argv.includes("--full");
const spineArgs = argv.filter((a) => a !== "--full");
if (spineArgs.length === 0) spineArgs.push(target);

const run = spawnSync(process.execPath, [SPINE_GATE, ...spineArgs], {
  cwd: ROOT,
  encoding: "utf8",
  env: {
    ...process.env,
    SPINE_AUDIT_DEFAULT: target,
    SPINE_STYLES_DIR: path.join(ROOT, "apps/frontend/src/styles"),
    SPINE_AUDIT_BASELINE: path.join(ROOT, "tools/design-audit.class-baseline.json"),
  },
  maxBuffer: 64 * 1024 * 1024,
});

if (run.error) {
  console.error(`Could not run spine's design-audit: ${run.error.message}`);
  process.exit(2);
}

const stdout = run.stdout ?? "";
const stderr = run.stderr ?? "";

// spine's audit prints one block per finding:
//   ❌ <file>:<line>
//      error: <description>: "<match>"
const findings = [];
let current = null;
for (const rawLine of stdout.split(/\r?\n/)) {
  const line = rawLine.replace(/\s+$/, "");
  const head = line.match(/^(?:❌|⚠️)\s+(.+):(\d+)$/);
  if (head) {
    current = { file: head[1], line: Number(head[2]), severity: "", message: "" };
    continue;
  }
  const body = line.match(/^\s+(error|warning):\s+(.*)$/);
  if (body && current) {
    current.severity = body[1];
    current.message = body[2];
    findings.push(current);
    current = null;
  }
}

const isAnatomy = (f) => ANATOMY_RULES.find((r) => f.message.startsWith(r.prefix));
const anatomyFindings = findings.filter(isAnatomy);

// ─── Mode/chrome check (foundation mode only — PinyinPal-specific) ──────────
//
// The page-anatomy rules above cover the WIDTH consequence of an archetype.
// The dual-mode chrome law (page-archetypes.md §0) covers the MODE/CHROME
// consequence: Focus = rail collapsed + recessed top bar, Browse = rail
// expanded + standard top bar, auth = no rail. Mode is derived from the page's
// archetype, never per-page taste.
//
// This check is NOT spine's — it is the repo's own gate for the unimplemented
// half of the design system. It verifies three things:
//   1. the ledger's `mode`/`chrome` fields are consistent with its archetype
//      (a Focus route declaring an expanded rail is a finding; a Browse route
//      declaring a recessed top bar is a finding);
//   2. the frontend route→archetype table (pageChrome.ts) resolves every
//      conforms route to the same mode as the ledger;
//   3. AppLayout actually wires the mode into SideNav collapse + AppTopBar
//      variant (the rail/topbar chrome the law demands).

const INVENTORY_PATH = path.join(ROOT, ".github", "page-inventory.json");
const PAGE_CHROME_PATH = path.join(
  ROOT,
  "apps",
  "frontend",
  "src",
  "shared",
  "constants",
  "pageChrome.ts",
);
const APP_LAYOUT_PATH = path.join(
  ROOT,
  "apps",
  "frontend",
  "src",
  "shared",
  "layouts",
  "AppLayout.tsx",
);

const FOCUS_ARCHETYPES = new Set(["detail", "wizard"]);

function modeForArchetype(archetype) {
  if (archetype == null) return null;
  if (archetype === "auth") return "auth";
  if (FOCUS_ARCHETYPES.has(archetype)) return "focus";
  return "browse";
}

function chromeForArchetype(archetype) {
  const mode = modeForArchetype(archetype);
  if (mode == null) return null;
  if (mode === "focus") return { rail: "collapsed", topbar: "recessed" };
  if (mode === "auth") return { rail: "none", topbar: "standard" };
  return { rail: "expanded", topbar: "standard" };
}

/** Parse the `ROUTE_ARCHETYPES` literals from pageChrome.ts (path + archetype). */
function parseRouteTable(source) {
  const entries = [];
  const re =
    /path:\s*["'`]([^"'`]+)["'`]\s*,\s*(exact:\s*(?:true|false)\s*,\s*)?archetype:\s*["']([a-z-]+)["']/g;
  let m;
  while ((m = re.exec(source)) !== null) {
    entries.push({ path: m[1], exact: m[2] ? /true/.test(m[2]) : false, archetype: m[3] });
  }
  return entries;
}

/** Resolve a pathname against the parsed frontend route table (exact first, then longest prefix). */
function resolveFrontendMode(entries, pathname) {
  const exact = entries.find((r) => r.exact && pathname === r.path);
  if (exact) return modeForArchetype(exact.archetype);
  const prefix = entries
    .filter((r) => !r.exact)
    .sort((a, b) => b.path.length - a.path.length)
    .find((r) => pathname.startsWith(r.path));
  return modeForArchetype(prefix?.archetype ?? "overview");
}

function lineOf(source, needle) {
  const idx = source.indexOf(needle);
  if (idx === -1) return -1;
  return source.slice(0, idx).split("\n").length;
}

function runChromeCheck() {
  const chromeFindings = [];

  if (
    !fs.existsSync(INVENTORY_PATH) ||
    !fs.existsSync(PAGE_CHROME_PATH) ||
    !fs.existsSync(APP_LAYOUT_PATH)
  ) {
    chromeFindings.push({
      file: "mode/chrome gate",
      line: 0,
      message:
        "missing a chrome-check input (page-inventory.json, pageChrome.ts, or AppLayout.tsx)",
    });
    return chromeFindings;
  }

  const inventory = JSON.parse(fs.readFileSync(INVENTORY_PATH, "utf-8"));
  const pageChromeSource = fs.readFileSync(PAGE_CHROME_PATH, "utf-8");
  const appLayoutSource = fs.readFileSync(APP_LAYOUT_PATH, "utf-8");
  const pages = Array.isArray(inventory.pages) ? inventory.pages : [];

  // 1. Ledger self-consistency (per conforms entry).
  for (const page of pages) {
    if (page.status !== "conforms" || page.archetype == null) continue;
    const expectedMode = modeForArchetype(page.archetype);
    const expectedChrome = chromeForArchetype(page.archetype);
    if (page.mode !== expectedMode) {
      chromeFindings.push({
        file: INVENTORY_PATH,
        line: pages.indexOf(page) + 1,
        message: `route "${page.route}" (archetype ${page.archetype}) declares mode "${page.mode}" but must declare "${expectedMode}" (mode derives from archetype)`,
      });
    }
    if (
      !page.chrome ||
      page.chrome.rail !== expectedChrome.rail ||
      page.chrome.topbar !== expectedChrome.topbar
    ) {
      chromeFindings.push({
        file: INVENTORY_PATH,
        line: pages.indexOf(page) + 1,
        message: `route "${page.route}" (archetype ${page.archetype}) declares chrome ${JSON.stringify(page.chrome)} but must declare ${JSON.stringify(expectedChrome)}`,
      });
    }
  }

  // 2. Frontend route→archetype parity vs the ledger.
  const routeEntries = parseRouteTable(pageChromeSource);
  if (routeEntries.length === 0) {
    chromeFindings.push({
      file: PAGE_CHROME_PATH,
      line: lineOf(pageChromeSource, "ROUTE_ARCHETYPES"),
      message: "pageChrome.ts route→archetype table could not be parsed (format changed?)",
    });
  } else {
    for (const page of pages) {
      if (page.status !== "conforms" || page.archetype == null) continue;
      const frontendMode = resolveFrontendMode(routeEntries, page.route);
      if (frontendMode !== page.mode) {
        chromeFindings.push({
          file: PAGE_CHROME_PATH,
          line: lineOf(pageChromeSource, `path: "${page.route}"`),
          message: `route "${page.route}" resolves to mode "${frontendMode}" in pageChrome.ts but the ledger says "${page.mode}" — the layout would render the wrong chrome`,
        });
      }
    }
  }

  // 3. AppLayout wiring — the layout must derive the mode and apply it to both
  //    the rail collapse and the top bar variant.
  const hasResolve = appLayoutSource.includes("resolvePageMode");
  const hasChrome = appLayoutSource.includes("chromeForMode");
  const hasRailCollapse = /collapsed=\{[^}]*isFocusMode/.test(appLayoutSource);
  const hasTopbarVariant = /variant=\{[^}]*recessed/.test(appLayoutSource);
  if (!hasResolve || !hasChrome || !hasRailCollapse || !hasTopbarVariant) {
    chromeFindings.push({
      file: APP_LAYOUT_PATH,
      line: Math.max(
        lineOf(appLayoutSource, "resolvePageMode"),
        lineOf(appLayoutSource, "chromeForMode"),
        1,
      ),
      message:
        "AppLayout must wire mode into the chrome: derive via resolvePageMode/chromeForMode, collapse the rail in focus mode, and pass the recessed variant to AppTopBar",
    });
  }

  return chromeFindings;
}

// ─── Session/route check (session = route, not modal — S2) ──────────────────
//
// The revalidation contract (docs/guides/design/design-revalidation-guide.md §4)
// says a surface that IS a learning session is a routed `detail`/Focus surface,
// and a modal may host only a transient action (confirm, quota prompt, quick
// reveal that is not itself a session). "Session = route" must fail the gate,
// not be a convention, so this check machine-enforces both halves:
//
//   session-modal — no <Modal> may wrap a session surface. Session surfaces are
//                   derived, not hand-listed: every entity hub in
//                   entityHubRegistry.tsx, the hub dispatcher (LexicalHubRouter),
//                   and any JSX tag whose name ends in Hub / DetailContent /
//                   Session / SessionView / DetailScreen.
//   session-route — the dispatcher must be reached THROUGH a route: the app
//                   shell must not mount it, the router must register the hub
//                   route, pageChrome must declare that route `detail` (→ Focus
//                   chrome), and the page rendering it must use PageShell(detail)
//                   with no overlay inside.
//
// WHAT THE HUMAN RUBRIC STILL CATCHES (design-quality-rubric.md): a session
// rendered inline in a Browse page — a third mode with no modal at all; a
// session whose component name carries no session vocabulary; and a "quick
// reveal" that has quietly grown into a session. Those need a reviewer.

const SRC_DIR = path.join(ROOT, "apps", "frontend", "src");
const ENTITY_REGISTRY_PATH = path.join(SRC_DIR, "features", "lexical-hub", "entityHubRegistry.tsx");
const ROUTER_DIR = path.join(SRC_DIR, "router");
const SESSION_PAGE_PATH = path.join(SRC_DIR, "pages", "learn", "hub", "LexicalEntityPage.tsx");
const HUB_ROUTE_BASE = "/learn/hub";

/** Session vocabulary: a tag with one of these suffixes can only be a session body. */
const SESSION_TAG_RE = /(?:Hub|DetailContent|Session|SessionView|DetailScreen)$/;

function walkSourceFiles(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === "__tests__") continue;
      walkSourceFiles(full, out);
    } else if (/\.(tsx|jsx)$/.test(entry.name)) {
      // Stories intentionally demo components in isolation and are excluded.
      if (/\.stories\.tsx$/.test(entry.name)) continue;
      out.push(full);
    }
  }
  return out;
}

/** Session-surface names: the registry's hubs plus the dispatcher. */
function collectSessionSurfaces() {
  const names = new Set(["LexicalHubRouter"]);
  if (fs.existsSync(ENTITY_REGISTRY_PATH)) {
    const source = fs.readFileSync(ENTITY_REGISTRY_PATH, "utf-8");
    // lazy(() => import("…").then((m) => ({ default: m.CharacterHub })))
    const re = /\bm\.([A-Z][A-Za-z0-9]*)/g;
    let match;
    while ((match = re.exec(source)) !== null) names.add(match[1]);
  }
  return names;
}

/** The JSX block of every <Modal> in the source (definition site excluded). */
function findModalBlocks(source) {
  const blocks = [];
  const open = /<Modal\b/g;
  let match;
  while ((match = open.exec(source)) !== null) {
    const start = match.index;
    const close = source.indexOf("</Modal>", start);
    blocks.push({
      index: start,
      text: source.slice(start, close === -1 ? source.length : close + "</Modal>".length),
    });
  }
  return blocks;
}

function runSessionModalCheck() {
  const findings = [];
  const sessionSurfaces = collectSessionSurfaces();

  for (const file of walkSourceFiles(SRC_DIR)) {
    if (path.basename(file).startsWith("Modal.")) continue; // the Modal component itself
    const source = fs.readFileSync(file, "utf-8");
    if (!source.includes("<Modal")) continue;

    for (const block of findModalBlocks(source)) {
      const tags = [...block.text.matchAll(/<([A-Z][A-Za-z0-9_]*)/g)].map((m) => m[1]);
      const hosted = tags.filter((tag) => sessionSurfaces.has(tag) || SESSION_TAG_RE.test(tag));
      if (hosted.length === 0) continue;
      const line = source.slice(0, block.index).split("\n").length;
      findings.push({
        file,
        line,
        message:
          `a <Modal> hosts a session surface (${[...new Set(hosted)].join(", ")}) — ` +
          "a learning session must be a routed `detail` surface, not an overlay " +
          '(design-revalidation-guide §4 "session = route, not modal")',
      });
    }
  }

  return findings;
}

function runSessionRouteCheck() {
  const findings = [];
  const add = (file, line, message) => findings.push({ file, line, message });

  // 1. The app shell must not mount the dispatcher — that is the overlay wiring
  //    this rule removed.
  if (!fs.existsSync(APP_LAYOUT_PATH)) {
    add(
      APP_LAYOUT_PATH,
      1,
      "missing AppLayout.tsx — cannot verify the shell renders no hub overlay",
    );
  } else {
    const shell = fs.readFileSync(APP_LAYOUT_PATH, "utf-8");
    if (shell.includes("LexicalHubRouter") || shell.includes("entityHubRegistry")) {
      add(
        APP_LAYOUT_PATH,
        Math.max(lineOf(shell, "LexicalHubRouter"), lineOf(shell, "entityHubRegistry"), 1),
        "AppLayout mounts the lexical session dispatcher — a session must be a routed detail surface, not an app-shell overlay",
      );
    }
  }

  // 2. The router must register the hub route.
  const routerFiles = walkSourceFiles(ROUTER_DIR).filter((f) => fs.existsSync(f));
  const registersHubRoute = routerFiles.some((file) => {
    const source = fs.readFileSync(file, "utf-8");
    return source.includes("lexical_entity_route") || source.includes("hub/:entityType/:entityId");
  });
  if (!registersHubRoute) {
    add(
      ROUTER_DIR,
      1,
      "no route registers the lexical session (`hub/:entityType/:entityId` / lexical_entity_route) — a session must be reachable at a real URL",
    );
  }

  // 3. pageChrome must declare that route `detail`, i.e. Focus chrome.
  if (!fs.existsSync(PAGE_CHROME_PATH)) {
    add(PAGE_CHROME_PATH, 1, "missing pageChrome.ts — cannot verify the session route is Focus");
  } else {
    const chromeSource = fs.readFileSync(PAGE_CHROME_PATH, "utf-8");
    const entries = parseRouteTable(chromeSource);
    const hubEntry = entries
      .filter((e) => HUB_ROUTE_BASE.startsWith(e.path))
      .sort((a, b) => b.path.length - a.path.length)[0];
    if (!hubEntry) {
      add(
        PAGE_CHROME_PATH,
        lineOf(chromeSource, "ROUTE_ARCHETYPES"),
        `pageChrome.ts declares no route for ${HUB_ROUTE_BASE} — the routed lexical session would resolve to Browse chrome`,
      );
    } else if (hubEntry.archetype !== "detail") {
      add(
        PAGE_CHROME_PATH,
        lineOf(chromeSource, `path: "${hubEntry.path}"`),
        `route ${HUB_ROUTE_BASE} resolves to archetype "${hubEntry.archetype}" but a learning session must be "detail" (Focus: rail collapsed + recessed top bar)`,
      );
    }
  }

  // 4. The page hosting the session must be a detail page with no overlay.
  if (!fs.existsSync(SESSION_PAGE_PATH)) {
    add(
      SESSION_PAGE_PATH,
      1,
      "missing the routed lexical session page (pages/learn/hub/LexicalEntityPage.tsx) — the session has no Focus surface to live on",
    );
  } else {
    const page = fs.readFileSync(SESSION_PAGE_PATH, "utf-8");
    if (!/PageShell\s+archetype="detail"/.test(page)) {
      add(
        SESSION_PAGE_PATH,
        lineOf(page, "PageShell"),
        'the lexical session page must render <PageShell archetype="detail"> (the detail/Focus anatomy)',
      );
    }
    if (!page.includes("LexicalHubRouter")) {
      add(
        SESSION_PAGE_PATH,
        lineOf(page, "PageShell"),
        "the lexical session page does not render the session dispatcher (LexicalHubRouter)",
      );
    }
    if (page.includes("<Modal")) {
      add(
        SESSION_PAGE_PATH,
        lineOf(page, "<Modal"),
        "the lexical session page renders a <Modal> — the session itself must be the page, not a dialog inside it",
      );
    }
  }

  return findings;
}

const summaryLine = stdout
  .split(/\r?\n/)
  .find((l) => /^\s+\d+ error\(s\), \d+ warning\(s\)/.test(l));

if (FULL) {
  // No rule filter. spine's findings are reprinted verbatim so this mode stays a
  // drop-in for the retired fork, and its exit code is spine's own.
  console.log("\n🔍 Full audit — spine's design-audit, every rule (no filter)");
  console.log(`   target: ${target}`);
  console.log(`   spine:  ${SPINE_ROOT}`);
  console.log(`   spine's full audit reported:${summaryLine ?? " (no summary line)"}`);
  console.log(
    "   floor:  249/436/685 — pinned at S10 (2026-10-25: −1, the utility-duplicate on .shadow-sm cleared with its map key, see design-lead-s10-precondition-ruling.md § 3.3); a floor, not a budget\n",
  );

  if (!summaryLine) {
    console.error("spine's design-audit produced no summary — the gate could not be trusted.\n");
    if (stderr.trim()) console.error(stderr.trim());
    process.exit(2);
  }

  const body = stdout.trimEnd();
  if (body) console.log(body);
  if (stderr.trim()) process.stderr.write(stderr);
  process.exit(run.status ?? 2);
}

console.log(
  "\n🔍 Foundation audit — page-anatomy law + mode/chrome law + session law (spine's design-audit, foundation rules)",
);
console.log(`   target: ${target}`);
console.log(`   spine:  ${SPINE_ROOT}`);
console.log(`   spine's full audit reported:${summaryLine ?? " (no summary line)"}`);
console.log(`   page-anatomy findings: ${anatomyFindings.length} of ${findings.length} total\n`);

for (const f of anatomyFindings) {
  const rule = isAnatomy(f);
  console.log(`❌ ${f.file}:${f.line}`);
  console.log(`   ${rule.name}: ${f.message}`);
}

// Mode/chrome check (dual-mode chrome law) — runs in foundation mode only.
const chromeFindings = runChromeCheck();
if (chromeFindings.length > 0) {
  console.log(`   mode/chrome findings: ${chromeFindings.length}\n`);
  for (const f of chromeFindings) {
    console.log(`❌ ${f.file}:${f.line}`);
    console.log(`   mode-chrome: ${f.message}`);
  }
}

// Session/route check ("session = route, not modal") — foundation mode only.
const sessionModalFindings = runSessionModalCheck();
const sessionRouteFindings = runSessionRouteCheck();
const sessionFindings = [...sessionModalFindings, ...sessionRouteFindings];
if (sessionFindings.length > 0) {
  console.log(`   session/route findings: ${sessionFindings.length}\n`);
  for (const f of sessionFindings) {
    console.log(`❌ ${f.file}:${f.line}`);
    const rule = sessionModalFindings.includes(f) ? "session-modal" : "session-route";
    console.log(`   ${rule}: ${f.message}`);
  }
}

if (anatomyFindings.length > 0 || chromeFindings.length > 0 || sessionFindings.length > 0) {
  if (anatomyFindings.length > 0) {
    console.log(
      `\n${anatomyFindings.length} page-anatomy finding(s) — the law: a page content region is` +
        " PageShell -> PageStack -> PageGrid. No page max-width, no hand-rolled centering wrapper," +
        " no page-defined grid.\n",
    );
  }
  if (chromeFindings.length > 0) {
    console.log(
      `\n${chromeFindings.length} mode/chrome finding(s) — the dual-mode chrome law: Focus =` +
        " collapsed rail + recessed top bar, Browse = expanded rail + standard top bar." +
        " Mode derives from the page's archetype.\n",
    );
  }
  if (sessionFindings.length > 0) {
    console.log(
      `\n${sessionFindings.length} session/route finding(s) — the session law: a learning session` +
        " (character/word/radical/chengyu/grammar detail, reader, quiz, review) is a routed" +
        " `detail` Focus surface. Modals are for transient actions only.\n",
    );
  }
  process.exit(1);
}

if (!summaryLine) {
  console.error("spine's design-audit produced no summary — the gate could not be trusted.\n");
  if (stderr.trim()) console.error(stderr.trim());
  process.exit(2);
}

console.log("✅ Foundation gate PASS — no page-anatomy, mode/chrome or session/route findings.\n");
