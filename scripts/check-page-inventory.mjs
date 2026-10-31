#!/usr/bin/env node

/**
 * check-page-inventory.mjs
 *
 * Machine-checkable page contract for the page-inventory ledger.
 *
 * Every page container in `.github/page-inventory.json` is validated against
 * the page-archetype library and the shared component registry. The ledger is
 * the living catalog + divergence snapshot; this script is the gate that
 * keeps it honest (drift self-surfaces at merge, like check-registry-stories).
 *
 * Entry shape:
 *   {
 *     "route": "/library",                       // route string (required)
 *     "component": "LibraryPage",                // routed page component (nullable for pure redirects)
 *     "archetype": "list",                       // id from page-archetypes.md (nullable until assigned)
 *     "mode": "browse",                          // browse | focus | auth — derived from archetype (mode-aware chrome)
 *     "chrome": {                                // derived from archetype (mode-aware chrome)
 *       "rail": "expanded",                      //   expanded | collapsed | none
 *       "topbar": "standard"                     //   standard | recessed | none
 *     },
 *     "status": "conforms" | "diverges",         // M0 snapshot semantics (see below)
 *     "anatomy": {                               // OPTIONAL declared target (page-anatomy law, S0a-4)
 *       "shell": "PageShell",                    //   the page-content layout primitive (law target)
 *       "measure": "overview",                   //   archetype whose --page-measure-* governs the width;
 *                                                //   MUST equal the entry's `archetype`
 *       "gutter": "default",                     //   PageGrid gutter tier: sm | default | lg
 *       "header": "PageHeader" | null            //   header primitive (registry component) or null
 *     }
 *   }
 *
 * Storybook stories are NOT part of this ledger: page stories were retired, and
 * shared-component stories are enforced by check-registry-stories.
 *
 * Anatomy semantics (S0a-4, ratified rollout — "declared target" model):
 *   `anatomy` declares the page's TARGET under the page-anatomy law — the ledger
 *   is the forward contract. Whether the real code already meets it is tracked
 *   SEPARATELY by design-audit's page-anatomy rules (missing-layout-token /
 *   page-scoped-layout-css / page-scoped-grid). So `conforms` = "declared
 *   correctly per archetype" (not "code already migrated"). A `conforms` entry
 *   MUST declare a valid `anatomy`; S2 migrations close the audit findings.
 *
 * Status semantics (M0 divergence report):
 *   - `conforms`  — the page claims it matches its archetype contract, so it
 *                   MUST declare: a valid `archetype`, a `component`, mode +
 *                   chrome derived from that archetype, and a matching
 *                   `anatomy`. A conforms page missing any of those is a hard
 *                   FAIL.
 *   - `diverges`  — the page is a known gap (redirect by design / unassigned
 *                   archetype / anatomy not yet audited). It is REPORTED as a
 *                   divergence, not failed — this IS the M0 snapshot. But a
 *                   diverges entry that declares an illegal archetype, mode or
 *                   chrome is still a hard FAIL (declared-but-wrong is always
 *                   drift).
 *
 * Fail conditions (exit 1):
 *   1. A routed page has NO ledger entry ("lacks an entry").
 *   2. An entry declares an archetype not in the allowed enum.
 *   3. An entry's `anatomy.header` names a component not in component-registry.json.
 *   4. An entry's component name does not resolve to a page file under
 *      apps/frontend/src/pages/**, or a page file has no ledger entry.
 *
 * Coverage sources (the "which pages exist" ground truth):
 *   - Every `*Page.tsx` under apps/frontend/src/pages/** must appear as some
 *     entry's `component` (exempt list: internal/non-routed page helpers).
 *
 * Usage:
 *   node scripts/check-page-inventory.mjs
 *
 * Exit codes:
 *   0 = ledger PASS (structural contract met; divergences reported, not fatal)
 *   1 = at least one FAIL
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ─── Configuration ───────────────────────────────────────────────────────────

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const INVENTORY_PATH = path.join(ROOT, ".github", "page-inventory.json");
const REGISTRY_PATH = path.join(ROOT, ".github", "component-registry.json");
const PAGES_DIR = path.join(ROOT, "apps", "frontend", "src", "pages");

// Archetype ids from page-archetypes.md (§0 mode/page table) — spine's closed
// generic set (spine registry/renames.md §Page archetypes).
const ALLOWED_ARCHETYPES = [
  "overview",
  "list",
  "detail",
  "create-edit",
  "settings",
  "auth",
  "search",
  "profile",
  "notifications",
  "reports",
  "empty",
  "not-found",
  "wizard",
];

// Page-anatomy contract (S0a-4, ratified rollout). The `measure` archetype is
// the one whose --page-measure-<archetype> token governs the page content width
// (PageShell). Under the law it MUST equal the entry's `archetype`.
const ANATOMY_MEASURE_ARCHETYPES = [
  "overview",
  "list",
  "detail",
  "create-edit",
  "settings",
  "auth",
  "search",
  "profile",
  "notifications",
  "reports",
  "empty",
  "not-found",
  "wizard",
];
const ANATOMY_GUTTERS = ["sm", "default", "lg"];
// The page-content layout primitive every route targets (chrome lives in
// AppLayout/LearnLayout, not page anatomy).
const ANATOMY_SHELL = "PageShell";

// Mode/chrome contract (pre-26 spine epic, mode-aware chrome). Mode derives
// from the page's archetype (page-archetypes.md §0): detail | wizard -> focus,
// auth -> auth (neither), everything else -> browse. Chrome follows mode:
// focus -> rail collapsed + recessed top bar; auth -> rail none + standard top
// bar; browse -> rail expanded + standard top bar.
const ALLOWED_MODES = ["browse", "focus", "auth"];
const ALLOWED_RAIL_STATES = ["expanded", "collapsed", "none"];
const ALLOWED_TOPBAR_STATES = ["standard", "recessed", "none"];
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

// *Page.tsx files that are internal/non-routed page helpers, not page containers.
const EXEMPT_PAGE_COMPONENTS = new Set(["ContentPlaceholderPage", "QuizSessionPage"]);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function* walkFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walkFiles(fullPath);
    } else if (entry.isFile()) {
      yield fullPath;
    }
  }
}

/** All page container names from *Page.tsx files under pages/** (exempts applied). */
function collectPageComponents() {
  if (!fs.existsSync(PAGES_DIR)) return [];
  const names = [];
  for (const file of walkFiles(PAGES_DIR)) {
    if (!file.endsWith("Page.tsx")) continue;
    const basename = path.basename(file, ".tsx");
    if (EXEMPT_PAGE_COMPONENTS.has(basename)) continue;
    names.push({ name: basename, file });
  }
  return names;
}

/** Does a component name resolve to a real *Page.tsx under pages/**? */
function pageComponentExists(name) {
  if (!fs.existsSync(PAGES_DIR)) return false;
  for (const file of walkFiles(PAGES_DIR)) {
    if (path.basename(file, ".tsx") === name && file.endsWith("Page.tsx")) return true;
  }
  return false;
}

// ─── Main ────────────────────────────────────────────────────────────────────

function main() {
  if (!fs.existsSync(INVENTORY_PATH)) {
    console.error(`❌ Page inventory not found: ${path.relative(ROOT, INVENTORY_PATH)}`);
    process.exit(1);
  }
  if (!fs.existsSync(REGISTRY_PATH)) {
    console.error(`❌ Registry not found: ${path.relative(ROOT, REGISTRY_PATH)}`);
    process.exit(1);
  }

  const inventory = JSON.parse(fs.readFileSync(INVENTORY_PATH, "utf-8"));
  const registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf-8"));
  const registryNames = new Set(Object.keys(registry.components ?? {}));
  const pages = Array.isArray(inventory.pages) ? inventory.pages : [];

  console.log(`\n🔍 Page Inventory Contract: ${path.relative(ROOT, INVENTORY_PATH)}\n`);
  console.log(`  Pages: ${pages.length} entries\n`);

  const failures = [];
  const divergences = [];

  // ── Per-entry validation ──────────────────────────────────────────────────
  const seenRoutes = new Set();
  const seenComponents = new Set();

  for (const [idx, page] of pages.entries()) {
    const label = `[${idx}] ${page.route ?? "<missing route>"}`;
    const problems = [];

    // route required + unique
    if (typeof page.route !== "string" || page.route.length === 0) {
      problems.push("missing `route`");
    } else if (seenRoutes.has(page.route)) {
      problems.push(`duplicate route "${page.route}"`);
    } else {
      seenRoutes.add(page.route);
    }

    // status must be conforms | diverges
    if (page.status !== "conforms" && page.status !== "diverges") {
      problems.push(`invalid status "${page.status}" (expected conforms|diverges)`);
    }

    // archetype must be in the allowed enum when declared
    if (page.archetype != null && !ALLOWED_ARCHETYPES.includes(page.archetype)) {
      problems.push(
        `unregistered archetype "${page.archetype}" (allowed: ${ALLOWED_ARCHETYPES.join(", ")})`,
      );
    }

    // component must resolve to a real page file when declared
    if (page.component != null) {
      if (!pageComponentExists(page.component)) {
        problems.push(
          `component "${page.component}" does not resolve to a *Page.tsx under pages/**`,
        );
      } else if (seenComponents.has(page.component)) {
        problems.push(`duplicate component "${page.component}" (one entry per page container)`);
      } else {
        seenComponents.add(page.component);
      }
    }

    // anatomy map (declared target — page-anatomy law, S0a-4)
    if (page.anatomy != null) {
      if (typeof page.anatomy !== "object" || Array.isArray(page.anatomy)) {
        problems.push("`anatomy` must be an object { shell, measure, gutter, header }");
      } else {
        // shell: must equal the law's page-content primitive
        if (page.anatomy.shell !== ANATOMY_SHELL) {
          problems.push(
            `anatomy.shell must be "${ANATOMY_SHELL}" (page-anatomy law) — got ${JSON.stringify(page.anatomy.shell)}`,
          );
        }
        // measure: must be a registered archetype and equal the entry's archetype
        if (!ANATOMY_MEASURE_ARCHETYPES.includes(page.anatomy.measure)) {
          problems.push(
            `anatomy.measure "${page.anatomy.measure}" is not a valid measure archetype (allowed: ${ANATOMY_MEASURE_ARCHETYPES.join(", ")})`,
          );
        } else if (page.archetype != null && page.anatomy.measure !== page.archetype) {
          problems.push(
            `anatomy.measure "${page.anatomy.measure}" must equal archetype "${page.archetype}" (measure follows archetype under the page-anatomy law)`,
          );
        }
        // gutter: sm | default | lg
        if (!ANATOMY_GUTTERS.includes(page.anatomy.gutter)) {
          problems.push(
            `anatomy.gutter "${page.anatomy.gutter}" invalid (allowed: ${ANATOMY_GUTTERS.join(", ")})`,
          );
        }
        // header: null or a registry component name
        if (page.anatomy.header != null) {
          if (typeof page.anatomy.header !== "string" || !registryNames.has(page.anatomy.header)) {
            problems.push(
              `anatomy.header ${JSON.stringify(page.anatomy.header)} must be null or a registry component (not in component-registry.json)`,
            );
          }
        }
      }
    }

    // mode + chrome (mode-aware chrome contract — derived from archetype)
    if (page.mode != null) {
      if (!ALLOWED_MODES.includes(page.mode)) {
        problems.push(`mode "${page.mode}" invalid (allowed: ${ALLOWED_MODES.join(", ")})`);
      } else if (page.archetype != null && page.mode !== modeForArchetype(page.archetype)) {
        problems.push(
          `mode "${page.mode}" must equal "${modeForArchetype(page.archetype)}" (derived from archetype "${page.archetype}")`,
        );
      }
    }
    if (page.chrome != null) {
      if (typeof page.chrome !== "object" || Array.isArray(page.chrome)) {
        problems.push("`chrome` must be an object { rail, topbar }");
      } else {
        if (!ALLOWED_RAIL_STATES.includes(page.chrome.rail)) {
          problems.push(
            `chrome.rail "${page.chrome.rail}" invalid (allowed: ${ALLOWED_RAIL_STATES.join(", ")})`,
          );
        }
        if (!ALLOWED_TOPBAR_STATES.includes(page.chrome.topbar)) {
          problems.push(
            `chrome.topbar "${page.chrome.topbar}" invalid (allowed: ${ALLOWED_TOPBAR_STATES.join(", ")})`,
          );
        }
        if (page.archetype != null) {
          const expectedChrome = chromeForArchetype(page.archetype);
          const mismatch =
            page.chrome.rail !== expectedChrome.rail ||
            page.chrome.topbar !== expectedChrome.topbar;
          if (mismatch) {
            problems.push(
              `chrome ${JSON.stringify(page.chrome)} must equal ${JSON.stringify(expectedChrome)} (derived from archetype "${page.archetype}")`,
            );
          }
        }
      }
    }

    // conforms → must declare archetype + component + mode + chrome + anatomy
    if (page.status === "conforms") {
      if (page.archetype == null) problems.push("conforms page missing `archetype`");
      if (page.component == null) problems.push("conforms page missing `component`");
      if (page.anatomy == null) {
        problems.push(
          "conforms page missing `anatomy` (declared target required — { shell: PageShell, measure: <archetype>, gutter, header })",
        );
      }
      if (page.mode == null) {
        problems.push(
          "conforms page missing `mode` (derived from archetype — browse | focus | auth)",
        );
      }
      if (page.chrome == null) {
        problems.push("conforms page missing `chrome` (derived from archetype — { rail, topbar })");
      }
    }

    if (problems.length > 0) {
      failures.push({ label, problems });
    } else if (page.status === "diverges") {
      divergences.push(page);
    }
  }

  // ── Coverage: every page component must be in the ledger ──────────────────
  const uncoveredPages = collectPageComponents().filter((p) => !seenComponents.has(p.name));
  if (uncoveredPages.length > 0) {
    failures.push({
      label: "coverage",
      problems: uncoveredPages.map(
        (p) => `page container "${p.name}" (${path.relative(ROOT, p.file)}) has no ledger entry`,
      ),
    });
  }

  // ── Report ────────────────────────────────────────────────────────────────
  const conformsCount = pages.filter((p) => p.status === "conforms").length;

  for (const page of divergences) {
    console.log(
      `⚠️  DIVERGES  ${page.route}  (${page.component ?? "—"})  archetype: ${page.archetype ?? "unassigned"}`,
    );
  }

  console.log(
    `\n  Conforming: ${conformsCount} · Diverging: ${divergences.length} · Failed: ${failures.length}\n`,
  );

  for (const fail of failures) {
    console.log(`❌ ${fail.label}`);
    for (const p of fail.problems) console.log(`     - ${p}`);
  }

  console.log(`\n${"─".repeat(50)}`);
  if (failures.length > 0) {
    const problemCount = failures.reduce((n, f) => n + f.problems.length, 0);
    console.log(`  ${problemCount} problem(s) across ${failures.length} entry/coverage group(s)`);
    console.log(`${"─".repeat(50)}\n`);
    process.exit(1);
  }
  console.log(
    `  Page inventory PASS — ${pages.length} entries (${conformsCount} conforms, ${divergences.length} diverges)`,
  );
  console.log(`${"─".repeat(50)}\n`);
  process.exit(0);
}

main();
