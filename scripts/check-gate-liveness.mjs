#!/usr/bin/env node

/**
 * check-gate-liveness.mjs - is each gate still measuring anything?
 *
 * WHY THIS EXISTS
 *   `scripts/check-reflow.mjs` printed `0/0 pass` and exited 0 for weeks. Every gate in
 *   `.github/instructions/project-workflow.instructions.md` measured something; nothing asked whether
 *   the thing it measured was still there. A denominator that quietly reaches zero is indistinguishable
 *   from a pass, and the only reader that noticed was a human reading the output line. This gate asks
 *   the question mechanically, for the table as a whole.
 *
 * WHAT IT CHECKS
 *   1. DECLARATION: every numbered row carries a non-empty `Measures` cell. A row that says what it
 *      checks but not what it counts cannot be audited, and cannot be pinned or probed either.
 *   2. REGISTRATION: every `scripts/check-*.mjs` on disk is accounted for - its npm script appears in
 *      the table, or it is listed in EXEMPT below with the reason it is not a numbered gate. A new
 *      check script that is neither is a finding, because an unregistered check is how a gate stops
 *      being run without anyone deciding that. An exemption that a table row has since covered is a
 *      finding too: a stale exemption reads as a decision nobody has revisited.
 *   3. OBSERVATION: a declared list of gates is probed by running its command and reading the
 *      denominator out of its own summary line.
 *      - a probe whose regex matches nothing is a FAILURE ("probe blind"), never a pass. That is the
 *        exact failure mode this gate exists to catch, and a blind probe would otherwise reproduce it;
 *      - a gate that exits 1 on pre-existing debt is NOT a liveness failure. `check:doc-links` reports
 *        `623 markdown file(s) scanned` and exits 1 over 128 unresolved links: the denominator is 623,
 *        so the gate is alive. The verdict belongs to that gate and the docs work; this reads the
 *        denominator only, and never makes its own run red because another gate is red on debt;
 *      - a probe may be PINNED DEAD with a reason naming what clears it. The pin cuts both ways: a
 *        pinned gate that starts reporting a non-zero denominator is a finding ("baseline stale"), so
 *        a pin cannot outlive the condition that justified it.
 *   4. ITS OWN DENOMINATOR: rows, declared rows, check scripts on disk, probes, pinned-dead pins, all
 *      on one line. The gate exits 1 when fewer than MIN_PROBES gates are declared, so it cannot pass
 *      by probing nothing.
 *
 * Usage:
 *   node scripts/check-gate-liveness.mjs
 *
 * Exit codes: 0 = every declaration holds and every probe reads a live denominator, 1 = a finding.
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GATE_TABLE, gateCommands, readGateTable } from "./lib/gate-table.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MIN_PROBES = 3;
const PROBE_TIMEOUT_MS = 20_000;
const NPM = process.platform === "win32" ? "npm.cmd" : "npm";

/**
 * The check scripts that are deliberately not numbered table gates, and why each is not. Being here
 * is a decision with a reason, not a silence.
 */
const EXEMPT = new Map([
  [
    "check-custom-property-closure.mjs",
    "a design-internal receipt (its own header): it scans apps/frontend/src for var() names that " +
      "resolve nowhere and exits on dangling names or cycles, printing 13 declared-but-unread names " +
      "as informational. Making it a numbered Tier 2 gate is its own decision, not this gate's.",
  ],
  [
    "check-reflow.mjs",
    "probed below as PINNED DEAD instead of numbered: page stories were retired, so its selector " +
      "yields 0 of 20 ledger entries and it has no denominator to be a gate over (its own header). " +
      "The zero is declared in PROBES rather than left invisible here.",
  ],
  [
    "check-token-values.mjs",
    "not an unattended gate: it takes --before <rev> and --after <worktree> and exits 2 on a bare " +
      "invocation, so it proves one token rename inside the change that makes it. A table row would " +
      "have to carry two revisions and could not run in a governed pass.",
  ],
]);

const at = (re, group = 1) => ({ re, group });

/**
 * The gates whose denominator is read on every run. A denominator comes from the gate's own summary
 * line, never from its exit code, and the probes stay cheap enough that this run finishes in seconds:
 * nothing here builds, boots Storybook, or runs a test suite.
 */
const PROBES = [
  {
    script: "check:doc-links",
    denominator: [at(/(\d+) markdown file\(s\) scanned/)],
    note: "exits 1 over 128 unresolved links of pre-existing debt; 623 scanned files is the denominator",
  },
  {
    script: "check:reflow",
    denominator: [at(/(\d+) selected/), at(/(\d+)\/(\d+) pass/, 2)],
    note: "two shapes: the dead one names what the selector yielded, the live one the rows measured",
    pinned:
      "dead on purpose - .github/page-inventory.json has 20 entries and 0 carrying a story, so the " +
      "selector yields nothing (7d32983c made that zero fail closed). Cleared by the page-measurement " +
      "batch, which restores a served-app measurement source; unpin when the denominator is non-zero.",
  },
  {
    script: "check:class-catalog",
    denominator: [at(/\((\d+) classes\)/)],
    note: "classes catalogued across the three stylesheets",
  },
  {
    script: "check:page-inventory",
    denominator: [at(/(\d+) entries/)],
    note: "entries in .github/page-inventory.json",
  },
  {
    script: "check:solar-parity",
    denominator: [at(/gate coverage: (\d+)\//)],
    note: "gate commands parsed from the numbered rows above; also proves the table read is alive",
  },
];

const pad = (v, w) => String(v) + " ".repeat(Math.max(0, w - String(v).length));

/** Wrap a reason onto continuation lines so a 200-character exemption stays readable in a terminal. */
function wrap(text, width = 92) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    if (line && line.length + word.length + 1 > width) {
      lines.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** The first line of a gate's own output that a declared pattern reads a number out of, or null. */
function readDenominator(text, patterns) {
  for (const raw of String(text).split(/\r?\n/)) {
    for (const { re, group } of patterns) {
      const match = raw.match(re);
      if (match) return { value: Number(match[group]), line: raw.trim() };
    }
  }
  return null;
}

const rows = readGateTable(ROOT);
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
const scripts = pkg.scripts ?? {};

/** script name -> the first gate row that declares it, so accounting can name the row, not just "yes". */
const rowOf = new Map();
for (const { row, script } of gateCommands(rows)) if (!rowOf.has(script)) rowOf.set(script, row);

const checkFiles = fs
  .readdirSync(path.join(ROOT, "scripts"))
  .filter((file) => /^check-.*\.mjs$/.test(file))
  .sort();

const findings = [];

// 1. DECLARATION - what each row counts.
const undeclared = rows.filter((row) => !row.measures);
for (const row of undeclared) {
  findings.push(
    `gate ${row.row} ${row.label}: no Measures cell - the row does not say what it counts`,
  );
}

// 2. REGISTRATION - every check script on disk is a table gate or a stated exemption.
const accounting = checkFiles.map((file) => {
  const owners = Object.entries(scripts)
    .filter(([, command]) => String(command).includes(`scripts/${file}`))
    .map(([name]) => name);
  const gate = owners.map((name) => rowOf.get(name)).find((row) => row !== undefined);
  if (gate !== undefined) {
    if (EXEMPT.has(file)) {
      findings.push(
        `${file}: stale exemption - gate ${gate} now covers it in the table; delete its EXEMPT entry`,
      );
    }
    return { file, state: `in table (gate ${gate})` };
  }
  if (EXEMPT.has(file)) return { file, state: "exempt", reason: EXEMPT.get(file) };
  findings.push(
    `${file}: neither a numbered gate nor an EXEMPT entry - register it in the table, or say in ` +
      `EXEMPT why it is not a gate`,
  );
  return { file, state: "UNACCOUNTED" };
});

// 3. OBSERVATION - run each probe and read its denominator, not its verdict.
const started = Date.now();
const probes = PROBES.map((probe) => {
  const began = Date.now();
  const result = spawnSync(NPM, ["--silent", "run", probe.script], {
    cwd: ROOT,
    encoding: "utf8",
    timeout: PROBE_TIMEOUT_MS,
    shell: process.platform === "win32",
  });
  const text = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
  const reading = readDenominator(text, probe.denominator);
  const run = { ...probe, exit: result.status, ms: Date.now() - began, reading };
  if (result.status === null) {
    findings.push(
      `probe did not finish: ${probe.script} (${result.error?.code ?? `killed after ${PROBE_TIMEOUT_MS} ms`})`,
    );
  }
  if (!reading) {
    const patterns = probe.denominator.map(({ re }) => re).join(" | ");
    findings.push(
      `probe blind: ${probe.script} printed no line matching ${patterns} - a probe that reads ` +
        `nothing is not a pass`,
    );
  } else if (probe.pinned) {
    if (reading.value !== 0) {
      findings.push(
        `baseline stale: ${probe.script} is pinned dead but now reports ${reading.value} - unpin it`,
      );
    }
  } else if (reading.value === 0) {
    findings.push(`${probe.script}: denominator is 0 - it ran and measured nothing`);
  }
  return run;
});
const probeMs = Date.now() - started;

if (PROBES.length < MIN_PROBES) {
  findings.push(
    `only ${PROBES.length} probe(s) declared: at least ${MIN_PROBES} gates must be observed - this ` +
      `gate cannot pass by probing nothing`,
  );
}

// 4. THE RUN ITSELF.
const pinnedCount = PROBES.filter((probe) => probe.pinned).length;
const F = Math.max(...checkFiles.map((file) => file.length), 8);
const S = Math.max(...probes.map((probe) => probe.script.length), 6);

console.log(`\n🔍 Gate liveness: ${GATE_TABLE}\n`);
console.log(
  `  DECLARATION   ${rows.length} numbered row(s), ${rows.length - undeclared.length} declare a cell`,
);
for (const row of undeclared) console.log(`    ✗ ${row.row} ${row.label}: empty Measures cell`);
// A row with no command is outside every command-counted denominator (`A+B gate coverage: N/N`), so
// it is named here rather than left to look covered. The two audit-skill rows are the expected ones.
const silent = rows.filter((row) => row.commands.length === 0);
console.log(
  `                ${rows.length - silent.length}/${rows.length} declare a command; ` +
    `no command in: ${silent.map((row) => `${row.row} (${row.label})`).join(", ") || "none"}`,
);

console.log(`\n  REGISTRATION  ${checkFiles.length} scripts/check-*.mjs on disk`);
for (const { file, state, reason } of accounting) {
  console.log(`    ${pad(file, F)}  ${state}`);
  for (const line of reason ? wrap(reason) : []) console.log(`      ↳ ${line}`);
}

console.log(
  `\n  OBSERVATION   ${probes.length} probe(s), ${pinnedCount} pinned dead, ${probeMs} ms`,
);
for (const probe of probes) {
  const verdict = !probe.reading
    ? "BLIND"
    : probe.pinned
      ? `pinned ${probe.reading.value}`
      : `${probe.reading.value}`;
  console.log(
    `    ${pad(probe.script, S)}  exit ${pad(probe.exit, 2)}  denominator ${pad(verdict, 10)}  ${probe.note}`,
  );
  if (probe.reading) console.log(`      ↳ read: "${probe.reading.line}"`);
  if (probe.pinned) for (const line of wrap(probe.pinned)) console.log(`      ⚑ pin: ${line}`);
}

const summary =
  `gate liveness: ${rows.length} rows · ${rows.length - undeclared.length} declared · ` +
  `${checkFiles.length} on disk · ${probes.length} probed · ${pinnedCount} pinned dead`;
const coverage =
  `gate liveness: ${accounting.filter((a) => a.state !== "UNACCOUNTED").length}/${checkFiles.length} ` +
  `check scripts accounted for · ${probes.filter((p) => p.reading).length}/${probes.length} probes read`;

console.log(`\n${"─".repeat(72)}`);
console.log(`  ${summary}`);
console.log(`  ${coverage}`);
for (const finding of findings) console.log(`  ✗ ${finding}`);
console.log(
  `  ${
    findings.length
      ? `❌ ${findings.length} finding(s): a gate here declares nothing, or nothing proved it is measuring`
      : "✅ every row declares what it counts, every check script is accounted for, every probe reads a live denominator"
  }`,
);
console.log(`${"─".repeat(72)}\n`);
process.exit(findings.length ? 1 : 0);
