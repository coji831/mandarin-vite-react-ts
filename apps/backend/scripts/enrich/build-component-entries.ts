/**
 * @file apps/backend/scripts/enrich/build-component-entries.ts
 * @description Enrich: Extract unique component glyphs from MMAH decomposition
 *   fields (IDS format) and build Component seed data.
 *
 * Reads:
 *   - content/seed/phase1/mmah-entries.json — MMAH entries with decomposition
 *   - content/seed/phase1/unihan-strokes.json — stroke counts by glyph
 *   - content/radicals/radicals.json — Kangxi radicals (to avoid duplicates)
 *
 * Writes: content/seed/phase2/component-entries.json
 *
 * Idempotent: pure JSON-to-JSON transform.
 *
 * Run: cd apps/backend && npx tsx scripts/enrich/build-component-entries.ts
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { writeJsonAtomic, ensureDir } from "../utils.js";
import { scriptLogger } from "../logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logger = scriptLogger("enrich:component-entries");

// ── Paths ──

const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..", "..");
const PHASE1_DIR = path.join(PROJECT_ROOT, "content", "seed", "phase1");
const PHASE2_DIR = path.join(PROJECT_ROOT, "content", "seed", "phase2");
const RADICALS_PATH = path.join(PROJECT_ROOT, "content", "radicals", "radicals.json");

// ── IDS Operators ──

const IDS_BINARY = new Set([
  "\u2FF0",
  "\u2FF1",
  "\u2FF4",
  "\u2FF5",
  "\u2FF6",
  "\u2FF7",
  "\u2FF8",
  "\u2FF9",
  "\u2FFA",
  "\u2FFB",
]);
// Named references: ⿰ ⿱ ⿴ ⿵ ⿶ ⿷ ⿸ ⿹ ⿺ ⿻
const IDS_TERNARY = new Set(["\u2FF2", "\u2FF3"]);
// Named references: ⿲ ⿳

// ── Single strokes to filter out (not components) ──
// Basic CJK strokes that appear as glyphs but are strokes, not components.
// Note: 一, 丨, 丶 are already in radicals and will be filtered by radical check.
const STROKE_GLYPHS = new Set([
  "\u4E3F", // 丿 — left-falling stroke
  "\u4E59", // 乙 — second stroke
  "\u4E85", // 亅 — hook
  "\u4E5B", // 乛 — bent stroke
  "\u4E5A", // 乚 — curved stroke (variant of 乛)
  "\u4E41", // 乁 — sloping stroke
]);

// ── Types ──

interface MmahEntry {
  character: string;
  definition?: string;
  pinyin?: string[];
  decomposition?: string;
  etymology?: {
    type?: string;
    hint?: string;
    phonetic?: string;
    semantic?: string;
  };
  radical?: string;
  matches?: Array<Array<number> | null>;
}

interface RadicalEntry {
  id: string;
  glyph: string;
  alternateGlyphs: string[];
  [key: string]: unknown;
}

interface ComponentRecord {
  id: string;
  glyph: string;
  meaning: string | null;
  type: string | null;
  variantOf: string | null;
  strokes: number | null;
}

// ── IDS Parser ──

/**
 * Recursively extract all sub-character glyphs from an IDS decomposition string.
 * Returns unique glyphs only.
 */
function extractIdsComponents(decomp: string): string[] {
  const components: string[] = [];
  let pos = 0;

  function parse(): string | null {
    if (pos >= decomp.length) return null;
    const ch = decomp[pos];

    // Unknown / wildcard marker — skip
    if (ch === "\uFF1F") {
      // ？ (full-width question mark)
      pos++;
      return null;
    }

    // Binary IDS operator
    if (IDS_BINARY.has(ch)) {
      pos++;
      const left = parse();
      const right = parse();
      if (left) components.push(left);
      if (right) components.push(right);
      return null;
    }

    // Ternary IDS operator
    if (IDS_TERNARY.has(ch)) {
      pos++;
      const a = parse();
      const b = parse();
      const c = parse();
      if (a) components.push(a);
      if (b) components.push(b);
      if (c) components.push(c);
      return null;
    }

    // Regular character — could be CJK, bopomofo, or other
    pos++;
    return ch;
  }

  parse();
  return [...new Set(components)];
}

/**
 * Check if a character is a CJK Unified Ideograph (U+4E00–U+9FFF, U+3400–U+4DBF,
 * U+20000–U+2A6DF, U+2A700–U+2B73F, U+2B740–U+2B81F, U+2B820–U+2CEAF, U+2CEB0–U+2EBEF)
 * or a CJK Radicals Supplement (U+2E80–U+2EFF) / Kangxi Radicals (U+2F00–U+2FDF).
 */
function isCjkOrRadical(ch: string): boolean {
  const code = ch.charCodeAt(0);
  return (
    (code >= 0x4e00 && code <= 0x9fff) || // CJK Unified Ideographs
    (code >= 0x3400 && code <= 0x4dbf) || // CJK Extension A
    (code >= 0x20000 && code <= 0x2a6df) || // CJK Extension B
    (code >= 0x2a700 && code <= 0x2b73f) || // CJK Extension C
    (code >= 0x2b740 && code <= 0x2b81f) || // CJK Extension D
    (code >= 0x2b820 && code <= 0x2ceaf) || // CJK Extension E
    (code >= 0x2ceb0 && code <= 0x2ebef) || // CJK Extension F
    (code >= 0x2e80 && code <= 0x2eff) || // CJK Radicals Supplement
    (code >= 0x2f00 && code <= 0x2fdf) // Kangxi Radicals
  );
}

// ── Main ──

function main(): void {
  logger.info("📦 Build Component Entries");
  logger.info("═══════════════════════════\n");

  // ── Load inputs ──

  logger.info("Loading inputs...");

  const mmahEntries: MmahEntry[] = JSON.parse(
    fs.readFileSync(path.join(PHASE1_DIR, "mmah-entries.json"), "utf-8"),
  );
  logger.info(`  📄 MMAH entries: ${mmahEntries.length}`);

  const unihanStrokes: Record<string, number> = JSON.parse(
    fs.readFileSync(path.join(PHASE1_DIR, "unihan-strokes.json"), "utf-8"),
  );
  logger.info(`  📄 Unihan strokes: ${Object.keys(unihanStrokes).length}`);

  // Load radicals
  let radicals: RadicalEntry[] = [];
  if (fs.existsSync(RADICALS_PATH)) {
    radicals = JSON.parse(fs.readFileSync(RADICALS_PATH, "utf-8"));
  }
  logger.info(`  📄 Radicals: ${radicals.length}`);

  // ── Build lookup maps ──

  // Radical main glyphs (filter these out — they're already in the radicals table)
  // Alternate glyphs (like 人 → 亻, 手 → 扌) are kept as components with variantOf set
  const radicalMainGlyphs = new Set<string>();
  const altGlyphToRadicalId = new Map<string, string>(); // alternate glyph → radical ID
  for (const r of radicals) {
    if (r.glyph) radicalMainGlyphs.add(r.glyph);
    for (const alt of r.alternateGlyphs || []) {
      altGlyphToRadicalId.set(alt, r.id);
    }
  }
  logger.info(`  📄 Radical main glyphs: ${radicalMainGlyphs.size}`);
  logger.info(`  📄 Alternate glyph mappings: ${altGlyphToRadicalId.size}`);

  // MMAH by glyph (for meaning lookups)
  const mmahByGlyph = new Map<string, MmahEntry>();
  for (const entry of mmahEntries) {
    mmahByGlyph.set(entry.character, entry);
  }

  // Build set of all glyphs that appear as etymology.phonetic (for type inference)
  const glyphsAsPhonetic = new Set<string>();
  const glyphsAsSemantic = new Set<string>();
  for (const entry of mmahEntries) {
    if (entry.etymology?.phonetic) {
      glyphsAsPhonetic.add(entry.etymology.phonetic);
    }
    if (entry.etymology?.semantic) {
      glyphsAsSemantic.add(entry.etymology.semantic);
    }
  }
  logger.info(`  📄 Glyphs appearing as phonetic: ${glyphsAsPhonetic.size}`);
  logger.info(`  📄 Glyphs appearing as semantic: ${glyphsAsSemantic.size}`);

  // ── Extract components from MMAH decompositions ──

  logger.info("Extracting component glyphs from MMAH decompositions...");

  const rawComponents = new Set<string>();
  let parsedCount = 0;
  let skippedQuestion = 0;
  let emptyDecomp = 0;

  for (const entry of mmahEntries) {
    const decomp = entry.decomposition;
    if (!decomp) {
      emptyDecomp++;
      continue;
    }
    if (decomp === "\uFF1F") {
      // "？" — unknown
      skippedQuestion++;
      continue;
    }

    const glyphs = extractIdsComponents(decomp);
    for (const g of glyphs) {
      if (g && isCjkOrRadical(g)) {
        rawComponents.add(g);
      }
    }
    parsedCount++;
  }

  logger.info(`  Parsed ${parsedCount} decompositions`);
  logger.info(`  Skipped ${skippedQuestion} unknown (？)`);
  logger.info(`  Empty decomp: ${emptyDecomp}`);
  logger.info(`  Raw unique component glyphs: ${rawComponents.size}`);

  // ── Filter components ──

  logger.info("Filtering components...");

  const filteredComponents = new Set<string>();
  let filteredStrokes = 0;
  let filteredRadicals = 0;
  let filteredNonCjk = 0;

  for (const glyph of rawComponents) {
    // Filter out single strokes
    if (STROKE_GLYPHS.has(glyph)) {
      filteredStrokes++;
      continue;
    }

    // Filter out Kangxi radicals (main glyphs only — alternate glyphs are kept as components)
    if (radicalMainGlyphs.has(glyph)) {
      filteredRadicals++;
      continue;
    }

    // Also filter out CJK Radicals Supplement / Kangxi Radicals range characters
    // that aren't in our radicals list — these are special radical symbols
    const code = glyph.charCodeAt(0);
    if ((code >= 0x2e80 && code <= 0x2eff) || (code >= 0x2f00 && code <= 0x2fdf)) {
      filteredNonCjk++;
      continue;
    }

    filteredComponents.add(glyph);
  }

  logger.info(`  Filtered strokes: ${filteredStrokes}`);
  logger.info(`  Filtered radicals: ${filteredRadicals}`);
  logger.info(`  Filtered (CJK radical symbols): ${filteredNonCjk}`);
  logger.info(`  Remaining components: ${filteredComponents.size}`);

  // ── Build component records ──

  logger.info("Building component records...");

  const sortedGlyphs = [...filteredComponents].sort();
  const records: ComponentRecord[] = [];

  let phoneticCount = 0;
  let bothCount = 0;
  let variantCount = 0;

  for (let i = 0; i < sortedGlyphs.length; i++) {
    const glyph = sortedGlyphs[i];
    const id = `cmp_${String(i + 1).padStart(3, "0")}`;

    // Meaning: lookup from MMAH entry
    const mmahEntry = mmahByGlyph.get(glyph);
    const meaning = mmahEntry?.definition ?? null;

    // Type inference
    const isPhonetic = glyphsAsPhonetic.has(glyph);
    const isSemantic = glyphsAsSemantic.has(glyph);
    let type: string | null = null;
    if (isPhonetic && isSemantic) {
      type = "both";
      bothCount++;
    } else if (isPhonetic) {
      type = "phonetic";
      phoneticCount++;
    }

    // Variant: if this glyph is an alternate glyph of a radical
    const variantOf = altGlyphToRadicalId.get(glyph) ?? null;
    if (variantOf) variantCount++;

    // Stroke count
    const strokes = unihanStrokes[glyph] ?? null;

    records.push({
      id,
      glyph,
      meaning,
      type,
      variantOf,
      strokes,
    });
  }

  logger.info(`  Records: ${records.length}`);
  logger.info(`  Type=phonetic: ${phoneticCount}`);
  logger.info(`  Type=both: ${bothCount}`);
  logger.info(`  Variant references: ${variantCount}`);

  // ── Write output ──

  logger.info("Writing output...");
  ensureDir(PHASE2_DIR);
  const outputPath = path.join(PHASE2_DIR, "component-entries.json");
  writeJsonAtomic(outputPath, records);
  logger.info(`  ✅ Written ${records.length} component entries`);

  // ── Summary ──

  logger.info("\n═══════════════════════════════════════════");
  logger.info("  ✅ Component Entries Complete");
  logger.info("═══════════════════════════════════════════\n");
  logger.info(`  Component records: ${records.length}`);
  logger.info(`  Input MMAH entries: ${mmahEntries.length}`);
  logger.info(`  Raw unique glyphs: ${rawComponents.size}`);
  logger.info(`  After filtering: ${filteredComponents.size}`);
  logger.info("");
}

main();
