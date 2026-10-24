#!/usr/bin/env node

/**
 * design-audit-foundation.mjs — the spine design-audit, served in two modes.
 *
 * WHY THIS EXISTS
 *   spine is the source of truth for the design system, including the page-anatomy
 *   law's rules. This script runs spine's own `design-audit` gate (never a local
 *   copy of the rules). It has two modes:
 *
 *   FOUNDATION (default) — fails on the page-anatomy family only:
 *     - missing-layout-token      hardcoded max-width in a page container
 *     - page-scoped-layout-css    hand-rolled `margin: ... auto` page wrapper
 *     - page-scoped-grid          page-defined grid-template-columns
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
 *   foundation: 0 = no page-anatomy findings; 1 = page-anatomy findings; 2 = gate unusable
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
  console.log("   floor:  250/436/686 — pinned at S3 (2026-10-24); a floor, not a budget\n");

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
  "\n🔍 Foundation audit — page-anatomy law (spine's design-audit, foundation rules only)",
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

if (anatomyFindings.length > 0) {
  console.log(
    `\n${anatomyFindings.length} page-anatomy finding(s) — the law: a page content region is` +
      " PageShell -> PageStack -> PageGrid. No page max-width, no hand-rolled centering wrapper," +
      " no page-defined grid.\n",
  );
  process.exit(1);
}

if (!summaryLine) {
  console.error("spine's design-audit produced no summary — the gate could not be trusted.\n");
  if (stderr.trim()) console.error(stderr.trim());
  process.exit(2);
}

console.log("✅ Foundation gate PASS — no page-anatomy findings.\n");
