#!/usr/bin/env node
/**
 * check-token-values.mjs — G1: the step-1a proof gate ("names only, values held").
 *
 * Resolves every `:root` (and `[data-theme]`) custom property in two trees through
 * its own `var()` chain and compares the RESOLVED, NORMALIZED values. 1a may move
 * a name; it may not move a value.
 *
 *   node scripts/check-token-values.mjs --before b2459591 [--after .]
 *   node scripts/check-token-values.mjs --before-file a.css --after-file b.css
 *
 * Exit rules (fail closed):
 *   CHANGED <name>: <before> -> <after>            a value moved              -> exit 1
 *   ORPHAN  <name>: <value> — no surviving name resolves to this value      -> exit 1
 *   UNRESOLVED <name>: <value>                     a var() with no mapping   -> exit 1
 *   STALE-ALLOW <name>                             an allow entry matched nothing
 *                                                                           -> exit 1
 *
 * ORPHAN is scoped to names something actually read (git grep for `var(--name)`
 * in the before tree). A name nothing read is an R-DELETE by ruling, not an
 * orphan: its value is allowed to leave with it.
 *
 * Allow-list `tools/token-value-allow.json` sanctions by name, on both sides of
 * the diff: a CHANGED row prints `ALLOWED`, and a removed name that would
 * otherwise print ORPHAN prints `ALLOWED-REMOVED`. It is empty for 1a; in 1b its
 * contents ARE the enumerated diff. An entry that matches neither is STALE-ALLOW
 * and fails, so a held token that 1b forgets to land cannot pass quietly.
 *
 * Blind spots, named so the gate is not trusted past them: no cascade/order
 * effects, no `!important`, no inline styles, no `.module.css` scoping, and
 * `color-mix` only against `transparent`.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const GLOBALS = "apps/frontend/src/styles/globals.css";
const ALLOW_PATH = path.join(ROOT, "tools/token-value-allow.json");
const MAX_DEPTH = 12;

const argv = process.argv.slice(2);
const arg = (flag) => {
  const i = argv.indexOf(flag);
  return i === -1 ? undefined : argv[i + 1];
};
const beforeRev = arg("--before");
const afterDir = arg("--after");
const beforeFile = arg("--before-file");
const afterFile = arg("--after-file");
const globalsRel = arg("--globals") ?? GLOBALS;

if (!beforeRev && !beforeFile) {
  console.error(
    "usage: check-token-values.mjs --before <rev> [--after <worktree>] | --before-file <css> --after-file <css>",
  );
  process.exit(2);
}

// ─── Read both sides ────────────────────────────────────────────────────────

function readBefore() {
  if (beforeFile) return fs.readFileSync(path.resolve(ROOT, beforeFile), "utf8");
  return execFileSync("git", ["show", `${beforeRev}:${globalsRel}`], {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 1 << 26,
  });
}

function readAfter() {
  if (afterFile) return fs.readFileSync(path.resolve(ROOT, afterFile), "utf8");
  const base = path.resolve(ROOT, afterDir ?? ".");
  const candidate = path.join(base, globalsRel);
  return fs.readFileSync(fs.existsSync(candidate) ? candidate : base, "utf8");
}

// ─── Collect :root / [data-theme] declarations ──────────────────────────────

function collect(css) {
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const map = new Map();
  let rule;
  const ruleRe = /([^{}]+)\{([^{}]*)\}/g;
  while ((rule = ruleRe.exec(clean))) {
    const selector = rule[1].trim();
    if (selector !== ":root" && !selector.includes("[data-theme")) continue;
    for (const decl of rule[2].split(";")) {
      const at = decl.indexOf(":");
      if (at === -1) continue;
      const name = decl.slice(0, at).trim();
      if (!name.startsWith("--")) continue;
      map.set(name, decl.slice(at + 1).trim());
    }
  }
  return map;
}

// ─── Resolve var() chains ───────────────────────────────────────────────────

function splitTop(text, sep = ",") {
  const parts = [];
  let depth = 0;
  let quote = null;
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quote) {
      if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'") quote = c;
    else if (c === "(") depth++;
    else if (c === ")") depth--;
    else if (c === sep && depth === 0) {
      parts.push(text.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(text.slice(start));
  return parts;
}

function resolveName(name, map, depth, stack) {
  if (!map.has(name)) return { error: `UNRESOLVED ${name}`, detail: `no declaration for ${name}` };
  if (stack.includes(name))
    return { error: `CYCLE ${name}`, detail: `cycle at ${[...stack, name].join(" -> ")}` };
  if (depth > MAX_DEPTH) return { error: `DEPTH ${name}`, detail: `var() chain > ${MAX_DEPTH}` };
  return substitute(map.get(name), map, depth + 1, [...stack, name]);
}

function substitute(value, map, depth, stack) {
  let out = "";
  let i = 0;
  while (i < value.length) {
    const open = value.indexOf("var(", i);
    if (open === -1) {
      out += value.slice(i);
      break;
    }
    out += value.slice(i, open);
    let k = open + 4;
    let level = 1;
    while (k < value.length && level > 0) {
      if (value[k] === "(") level++;
      else if (value[k] === ")") level--;
      k++;
    }
    const [rawName, ...rest] = splitTop(value.slice(open + 4, k - 1));
    const fallback = rest.join(",").trim();
    const resolved = resolveName(rawName.trim(), map, depth, stack);
    if (resolved.error) {
      if (!fallback) return resolved;
      out += substitute(fallback, map, depth, stack).value ?? fallback;
    } else {
      out += resolved.value;
    }
    i = k;
  }
  return { value: out };
}

// ─── Normalize before comparing ─────────────────────────────────────────────

const round = (n) => Math.round(n * 1e6) / 1e6;
const alpha3 = (a) => Math.min(1, Math.max(0, a)).toFixed(3);

function hexToRgba(hex) {
  let h = hex.slice(1);
  if (h.length === 3 || h.length === 4) h = [...h].map((c) => c + c).join("");
  const n = (s) => parseInt(s, 16);
  const a = h.length === 8 ? n(h.slice(6, 8)) / 255 : 1;
  return `rgba(${n(h.slice(0, 2))}, ${n(h.slice(2, 4))}, ${n(h.slice(4, 6))}, ${alpha3(a)})`;
}

function rgbToRgba(body) {
  const [rgbPart, alphaPart] = body.includes("/") ? body.split("/") : [body, ""];
  const nums = rgbPart
    .trim()
    .split(/[\s,]+/)
    .filter(Boolean)
    .map(Number);
  if (nums.length < 3 || nums.some(Number.isNaN)) return null;
  const alpha = alphaPart.trim() ? Number(alphaPart) : (nums[3] ?? 1);
  if (Number.isNaN(alpha)) return null;
  return `rgba(${Math.round(nums[0])}, ${Math.round(nums[1])}, ${Math.round(nums[2])}, ${alpha3(alpha)})`;
}

function normalizeColor(token) {
  const t = token.toLowerCase();
  if (t === "transparent") return "rgba(0, 0, 0, 0.000)";
  if (t === "white") return "rgba(255, 255, 255, 1.000)";
  if (t === "black") return "rgba(0, 0, 0, 1.000)";
  if (t.startsWith("#")) return hexToRgba(t);
  const inner = t.slice(t.indexOf("(") + 1, -1);
  return rgbToRgba(inner) ?? token;
}

function evalPercent(expr) {
  const calc = expr.trim().match(/^calc\((.*)\)$/i);
  const body = calc ? calc[1] : expr.trim();
  let product = 1;
  let percent = false;
  for (const term of body.split("*").map((s) => s.trim())) {
    const isPercent = term.endsWith("%");
    const value = Number(term.replace("%", ""));
    if (Number.isNaN(value)) return null;
    product *= value;
    if (isPercent) percent = true;
  }
  return percent ? product / 100 : product;
}

function normalizeColorMix(value) {
  let out = "";
  let i = 0;
  for (;;) {
    const open = value.toLowerCase().indexOf("color-mix(", i);
    if (open === -1) return out + value.slice(i);
    out += value.slice(i, open);
    let k = open + 10;
    let level = 1;
    while (k < value.length && level > 0) {
      if (value[k] === "(") level++;
      else if (value[k] === ")") level--;
      k++;
    }
    const inner = value.slice(open + 10, k - 1);
    const [space, colorExpr = "", mixWith] = splitTop(inner).map((s) => s.trim());
    const weight = colorExpr.match(/(calc\([^()]*\)|-?\d*\.?\d+%)\s*$/);
    const alpha = weight ? evalPercent(weight[1]) : null;
    const colorOnly = weight ? colorExpr.slice(0, weight.index).trim() : colorExpr;
    if (
      /^in srgb$/i.test(space) &&
      /^transparent$/i.test(mixWith ?? "") &&
      alpha !== null &&
      /^(#[0-9a-f]{3,8}|rgba?\()/i.test(colorOnly)
    ) {
      const [r, g, b] = normalizeColor(colorOnly).match(/\d+/g).map(Number);
      out += `rgba(${r}, ${g}, ${b}, ${alpha3(alpha)})`;
    } else {
      out += `color-mix(${inner})`;
    }
    i = k;
  }
}

function normalize(value) {
  let v = normalizeColorMix(value.trim());
  v = v.replace(/(-?\d*\.?\d+)rem\b/g, (_, n) => `${round(Number(n) * 16)}px`);
  v = v.replace(/(-?\d*\.?\d+)px\b/g, (_, n) => `${round(Number(n))}px`);
  v = v.replace(/#[0-9a-f]{3,8}\b|rgba?\([^()]*\)|\btransparent\b/gi, normalizeColor);
  return v.replace(/\s+/g, " ").trim();
}

// ─── Consumers, so ORPHAN does not fail on a sanctioned deletion ────────────

function consumersAt(rev) {
  if (!rev) return null;
  try {
    const out = execFileSync(
      "git",
      ["grep", "-h", "-o", "-E", "var\\(--[a-zA-Z0-9-]+", rev, "--", "apps/frontend/src"],
      { cwd: ROOT, encoding: "utf8", maxBuffer: 1 << 26 },
    );
    return new Set(
      out
        .split("\n")
        .map((l) => l.replace(/^var\(/, "").trim())
        .filter(Boolean),
    );
  } catch {
    return new Set();
  }
}

// A composite at a call site holds the value a removed plane used to carry, so
// an ORPHAN test that only reads :root would call a sanctioned R-CONSTRUCT row
// dead. Resolve every `color-mix()` written in the tree and count it as a surviving value.
function compositeValues(map) {
  const values = new Set();
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== "node_modules" && !entry.name.startsWith(".")) walk(full);
        continue;
      }
      if (!/\.(css|tsx?)$/.test(entry.name)) continue;
      const text = fs.readFileSync(full, "utf8");
      for (let i = text.toLowerCase().indexOf("color-mix("); i !== -1;) {
        let k = i + 10;
        let level = 1;
        while (k < text.length && level > 0) {
          if (text[k] === "(") level++;
          else if (text[k] === ")") level--;
          k++;
        }
        const resolved = substitute(text.slice(i, k), map, 0, []);
        if (!resolved.error) values.add(normalize(resolved.value));
        i = text.toLowerCase().indexOf("color-mix(", k);
      }
    }
  };
  const src = path.join(path.resolve(ROOT, afterDir ?? "."), "apps/frontend/src");
  if (fs.existsSync(src)) walk(src);
  return values;
}

// ─── Compare ────────────────────────────────────────────────────────────────

const allowList = fs.existsSync(ALLOW_PATH)
  ? JSON.parse(fs.readFileSync(ALLOW_PATH, "utf8")).map((e) => (typeof e === "string" ? e : e.name))
  : [];
const consumed = consumersAt(beforeRev);

const beforeMap = collect(readBefore());
const afterMap = collect(readAfter());

const failures = [];
const resolutionErrors = [];
const err = (side, name, msg) => resolutionErrors.push(`UNRESOLVED ${name}: ${msg} [${side}]`);

const before = new Map();
for (const [name, value] of beforeMap) {
  const r = resolveName(name, beforeMap, 0, []);
  if (r.error) err("before", name, `${value} (${r.error})`);
  else before.set(name, { raw: value, norm: normalize(r.value) });
}
const after = new Map();
for (const [name, value] of afterMap) {
  const r = resolveName(name, afterMap, 0, []);
  if (r.error) err("after", name, `${value} (${r.error})`);
  else after.set(name, { raw: value, norm: normalize(r.value) });
}

const added = [...after.keys()].filter((n) => !beforeMap.has(n));
const removed = [...beforeMap.keys()].filter((n) => !afterMap.has(n));
const compared = [...beforeMap.keys()].filter((n) => afterMap.has(n));

if (argv.includes("--json")) {
  const dump = (m) => Object.fromEntries([...m].map(([k, v]) => [k, v.norm]));
  console.log(JSON.stringify({ before: dump(before), after: dump(after) }));
  process.exit(0);
}

const changed = [];
const allowedNames = new Set();
const allowedRemovals = [];
for (const name of compared) {
  if (!before.has(name) || !after.has(name)) continue;
  if (before.get(name).norm === after.get(name).norm) continue;
  if (allowList.includes(name)) {
    console.log(`ALLOWED ${name}: ${before.get(name).norm} -> ${after.get(name).norm}`);
    allowedNames.add(name);
    continue;
  }
  changed.push({ name, from: before.get(name).norm, to: after.get(name).norm });
}

const afterValues = new Set([...after.values()].map((v) => v.norm));
for (const value of compositeValues(afterMap)) afterValues.add(value);
const orphans = [];
const unusedDeletions = [];
for (const name of removed) {
  const value = before.get(name)?.norm ?? "(unresolved)";
  if (afterValues.has(value)) continue;
  if (consumed && !consumed.has(name)) {
    unusedDeletions.push(name);
    continue;
  }
  // Amendment A: the allow list must be able to sanction a retirement, not just
  // a value move. Only a name that would otherwise be ORPHAN is eligible.
  if (allowList.includes(name)) {
    allowedRemovals.push({ name, value });
    allowedNames.add(name);
    continue;
  }
  orphans.push({ name, value });
}

const staleAllows = allowList.filter((name) => !allowedNames.has(name));

for (const line of resolutionErrors) console.log(line);
for (const name of added) console.log(`ADDED ${name}: ${after.get(name).norm}`);
for (const name of removed) console.log(`REMOVED ${name}: ${before.get(name).norm}`);
for (const { name, from, to } of changed) console.log(`CHANGED ${name}: ${from} -> ${to}`);
for (const { name, value } of orphans)
  console.log(`ORPHAN ${name}: ${value} — no surviving name resolves to this value`);
for (const { name, value } of allowedRemovals) console.log(`ALLOWED-REMOVED ${name}: ${value}`);
if (unusedDeletions.length)
  console.log(`· ${unusedDeletions.length} name(s) retired unused: ${unusedDeletions.join(", ")}`);
if (allowList.length)
  console.log(
    `· ${allowList.length - staleAllows.length} change(s) allowed, ${staleAllows.length} unused allow-list entry(ies)`,
  );
for (const name of staleAllows) console.log(`STALE-ALLOW ${name}`);
console.log(
  `· names: ${beforeMap.size} -> ${afterMap.size} (a rename moves a name, not a value, so it appears in both lists)`,
);

if (changed.length || orphans.length || resolutionErrors.length || staleAllows.length)
  process.exit(1);

console.log(
  `✅ token values identical: ${added.length} added, ${removed.length} removed, 0 changed (${compared.length} compared).`,
);
