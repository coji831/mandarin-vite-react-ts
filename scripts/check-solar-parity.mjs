#!/usr/bin/env node

/**
 * check-solar-parity.mjs - can a governed run actually execute every gate the workflow declares?
 *
 * WHY THIS EXISTS
 *   `.solar/commands.json` is the closed set of commands a governed run may execute. It drifted from
 *   the gate table: it declared 22 commands and could not run seven of the repo's own gates, so a
 *   governed run could report a pass it had no way to take. Nothing noticed, because the gate table
 *   and the solar manifest were never compared. This compares them.
 *
 * WHAT IT CHECKS
 *   The gate table is the INPUT. Script names are never hardcoded here: every `npm run <script>`
 *   inside a `| <number> | ... |` row of `.github/instructions/project-workflow.instructions.md` is a
 *   gate, so a gate added to that table is a finding on the next run.
 *   A. the gate resolves: the script exists at the root, or in the workspace its `--workspace=` names.
 *   B. solar can run it: some `.solar/commands.json` entry's argv carries the same `run <script>`
 *      pair. `--silent` may precede it. When the script exists only inside a workspace, that entry
 *      must carry the same `--workspace=`, or the command cannot succeed at runtime.
 *   C. solar invents nothing: every solar entry that runs an npm script names a script that exists.
 *   D. agent parity: every registry agent has `.github/agents/<key>.agent.md`, and every agent file
 *      on disk is either a registry agent or a declared runtime agent (`.solar/config.json`).
 *
 * Usage:
 *   node scripts/check-solar-parity.mjs
 *
 * Exit codes: 0 = every gate is executable by a governed run, 1 = at least one finding.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const WORKFLOW = ".github/instructions/project-workflow.instructions.md";
const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));
const has = (obj, key) => Object.prototype.hasOwnProperty.call(obj ?? {}, key);
const pad = (v, w) => String(v) + " ".repeat(Math.max(0, w - String(v).length));

const rootPkg = readJson("package.json");
const rootScripts = rootPkg.scripts ?? {};
const solar = readJson(".solar/commands.json");
const config = readJson(".solar/config.json");
const registry = readJson(".solar/registry.json");

/** workspace package name -> its scripts, discovered through the root manifest, not a path list. */
const workspaceScripts = new Map();
for (const pattern of rootPkg.workspaces ?? []) {
  const base = path.join(ROOT, pattern.replace(/\/\*$/, ""));
  if (!fs.existsSync(base)) continue;
  for (const entry of fs.readdirSync(base, { withFileTypes: true })) {
    const manifest = path.join(base, entry.name, "package.json");
    if (!entry.isDirectory() || !fs.existsSync(manifest)) continue;
    const pkg = JSON.parse(fs.readFileSync(manifest, "utf8"));
    if (pkg.name) workspaceScripts.set(pkg.name, pkg.scripts ?? {});
  }
}
const scriptAnywhere = (s) =>
  has(rootScripts, s) || [...workspaceScripts.values()].some((ws) => has(ws, s));

/** The scripts an argv runs: the token after each `run`, which a leading `--silent` never disturbs. */
const runTargets = (argv) =>
  argv.flatMap((t, i) =>
    t === "run" && argv[i + 1] && !argv[i + 1].startsWith("-") ? [argv[i + 1]] : [],
  );

/** Every `npm run <script>` in a numbered gate row, with the `--workspace=` that follows it. */
const gates = [];
for (const line of fs.readFileSync(path.join(ROOT, WORKFLOW), "utf8").split(/\r?\n/)) {
  const row = line.match(/^\|\s*(\d+)\s*\|/);
  if (!row) continue;
  const label = line.split("|")[2]?.trim() ?? "";
  const matches = [...line.matchAll(/npm run ([\w:.-]+)/g)];
  matches.forEach((m, i) => {
    const tail = line.slice(m.index + m[0].length, matches[i + 1]?.index ?? line.length);
    gates.push({
      row: +row[1],
      label,
      script: m[1],
      workspace: tail.match(/--workspace=([\w@/.-]+)/)?.[1],
    });
  });
}

const resolves = (g) =>
  g.workspace ? has(workspaceScripts.get(g.workspace), g.script) : has(rootScripts, g.script);

/** The solar key that runs this gate, or null. Judged by argv, never by the key's own name. */
function solarRunner(g) {
  for (const [key, command] of Object.entries(solar)) {
    const argv = command.argv ?? [];
    if (!runTargets(argv).includes(g.script)) continue;
    const needsWorkspace = g.workspace && !has(rootScripts, g.script);
    if (needsWorkspace && !argv.includes(`--workspace=${g.workspace}`)) continue;
    return key;
  }
  return null;
}
const rows = gates.map((g) => ({ ...g, ok: resolves(g), runner: solarRunner(g) }));

const invented = Object.entries(solar)
  .map(([key, c]) => ({ key, missing: runTargets(c.argv ?? []).filter((s) => !scriptAnywhere(s)) }))
  .filter((e) => e.missing.length);

const onDisk = fs
  .readdirSync(path.join(ROOT, ".github", "agents"))
  .filter((f) => f.endsWith(".agent.md"))
  .map((f) => f.replace(/\.agent\.md$/, ""));
const workers = Object.entries(registry)
  .filter(([, v]) => v && typeof v === "object" && typeof v.system === "string")
  .map(([k]) => k);
const runtime = Array.isArray(config.runtime_agents) ? config.runtime_agents : [];

const gatesFailed = rows.filter((r) => !r.ok || !r.runner);
const agentFails = [
  ...workers.filter((k) => !onDisk.includes(k)).map((a) => `no .github/agents/${a}.agent.md`),
  ...onDisk
    .filter((x) => !workers.includes(x) && !runtime.includes(x))
    .map((a) => `.github/agents/${a}.agent.md is neither a registry worker nor a runtime agent`),
  ...runtime
    .filter((x) => !onDisk.includes(x))
    .map((a) => `runtime_agents declares "${a}" but its agent file is missing`),
];
const fails = [
  ...rows
    .filter((r) => !r.ok)
    .map((r) => `gate ${r.row} ${r.label}: no npm script named "${r.script}"`),
  ...rows
    .filter((r) => r.ok && !r.runner)
    .map((r) => `gate ${r.row} ${r.label}: no solar command runs "${r.script}"`),
  ...invented.map((e) => `solar:${e.key} runs nonexistent script(s): ${e.missing.join(", ")}`),
  ...agentFails,
];

const L = Math.max(...rows.map((r) => r.label.length), 5);
const S = Math.max(...rows.map((r) => `${r.script} ${r.workspace ?? ""}`.trim().length), 6);
const stats = `${rows.length} gate commands · ${Object.keys(solar).length} solar commands`;
const agents = `${workers.length} workers · ${onDisk.length} agents · ${runtime.length} runtime`;
console.log(`\n🔍 Solar parity: ${WORKFLOW}`);
console.log(`  ${stats}\n  ${agents}\n`);
for (const r of rows) {
  const cmd = `${r.script}${r.workspace ? " " + r.workspace : ""}`;
  const state = r.ok ? "resolves" : "NO SUCH SCRIPT";
  const where = r.runner ? `solar:${r.runner}` : "not in solar";
  console.log(`  ${pad(r.row, 2)} ${pad(r.label, L)}  ${pad(cmd, S)}  ${pad(state, 10)}  ${where}`);
}

console.log(`\n${"─".repeat(64)}`);
console.log(`  A+B gate coverage: ${rows.length - gatesFailed.length}/${rows.length}`);
console.log(
  `  C solar invents nothing: ${invented.length ? `${invented.length} finding(s)` : "ok"}`,
);
console.log(`  D agent parity: ${agentFails.length ? `${agentFails.length} finding(s)` : "ok"}`);
for (const f of fails) console.log(`  ✗ ${f}`);
const verdict = fails.length
  ? `❌ ${fails.length} finding(s): a governed run cannot execute this gate set`
  : "✅ every gate resolves and is runnable by solar";
console.log(`  ${verdict}`);
console.log(`${"─".repeat(64)}\n`);
process.exit(fails.length ? 1 : 0);
