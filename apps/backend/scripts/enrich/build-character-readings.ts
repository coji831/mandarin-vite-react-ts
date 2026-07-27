/**
 * @file apps/backend/scripts/enrich/build-character-readings.ts
 * @description Enrich 2: Extract readings from CC-CEDICT and existing content
 *   files into normalized CharacterReading records.
 *
 * Reads:
 *   - content/seed/phase2/characters.json (from Enrich 1)
 *   - content/seed/phase1/cc-cedict-entries.json
 *   - content/characters/characters.json (existing — for existing readings data)
 *
 * Writes: content/seed/phase2/character-readings.json
 *
 * Idempotent: pure JSON-to-JSON transform.
 *
 * Run: cd apps/backend && npx tsx scripts/enrich/build-character-readings.ts
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { writeJsonAtomic, ensureDir } from "../utils.js";
import { scriptLogger } from "../logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logger = scriptLogger("enrich:char-readings");

// ── Paths ──

const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..", "..");
const PHASE1_DIR = path.join(PROJECT_ROOT, "content", "seed", "phase1");
const PHASE2_DIR = path.join(PROJECT_ROOT, "content", "seed", "phase2");
const CONTENT_CHARS_DIR = path.join(PROJECT_ROOT, "content", "characters");

// ── Types ──

interface CedictEntry {
  traditional: string;
  simplified: string;
  pinyinRaw: string;
  pinyinNumbered: string;
  definitions: string[];
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

interface ExistingCharacterEntry {
  id: string;
  glyph: string;
  readings: Array<{
    pinyin: string;
    tone: number;
    type: string;
    coreMeaning: string | null;
  }>;
}

interface ExistingCharacterFile {
  version: number;
  updated_at: string;
  characters: ExistingCharacterEntry[];
}

interface CharacterReadingRecord {
  characterId: string;
  pinyin: string;
  tone: number;
  type: "primary" | "secondary";
}

// ── Pinyin tokenizer ──

/**
 * Split a numbered pinyin string into syllables and extract (syllable, tone).
 * E.g., "ni3 hao3" → [["ni", 3], ["hao", 3]]
 * Handles "u:" as "ü".
 */
function parseNumberedPinyin(numbered: string): Array<{ syllable: string; tone: number }> {
  const tokens: Array<{ syllable: string; tone: number }> = [];
  const parts = numbered.trim().split(/\s+/);

  for (const part of parts) {
    if (!part) continue;
    // Normalize u: → ü
    let normalized = part.replace(/u:/g, "ü").replace(/U:/g, "Ü");

    // Extract tone number from the end
    const toneMatch = normalized.match(/^(.+?)([0-9])$/);
    if (toneMatch) {
      const syllable = toneMatch[1].toLowerCase();
      const tone = parseInt(toneMatch[2], 10);
      tokens.push({ syllable, tone });
    } else {
      // No tone number found — treat as neutral tone
      tokens.push({ syllable: normalized.toLowerCase(), tone: 0 });
    }
  }

  return tokens;
}

/** Check if a string contains CJK characters. */
function hasCjk(text: string): boolean {
  return /[\u4e00-\u9fff\u3400-\u4dbf]/.test(text);
}

// ── Main ──

async function main(): Promise<void> {
  logger.info("📦 Build Character Readings (Enrich 2)");
  logger.info("════════════════════════════════════════\n");

  // ── Load inputs ──

  logger.info("Loading inputs...");

  const phase2CharsPath = path.join(PHASE2_DIR, "characters.json");
  if (!fs.existsSync(phase2CharsPath)) {
    logger.error(
      "  ❌ Phase 2 characters.json not found — run Enrich 1 first",
      new Error("Missing characters.json"),
    );
    process.exit(1);
  }
  const characters: NewCharacterEntry[] = JSON.parse(fs.readFileSync(phase2CharsPath, "utf-8"));
  logger.info(`  📄 Phase 2 characters: ${characters.length}`);

  const cedictEntries: CedictEntry[] = JSON.parse(
    fs.readFileSync(path.join(PHASE1_DIR, "cc-cedict-entries.json"), "utf-8"),
  );
  logger.info(`  📄 CC-CEDICT entries: ${cedictEntries.length}`);

  // Load existing content
  let existingCharFile: ExistingCharacterFile = { version: 1, updated_at: "", characters: [] };
  const existingCharsPath = path.join(CONTENT_CHARS_DIR, "characters.json");
  if (fs.existsSync(existingCharsPath)) {
    existingCharFile = JSON.parse(fs.readFileSync(existingCharsPath, "utf-8"));
    logger.info(`  📄 Existing characters: ${existingCharFile.characters.length}`);
  }

  // ── Build lookup maps ──

  // Character glyph → ID from Phase 2 characters
  const glyphToId = new Map<string, string>();
  for (const ch of characters) {
    glyphToId.set(ch.glyph, ch.id);
  }
  logger.info(`  📄 Glyph→ID map: ${glyphToId.size} entries`);

  // Existing readings: glyph → array of (pinyin, tone, type) from existing content
  const existingReadingsByGlyph = new Map<
    string,
    Array<{ pinyin: string; tone: number; type: string }>
  >();
  for (const ch of existingCharFile.characters) {
    const readings = ch.readings.map((r) => ({
      pinyin: r.pinyin,
      tone: r.tone,
      type: r.type,
    }));
    if (readings.length > 0) {
      existingReadingsByGlyph.set(ch.glyph, readings);
    }
  }
  logger.info(`  📄 Existing readings: ${existingReadingsByGlyph.size} glyphs`);

  // ── Step 1: Extract readings from CC-CEDICT ──

  logger.info("Extracting readings from CC-CEDICT...");

  // glyph → Map of "syllable_tone" → frequency count
  const cedictReadingFreq = new Map<string, Map<string, number>>();

  let processedEntries = 0;
  for (const entry of cedictEntries) {
    const simp = entry.simplified;
    if (!simp || !hasCjk(simp)) continue;

    const pinyin = entry.pinyinNumbered || entry.pinyinRaw;
    if (!pinyin) continue;

    const tokens = parseNumberedPinyin(pinyin);
    const chars = [...simp];
    const cjkChars = chars.filter((c) => hasCjk(c));

    // Only process entries where the number of CJK chars matches the number of pinyin tokens
    if (cjkChars.length !== tokens.length) {
      // Try harder: filter non-CJK tokens
      const cjkTokens = tokens.filter((_, i) => hasCjk(chars[i]));
      if (cjkChars.length !== cjkTokens.length) continue;
      // Continue with the matching subset
      for (let i = 0; i < chars.length; i++) {
        if (!hasCjk(chars[i])) continue;
        const char = chars[i];
        const tokenIdx = tokens.length > 1 ? i : 0; // single pinyin for whole word
        if (tokenIdx >= tokens.length) continue;
        const token = tokens[tokenIdx];
        const key = `${token.syllable}_${token.tone}`;
        if (!cedictReadingFreq.has(char)) {
          cedictReadingFreq.set(char, new Map());
        }
        const freq = cedictReadingFreq.get(char)!;
        freq.set(key, (freq.get(key) || 0) + 1);
      }
      continue;
    }

    for (let i = 0; i < cjkChars.length; i++) {
      const char = cjkChars[i];
      const token = tokens[i];
      const key = `${token.syllable}_${token.tone}`;

      if (!cedictReadingFreq.has(char)) {
        cedictReadingFreq.set(char, new Map());
      }
      const freq = cedictReadingFreq.get(char)!;
      freq.set(key, (freq.get(key) || 0) + 1);
    }

    processedEntries++;
  }

  logger.info(`  📊 Processed ${processedEntries} CC-CEDICT entries`);
  logger.info(`  📊 Unique glyphs with readings: ${cedictReadingFreq.size}`);

  // ── Step 2: Build unique reading records ──

  logger.info("Building reading records...");

  const readingSet = new Set<string>(); // Dedup by "characterId_pinyin_tone"
  const readingRecords: CharacterReadingRecord[] = [];

  for (const [glyph, freqMap] of cedictReadingFreq) {
    const charId = glyphToId.get(glyph);
    if (!charId) continue; // Skip characters not in our character set

    // Find most frequent reading
    let maxFreq = 0;
    const entries = [...freqMap.entries()];
    const topKey = entries.reduce((best, [k, f]) => (f > best[1] ? [k, f] : best), ["", 0])[0];

    for (const [key, freq] of entries) {
      const [syllable, toneStr] = key.split("_");
      const tone = parseInt(toneStr, 10);
      const type = key === topKey ? "primary" : "secondary";

      const dedupKey = `${charId}_${syllable}_${tone}`;
      if (readingSet.has(dedupKey)) continue;
      readingSet.add(dedupKey);

      readingRecords.push({
        characterId: charId,
        pinyin: syllable,
        tone,
        type,
      });
    }
  }

  // ── Step 3: Add existing content readings ──

  logger.info("Adding readings from existing content...");

  let existingAdded = 0;
  for (const [glyph, readings] of existingReadingsByGlyph) {
    const charId = glyphToId.get(glyph);
    if (!charId) continue;

    for (const reading of readings) {
      const dedupKey = `${charId}_${reading.pinyin}_${reading.tone}`;
      if (readingSet.has(dedupKey)) continue;
      readingSet.add(dedupKey);

      readingRecords.push({
        characterId: charId,
        pinyin: reading.pinyin,
        tone: reading.tone,
        type: reading.type as "primary" | "secondary",
      });
      existingAdded++;
    }
  }
  logger.info(`  📊 Added ${existingAdded} readings from existing content`);

  // Sort for deterministic output
  readingRecords.sort((a, b) => {
    if (a.characterId !== b.characterId) return a.characterId.localeCompare(b.characterId);
    if (a.pinyin !== b.pinyin) return a.pinyin.localeCompare(b.pinyin);
    return a.tone - b.tone;
  });

  // ── Write output ──

  ensureDir(PHASE2_DIR);
  const outputPath = path.join(PHASE2_DIR, "character-readings.json");
  writeJsonAtomic(outputPath, readingRecords);
  logger.info(`  ✅ Written ${readingRecords.length} readings to ${outputPath}`);

  // ── Summary ──

  const uniqueChars = new Set(readingRecords.map((r) => r.characterId)).size;
  const primaryCount = readingRecords.filter((r) => r.type === "primary").length;
  const secondaryCount = readingRecords.filter((r) => r.type === "secondary").length;

  logger.info("\n═══════════════════════════════════════════");
  logger.info("  ✅ Character Readings Complete");
  logger.info("═══════════════════════════════════════════\n");
  logger.info(`  Total reading records: ${readingRecords.length}`);
  logger.info(`  Unique characters: ${uniqueChars}`);
  logger.info(`  Primary readings: ${primaryCount}`);
  logger.info(`  Secondary readings: ${secondaryCount}`);
  logger.info("");
}

main().catch((e: Error) => {
  logger.error(`❌ Failed: ${e.message}`, e);
  process.exit(1);
});
