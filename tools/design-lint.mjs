#!/usr/bin/env node

/**
 * design-lint.mjs — STRICT DESIGN.md spec-validity gate (canonical gate #8).
 *
 * Wraps `@google/design.md lint DESIGN.md` (the documented gate command) and
 * enforces ZERO findings (errors + warnings + infos), because the upstream CLI
 * exits 0 on warnings — which would let a spec regression through silently.
 *
 * Canonical command (single source: .github/instructions/project-workflow.
 * instructions.md, gate #8): `npm run design:lint`.
 *
 * Semantics (verified 2026-09-10 against @google/design.md v0.3.0):
 *   - Upstream `lint` exits non-zero only on `error`-severity findings.
 *   - DESIGN.md is a bespoke format (design tokens nested under `tokens:`,
 *     custom body). The tool value-validates TOP-LEVEL token groups only; after
 *     the S0b-1 restructure the frontmatter is `name`/`description`/`tokens`
 *     and lint yields 0 findings. This strict wrapper keeps it that way: any
 *     regression — an unknown top-level key, a re-added `components:` catalog,
 *     a YAML break, an invalid top-level token value — fails CI.
 *   - Real token-VALUE protection of the `tokens:` subtree (the DESIGN.md <->
 *     globals.css 1:1 parity contract) is a separate gate; this file validates
 *     frontmatter STRUCTURE only.
 *
 * Exit: 0 = clean (0 findings); 1 = any finding or tool failure (fail closed).
 */

import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CLI = path.join(ROOT, "node_modules", "@google", "design.md", "dist", "index.js");
const DESIGN_MD = path.join(ROOT, "DESIGN.md");

const res = spawnSync(process.execPath, [CLI, "lint", DESIGN_MD, "--format=json"], {
  cwd: ROOT,
  encoding: "utf8",
});

if (res.error) {
  console.error(`[design-lint] failed to spawn lint: ${res.error.message}`);
  process.exit(1);
}

let report;
try {
  report = JSON.parse(res.stdout);
} catch {
  console.error("[design-lint] could not parse lint JSON output (tool failure) — failing closed.");
  console.error(res.stdout || res.stderr);
  process.exit(1);
}

const { errors = 0, warnings = 0, infos = 0 } = report.summary ?? {};
const total = errors + warnings + infos;

for (const f of report.findings ?? []) {
  const loc = f.path ? `${f.path}: ` : "";
  console.log(`  [${f.severity}] ${loc}${f.message}`);
}

console.log(
  `\ndesign.md lint: ${errors} errors, ${warnings} warnings, ${infos} infos (strict gate — 0 findings required)`,
);
process.exit(total > 0 ? 1 : 0);
