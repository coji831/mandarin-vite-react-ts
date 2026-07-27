/**
 * @file apps/backend/scripts/enrich/build-pinyin-mappings.ts
 * @description Enrich 3: Create PinyinCharacterMapping junction records linking
 *   characters to pinyin syllables.
 *
 * Reads:
 *   - content/seed/phase2/characters.json (from Enrich 1)
 *   - content/seed/phase2/character-readings.json (from Enrich 2)
 *   - content/seed/phase1/pinyin-syllables.json
 *
 * Writes: content/seed/phase2/pinyin-character-mappings.json
 *
 * Idempotent: pure JSON-to-JSON transform.
 *
 * Run: cd apps/backend && npx tsx scripts/enrich/build-pinyin-mappings.ts
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { writeJsonAtomic, ensureDir } from "../utils.js";
import { scriptLogger } from "../logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logger = scriptLogger("enrich:pinyin-mappings");

// ── Paths ──

const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..", "..");
const PHASE1_DIR = path.join(PROJECT_ROOT, "content", "seed", "phase1");
const PHASE2_DIR = path.join(PROJECT_ROOT, "content", "seed", "phase2");

// ── Types ──

interface PinyinSyllableEntry {
  initial: string;
  final: string;
  tone: number;
  syllable: string;
  syllablePretty: string;
}

interface CharacterReadingRecord {
  characterId: string;
  pinyin: string;
  tone: number;
  type: "primary" | "secondary";
}

interface PinyinCharacterMappingRecord {
  pinyinSyllableId: string;
  characterId: string;
  readingType: "primary" | "secondary";
  isDefault: boolean;
}

// ── Main ──

async function main(): Promise<void> {
  logger.info("📦 Build Pinyin Character Mappings (Enrich 3)");
  logger.info("═══════════════════════════════════════════════\n");

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

  const readingsPath = path.join(PHASE2_DIR, "character-readings.json");
  if (!fs.existsSync(readingsPath)) {
    logger.error(
      "  ❌ Phase 2 character-readings.json not found — run Enrich 2 first",
      new Error("Missing character-readings.json"),
    );
    process.exit(1);
  }

  const characters: Array<{ id: string; glyph: string }> = JSON.parse(
    fs.readFileSync(phase2CharsPath, "utf-8"),
  );
  logger.info(`  📄 Phase 2 characters: ${characters.length}`);

  const readings: CharacterReadingRecord[] = JSON.parse(fs.readFileSync(readingsPath, "utf-8"));
  logger.info(`  📄 Character readings: ${readings.length}`);

  const pinyinSyllables: PinyinSyllableEntry[] = JSON.parse(
    fs.readFileSync(path.join(PHASE1_DIR, "pinyin-syllables.json"), "utf-8"),
  );
  logger.info(`  📄 Pinyin syllables: ${pinyinSyllables.length}`);

  // ── Build pinyin syllable lookup ──

  // Map: "syllable_tone" → id (sequential as they appear)
  // The pinyin-syllables.json has no IDs yet, so we generate them:
  // ps_XXXXX (pinyin syllable, 5-digit zero-padded index)
  const syllableToId = new Map<string, string>();
  const syllableById = new Map<string, PinyinSyllableEntry>();

  // Also build a lookup by initial+final+tone combination
  const comboToId = new Map<string, string>();

  for (let i = 0; i < pinyinSyllables.length; i++) {
    const syl = pinyinSyllables[i];
    const id = `ps_${String(i + 1).padStart(5, "0")}`;
    const key = `${syl.syllable}`;
    const comboKey = `${syl.initial}_${syl.final}_${syl.tone}`;

    syllableToId.set(key, id);
    comboToId.set(comboKey, id);
    syllableById.set(id, syl);
  }
  logger.info(`  📄 Built syllable lookup: ${syllableToId.size} entries`);

  // ── Build character glyph → ID map ──

  const charIdSet = new Set<string>();
  for (const ch of characters) {
    charIdSet.add(ch.id);
  }

  // ── Build mappings ──

  logger.info("Building pinyin-character mappings...");

  const mappings: PinyinCharacterMappingRecord[] = [];
  const mappingSet = new Set<string>(); // dedup by "syllableId_characterId"

  let matched = 0;
  let unmatched = 0;

  for (const reading of readings) {
    if (!charIdSet.has(reading.characterId)) continue;

    // Try to find matching pinyin syllable
    // Pinyin syllables have keys like "ba1", "ba2", etc.
    const numberedSyllable = reading.pinyin + reading.tone;

    // Try with tone number
    let sylId = syllableToId.get(numberedSyllable);

    // Try without tone (tone 0/neutral)
    if (!sylId && reading.tone === 0) {
      sylId = syllableToId.get(reading.pinyin);
    }

    // Try alternate: if tone is 0, try all tones for this pinyin
    if (!sylId && reading.tone === 0) {
      // Try tones 1-5
      for (let t = 1; t <= 5; t++) {
        const altKey = reading.pinyin + t;
        if (syllableToId.has(altKey)) {
          sylId = syllableToId.get(altKey);
          break;
        }
      }
    }

    if (!sylId) {
      // Try matching just by syllable (without tone)
      for (const [key, id] of syllableToId) {
        const keySyllable = key.replace(/[1-5]$/, "");
        if (keySyllable === reading.pinyin) {
          sylId = id;
          break;
        }
      }
    }

    if (!sylId) {
      unmatched++;
      continue;
    }

    const dedupKey = `${sylId}_${reading.characterId}`;
    if (mappingSet.has(dedupKey)) continue;
    mappingSet.add(dedupKey);

    const isDefault = reading.type === "primary";

    mappings.push({
      pinyinSyllableId: sylId,
      characterId: reading.characterId,
      readingType: reading.type,
      isDefault,
    });

    matched++;
  }

  // Sort for deterministic output
  mappings.sort((a, b) => {
    if (a.pinyinSyllableId !== b.pinyinSyllableId) {
      return a.pinyinSyllableId.localeCompare(b.pinyinSyllableId);
    }
    return a.characterId.localeCompare(b.characterId);
  });

  // ── Write output ──

  ensureDir(PHASE2_DIR);
  const outputPath = path.join(PHASE2_DIR, "pinyin-character-mappings.json");
  writeJsonAtomic(outputPath, mappings);
  logger.info(`  ✅ Written ${mappings.length} mappings to ${outputPath}`);

  // ── Summary ──

  const uniqueChars = new Set(mappings.map((m) => m.characterId)).size;
  const defaultCount = mappings.filter((m) => m.isDefault).length;

  logger.info("\n═══════════════════════════════════════════════");
  logger.info("  ✅ Pinyin Character Mappings Complete");
  logger.info("═══════════════════════════════════════════════\n");
  logger.info(`  Total mappings: ${mappings.length}`);
  logger.info(`  Unique characters: ${uniqueChars}`);
  logger.info(`  Default (primary) mappings: ${defaultCount}`);
  logger.info(`  Matched readings: ${matched}`);
  logger.info(`  Unmatched readings: ${unmatched}`);
  logger.info("");
}

main().catch((e: Error) => {
  logger.error(`❌ Failed: ${e.message}`, e);
  process.exit(1);
});
