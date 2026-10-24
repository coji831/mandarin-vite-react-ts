#!/usr/bin/env node

/**
 * check-spine-parity.mjs — name discipline gate: the consumer's live token layer
 * against SPINE's canonical name list.
 *
 * Different question from `check:design-parity`, which is a mirror check
 * (DESIGN.md <-> globals.css, one repo against itself). This gate asks whether
 * every custom property the consumer declares in `:root` is a name spine already
 * owns — the executable form of the Design Lead ruling's success gate item 1
 * ("Theme name discipline", the `add-theme` check 2 statement: an overlay
 * introduces no new semantic or component names).
 *
 * The spine side is a committed, provenance-stamped snapshot
 * (`tools/spine-token-names.json`), not a live spine checkout, so the gate runs
 * on any machine. Regenerate the snapshot with
 * `node tools/spine-token-names.regen.mjs --spine <path-to-spine>`.
 *
 * Every declared name classifies into exactly one bucket:
 *
 *   canonical          in spine's name list, at spine's value
 *   override           in spine's list, value is the sanctioned theme delta
 *                      (typography families, ADR-011 consequence 4)
 *   domain             in the committed product-domain allow list
 *   retired            in the committed retire list — a name the mapping table
 *                      deletes in step 1b. Informational: deleting it is paint
 *                      work, not a name-discipline defect.
 *   generic-violation  none of the above — a NEW generic name. FAIL.
 *   deprecated-alias   a name spine deprecated, still declared here or still
 *                      referenced by `var(--name)` in shipped code. FAIL.
 *
 * Usage: node scripts/check-spine-parity.mjs [--quiet]
 * Exit: 0 = pass, 1 = a generic violation or a deprecated reference, 2 = the
 *       snapshot is missing or malformed (fail closed: no reading is not a pass).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CSS_PATH = path.join(ROOT, "apps", "frontend", "src", "styles", "globals.css");
const SNAPSHOT_PATH = path.join(ROOT, "tools", "spine-token-names.json");
const SHIPPED_DIR = path.join(ROOT, "apps", "frontend", "src");
const SHIPPED_EXT = new Set([".css", ".tsx"]);
const QUIET = process.argv.includes("--quiet");

const die = (code, message) => {
  console.error(message);
  process.exit(code);
};

// ─── Snapshot ────────────────────────────────────────────────────────────────
function loadSnapshot() {
  if (!fs.existsSync(SNAPSHOT_PATH)) {
    die(
      2,
      `❌ spine parity: snapshot missing at ${path.relative(ROOT, SNAPSHOT_PATH)} — fail closed.`,
    );
  }
  let snap;
  try {
    snap = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, "utf8"));
  } catch (error) {
    die(2, `❌ spine parity: snapshot is not valid JSON (${error.message}) — fail closed.`);
  }
  for (const key of ["canonical", "deprecated", "domain", "retired", "themeDelta"]) {
    if (!snap[key] || (Array.isArray(snap[key]) ? false : typeof snap[key] !== "object")) {
      die(2, `❌ spine parity: snapshot has no \`${key}\` set — fail closed.`);
    }
  }
  if (!snap.provenance?.commit) {
    die(2, "❌ spine parity: snapshot carries no provenance.commit — fail closed.");
  }
  return snap;
}

// ─── Consumer live layer ─────────────────────────────────────────────────────
function readLiveVars() {
  const css = fs.readFileSync(CSS_PATH, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
  const open = css.indexOf(":root {");
  if (open === -1) throw new Error("globals.css has no `:root {` block");
  const close = css.indexOf("}", open);
  const block = css.slice(open, close);
  const vars = new Map();
  const re = /(--[\w-]+)\s*:\s*([^;]+);/g;
  let m;
  while ((m = re.exec(block)) !== null) vars.set(m[1], m[2].replace(/\s+/g, " ").trim());
  return vars;
}

// ─── Shipped-code references ─────────────────────────────────────────────────
function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (SHIPPED_EXT.has(path.extname(entry.name))) yield full;
  }
}

function countRefs(names) {
  const refs = new Map(names.map((name) => [name, []]));
  const patterns = names.map((name) => [name, new RegExp(`${name}(?![\\w-])`, "g")]);
  for (const file of walk(SHIPPED_DIR)) {
    const text = fs.readFileSync(file, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
    for (const [name, pattern] of patterns) {
      const hits = text.match(pattern);
      if (!hits) continue;
      const rel = path.relative(ROOT, file).replace(/\\/g, "/");
      for (let i = 0; i < hits.length; i += 1) refs.get(name).push(rel);
    }
  }
  return refs;
}

// ─── Values ──────────────────────────────────────────────────────────────────
// Whitespace is not meaningful in these values; nothing else is normalised, so
// a hex and an rgba() of the same colour still count as different notation
// (which is the honest reading of "spine's value").
const normalise = (value) => String(value).replace(/\s+/g, "").toLowerCase();

// ─── Main ────────────────────────────────────────────────────────────────────
const snap = loadSnapshot();
const canonical = snap.canonical;
const deprecated = snap.deprecated;
const domain = new Set(snap.domain);
const retired = new Set(snap.retired);
const themeDelta = new Set(snap.themeDelta);

const live = readLiveVars();
const buckets = {
  canonical: [],
  override: [],
  domain: [],
  retired: [],
  generic: [],
  deprecated: [],
};
const drift = [];

for (const [name, value] of live) {
  if (Object.hasOwn(deprecated, name)) buckets.deprecated.push(name);
  else if (domain.has(name)) buckets.domain.push(name);
  else if (Object.hasOwn(canonical, name)) {
    if (themeDelta.has(name)) buckets.override.push(name);
    else {
      buckets.canonical.push(name);
      if (normalise(value) !== normalise(canonical[name])) {
        drift.push({ name, local: value, spine: canonical[name] });
      }
    }
  } else if (retired.has(name)) buckets.retired.push(name);
  else buckets.generic.push(name);
}

const deprecatedRefs = countRefs(Object.keys(deprecated));
const deprecatedReferences = [...deprecatedRefs.entries()].filter(([, files]) => files.length > 0);

// Declarations are already counted above; report the two shapes separately so a
// declaration (this file) is not confused with a consumer elsewhere.
const declaredDeprecated = new Set(buckets.deprecated);
const refsOutsideDeclaration = deprecatedReferences.filter(([name]) => {
  const files = new Set(deprecatedRefs.get(name));
  if (!declaredDeprecated.has(name)) return true;
  return files.size > 1 || !files.has("apps/frontend/src/styles/globals.css");
});

if (!QUIET) {
  const { commit, commitDate, stampedAt } = snap.provenance;
  console.log(
    `spine parity — globals.css :root (${live.size} names) vs tools/spine-token-names.json`,
  );
  console.log(
    `  snapshot provenance: spine ${commit.slice(0, 8)} (${commitDate}), stamped ${stampedAt}`,
  );
  console.log("");
  console.log(`  canonical          ${String(buckets.canonical.length).padStart(3)}`);
  console.log(
    `  override           ${String(buckets.override.length).padStart(3)}  (sanctioned theme delta)`,
  );
  console.log(`  domain             ${String(buckets.domain.length).padStart(3)}`);
  console.log(
    `  retired            ${String(buckets.retired.length).padStart(3)}  (of the ${retired.size}-name retire set; deleting them is step 1b)`,
  );
  console.log(`  generic            ${String(buckets.generic.length).padStart(3)}`);
  console.log(`  deprecated         ${String(buckets.deprecated.length).padStart(3)}  (declared)`);
  console.log("");

  if (buckets.override.length) {
    console.log("  overrides — the value the consumer holds is the product decision, not spine's:");
    for (const name of buckets.override.sort()) {
      console.log(`    ${name}: ${live.get(name)}`);
      console.log(`    ${" ".repeat(name.length)}  spine: ${canonical[name]}`);
    }
    console.log("");
  }

  if (drift.length) {
    console.log(
      `  paint pending — canonical name, value not yet spine's (${drift.length}; step 1b closes these):`,
    );
    for (const { name, local, spine } of drift.sort((a, b) => a.name.localeCompare(b.name))) {
      console.log(`    ${name}: ${local}  ->  ${spine}`);
    }
    console.log("");
  }

  if (deprecatedReferences.length) {
    console.log("  deprecated aliases still referenced in shipped code:");
    for (const [name, files] of deprecatedReferences) {
      console.log(
        `    ${name} -> ${deprecated[name]}  (${files.length} ref in ${[...new Set(files)].join(", ")})`,
      );
    }
    console.log("");
  }

  if (!refsOutsideDeclaration.length && deprecatedReferences.length) {
    console.log("  (references above are the declaration in globals.css only)");
    console.log("");
  }
}

let failed = false;
for (const name of buckets.generic) {
  console.log(`GENERIC ${name}`);
  failed = true;
}
for (const [name, files] of deprecatedReferences) {
  console.log(`DEPRECATED ${name} (${files.length} ref${files.length === 1 ? "" : "s"})`);
  failed = true;
}

if (failed) {
  console.log("");
  console.log(
    "❌ spine parity FAIL — a name spine does not own, or a deprecated alias spine is retiring.",
  );
  process.exit(1);
}

console.log(
  `✅ spine parity PASS — ${buckets.canonical.length} canonical, ${buckets.override.length} override, ` +
    `${buckets.domain.length} domain, 0 generic, 0 deprecated.`,
);
process.exit(0);
