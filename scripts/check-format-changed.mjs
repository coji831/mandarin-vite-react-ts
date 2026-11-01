#!/usr/bin/env node

/**
 * check-format-changed.mjs - gate 1 over the files that changed, so a two-file edit does not pay
 * for the whole tree.
 *
 * WHY THIS EXISTS
 *   `npm run format:check` walks `docs/**`, `apps/**`, `packages/**`, `scripts/**`, `.github/**`,
 *   `*.md` and `*.json` and costs ~22 s on this tree (measured 2026-11-01), paid on every code
 *   change to re-check files that usually did not change. CI runs that full sweep on every PR, so
 *   the local Tier-1 pass can ask the narrower and far cheaper question: is what I just touched
 *   formatted?
 *
 *   It is an OPTIMIZATION and never a substitute. `format:check` keeps its exact globs and CI keeps
 *   running it; narrowing `format:check` itself would have narrowed CI, because `ci.yml` and gate 1
 *   read the same npm script.
 *
 * WHAT IT CHECKS
 *   The files that changed against `<base>`, PLUS every untracked file: a brand-new file is the
 *   likeliest thing to be unformatted and it appears in no diff. Prettier decides which of them are
 *   checkable, through its own `.prettierignore` and `--ignore-unknown`. There is no extension
 *   allowlist here, because a second copy of that decision is exactly the thing that drifts.
 *
 * Usage:
 *   node scripts/check-format-changed.mjs              # changed vs HEAD, staged + unstaged + untracked
 *   node scripts/check-format-changed.mjs --base main  # changed vs any revision, branch, tag or commit
 *
 * Exit codes: 0 = every changed file is formatted (or nothing changed), 1 = prettier found a
 *   violation and named it, 2 = the run itself broke (not a git repository, unknown base revision,
 *   prettier not installed) printed as one line with no stack trace.
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const IGNORE_PATH = path.join(ROOT, ".prettierignore");

/**
 * Paths per prettier invocation. The Windows command line caps at 32,767 characters and a repo path
 * averages ~60, so 100 paths is ~6 KB: four times inside the limit, and large enough that a normal
 * change set is a single run.
 */
const CHUNK = 100;

/** Give up on a run, as one line, without the stack a thrown error would print. */
function broke(message) {
  console.error(`format:check:changed: ${message}`);
  process.exit(2);
}

const ANSI = /\u001b\[[0-9;]*m/g;
const stripAnsi = (text) => String(text ?? "").replace(ANSI, "");

function git(args) {
  const result = spawnSync("git", args, { cwd: ROOT, encoding: "utf8", timeout: 60_000 });
  if (result.error)
    broke(`git ${args[0]} could not run (${result.error.code ?? result.error.message})`);
  return result;
}

function parseArgs(argv) {
  let base = "HEAD";
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      console.log("usage: node scripts/check-format-changed.mjs [--base <rev>]   (default: HEAD)");
      process.exit(0);
    }
    if (arg === "--base") {
      base = argv[i + 1];
      if (base === undefined) broke("--base needs a revision, e.g. --base origin/main");
      i++;
    } else if (arg.startsWith("--base=")) {
      base = arg.slice("--base=".length);
    } else {
      broke(
        `unknown argument "${arg}" - usage: node scripts/check-format-changed.mjs [--base <rev>]`,
      );
    }
  }
  return { base };
}

/** The paths of `prettier`'s own CLI entry, so it can be spawned with the running node and no shell. */
function prettierCli() {
  const require = createRequire(import.meta.url);
  const pkgPath = require.resolve("prettier/package.json");
  const pkg = require("prettier/package.json");
  const bin = typeof pkg.bin === "string" ? pkg.bin : (pkg.bin?.prettier ?? "./bin/prettier.cjs");
  return path.resolve(path.dirname(pkgPath), bin);
}

const { base } = parseArgs(process.argv.slice(2));
const started = Date.now();

if (git(["rev-parse", "--is-inside-work-tree"]).status !== 0) {
  broke(`not inside a git repository - ${ROOT} has nothing to compare against`);
}
if (git(["rev-parse", "--verify", "--quiet", `${base}^{commit}`]).status !== 0) {
  broke(
    `unknown base revision "${base}" - pass --base <rev> naming a commit, branch or tag that exists`,
  );
}

const tracked = git(["diff", "--name-only", "--diff-filter=ACMR", base]);
if (tracked.status !== 0) broke(`git diff against "${base}" failed: ${tracked.stderr.trim()}`);
const untracked = git(["ls-files", "--others", "--exclude-standard"]);
if (untracked.status !== 0) broke(`git ls-files failed: ${untracked.stderr.trim()}`);

const changed = [
  ...new Set(
    `${tracked.stdout}\n${untracked.stdout}`
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .filter((rel) => !rel.startsWith(".git/") && fs.existsSync(path.join(ROOT, rel))),
  ),
].sort();

if (changed.length === 0) {
  console.log(`format:check:changed: 0 files changed vs ${base} — nothing to check`);
  process.exit(0);
}

// Prettier, not this script, says which of them it can and will format.
const prettier = await import("prettier");
const checkable = [];
let skipped = 0;
for (const rel of changed) {
  const info = await prettier.getFileInfo(rel, { ignorePath: IGNORE_PATH });
  if (info.ignored || info.inferredParser === null) skipped++;
  else checkable.push(rel);
}

const cli = prettierCli();
if (!fs.existsSync(cli)) broke(`prettier CLI not found at ${cli} - run npm install`);

/**
 * The files prettier names as unformatted: one `[warn] <path>` per file, plus its closing sentence.
 * Prettier colourises that line even through a pipe, so the escape sequences come off before matching.
 */
function namedFiles(stdout, stderr) {
  return stripAnsi(`${stdout ?? ""}\n${stderr ?? ""}`)
    .split(/\r?\n/)
    .filter((line) => line.startsWith("[warn] ") && !line.startsWith("[warn] Code style issues"))
    .map((line) => line.slice("[warn] ".length).trim());
}

const violations = [];
let sawViolation = false;
let batches = 0;
for (let i = 0; i < checkable.length; i += CHUNK) {
  const batch = checkable.slice(i, i + CHUNK);
  batches++;
  const result = spawnSync(process.execPath, [cli, "--check", "--ignore-unknown", ...batch], {
    cwd: ROOT,
    encoding: "utf8",
    timeout: 300_000,
    shell: false,
    env: { ...process.env, NO_COLOR: "1" },
  });
  if (result.stdout) process.stdout.write(stripAnsi(result.stdout));
  if (result.stderr) process.stderr.write(stripAnsi(result.stderr));
  if (result.error) broke(`prettier could not run (${result.error.code ?? result.error.message})`);
  if (result.status === 1) {
    // The verdict is prettier's status, never this script's ability to parse its prose. Reading the
    // names is for the message only: a parse that yields nothing must not turn a failure into a pass.
    sawViolation = true;
    violations.push(...namedFiles(result.stdout, result.stderr));
  } else if (result.status !== 0)
    broke(`prettier exited ${result.status} on ${batch.length} path(s)`);
}

const denominator =
  checkable.length === 0
    ? `${changed.length} file(s) changed vs ${base}, 0 checked (every one ignored by .prettierignore or unknown to prettier)`
    : `${changed.length} file(s) changed vs ${base}, ${checkable.length} checked` +
      (skipped ? `, ${skipped} skipped as ignored or unknown` : "");
const verdict =
  checkable.length === 0
    ? "nothing checkable changed"
    : !sawViolation
      ? "every changed file is formatted"
      : violations.length === 0
        ? "prettier reported unformatted files but named none - read its output above"
        : `${violations.length} not formatted, named above: ${violations.slice(0, 3).join(", ")}` +
          (violations.length > 3 ? ` and ${violations.length - 3} more` : "");
const run = batches > 1 ? `, ${batches} prettier run(s) of <=${CHUNK}` : "";
console.log(
  `format:check:changed: ${denominator}${run} in ${Date.now() - started} ms — ${verdict}`,
);
process.exit(sawViolation ? 1 : 0);
