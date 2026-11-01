#!/usr/bin/env node

/**
 * check-doc-links.mjs
 *
 * Standalone link-target companion to check:system-map (C2). Walks docs/**,
 * .github/** and repo-root *.md, reports relative markdown links whose targets
 * do not resolve, and compares that set against the pinned baseline below.
 *
 * Rules:
 *   - Only RELATIVE links are checked (http(s)://, mailto:, tel:, data:,
 *     file://, and bare `#anchor` links are skipped).
 *   - Targets are resolved against the containing file's directory. A trailing
 *     `/` resolves as a directory link. A `#fragment` is stripped before the
 *     file-existence check.
 *   - `<!-- link-ignore: <path> -->` inside a file exempts any broken link in
 *     THAT file whose target matches <path> (raw target or normalized path).
 *   - Gitignored `wip/` and `verification-artifacts/` are skipped (they keep
 *     pointer rows, never content — per the two-layer design).
 *   - build artifacts (node_modules, dist, storybook-static, .git, .terraform)
 *     are not scanned.
 *
 * THE RATCHET
 *   The tree carries 128 unresolved relative links that predate this check, so "red on any break"
 *   made the gate permanently red and therefore uninformative: a new break looked exactly like the
 *   debt already there. `.github/doc-links-baseline.json` pins the accepted set as link IDENTITIES
 *   (containing file + raw target), not as a count. A count lets a fix in one file pay for a new
 *   break in another - the number stays 128, the gate stays green, the regression ships. Identities
 *   make both directions visible:
 *     - a break that is not in the baseline is a NEW BREAK: named individually, exit 1;
 *     - a baseline entry that is no longer broken is a STALE entry: named, exit 1, lower the
 *       baseline. A baseline that never expires is a rubber stamp. Same both-ways rule as the
 *       pinned-dead probes in check-gate-liveness.mjs;
 *     - neither means exit 0, with one line carrying current, baseline, new and stale counts so it
 *       is obvious a real measurement happened.
 *
 * Usage:
 *   node scripts/check-doc-links.mjs                  # ratchet verdict against the pinned baseline
 *   node scripts/check-doc-links.mjs --print-baseline # print the current set as baseline JSON
 *
 * `--print-baseline` writes to stdout and nowhere else, on purpose: a legitimate change is made by
 * redirecting into `.github/doc-links-baseline.json` and REVIEWING THE DIFF. A flag that rewrote the
 * file in place would let a break be accepted by rerunning the check, which is how a ratchet stops
 * ratcheting. The provenance fields are carried over from the committed baseline when it parses.
 *
 * Exit codes:
 *   0 = the current set matches the baseline
 *   1 = at least one new break, or at least one stale baseline entry
 *   2 = the baseline is missing, is not valid JSON, or is not shaped like a baseline
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASELINE = path.join(ROOT, ".github", "doc-links-baseline.json");
const printBaseline = process.argv.includes("--print-baseline");

// Directories/files never scanned (build artifacts + gitignored governance dirs).
const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "storybook-static",
  ".terraform",
  "wip",
  "verification-artifacts",
]);
const SKIP_FILES = new Set(["package-lock.json"]);

function* walkMd(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) yield* walkMd(full);
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      yield full;
    }
  }
}

function collectScannedFiles() {
  const files = new Set();
  for (const dir of [path.join(ROOT, "docs"), path.join(ROOT, ".github")]) {
    if (fs.existsSync(dir)) {
      for (const f of walkMd(dir)) files.add(f);
    }
  }
  // Repo-root *.md (README.md, DESIGN.md, CLAUDE.md, TODO.md, AGENTS.md …).
  for (const entry of fs.readdirSync(ROOT, { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith(".md") && !SKIP_FILES.has(entry.name)) {
      files.add(path.join(ROOT, entry.name));
    }
  }
  return [...files].sort();
}

/**
 * Remove fenced code blocks (``` or ~~~) so markdown-looking text inside code
 * (prompt templates, shell/PowerShell snippets) is not treated as links.
 */
function stripFenced(text) {
  return text.replace(/```[\s\S]*?```/g, "").replace(/~~~[\s\S]*?~~~/g, "");
}

/**
 * Extract { inline } and { definitions } markdown links from a file body.
 * Inline: [text](target) and ![alt](target). Definitions: [label]: target "title".
 */
function extractLinks(text) {
  const links = [];
  const reInline = /!?\[[^\]]*\]\(<([^>]+)>\)|!?\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  let m;
  while ((m = reInline.exec(text)) !== null) {
    const target = m[1] ?? m[2];
    if (target) links.push(target.trim());
  }
  const reDef = /^\[([^\]]+)\]:\s*<?([^\s>]+)>?(?:\s+["'(][^"')]+["')])?/gm;
  while ((m = reDef.exec(text)) !== null) {
    const target = m[2].trim();
    // A reference "destination" without a dot or slash is prose, not a path
    // (e.g. `[Rationale]: Break the epic into …`). Skip it.
    if (!/[./]/.test(target)) continue;
    links.push(target);
  }
  return links;
}

function isSkippable(target) {
  return (
    /^(https?:|mailto:|tel:|data:|file:|ftp:)/i.test(target) ||
    target.startsWith("#") ||
    target.startsWith("<") // inline HTML or bare angle target
  );
}

/** Resolve a relative target against the file's dir; returns an absolute path (fragment stripped). */
function resolveTarget(file, target) {
  const clean = target.split("#")[0].replace(/^<|>$/g, "");
  if (!clean) return null;
  const abs = path.resolve(path.dirname(file), clean);
  return abs;
}

/** The `<!-- link-ignore: path -->` escapes declared in a file. */
function linkIgnores(text) {
  const out = [];
  const re = /<!--\s*link-ignore:\s*([^-]+?)\s*-->/g;
  let m;
  while ((m = re.exec(text)) !== null) out.push(m[1].trim());
  return out;
}

/** A stable identity for one unresolved link: containing file + raw target, forward-slashed. */
function identity(relFile, target) {
  return { file: relFile.replace(/\\/g, "/"), target };
}

/**
 * Ordinal compare, not localeCompare: the baseline is a committed artefact, so its entry order must
 * be the same on every machine that reprints it.
 */
function compareEntries(a, b) {
  if (a.file !== b.file) return a.file < b.file ? -1 : 1;
  if (a.target !== b.target) return a.target < b.target ? -1 : 1;
  return 0;
}

const keyOf = (entry) => `${entry.file}\n${entry.target}`;
const BASELINE_REL = path.relative(ROOT, BASELINE).replace(/\\/g, "/");
const PLACEHOLDER_REASON = "TODO: why these links are accepted, and what clears them";

function failBaseline(message) {
  console.error(`doc-links: ${message}`);
  process.exit(2);
}

/** Read and validate the pinned baseline. A bad baseline is exit 2, never a silent empty set. */
function loadBaseline() {
  if (!fs.existsSync(BASELINE)) {
    failBaseline(
      `baseline missing at ${BASELINE_REL} - create it with: node scripts/check-doc-links.mjs --print-baseline > ${BASELINE_REL}`,
    );
  }
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(BASELINE, "utf8"));
  } catch (err) {
    failBaseline(`baseline is not valid JSON at ${BASELINE_REL} - ${err.message}`);
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    failBaseline(`baseline at ${BASELINE_REL} is not a JSON object`);
  }
  if (typeof parsed.reason !== "string" || !parsed.reason.trim()) {
    failBaseline(`baseline at ${BASELINE_REL} declares no "reason" string`);
  }
  if (typeof parsed.pinned !== "string" || !parsed.pinned.trim()) {
    failBaseline(`baseline at ${BASELINE_REL} declares no "pinned" string`);
  }
  if (!Array.isArray(parsed.entries)) {
    failBaseline(`baseline at ${BASELINE_REL} declares no "entries" array`);
  }
  const entries = [];
  const seen = new Set();
  for (let i = 0; i < parsed.entries.length; i += 1) {
    const entry = parsed.entries[i];
    if (!entry || typeof entry.file !== "string" || typeof entry.target !== "string") {
      failBaseline(
        `baseline entry ${i} at ${BASELINE_REL} is not { "file": <string>, "target": <string> }`,
      );
    }
    const one = identity(entry.file, entry.target);
    const key = keyOf(one);
    if (seen.has(key)) {
      failBaseline(`baseline entry ${i} at ${BASELINE_REL} repeats ${one.file} -> ${one.target}`);
    }
    seen.add(key);
    entries.push(one);
  }
  return entries.sort(compareEntries);
}

/** The current set, printed in the baseline's exact shape so it can be redirected and reviewed. */
function printCurrent(entries) {
  let reason = PLACEHOLDER_REASON;
  let pinned = new Date().toISOString().slice(0, 10);
  if (fs.existsSync(BASELINE)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(BASELINE, "utf8"));
      if (typeof parsed.reason === "string" && parsed.reason.trim()) reason = parsed.reason;
      if (typeof parsed.pinned === "string" && parsed.pinned.trim()) pinned = parsed.pinned;
    } catch {
      // An unreadable baseline is the ratchet's exit 2; printing the current set must not depend on it.
    }
  }
  process.stdout.write(`${JSON.stringify({ reason, pinned, entries }, null, 2)}\n`);
  process.exit(0);
}

function main() {
  const files = collectScannedFiles();
  const current = [];

  for (const file of files) {
    let text;
    try {
      text = fs.readFileSync(file, "utf-8");
    } catch {
      continue;
    }
    const ignores = linkIgnores(text).map((p) => path.resolve(ROOT, p));
    const seen = new Set();
    const body = stripFenced(text);

    for (const target of extractLinks(body)) {
      if (isSkippable(target)) continue;
      const abs = resolveTarget(file, target);
      if (!abs || seen.has(abs)) continue;
      seen.add(abs);

      // File exists → OK. Directory (trailing /) → OK if dir exists.
      if (fs.existsSync(abs)) continue;

      // link-ignore escape: exact raw target or normalized path exempts it.
      if (ignores.includes(abs)) continue;

      current.push(identity(path.relative(ROOT, file), target));
    }
  }
  current.sort(compareEntries);

  // Only `--print-baseline` may emit JSON, and it must be the only thing on stdout.
  if (printBaseline) printCurrent(current);

  const baseline = loadBaseline();
  console.log(`\n🔍 Doc link checker — ${files.length} markdown file(s) scanned`);

  const baselineKeys = new Set(baseline.map(keyOf));
  const currentKeys = new Set(current.map(keyOf));
  const added = current.filter((entry) => !baselineKeys.has(keyOf(entry)));
  const stale = baseline.filter((entry) => !currentKeys.has(keyOf(entry)));
  const findings = [];

  for (const entry of added) console.log(`  ❌ new break: ${entry.file} → ${entry.target}`);
  for (const entry of stale) {
    console.log(`  ⚠ stale baseline entry: ${entry.file} → ${entry.target}`);
  }
  if (added.length) {
    findings.push(
      `${added.length} new break(s) not in ${BASELINE_REL} - fix the link, or accept it on purpose ` +
        `with --print-baseline and review the diff`,
    );
  }
  if (stale.length) {
    findings.push(
      `${stale.length} stale baseline entr(ies) no longer broken - lower ${BASELINE_REL} to match`,
    );
  }

  const uniqueFiles = new Set(current.map((entry) => entry.file)).size;
  console.log(`\n${"─".repeat(72)}`);
  console.log(
    `  doc links: ${current.length} current · ${baseline.length} baseline · ${added.length} new · ` +
      `${stale.length} stale · ${files.length} scanned · ${uniqueFiles} file(s) with breaks · ` +
      `${findings.length ? "FAIL" : "ok"}`,
  );
  for (const finding of findings) console.log(`  ✗ ${finding}`);
  console.log(
    `  ${
      findings.length
        ? `❌ ${findings.length} finding(s): the pinned baseline and the tree disagree`
        : `✅ every one of the ${current.length} unresolved link(s) is pinned in ${BASELINE_REL}`
    }`,
  );
  console.log(`${"─".repeat(72)}\n`);
  process.exit(findings.length ? 1 : 0);
}

main();
