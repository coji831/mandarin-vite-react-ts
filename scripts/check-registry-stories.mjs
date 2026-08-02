#!/usr/bin/env node

/**
 * check-registry-stories.mjs
 *
 * Machine-checkable Storybook contract for the shared component registry.
 *
 * Every shared component in `.github/component-registry.json` (importPath
 * starting with `shared/components`) MUST declare a `storybook` block:
 *
 *   "storybook": {
 *     "storyFile": "<repo-relative path to the .stories.tsx file>",
 *     "states": ["variant-catalog", "default", "loading", "error", "empty", "disabled", "edge"]
 *   }
 *
 * This script asserts:
 *   1. `storybook.storyFile` is a string and the file exists on disk
 *      (storyFile is repo-relative, e.g. `apps/frontend/src/shared/components/...`,
 *      resolved against the repo root).
 *   2. `storybook.states` is a non-empty array whose values are all in the
 *      allowed enum.
 *
 * Feature components (importPath NOT under `shared/components`) are skipped —
 * they are documented in their feature docs/design.md, not the registry.
 *
 * Usage:
 *   node scripts/check-registry-stories.mjs
 *
 * Exit codes:
 *   0 = all shared components PASS
 *   1 = at least one FAIL (missing storyFile, missing file, or bad states)
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ─── Configuration ───────────────────────────────────────────────────────────

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REGISTRY_PATH = path.join(ROOT, ".github", "component-registry.json");

const ALLOWED_STATES = [
  "variant-catalog",
  "default",
  "loading",
  "error",
  "empty",
  "disabled",
  "edge",
];

// ─── Main ────────────────────────────────────────────────────────────────────

function main() {
  if (!fs.existsSync(REGISTRY_PATH)) {
    console.error(`❌ Registry not found: ${path.relative(ROOT, REGISTRY_PATH)}`);
    process.exit(1);
  }

  const registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf-8"));
  const entries = Object.entries(registry.components ?? {});
  const shared = entries.filter(([, c]) =>
    String(c.importPath ?? "").startsWith("shared/components"),
  );
  const feature = entries.filter(
    ([, c]) => !String(c.importPath ?? "").startsWith("shared/components"),
  );

  console.log(`\n🔍 Registry Storybook Contract: ${path.relative(ROOT, REGISTRY_PATH)}\n`);
  console.log(
    `  Components: ${entries.length} total (${shared.length} shared, ${feature.length} feature — skipped)\n`,
  );

  let failures = 0;

  for (const [name, component] of shared) {
    const problems = [];

    // 1. storybook block present
    if (!component.storybook) {
      problems.push("missing `storybook` block");
    } else {
      const { storyFile, states } = component.storybook;

      // 1a. storyFile is a string and points to a real file
      if (typeof storyFile !== "string" || storyFile.length === 0) {
        problems.push("`storybook.storyFile` missing or not a string");
      } else {
        // storyFile is repo-relative; resolve against the repo root.
        const absPath = path.resolve(ROOT, storyFile);
        if (!fs.existsSync(absPath)) {
          problems.push(`storyFile not found on disk: ${storyFile}`);
        }
      }

      // 1b. states is a non-empty array of allowed enum values
      if (!Array.isArray(states) || states.length === 0) {
        problems.push("`storybook.states` missing or empty (expected ≥1 state)");
      } else {
        const invalid = states.filter((s) => !ALLOWED_STATES.includes(s));
        if (invalid.length > 0) {
          problems.push(
            `invalid state(s): ${invalid.join(", ")} (allowed: ${ALLOWED_STATES.join(", ")})`,
          );
        }
      }
    }

    if (problems.length > 0) {
      failures++;
      console.log(`❌ ${name}`);
      for (const p of problems) console.log(`     - ${p}`);
    } else {
      const states = component.storybook.states.join(", ");
      console.log(`✅ ${name}  (${component.storybook.storyFile} — ${states})`);
    }
  }

  console.log(`\n${"─".repeat(50)}`);
  if (failures > 0) {
    console.log(
      `  ${failures} of ${shared.length} shared component(s) FAILED the storybook contract`,
    );
    console.log(`${"─".repeat(50)}\n`);
    process.exit(1);
  }
  console.log(`  All ${shared.length} shared component(s) PASS the storybook contract`);
  console.log(`${"─".repeat(50)}\n`);
  process.exit(0);
}

main();
