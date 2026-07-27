/**
 * @file apps/backend/scripts/enrich/build-character-entries.ts
 * @description Enrich 1: Merge raw data from MMAH, Unihan, HSK, and existing
 *   content files into the core Character seed file.
 *
 * Reads:
 *   - content/seed/phase1/mmah-entries.json
 *   - content/seed/phase1/unihan-strokes.json
 *   - content/seed/phase1/hsk-words.json
 *   - content/characters/characters.json (existing)
 *   - content/characters/index.json (existing)
 *
 * Writes: content/seed/phase2/characters.json
 *
 * Idempotent: pure JSON-to-JSON transform — same inputs = same outputs.
 *
 * Run: cd apps/backend && npx tsx scripts/enrich/build-character-entries.ts
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { writeJsonAtomic, ensureDir, charsOf } from "../utils.js";
import { scriptLogger } from "../logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logger = scriptLogger("enrich:char-entries");

// ── Paths ──

const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..", "..");
const PHASE1_DIR = path.join(PROJECT_ROOT, "content", "seed", "phase1");
const PHASE2_DIR = path.join(PROJECT_ROOT, "content", "seed", "phase2");
const CONTENT_CHARS_DIR = path.join(PROJECT_ROOT, "content", "characters");

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

interface HskWordEntry {
  hskLevel: number;
  hskNo: number;
  simplified: string;
  hanziAlt: string;
  usage: string;
}

interface ExistingCharacterEntry {
  id: string;
  glyph: string;
  traditional: string | null;
  strokeCount: number | null;
  pinyin: string | null;
  readings: Array<{
    pinyin: string;
    tone: number;
    type: string;
    coreMeaning: string | null;
  }>;
  hskLevel: number | null;
  classification: string | null;
  etymology: string | null;
  frequencyRank: number | null;
  commonWords: string[] | null;
  coreMeaning?: string | null;
  phoneticComponentId?: string | null;
}

interface ExistingCharacterFile {
  version: number;
  updated_at: string;
  characters: ExistingCharacterEntry[];
}

interface ExistingIndexFile {
  version: number;
  updated_at: string;
  glyph_to_id: Record<string, string>;
}

interface NewCharacterEntry {
  id: string;
  glyph: string;
  strokeCount: number | null;
  classification: string | null;
  etymology: string | null;
  readings: Array<{
    pinyin: string;
    tone: number;
    type: string;
    coreMeaning: string | null;
  }>;
  hskLevel: number | null;
  frequencyRank: number | null;
  commonWords: string[] | null;
  phoneticComponentId: string | null;
  coreMeaning: string | null;
}

// ── Classification Mapper ──

const CLASSIFICATION_MAP: Record<string, string> = {
  pictographic: "pictograph",
  pictophonetic: "phono_semantic",
  ideographic: "ideograph",
};

function mapClassification(mmahType: string | undefined): string | null {
  if (!mmahType) return null;
  const lower = mmahType.toLowerCase().trim();
  return CLASSIFICATION_MAP[lower] || null;
}

// ── Main ──

function main(): void {
  logger.info("📦 Build Character Entries (Enrich 1)");
  logger.info("═══════════════════════════════════════\n");

  // ── Load inputs ──

  logger.info("Loading Phase 1 inputs...");

  const mmahEntries: MmahEntry[] = JSON.parse(
    fs.readFileSync(path.join(PHASE1_DIR, "mmah-entries.json"), "utf-8"),
  );
  logger.info(`  📄 MMAH entries: ${mmahEntries.length}`);

  const unihanStrokes: Record<string, number> = JSON.parse(
    fs.readFileSync(path.join(PHASE1_DIR, "unihan-strokes.json"), "utf-8"),
  );
  logger.info(`  📄 Unihan strokes: ${Object.keys(unihanStrokes).length}`);

  const hskWords: HskWordEntry[] = JSON.parse(
    fs.readFileSync(path.join(PHASE1_DIR, "hsk-words.json"), "utf-8"),
  );
  logger.info(`  📄 HSK words: ${hskWords.length}`);

  // Load existing content files
  let existingCharFile: ExistingCharacterFile = { version: 1, updated_at: "", characters: [] };
  let existingIndexFile: ExistingIndexFile = { version: 1, updated_at: "", glyph_to_id: {} };

  const existingCharsPath = path.join(CONTENT_CHARS_DIR, "characters.json");
  if (fs.existsSync(existingCharsPath)) {
    existingCharFile = JSON.parse(fs.readFileSync(existingCharsPath, "utf-8"));
    logger.info(`  📄 Existing characters: ${existingCharFile.characters.length}`);
  } else {
    logger.warn("  ⚠️ Existing characters.json not found");
  }

  const existingIndexPath = path.join(CONTENT_CHARS_DIR, "index.json");
  if (fs.existsSync(existingIndexPath)) {
    existingIndexFile = JSON.parse(fs.readFileSync(existingIndexPath, "utf-8"));
    logger.info(
      `  📄 Existing index: ${Object.keys(existingIndexFile.glyph_to_id).length} entries`,
    );
  } else {
    logger.warn("  ⚠️ Existing index.json not found");
  }

  // ── Build lookup maps ──

  // Existing glyph → id (from index.json)
  const glyphToExistingId = existingIndexFile.glyph_to_id;

  // Existing glyph → existing entry data (preserve readings, coreMeaning)
  const existingCharByGlyph = new Map<string, ExistingCharacterEntry>();
  for (const ch of existingCharFile.characters) {
    existingCharByGlyph.set(ch.glyph, ch);
  }
  logger.info(`  📄 Built existing character map: ${existingCharByGlyph.size} entries`);

  // MMAH entry by glyph
  const mmahByGlyph = new Map<string, MmahEntry>();
  for (const entry of mmahEntries) {
    mmahByGlyph.set(entry.character, entry);
  }
  logger.info(`  📄 Built MMAH map: ${mmahByGlyph.size} entries`);

  // HSK: compute min HSK level per character glyph across all words
  const hskLevelByGlyph = new Map<string, number>();
  for (const word of hskWords) {
    const chars = charsOf(word.simplified);
    for (const glyph of chars) {
      const existing = hskLevelByGlyph.get(glyph) ?? Infinity;
      if (word.hskLevel < existing) {
        hskLevelByGlyph.set(glyph, word.hskLevel);
      }
    }
  }
  logger.info(`  📄 Computed HSK levels for ${hskLevelByGlyph.size} unique glyphs`);

  // ── Collect all unique character glyphs ──

  const allGlyphs = new Set<string>();

  // From MMAH
  for (const entry of mmahEntries) {
    allGlyphs.add(entry.character);
  }

  // From HSK words
  for (const word of hskWords) {
    for (const g of charsOf(word.simplified)) {
      allGlyphs.add(g);
    }
    // Also handle hanziAlt
    if (word.hanziAlt) {
      for (const g of charsOf(word.hanziAlt)) {
        allGlyphs.add(g);
      }
    }
  }

  // From Unihan
  for (const glyph of Object.keys(unihanStrokes)) {
    allGlyphs.add(glyph);
  }

  // From existing characters
  for (const ch of existingCharFile.characters) {
    allGlyphs.add(ch.glyph);
  }

  logger.info(`  🔤 Total unique glyphs: ${allGlyphs.size}`);

  // ── Next available ID counter ──

  // Find max existing numeric ID
  let maxIdNum = 0;
  for (const id of Object.values(glyphToExistingId)) {
    const match = id.match(/^ch_(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxIdNum) maxIdNum = num;
    }
  }
  let nextIdNum = maxIdNum + 1;
  logger.info(`  🔢 Starting ID: ch_${nextIdNum}`);

  // ── Build character entries ──

  const characters: NewCharacterEntry[] = [];

  // Build a complete glyph→ID map from existing index (will extend as we assign new IDs)
  const glyphToIdMap = new Map(Object.entries(glyphToExistingId));

  for (const glyph of allGlyphs) {
    // Resolve ID
    let id: string;
    if (glyphToExistingId[glyph]) {
      id = glyphToExistingId[glyph];
    } else {
      id = `ch_${nextIdNum}`;
      nextIdNum++;
    }
    // Record in glyph→ID map (covers both existing and new characters)
    glyphToIdMap.set(glyph, id);

    // Stroke count from Unihan
    const strokeCount = unihanStrokes[glyph] ?? null;

    // Classification & etymology from MMAH
    const mmah = mmahByGlyph.get(glyph);
    let classification: string | null = null;
    let etymology: string | null = null;
    let phoneticComponentId: string | null = null;

    if (mmah) {
      classification = mapClassification(mmah.etymology?.type);
      if (mmah.etymology?.hint) {
        etymology = mmah.etymology.hint;
      } else if (mmah.definition) {
        etymology = mmah.definition;
      }
      // NOTE: phoneticComponentId is set from MMAH data here, but it stores
      // a glyph (e.g., "从") not a character ID. A second pass below resolves
      // all glyphs to character IDs using the complete glyphToIdMap.
      if (mmah.etymology?.phonetic) {
        phoneticComponentId = mmah.etymology.phonetic;
      }
    }

    // Preserve existing readings & coreMeaning
    const existing = existingCharByGlyph.get(glyph);
    const readings = existing?.readings ?? [];
    const coreMeaning = existing?.coreMeaning ?? null;

    // If existing has a classification/etymology, prefer that as manually curated
    if (existing?.classification) {
      classification = existing.classification;
    }
    if (existing?.etymology) {
      etymology = existing.etymology;
    }
    if (existing?.phoneticComponentId) {
      phoneticComponentId = existing.phoneticComponentId;
    }

    // HSK level (min of containing words)
    const hskLevel = hskLevelByGlyph.get(glyph) ?? null;

    characters.push({
      id,
      glyph,
      strokeCount,
      classification,
      etymology,
      readings,
      hskLevel,
      frequencyRank: null,
      commonWords: null,
      phoneticComponentId,
      coreMeaning,
    });
  }

  // ── Second pass: resolve phoneticComponentId glyphs → character IDs ──
  // The MMAH etymology.phonetic field stores a glyph string (e.g., "从").
  // We need to convert it to a character ID (e.g., "ch_20174") since the
  // Prisma schema expects a String? referencing Character.id.
  let phoneticResolved = 0;
  let phoneticNotFound = 0;
  for (const ch of characters) {
    if (!ch.phoneticComponentId) continue;
    // Already a character ID (from existing data) — skip
    if (ch.phoneticComponentId.startsWith("ch_")) continue;
    // Otherwise it's a glyph — resolve via the complete glyph→ID map
    const resolvedId = glyphToIdMap.get(ch.phoneticComponentId);
    if (resolvedId) {
      ch.phoneticComponentId = resolvedId;
      phoneticResolved++;
    } else {
      logger.warn(
        `  ⚠️ Phonetic component glyph "${ch.phoneticComponentId}" not found for "${ch.glyph}" (${ch.id})`,
      );
      ch.phoneticComponentId = null;
      phoneticNotFound++;
    }
  }
  logger.info(
    `  🔤 Phonetic component IDs resolved: ${phoneticResolved}, not found: ${phoneticNotFound}`,
  );

  // Sort by ID for deterministic output
  characters.sort((a, b) => a.id.localeCompare(b.id));

  // ── Write output ──

  ensureDir(PHASE2_DIR);
  const outputPath = path.join(PHASE2_DIR, "characters.json");
  writeJsonAtomic(outputPath, characters);
  logger.info(`  ✅ Written ${characters.length} characters to ${outputPath}`);

  // ── Summary ──

  const withClassifications = characters.filter((c) => c.classification !== null).length;
  const withEtymology = characters.filter((c) => c.etymology !== null).length;
  const withStrokeCount = characters.filter((c) => c.strokeCount !== null).length;
  const withHskLevel = characters.filter((c) => c.hskLevel !== null).length;
  const withReadings = characters.filter((c) => c.readings.length > 0).length;

  logger.info("\n═══════════════════════════════════════════");
  logger.info("  ✅ Character Entries Complete");
  logger.info("═══════════════════════════════════════════\n");
  logger.info(`  Total characters: ${characters.length}`);
  logger.info(`  With classifications: ${withClassifications}`);
  logger.info(`  With etymology: ${withEtymology}`);
  logger.info(`  With strokeCount: ${withStrokeCount}`);
  logger.info(`  With hskLevel: ${withHskLevel}`);
  logger.info(`  With readings: ${withReadings}`);
  logger.info("");
}

try {
  main();
} catch (e) {
  logger.error(`❌ Failed: ${(e as Error).message}`, e as Error);
  process.exit(1);
}
