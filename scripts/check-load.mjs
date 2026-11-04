#!/usr/bin/env node

/**
 * check-load.mjs - how much rule text an agent pays for before it reads any code.
 *
 * WHY THIS EXISTS
 *   The repo's rule surface grew to 302,745 B across 19 instructions, and eight of them keyed
 *   on `apps/frontend/src/**\/*.tsx`, so editing one component loaded 98,597 B of rules first.
 *   Nothing measured that, because both instruments in this portfolio count a *declared list*
 *   of always-on files rather than what the files themselves say. A budget you cannot measure
 *   is a wish.
 *
 * WHAT IT MEASURES
 *   - SESSION always-on: the project instructions plus any instruction whose `applyTo` is `**`,
 *     PLUS the user-level instructions a Copilot session carries (`~/.copilot/instructions`).
 *     That last layer is invisible to a repo-only count and is 7.4 KB on this machine.
 *   - SCOPED fan-in: for each representative path in .github/agent-surface.json, the bytes of
 *     every instruction whose `applyTo` glob matches it. This is the number that actually hurts,
 *     and the one no other check in this repo looks at.
 *   - PER-FILE ceiling: every instruction that declares an `applyTo`, against `per_file_cap_bytes`.
 *     The fan-in total can sit comfortably under its cap while one file carries a third of it, so
 *     the total alone does not say whether any single rule is too long to be obeyed. A rule with
 *     NO `applyTo` is a different class (it loads on a task match, not on a path) and is not
 *     measured here.
 *
 * THE RATCHET
 *   Values in the profile are CEILINGS. Lowering one is a pass; raising one to make room is the
 *   defect this file exists to prevent. A new instruction with a broad glob is a finding on the
 *   next run, which is the point.
 *
 * Usage:
 *   node scripts/check-load.mjs            # measure, print the table, exit 1 if over a ceiling
 *   node scripts/check-load.mjs --table    # print the table only, never fail
 *
 * Exit codes: 0 = inside every ceiling, 1 = over a ceiling, 2 = config missing or unreadable.
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PROFILE = path.join(ROOT, ".github", "agent-surface.json");
const INSTRUCTIONS = path.join(ROOT, ".github", "instructions");

/** The files a harness loads for every task, by convention rather than by glob. */
const ALWAYS_ON = [".github/copilot-instructions.md", "AGENTS.md", "CLAUDE.md"];

/**
 * A shim is a tiny always-on file whose whole content is "see <path>". CLAUDE.md is one, and the file it
 * names is loaded too - counting the 52-byte shim while ignoring the 10 KB behind it is how a budget
 * instrument lies. Follow the pointer, two hops deep.
 */
function followShims(rels) {
  const seen = new Set();
  const queue = [...rels];
  while (queue.length) {
    const rel = queue.shift();
    if (seen.has(rel)) continue;
    seen.add(rel);
    const abs = path.join(ROOT, rel);
    if (!fs.existsSync(abs) || fs.statSync(abs).size > 400) continue;
    const m = fs.readFileSync(abs, "utf8").match(/[\w./-]*[\w/-]\.md\b/);
    if (!m) continue;
    const target = path.relative(ROOT, path.resolve(path.dirname(abs), m[0])).replace(/\\/g, "/");
    if (target.startsWith("..") || !fs.existsSync(path.join(ROOT, target))) continue;
    queue.push(target);
  }
  return [...seen];
}

const tableOnly = process.argv.includes("--table");

if (!fs.existsSync(PROFILE)) {
  console.error(`load: profile not found at ${path.relative(ROOT, PROFILE)}`);
  process.exit(2);
}
let profile;
try {
  profile = JSON.parse(fs.readFileSync(PROFILE, "utf8"));
} catch (err) {
  console.error(`load: profile is not valid JSON - ${err.message}`);
  process.exit(2);
}

/** `**` -> any, `**\/` -> any dir prefix, `*` -> any segment chars, `?` -> one. Anchored. */
function globToRegExp(glob) {
  if (glob === "**") return /^.*$/;
  let out = "";
  for (let i = 0; i < glob.length; i += 1) {
    const c = glob[i];
    if (glob.startsWith("**/", i)) {
      out += "(?:.*/)?";
      i += 2;
    } else if (glob.startsWith("**", i)) {
      out += ".*";
      i += 1;
    } else if (c === "*") {
      out += "[^/]*";
    } else if (c === "?") {
      out += "[^/]";
    } else if ("\\^$.|+()[]{}".includes(c)) {
      out += `\\${c}`;
    } else {
      out += c;
    }
  }
  return new RegExp(`^${out}$`);
}

function frontmatter(text) {
  // Normalise first: two instruction files are CRLF in a working tree where git stores LF, and a
  // trailing \r on an `applyTo` value makes the glob silently match nothing.
  text = text.replace(/\r\n/g, "\n");
  if (!text.startsWith("---")) return {};
  const end = text.indexOf("\n---", 3);
  if (end < 0) return {};
  const out = {};
  for (const line of text.slice(3, end).split("\n")) {
    const m = line.match(/^([A-Za-z_-]+):\s*(.*)$/);
    if (m) out[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
  return out;
}

function readText(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8").replace(/\r\n/g, "\n");
}

function size(rel) {
  const abs = path.join(ROOT, rel);
  return fs.existsSync(abs) ? fs.statSync(abs).size : 0;
}

// ---- every instruction, with its compiled globs -------------------------------------------------
const rules = [];
if (fs.existsSync(INSTRUCTIONS)) {
  for (const file of fs.readdirSync(INSTRUCTIONS).sort()) {
    if (!file.endsWith(".instructions.md")) continue;
    const rel = path.posix.join(".github/instructions", file);
    const text = readText(rel);
    const fm = frontmatter(text);
    const globs = (fm.applyTo || "")
      .split(",")
      .map((g) => g.trim())
      .filter(Boolean);
    rules.push({
      rel,
      name: file.replace(".instructions.md", ""),
      bytes: size(rel),
      globs,
      regs: globs.map(globToRegExp),
      unconditional: globs.includes("**"),
      hasApplyTo: globs.length > 0,
    });
  }
}

// ---- the session's always-on layer -------------------------------------------------------------
const projectAlways = followShims(ALWAYS_ON.filter((f) => fs.existsSync(path.join(ROOT, f))));
const uncond = rules.filter((r) => r.unconditional);

const userDir = path.join(os.homedir(), ".copilot", "instructions");
let userBytes = 0;
const userFiles = [];
if (fs.existsSync(userDir)) {
  for (const f of fs.readdirSync(userDir)) {
    if (!f.endsWith(".instructions.md")) continue;
    const abs = path.join(userDir, f);
    const fm = frontmatter(fs.readFileSync(abs, "utf8"));
    // a user-level file with a narrower applyTo is not unconditional; only `**` (or none) counts
    if (fm.applyTo && fm.applyTo.trim() !== "**") continue;
    const bytes = fs.statSync(abs).size;
    userBytes += bytes;
    userFiles.push({ name: f, bytes });
  }
}

const alwaysOn =
  projectAlways.reduce((n, f) => n + size(f), 0) +
  uncond.reduce((n, r) => n + r.bytes, 0) +
  userBytes;

// ---- per-path fan-in ---------------------------------------------------------------------------
const paths = Array.isArray(profile.representative_paths) ? profile.representative_paths : [];
// An `applyTo: **` rule is already inside `alwaysOn`, so counting it here again would inflate every
// fan-in row by its size. The scoped set is the rules this path adds on top of the always-on layer.
const matches = (p) => rules.filter((r) => !r.unconditional && r.regs.some((re) => re.test(p)));

// ---- report ------------------------------------------------------------------------------------
const pad = (s, n) => String(s).padEnd(n);
const clip = (s, n) => (s.length > n ? `...${s.slice(-(n - 3))}` : s);
const num = (n) => n.toLocaleString("en-US");

console.log(
  `\nagent surface - ${rules.length} instruction(s), profile ${path.relative(ROOT, PROFILE)}\n`,
);

console.log("ALWAYS-ON (every task, before any file is opened)");
for (const f of projectAlways) console.log(`  ${pad(f, 52)} ${String(num(size(f))).padStart(8)}`);
for (const r of uncond)
  console.log(`  ${pad(`${r.name} (applyTo: **)`, 52)} ${String(num(r.bytes)).padStart(8)}`);
for (const f of userFiles)
  console.log(
    `  ${pad(clip(`~/.copilot/instructions/${f.name}`, 52), 52)} ${String(num(f.bytes)).padStart(8)}`,
  );
const alwaysCap = profile.always_on_cap_bytes;
const alwaysOver = alwaysCap != null && alwaysOn > alwaysCap;
console.log(
  `  ${pad("SESSION TOTAL", 52)} ${String(num(alwaysOn)).padStart(8)}   cap ${num(alwaysCap)}   ${alwaysOver ? "OVER" : "ok"}`,
);

console.log(
  "\nSCOPED FAN-IN (an edit at this path, on top of the always-on layer above; a rule with",
);
console.log("an `applyTo: **` glob is in the top already, so it is not counted twice here)\n");
console.log(`  ${pad("path", 56)}${pad("files", 6)}${pad("scoped", 9)}${pad("total", 9)}cap`);
let worst = 0;
const overPaths = [];
const missingPaths = [];
for (const entry of paths) {
  // A path that does not exist measures nothing, and would silently report a small number as if it
  // were a real edit. Two of the seven entries here were wrong on the first pass and read as PASS.
  if (!fs.existsSync(path.join(ROOT, entry.path))) {
    missingPaths.push(entry.path);
    console.log(`  ${pad(clip(entry.path, 56), 56)}   -  ${"MISSING".padStart(8)}`);
    continue;
  }
  const hits = matches(entry.path);
  const scoped = hits.reduce((n, r) => n + r.bytes, 0);
  const total = scoped + alwaysOn;
  const cap = entry.cap ?? profile.scope_fan_in_cap_bytes;
  const over = cap != null && total > cap;
  if (over) overPaths.push({ path: entry.path, total, cap });
  worst = Math.max(worst, total);
  const shownCap = cap == null ? "none" : num(cap);
  console.log(
    `  ${pad(clip(entry.path, 56), 56)}${String(hits.length).padStart(4)}  ${String(num(scoped)).padStart(8)} ${String(num(total)).padStart(8)}  ${pad(shownCap, 8)}${over ? "OVER" : "ok"}`,
  );
}

// ---- rules with no scope, and the widest glob ---------------------------------------------------
const unscoped = rules.filter((r) => !r.hasApplyTo);
if (unscoped.length) {
  console.log("\nUNSCOPED (no applyTo: loads only when its description matches a task)");
  for (const r of unscoped) console.log(`  ${pad(r.name, 52)} ${String(num(r.bytes)).padStart(8)}`);
}

const wide = rules
  .filter((r) => r.globs.some((g) => g === "**" || g === "**/*" || g === "**/*.tsx"))
  .map(
    (r) =>
      `${r.name} (${r.globs.filter((g) => g === "**" || g === "**/*" || g === "**/*.tsx").join(", ")})`,
  );
if (wide.length) console.log(`\nWIDEST GLOBS  ${wide.join("; ")}`);

// ---- per-file ceiling ---------------------------------------------------------------------------
// Only rules that declare an `applyTo`: an unscoped rule loads on a task match, not a path, so it is
// a different class and comparing it to a scoped rule's budget would be comparing two things.
const fileCap = profile.per_file_cap_bytes;
const scopedRules = rules.filter((r) => r.hasApplyTo);
const overFiles = fileCap != null ? scopedRules.filter((r) => r.bytes > fileCap) : [];
if (fileCap != null && scopedRules.length) {
  const widest = scopedRules.reduce((a, b) => (b.bytes > a.bytes ? b : a));
  console.log(`\nPER-FILE CEILING (the widest of ${scopedRules.length} scoped instructions)`);
  console.log(
    `  ${pad(widest.name, 52)} ${String(num(widest.bytes)).padStart(8)}   cap ${num(fileCap)}   ` +
      `${widest.bytes > fileCap ? "OVER" : "ok"}   ${num(Math.abs(fileCap - widest.bytes))} B ${widest.bytes > fileCap ? "over" : "headroom"}`,
  );
}

// ---- skills: the budgets the registry declares ---------------------------------------------------
// A skill loads on a task match, so it is not part of the always-on layer or of a path's fan-in and
// was invisible to every gate here. `.github/skills-registry.json` declares a budget per skill; until
// this section existed, nothing read it and the 12 numbers were decoration. Registry rows are checked
// in both directions a row can be wrong: a path that is not on disk, and bytes over the row's budget.
// Skills outside the registry are named but are not findings - the registry indexes the workflow
// family, and the three audit skills predate it.
const REGISTRY = path.join(ROOT, ".github", "skills-registry.json");
const skillsOnDisk = fs.existsSync(path.join(ROOT, ".github", "skills"))
  ? fs
      .readdirSync(path.join(ROOT, ".github", "skills"), { withFileTypes: true })
      .filter(
        (d) =>
          d.isDirectory() &&
          fs.existsSync(path.join(ROOT, ".github", "skills", d.name, "SKILL.md")),
      )
      .map((d) => `.github/skills/${d.name}/SKILL.md`)
  : [];
const overSkills = [];
const missingSkills = [];
const unregisteredSkills = [];
let registry = null;
if (fs.existsSync(REGISTRY)) {
  try {
    registry = JSON.parse(fs.readFileSync(REGISTRY, "utf8"));
  } catch (err) {
    console.error(`load: skills-registry.json is not valid JSON - ${err.message}`);
    process.exit(2);
  }
  const rows = Array.isArray(registry.skills) ? registry.skills : [];
  const registered = new Set();
  for (const s of rows) {
    registered.add(s.path);
    if (!fs.existsSync(path.join(ROOT, s.path))) {
      missingSkills.push(s);
      continue;
    }
    if (s.budget_bytes != null && size(s.path) > s.budget_bytes) overSkills.push(s);
  }
  const unregistered = skillsOnDisk.filter((p) => !registered.has(p));
  console.log(`\nSKILLS (${rows.length} registered, ${skillsOnDisk.length} on disk)`);
  for (const s of rows) {
    const actual = fs.existsSync(path.join(ROOT, s.path)) ? size(s.path) : null;
    const at = actual == null ? "MISSING" : String(num(actual)).padStart(8);
    const cap = s.budget_bytes == null ? "none" : num(s.budget_bytes);
    const over = actual != null && s.budget_bytes != null && actual > s.budget_bytes;
    const slack =
      actual == null || s.budget_bytes == null
        ? ""
        : `   ${num(Math.abs(s.budget_bytes - actual))} B ${over ? "over" : "headroom"}`;
    console.log(`  ${pad(s.id, 30)}${at}   cap ${pad(cap, 7)}${over ? "OVER" : "ok"}${slack}`);
  }
  if (unregistered.length) {
    for (const p of unregistered) unregisteredSkills.push(p);
  }
}

// ---- verdict -----------------------------------------------------------------------------------
const problems = [];
if (alwaysOver)
  problems.push(
    `always-on ${num(alwaysOn)} B over cap ${num(alwaysCap)} (by ${num(alwaysOn - alwaysCap)})`,
  );
for (const p of overPaths) problems.push(`${p.path} ${num(p.total)} B over cap ${num(p.cap)}`);
for (const r of overFiles)
  problems.push(`${r.name} ${num(r.bytes)} B over the per-file cap ${num(fileCap)}`);
for (const s of overSkills)
  problems.push(
    `skill ${s.id} ${num(size(s.path))} B over its registry budget ${num(s.budget_bytes)}`,
  );
for (const s of missingSkills)
  problems.push(`skills-registry.json names ${s.path}, which is not on disk`);
for (const p of unregisteredSkills)
  problems.push(
    `${p} has no row in skills-registry.json - add one with its trigger and a budget, or delete the skill`,
  );

if (missingPaths.length) {
  console.error(
    `\nload: ${missingPaths.length} representative path(s) do not exist - the profile is wrong`,
  );
  for (const p of missingPaths) console.error(`  - ${p}`);
  console.error(
    `  Fix .github/agent-surface.json. A path that is not in the tree measures nothing.`,
  );
  process.exit(2);
}

if (!problems.length) {
  const headroom = alwaysCap != null ? alwaysCap - alwaysOn : null;
  console.log(
    `\nload: PASS - always-on ${num(alwaysOn)} B${headroom != null ? ` (${num(headroom)} B headroom)` : ""}, worst path ${num(worst)} B`,
  );
  process.exit(0);
}

console.error(`\nload: ${problems.length} finding(s)`);
for (const p of problems) console.error(`  - ${p}`);
console.error("  The caps are a ratchet: fix the growth, do not raise the number.");
process.exit(tableOnly ? 0 : 1);
