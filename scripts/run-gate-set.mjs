#!/usr/bin/env node

/**
 * run-gate-set.mjs - run several gate commands under ONE `npm run`, keeping each gate's own
 * name and its own exit code.
 *
 * WHY THIS EXISTS
 *   Measured on this tree (2026-11-01, 3 runs per gate, medians): the npm wrapper costs ~540 ms
 *   per invocation and node startup ~70 ms. Across the 13 cheap Tier-2 gate commands the wrapper
 *   is 7,052 ms of the 15,566 ms those per-gate medians sum to - 45% of the sweep is npm telling
 *   itself what to run. The gates themselves total 8,514 ms. Collapsing N invocations into one
 *   removes (N-1) x ~540 ms
 *   without touching a single gate: the same node processes run, the same scripts, the same
 *   arguments, the same exit codes.
 *
 *   This is the Tier-2 counterpart of `npm run format:check:changed` (gate 1's fast path): an
 *   OPTIMIZATION, never a substitute. Every gate still runs alone through its own command, the
 *   gate table still names the individual commands, and nothing here decides whether a gate
 *   passes - it only reports what each one returned.
 *
 * WHAT IT DOES NOT DO
 *   - It takes the gate names as arguments instead of carrying a list of its own. A baked-in
 *     list would be a third copy of the gate set, and copies drift from the table. Ask for the
 *     gates you actually need to run.
 *   - It does not merge processes or share a parse. The scripts share no parser to reuse: each
 *     reads and parses its own input in its own process, and this only removes the npm layer
 *     between them.
 *
 * Usage:
 *   npm run gates -- check:design-parity check:spine-parity check:class-catalog
 *   node scripts/run-gate-set.mjs check:load check:doc-links check:solar-parity
 *
 * Exit codes: 0 = every gate passed, 1 = at least one gate failed (each is named), 2 = usage
 * error, unknown gate name, or unreadable package.json.
 */

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const NPM = process.platform === "win32" ? "npm.cmd" : "npm";

const names = process.argv.slice(2).filter((a) => a !== "--");

if (names.length === 0) {
  console.error("gates: name at least one npm script to run.");
  console.error("  npm run gates -- check:design-parity check:spine-parity");
  process.exit(2);
}

let scripts;
try {
  scripts = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8")).scripts ?? {};
} catch (e) {
  console.error(`gates: could not read package.json: ${e.message}`);
  process.exit(2);
}

const unknown = names.filter((n) => !(n in scripts));
if (unknown.length) {
  console.error(`gates: not an npm script in package.json: ${unknown.join(", ")}`);
  process.exit(2);
}

/**
 * A npm script that is exactly `node <path> [flags...]` can be run as that node process, skipping
 * the wrapper. Anything else (a workspace flag, `concurrently`, a binary on PATH) keeps its npm
 * invocation: the point is to remove a wrapper, never to reinterpret a command. No script in this
 * package.json passes a quoted argument to its node script, so splitting on whitespace is safe
 * here; the `startsWith("node ")` test is what keeps the shortcut narrow.
 */
function spawnFor(name) {
  const command = String(scripts[name]).trim();
  if (command.startsWith("node ")) {
    const [script, ...rest] = command.slice(5).trim().split(/\s+/);
    return { argv: [script, ...rest], via: "node" };
  }
  return { argv: [], via: "npm" };
}

const results = [];
const started = Date.now();

for (const name of names) {
  const { argv, via } = spawnFor(name);
  const began = Date.now();
  const run =
    via === "node"
      ? spawnSync(process.execPath, argv, { cwd: ROOT, encoding: "utf8" })
      : spawnSync(NPM, ["--silent", "run", name], { cwd: ROOT, encoding: "utf8", shell: false });
  const exit = run.status ?? (run.error ? 1 : 0);
  results.push({
    name,
    via,
    exit,
    ms: Date.now() - began,
    output: `${run.stdout ?? ""}${run.stderr ?? ""}`,
    error: run.error,
  });
}

const width = Math.max(...results.map((r) => r.name.length), 6);
const pad = (v, w) => String(v).padEnd(w);
const failed = results.filter((r) => r.exit !== 0);

// A failing gate's own output is printed under its name, so a red sweep says WHICH gate is red
// and what it said, without a second run.
for (const run of failed) {
  console.log(`\n--- ${run.name} (exit ${run.exit}) ---`);
  console.log(run.output.trimEnd() || "(no output)");
  if (run.error) console.log(`gates: ${run.name} could not be started: ${run.error.message}`);
}

console.log("");
console.log(`  ${pad("gate", width)}  exit     ms  verdict`);
for (const run of results) {
  console.log(
    `  ${pad(run.name, width)}  ${pad(run.exit, 4)} ${String(run.ms).padStart(6)}  ` +
      `${run.exit === 0 ? "pass" : "FAIL"}`,
  );
}

const npmCount = results.filter((r) => r.via === "npm").length;
const total = Date.now() - started;
console.log("");
console.log(
  `  ${results.length} gate(s): ${results.length - failed.length} passed, ` +
    `${failed.length} failed, ${total} ms total, ${npmCount + 1} npm invocation(s)`,
);
if (failed.length) {
  console.log(`  failed: ${failed.map((r) => `${r.name} (exit ${r.exit})`).join(", ")}`);
}

process.exit(failed.length ? 1 : 0);
