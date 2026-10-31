#!/usr/bin/env node

/**
 * generate-class-catalog.mjs
 *
 * Emits docs/guides/design/css-class-catalog.md from the three live sheets.
 *
 * WHY THIS EXISTS
 *   The utility-class and pattern-class list used to live inline in
 *   `frontend-css-styling.instructions.md`, which attaches to every `.tsx` edit. It was
 *   6,254 B of catalogue on the attach path: read-only reference that constrained nothing.
 *   It now lives here, generated, so the instruction can point at it instead of carrying it.
 *
 * WHY GENERATED, NOT HAND-WRITTEN
 *   A hand-maintained list of classes that exist is wrong by default: it is correct only
 *   until the next class is added, and nothing notices. `check:system-map` already uses this
 *   shape for the docs tree.
 *
 * Usage:
 *   node scripts/generate-class-catalog.mjs           # write the file
 *   node scripts/generate-class-catalog.mjs --check   # exit 1 if the file is stale
 *
 * Exit codes: 0 = written or up to date, 1 = stale (with --check), 2 = a sheet is missing.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = "docs/guides/design/css-class-catalog.md";

const SHEETS = [
  ["globals.css", "apps/frontend/src/styles/globals.css", "Tokens plus single-property utilities"],
  ["components.css", "apps/frontend/src/styles/components.css", "Multi-property component patterns"],
  ["animations.css", "apps/frontend/src/styles/animations.css", "Keyframes and animation classes"],
];

/** Class selectors at the start of a rule, with the declaration block that follows. */
const RULE = /^\.(-?[A-Za-z_][\w-]*)[^{]*\{([\s\S]*?)\n\}/gm;

function read(rel) {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) return null;
  return fs.readFileSync(abs, "utf8");
}

function classesOf(css) {
  const out = new Map();
  for (const m of css.matchAll(RULE)) {
    const [, name, body] = m;
    const decls = body
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("/*") && !l.startsWith("*"));
    if (!decls.length) continue;
    if (!out.has(name)) out.set(name, decls.slice(0, 4).join(" ").slice(0, 140));
  }
  return [...out.entries()].sort((a, b) => a[0].localeCompare(b[0]));
}

const missing = [];
const sections = [];
for (const [label, rel, purpose] of SHEETS) {
  const css = read(rel);
  if (css === null) {
    missing.push(rel);
    continue;
  }
  const rows = classesOf(css);
  sections.push({ label, rel, purpose, rows });
}

if (missing.length) {
  console.error(`class catalog: sheet(s) not found: ${missing.join(", ")}`);
  process.exit(2);
}

const total = sections.reduce((n, s) => n + s.rows.length, 0);

// last-verified is the newest sheet mtime, not the clock: a regeneration that changed nothing must not
// make a stale catalogue look freshly verified.
const newest = Math.max(
  ...SHEETS.map(([, rel]) => fs.statSync(path.join(ROOT, rel)).mtimeMs),
);
const verified = new Date(newest).toISOString().slice(0, 10);
const body = [
  "---",
  'purpose: "Every utility, pattern and animation class the three stylesheets declare, with its first declarations"',
  "status: active",
  `last-verified: ${verified}`,
  "audience: agent",
  "type: guide",
  "---",
  "",
  "# Class catalog",
  "",
  "Generated from the live sheets by `node scripts/generate-class-catalog.mjs`. **Do not hand-edit**;",
  "add the class to its sheet and re-run. `npm run check:class-catalog` fails when this file is stale.",
  "",
  `Classes found: **${total}** across ${sections.length} sheets.`,
  "",
  "The rule it serves is in `.github/instructions/frontend-css-styling.instructions.md`: a value comes",
  "from a token, and a repeated shape comes from one of these classes rather than a new block.",
  "",
];

for (const s of sections) {
  body.push(`## ${s.label}`, "", `${s.purpose}: \`${s.rel}\`. ${s.rows.length} classes.`, "");
  body.push("| Class | First declarations |", "| --- | --- |");
  for (const [name, decls] of s.rows) {
    body.push(`| \`.${name}\` | \`${decls.replace(/\|/g, "\\|")}\` |`);
  }
  body.push("");
}

const next = body.join("\n");
const abs = path.join(ROOT, OUT);

if (process.argv.includes("--check")) {
  const now = fs.existsSync(abs) ? fs.readFileSync(abs, "utf8") : "";
  const strip = (t) => t.replace(/last-verified: .*/g, "");
  if (strip(now) !== strip(next)) {
    console.error(`class catalog: ${OUT} is stale. Run: node scripts/generate-class-catalog.mjs`);
    process.exit(1);
  }
  console.log(`class catalog: up to date (${total} classes)`);
  process.exit(0);
}

fs.mkdirSync(path.dirname(abs), { recursive: true });
fs.writeFileSync(abs, next, "utf8");
console.log(`class catalog: wrote ${OUT} (${total} classes across ${sections.length} sheets)`);
