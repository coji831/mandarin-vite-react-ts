#!/usr/bin/env node
/**
 * check-custom-property-closure.mjs — every `var(--name)` in the tree resolves.
 *
 * Promoted from the inline Node snippet inside the seven-checks receipt (the one
 * that found `--radius-xs` in `PhoneticClustersContent.css:39`, ruling F1): an
 * inline scan cannot fail a build, so the next dangling name is invisible again.
 *
 *   node scripts/check-custom-property-closure.mjs [--root apps/frontend/src]
 *
 * Four counters (the receipt's own):
 *   declared      distinct custom properties DECLARED in the scanned tree
 *                 (any rule, not only `:root` — component-local channels such as
 *                 `--grid-cell-height` are real declarations)
 *   referenced    distinct custom properties READ through `var(--name)`
 *   dangling      referenced, declared nowhere, and no fallback  -> exit 1
 *   cycles        declaration groups whose `var()` chain is circular -> exit 1
 *
 * Two classes that are NOT dangling, printed so the count is auditable rather
 * than merely small:
 *   resolved-by-fallback   `var(--name, 200px)` — the component-local prop
 *                          channel is never set; the fallback is the value
 *   documentation-only     a `var(--example)` inside `<code>` in a stories/docs
 *                          string; prose about a token is not a read of one
 *
 * Blind spots, named so the gate is not trusted past them: no cascade/order
 * effects, no `!important`, no cross-file scope reasoning (a name declared in
 * any scanned file satisfies a read in any other — component CSS is not scoped
 * here), and a property set from JS at runtime is only seen when it is written
 * as a `"--name": value` object key in a scanned `.ts`/`.tsx` file.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const argv = process.argv.slice(2);
const arg = (flag) => {
  const i = argv.indexOf(flag);
  return i === -1 ? undefined : argv[i + 1];
};
const SCAN_REL = arg("--root") ?? "apps/frontend/src";
const SCAN = path.resolve(ROOT, SCAN_REL);

if (!fs.existsSync(SCAN)) {
  console.error(`closure: ${SCAN_REL} does not exist`);
  process.exit(2);
}

// ─── Walk ───────────────────────────────────────────────────────────────────

const files = [];
(function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "node_modules" && !entry.name.startsWith(".")) walk(full);
    } else if (/\.(css|ts|tsx)$/.test(entry.name)) {
      files.push(full);
    }
  }
})(SCAN);

const rel = (abs) => path.relative(ROOT, abs).replace(/\\/g, "/");

// Comments become blank lines rather than empty text, so line numbers survive —
// a dangling-name report is only useful if it points at the line a human opens.
const blankOut = (text) =>
  text.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " ")).replace(/\/\/[^\n]*/g, (m) =>
    m.replace(/[^\n]/g, " "),
  );

// ─── Collect ────────────────────────────────────────────────────────────────

const DECL_RE = /^\s*(--[a-zA-Z0-9-]+)\s*:/;
const DECL_JS_RE = /["'`](--[a-zA-Z0-9-]+)["'`]\s*:/;
const REF_RE = /var\(\s*(--[a-zA-Z0-9-]+)\s*([,)])/g;
const CODE_OPEN_RE = /<code\b/g;
const CODE_CLOSE_RE = /<\/code>/g;

const declarations = new Map(); // name -> { file, line }
const values = new Map(); // name -> value text (for the cycle walk)
const references = new Map(); // name -> { file, line, fallback }

for (const file of files) {
  const raw = fs.readFileSync(file, "utf8");
  const isCss = file.endsWith(".css");
  const text = blankOut(raw);
  const lines = text.split("\n");

  lines.forEach((line, i) => {
    if (isCss) {
      // A block selector can contain `--` (`.card--unlocked:focus-visible {`), so a
      // line that opens a block is a selector, never a declaration.
      const isSelector = /[{\,]\s*$/.test(line);
      const decl = isSelector ? null : line.match(DECL_RE);
      if (decl) {
        const name = decl[1];
        if (!declarations.has(name)) declarations.set(name, { file: rel(file), line: i + 1 });
        values.set(name, line.slice(line.indexOf(":") + 1).trim());
      }
    } else {
      const decl = line.match(DECL_JS_RE);
      if (decl && !declarations.has(decl[1])) {
        declarations.set(decl[1], { file: rel(file), line: i + 1 });
      }
    }

    for (const m of line.matchAll(REF_RE)) {
      const name = m[1];
      const before = line.slice(0, m.index);
      const inCode =
        (before.match(CODE_OPEN_RE)?.length ?? 0) > (before.match(CODE_CLOSE_RE)?.length ?? 0);
      const rank = (r) => (r.inCode ? 0 : r.fallback ? 1 : 2);
      const found = { file: rel(file), line: i + 1, fallback: m[2] === ",", inCode };
      const prev = references.get(name);
      if (!prev || rank(found) > rank(prev)) references.set(name, found);
    }
  });
}

// ─── Classify unresolved reads ──────────────────────────────────────────────

const unresolved = [];
for (const [name, ref] of references) {
  if (declarations.has(name)) continue;
  unresolved.push({ name, ...ref });
}
unresolved.sort((a, b) => a.name.localeCompare(b.name));

const className = (u) => (u.inCode ? "documentation-only" : u.fallback ? "resolved-by-fallback" : "dangling");
const dangling = unresolved.filter((u) => className(u) === "dangling");
const fallbacks = unresolved.filter((u) => className(u) === "resolved-by-fallback");
const docOnly = unresolved.filter((u) => className(u) === "documentation-only");

// ─── Cycles ─────────────────────────────────────────────────────────────────
// A cycle is a self-containing var() chain. Counted as groups, so one ring of
// three names prints 1 and not 3 — the number is "how many broken loops", which
// is what a reader acts on.

const cycleGroups = [];
const cycleKeys = new Set();
const state = new Map(); // 1 = on the DFS stack, 2 = settled

function dfs(name, stack) {
  state.set(name, 1);
  stack.push(name);
  for (const m of (values.get(name) ?? "").matchAll(REF_RE)) {
    const next = m[1];
    if (!values.has(next)) continue;
    if (state.get(next) === 1) {
      const group = stack.slice(stack.indexOf(next));
      const key = [...group].sort().join("|");
      if (!cycleKeys.has(key)) {
        cycleKeys.add(key);
        cycleGroups.push({ names: group, file: declarations.get(group[0]) });
      }
    } else if (!state.get(next)) {
      dfs(next, stack);
    }
  }
  stack.pop();
  state.set(name, 2);
}

for (const name of values.keys()) if (!state.get(name)) dfs(name, []);

// ─── Report ─────────────────────────────────────────────────────────────────

const cssCount = files.filter((f) => f.endsWith(".css")).length;
const tsCount = files.length - cssCount;

console.log(
  `custom-property closure — ${SCAN_REL} (${cssCount} css, ${tsCount} ts/tsx; comments stripped)`,
);
console.log(`  declared      ${declarations.size}`);
console.log(`  referenced    ${references.size}`);
console.log(`  dangling      ${dangling.length}`);
console.log(`  cycles        ${cycleGroups.length}`);

if (unresolved.length) {
  console.log(`\n  unresolved reads (${unresolved.length}) — no declaration in the scanned tree:`);
  const pad = Math.max(...unresolved.map((u) => u.name.length));
  for (const u of unresolved) {
    console.log(
      `    ${u.name.padEnd(pad)}  ${`${u.file}:${u.line}`.padEnd(58)} ${className(u)}`,
    );
  }
}

for (const group of cycleGroups) {
  console.log(
    `\n  CYCLE ${group.names.join(" -> ")} -> ${group.names[0]}  (${group.file?.file}:${group.file?.line})`,
  );
}

if (fallbacks.length || docOnly.length) {
  console.log(
    `\n  · ${fallbacks.length} resolved-by-fallback, ${docOnly.length} documentation-only — neither is a dangling name`,
  );
}

const unreferenced = [...declarations.keys()].filter((n) => !references.has(n)).sort();
if (unreferenced.length) {
  console.log(`  · ${unreferenced.length} declared but unread (informational): ${unreferenced.join(", ")}`);
}

console.log(`\n  genuinely dangling: ${dangling.length}`);

if (dangling.length || cycleGroups.length) process.exit(1);
