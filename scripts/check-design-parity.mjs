#!/usr/bin/env node

/**
 * check-design-parity.mjs — DESIGN.md tokens ↔ globals.css `:root` parity gate.
 *
 * The S0a-1 contract: DESIGN.md `tokens.*` and globals.css `:root` custom
 * properties are a 1:1 mirror for the token families where the mapping is
 * MECHANICAL. This gate asserts that contract bidirectionally:
 *
 *   1. FORWARD  — every DESIGN.md token in a covered family must exist as a
 *                 globals.css `:root` var with an equal value.
 *   2. REVERSE  — every globals.css `:root` var in a covered family must be a
 *                 declared DESIGN.md token (no undocumented/orphan CSS var).
 *
 * Covered families (literal value equality after whitespace normalization —
 * unit/shadow/dimension values only, so notation is identical):
 *   layout.page-measure.<archetype>   -> --page-measure-<archetype>
 *   layout.page-pad / chrome-h / measure-prose
 *   layout.section-rhythm.{sm,md,lg}  -> --section-rhythm-{sm,md,lg}
 *   layout.card-gutter.{sm,md,lg}     -> --card-gutter-{sm,md,lg}
 *   spacing[]                         -> --space-{xs,sm,md,lg,xl,2xl}  (index map)
 *   radii[]                           -> --radius-{sm,md,lg,pill}      (index map)
 *   size.touch                        -> --size-touch
 *   shadows.{sm,md,lg,xp-glow,elevated-1..3} -> --shadow-<key>
 *   transitions.{fast,normal,slow}    -> --transition-<key>
 *   z-index.{content,chrome,popover,modal,toast} -> --z-<key>
 *
 * Deliberately NOT covered (values differ in notation — hex vs rgba(), or use
 * variant arrays that need an authored index->var map): colors (incl. surface/
 * text/tone/stroke), typography (sizes/fluid tiers/line-heights/weights),
 * gradients. Those need a semantic-color-normalizing comparator — tracked
 * separately, NOT silently half-checked here.
 *
 * Usage: node scripts/check-design-parity.mjs
 * Exit: 0 = parity holds for all covered families; 1 = any drift (fail closed).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CSS_PATH = path.join(ROOT, "apps", "frontend", "src", "styles", "globals.css");
const DESIGN_PATH = path.join(ROOT, "DESIGN.md");

// ─── Normalization ───────────────────────────────────────────────────────────
// Whitespace is not semantically meaningful in these families (unit values,
// shadow lists, durations), so compare whitespace-stripped.
const strip = (v) => String(v).replace(/\s+/g, "").trim();

// ─── globals.css `:root` vars ───────────────────────────────────────────────
function readCssVars() {
  const css = fs.readFileSync(CSS_PATH, "utf8");
  const open = css.indexOf(":root {");
  if (open === -1) throw new Error("globals.css has no `:root {` block");
  const close = css.indexOf("}", open);
  const block = css.slice(open, close).replace(/\/\*[\s\S]*?\*\//g, "");
  const vars = new Map();
  const re = /(--[\w-]+)\s*:\s*([^;]+);/g;
  let m;
  while ((m = re.exec(block)) !== null) vars.set(m[1], m[2].replace(/\s+/g, " ").trim());
  return vars;
}

// ─── DESIGN.md tokens ───────────────────────────────────────────────────────
function readDesignTokens() {
  const md = fs.readFileSync(DESIGN_PATH, "utf8");
  const fm = YAML.parse(md.split(/^(?:---\s*)$/m)[1]);
  return fm?.tokens ?? {};
}

// ─── Covered families ───────────────────────────────────────────────────────
// Each family: { name, prefixes: string[], collect(tokens) -> [{ cssVar, mdPath, value }] }
const SPACE_LEVELS = ["xs", "sm", "md", "lg", "xl", "2xl"];
const RADIUS_LEVELS = ["sm", "md", "lg", "pill"];
const TIER_SUFFIX = { sm: "-sm", md: "-md", lg: "-lg" }; // section-rhythm / card-gutter (md carries its own suffix)

function mapObj(obj, fn) {
  return Object.entries(obj ?? {}).map(([k, v]) => fn(k, v));
}

const FAMILIES = [
  {
    name: "layout.page-measure",
    prefixes: ["--page-measure-"],
    collect: (t) =>
      mapObj(t.layout?.["page-measure"], (k, v) => ({
        cssVar: `--page-measure-${k}`,
        mdPath: `tokens.layout.page-measure.${k}`,
        value: v,
      })),
  },
  {
    name: "layout.scalars",
    prefixes: ["--page-pad", "--chrome-h", "--measure-prose"],
    collect: (t) =>
      ["page-pad", "chrome-h", "measure-prose"].map((k) => ({
        cssVar: `--${k}`,
        mdPath: `tokens.layout.${k}`,
        value: t.layout?.[k],
      })),
  },
  {
    name: "layout.section-rhythm",
    prefixes: ["--section-rhythm"],
    collect: (t) =>
      mapObj(t.layout?.["section-rhythm"], (k, v) => ({
        cssVar: `--section-rhythm${TIER_SUFFIX[k] ?? `-${k}`}`,
        mdPath: `tokens.layout.section-rhythm.${k}`,
        value: v,
      })),
  },
  {
    name: "layout.card-gutter",
    prefixes: ["--card-gutter"],
    collect: (t) =>
      mapObj(t.layout?.["card-gutter"], (k, v) => ({
        cssVar: `--card-gutter${TIER_SUFFIX[k] ?? `-${k}`}`,
        mdPath: `tokens.layout.card-gutter.${k}`,
        value: v,
      })),
  },
  {
    name: "spacing",
    prefixes: ["--space-"],
    collect: (t) =>
      (t.spacing ?? []).map((v, i) => ({
        cssVar: `--space-${SPACE_LEVELS[i]}`,
        mdPath: `tokens.spacing[${i}]`,
        value: v,
      })),
  },
  {
    name: "radii",
    prefixes: ["--radius-"],
    collect: (t) =>
      (t.radii ?? []).map((v, i) => ({
        cssVar: `--radius-${RADIUS_LEVELS[i]}`,
        mdPath: `tokens.radii[${i}]`,
        value: v,
      })),
  },
  {
    name: "size",
    prefixes: ["--size-touch"],
    collect: (t) => [{ cssVar: "--size-touch", mdPath: "tokens.size.touch", value: t.size?.touch }],
  },
  {
    name: "shadows",
    prefixes: ["--shadow-"],
    collect: (t) =>
      mapObj(t.shadows, (k, v) => ({
        cssVar: `--shadow-${k}`,
        mdPath: `tokens.shadows.${k}`,
        value: v,
      })),
  },
  {
    name: "transitions",
    prefixes: ["--transition-"],
    collect: (t) =>
      mapObj(t.transitions, (k, v) => ({
        cssVar: `--transition-${k}`,
        mdPath: `tokens.transitions.${k}`,
        value: v,
      })),
  },
  {
    name: "z-index",
    prefixes: ["--z-"],
    collect: (t) =>
      mapObj(t["z-index"], (k, v) => ({
        cssVar: `--z-${k}`,
        mdPath: `tokens.z-index.${k}`,
        value: v,
      })),
  },
];

// ─── Main ────────────────────────────────────────────────────────────────────
function main() {
  let cssVars, tokens;
  try {
    cssVars = readCssVars();
  } catch (e) {
    console.error(`[design-parity] ${e.message}`);
    process.exit(1);
  }
  try {
    tokens = readDesignTokens();
  } catch (e) {
    console.error(`[design-parity] could not parse DESIGN.md frontmatter: ${e.message}`);
    process.exit(1);
  }

  const errors = [];
  let pairCount = 0;

  // Build expected { cssVar -> { mdPath, value } } across covered families.
  const expected = new Map();
  for (const fam of FAMILIES) {
    for (const item of fam.collect(tokens)) {
      if (item.value === undefined || item.value === null) {
        errors.push(`[${fam.name}] ${item.mdPath} is missing from DESIGN.md tokens`);
        continue;
      }
      expected.set(item.cssVar, { mdPath: item.mdPath, value: item.value, family: fam.name });
    }
  }

  // FORWARD: every declared token has an equal globals.css var.
  for (const [cssVar, { mdPath, value, family }] of expected) {
    const cssVal = cssVars.get(cssVar);
    if (cssVal === undefined) {
      errors.push(
        `[${family}] ${mdPath} ("${value}") has no globals.css var --${cssVar} (add it to :root)`,
      );
    } else if (strip(cssVal) !== strip(value)) {
      errors.push(
        `[${family}] value drift: ${mdPath} = "${value}" but globals.css --${cssVar} = "${cssVal}" (keep DESIGN.md and :root in sync)`,
      );
    } else {
      pairCount += 1;
    }
  }

  // REVERSE: no orphan globals.css var in a covered family (undocumented token).
  for (const [cssVar] of cssVars) {
    const fam = FAMILIES.find((f) => f.prefixes.some((p) => cssVar.startsWith(p)));
    if (fam && !expected.has(cssVar)) {
      errors.push(
        `[${fam.name}] globals.css --${cssVar} has no declared DESIGN.md token (document it or remove it)`,
      );
    }
  }

  const coveredFamilies = FAMILIES.map((f) => f.name).join(", ");
  if (errors.length === 0) {
    console.log(
      `✅ DESIGN.md <-> globals.css parity PASS — ${pairCount} token/var pairs across: ${coveredFamilies}.`,
    );
    console.log(
      "   Not covered (notation/variant-array mapping — tracked separately): colors, typography, gradients.",
    );
    process.exit(0);
  }

  console.error(`❌ DESIGN.md <-> globals.css parity FAIL — ${errors.length} issue(s):`);
  for (const e of errors) console.error(`   - ${e}`);
  process.exit(1);
}

main();
