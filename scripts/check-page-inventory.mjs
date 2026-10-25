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
 *     "story": "apps/frontend/src/pages/...Full.stories.tsx",  // repo-relative; null when none
 *     "states": ["default"],                     // subset of ALLOWED_STATES
 *     "status": "conforms" | "diverges",         // M0 snapshot semantics (see below)
 *     "composition": { "region": "RegistryComponent" },  // optional; registry names ONLY
 *     "anatomy": {                               // OPTIONAL declared target (page-anatomy law, S0a-4)
 *       "shell": "PageShell",                    //   the page-content layout primitive (law target)
 *       "measure": "overview",                   //   archetype whose --page-measure-* governs the width;
 *                                                //   MUST equal the entry's `archetype`
 *       "gutter": "default",                     //   PageGrid gutter tier: sm | default | lg
 *       "header": "PageHeader" | null            //   header primitive (registry component) or null
 *     },
 *     "note": "optional human context"
 *   }
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
 *                   MUST declare: a valid archetype, a `component`, a `story`
 *                   whose file exists on disk, and >=1 valid state. A conforms
 *                   page missing any of those is a hard FAIL.
 *   - `diverges`  — the page is a known gap (missing Full story / unassigned
 *                   archetype / anatomy not yet audited). It is REPORTED as a
 *                   divergence, not failed — this IS the M0 snapshot. But a
 *                   diverges entry that *declares* a story whose file is
 *                   missing, uses an illegal state, or names a non-registry
 *                   component in its composition map is still a hard FAIL
 *                   (declared-but-wrong is always drift).
 *
 * Fail conditions (exit 1):
 *   1. A routed page has NO ledger entry ("lacks an entry").
 *   2. An entry declares an archetype not in the allowed enum.
 *   3. An entry's composition map names a component not in component-registry.json.
 *   4. A `conforms` entry is missing its Full story, or any entry declares a
 *      story whose file does not exist on disk.
 *   5. An entry has no/illegal states (values outside the allowed enum).
 *   6. An entry's component name does not resolve to a page file under
 *      apps/frontend/src/pages/**, or a page file has no ledger entry.
 *
 * Coverage sources (the "which pages exist" ground truth):
 *   - Every `<Page>Full.stories.tsx` under apps/frontend/src/pages/** must be
 *     referenced by a ledger entry's `story`.
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

// Shared with check-registry-stories.mjs.
const ALLOWED_STATES = [
  "variant-catalog",
  "default",
  "loading",
  "error",
  "empty",
  "disabled",
  "edge",
  "with-description",
  "with-cta",
  "with-eyebrow",
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

/** All Full story files under pages/** (repo-relative). */
function collectFullStories() {
  if (!fs.existsSync(PAGES_DIR)) return [];
  const stories = [];
  for (const file of walkFiles(PAGES_DIR)) {
    if (!file.endsWith("Full.stories.tsx")) continue;
    stories.push(path.relative(ROOT, file).replace(/\\/g, "/"));
  }
  return stories;
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

    // story file must exist when declared
    if (page.story != null) {
      if (typeof page.story !== "string" || page.story.length === 0) {
        problems.push("`story` declared but not a non-empty string");
      } else {
        const absStory = path.resolve(ROOT, page.story);
        if (!fs.existsSync(absStory)) {
          problems.push(`story file not found on disk: ${page.story}`);
        }
      }
    }

    // states: legal enum values when declared
    if (page.states != null) {
      if (!Array.isArray(page.states)) {
        problems.push("`states` must be an array");
      } else {
        const invalid = page.states.filter((s) => !ALLOWED_STATES.includes(s));
        if (invalid.length > 0) {
          problems.push(
            `invalid state(s): ${invalid.join(", ")} (allowed: ${ALLOWED_STATES.join(", ")})`,
          );
        }
      }
    }

    // composition map: registry names only
    if (page.composition != null) {
      if (typeof page.composition !== "object" || Array.isArray(page.composition)) {
        problems.push("`composition` must be an object of { region: registryComponent }");
      } else {
        for (const [region, componentName] of Object.entries(page.composition)) {
          if (typeof componentName !== "string") {
            problems.push(`composition.${region} must be a component name string`);
          } else if (!registryNames.has(componentName)) {
            problems.push(
              `composition.${region} names non-registry component "${componentName}" (not in component-registry.json)`,
            );
          }
        }
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

    // conforms → must declare archetype + component + story + >=1 state + anatomy
    if (page.status === "conforms") {
      if (page.archetype == null) problems.push("conforms page missing `archetype`");
      if (page.component == null) problems.push("conforms page missing `component`");
      if (page.story == null) problems.push("conforms page missing its `Full` story");
      if (!Array.isArray(page.states) || page.states.length === 0) {
        problems.push("conforms page missing declared states (expected >=1)");
      }
      if (page.anatomy == null) {
        problems.push(
          "conforms page missing `anatomy` (declared target required — { shell: PageShell, measure: <archetype>, gutter, header })",
        );
      }
    }

    if (problems.length > 0) {
      failures.push({ label, problems });
    } else if (page.status === "diverges") {
      divergences.push(page);
    }
  }

  // ── Coverage: every Full story must be referenced by the ledger ───────────
  const ledgerStories = new Set(pages.map((p) => p.story).filter((s) => typeof s === "string"));
  const uncoveredStories = collectFullStories().filter((s) => !ledgerStories.has(s));
  if (uncoveredStories.length > 0) {
    failures.push({
      label: "coverage",
      problems: uncoveredStories.map(
        (s) => `page has a <Page>Full.stories.tsx but no ledger entry references it: ${s}`,
      ),
    });
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
