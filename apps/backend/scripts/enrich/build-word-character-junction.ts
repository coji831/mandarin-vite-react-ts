/**
 * @file apps/backend/scripts/enrich/build-word-character-junction.ts
 * @description Enrich 5: Build WordCharacter junction records AND compute
 *   character enrichment (frequencyRank, commonWords, hskLevel).
 *
 * Reads:
 *   - content/seed/phase2/words.json (from Enrich 4)
 *   - content/seed/phase2/characters.json (from Enrich 1 — will be UPDATED)
 *
 * Writes:
 *   - content/seed/phase2/word-characters.json
 *   - content/seed/phase2/character-hsk-levels.json
 *   - UPDATE content/seed/phase2/characters.json (add frequencyRank, commonWords, hskLevel)
 *
 * Idempotent: pure JSON-to-JSON transform.
 *
 * Run: cd apps/backend && npx tsx scripts/enrich/build-word-character-junction.ts
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { writeJsonAtomic, ensureDir, charsOf } from "../utils.js";
import { scriptLogger } from "../logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logger = scriptLogger("enrich:word-char-junction");

// ── Paths ──

const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..", "..");
const PHASE2_DIR = path.join(PROJECT_ROOT, "content", "seed", "phase2");

// ── Types ──

interface NewWordEntry {
  id: string;
  simplified: string;
  pinyin: string | null;
  meaning: string | null;
  hskLevel: number | null;
  frequencyRank: number | null;
  wordClass: string | null;
  characters: string[];
  sequenceOrder: number[];
  hskNo: number | null;
  usage: string;
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

interface WordCharacterRecord {
  wordId: string;
  characterId: string;
  sequenceOrder: number;
}

interface CharacterHskLevelRecord {
  characterId: string;
  hskLevel: number;
}

// ── Main ──

async function main(): Promise<void> {
  logger.info("📦 Build Word-Character Junction (Enrich 5)");
  logger.info("════════════════════════════════════════════\n");

  // ── Load inputs ──

  logger.info("Loading inputs...");

  const wordsPath = path.join(PHASE2_DIR, "words.json");
  if (!fs.existsSync(wordsPath)) {
    logger.error(
      "  ❌ Phase 2 words.json not found — run Enrich 4 first",
      new Error("Missing words.json"),
    );
    process.exit(1);
  }
  const words: NewWordEntry[] = JSON.parse(fs.readFileSync(wordsPath, "utf-8"));
  logger.info(`  📄 Words: ${words.length}`);

  const charsPath = path.join(PHASE2_DIR, "characters.json");
  if (!fs.existsSync(charsPath)) {
    logger.error(
      "  ❌ Phase 2 characters.json not found — run Enrich 1 first",
      new Error("Missing characters.json"),
    );
    process.exit(1);
  }
  const characters: NewCharacterEntry[] = JSON.parse(fs.readFileSync(charsPath, "utf-8"));
  logger.info(`  📄 Characters: ${characters.length}`);

  // ── Build WordCharacter records ──

  logger.info("Building WordCharacter records...");

  const wordCharacters: WordCharacterRecord[] = [];
  const charWordCounts = new Map<string, number>(); // characterId → word count
  const charWordsMap = new Map<string, Set<string>>(); // characterId → set of simplified word texts
  const charHskLevels = new Map<string, number>(); // characterId → min HSK level
  // Belt-and-suspenders: track seen (wordId, characterId) pairs to avoid duplicates
  const seenWcPairs = new Set<string>();
  let skippedDuplicates = 0;

  for (const word of words) {
    const simplifiedGlyphs = charsOf(word.simplified);

    for (let i = 0; i < word.characters.length; i++) {
      const charId = word.characters[i];
      const pairKey = `${word.id}:${charId}`;

      // Skip duplicate (wordId, characterId) pairs — the Prisma @@unique constraint
      // prevents these, and the root cause was fixed in Enrich 4, but guard here too
      if (seenWcPairs.has(pairKey)) {
        skippedDuplicates++;
        continue;
      }
      seenWcPairs.add(pairKey);

      wordCharacters.push({
        wordId: word.id,
        characterId: charId,
        sequenceOrder: word.sequenceOrder[i] ?? i + 1,
      });

      // Count words per character
      charWordCounts.set(charId, (charWordCounts.get(charId) || 0) + 1);

      // Collect unique simplified glyphs per character
      if (!charWordsMap.has(charId)) {
        charWordsMap.set(charId, new Set());
      }
      // Use the glyph from the simplified form for the word
      if (i < simplifiedGlyphs.length) {
        charWordsMap.get(charId)!.add(simplifiedGlyphs[i]);
      }

      // Compute min HSK level per character
      if (word.hskLevel !== null) {
        const current = charHskLevels.get(charId) ?? Infinity;
        if (word.hskLevel < current) {
          charHskLevels.set(charId, word.hskLevel);
        }
      }
    }
  }

  if (skippedDuplicates > 0) {
    logger.warn(`  ⚠️ Skipped ${skippedDuplicates} duplicate WordCharacter pairs`);
  }

  logger.info(`  📊 WordCharacter records: ${wordCharacters.length}`);
  logger.info(`  📊 Characters with word counts: ${charWordCounts.size}`);

  // Sort wordCharacters for deterministic output
  wordCharacters.sort((a, b) => {
    if (a.wordId !== b.wordId) return a.wordId.localeCompare(b.wordId);
    return a.sequenceOrder - b.sequenceOrder;
  });

  // ── Compute character enrichment ──

  logger.info("Computing character enrichment...");

  // frequencyRank: sort characters by word count descending, assign rank 1-N
  const charFreqEntries = [...charWordCounts.entries()].sort((a, b) => b[1] - a[1]);
  const charFreqRank = new Map<string, number>();
  for (let i = 0; i < charFreqEntries.length; i++) {
    charFreqRank.set(charFreqEntries[i][0], i + 1);
  }

  // Update characters array with enrichment fields
  let updatedCount = 0;
  const charHskLevelRecords: CharacterHskLevelRecord[] = [];

  for (const ch of characters) {
    const freqRank = charFreqRank.get(ch.id) ?? null;
    const commonWords = charWordsMap.has(ch.id) ? [...charWordsMap.get(ch.id)!].sort() : null;
    const hskLevel = charHskLevels.get(ch.id) ?? null;

    ch.frequencyRank = freqRank;
    ch.commonWords = commonWords;
    ch.hskLevel = hskLevel;

    if (hskLevel !== null) {
      charHskLevelRecords.push({
        characterId: ch.id,
        hskLevel,
      });
    }

    updatedCount++;
  }

  // Sort character HSK levels
  charHskLevelRecords.sort((a, b) => a.characterId.localeCompare(b.characterId));

  // ── Write outputs ──

  ensureDir(PHASE2_DIR);

  // WordCharacter
  const wcPath = path.join(PHASE2_DIR, "word-characters.json");
  writeJsonAtomic(wcPath, wordCharacters);
  logger.info(`  ✅ Written ${wordCharacters.length} word-characters to ${wcPath}`);

  // CharacterHskLevel
  const chlPath = path.join(PHASE2_DIR, "character-hsk-levels.json");
  writeJsonAtomic(chlPath, charHskLevelRecords);
  logger.info(`  ✅ Written ${charHskLevelRecords.length} character-hsk-levels to ${chlPath}`);

  // Updated characters.json
  writeJsonAtomic(charsPath, characters);
  logger.info(`  ✅ Updated characters.json with enrichment fields`);

  // ── Summary ──

  const withFreqRank = characters.filter((c) => c.frequencyRank !== null).length;
  const withCommonWords = characters.filter(
    (c) => c.commonWords !== null && c.commonWords.length > 0,
  ).length;
  const withHskLevel = characters.filter((c) => c.hskLevel !== null).length;
  const maxRank = characters.reduce(
    (max, c) => (c.frequencyRank !== null && c.frequencyRank > max ? c.frequencyRank : max),
    0,
  );

  logger.info("\n═══════════════════════════════════════════");
  logger.info("  ✅ Word-Character Junction Complete");
  logger.info("═══════════════════════════════════════════\n");
  logger.info(`  WordCharacter records: ${wordCharacters.length}`);
  logger.info(`  Characters with frequencyRank: ${withFreqRank}`);
  logger.info(`  Max frequencyRank: ${maxRank}`);
  logger.info(`  Characters with commonWords: ${withCommonWords}`);
  logger.info(`  Characters with hskLevel: ${withHskLevel}`);
  logger.info(`  CharacterHskLevel records: ${charHskLevelRecords.length}`);
  logger.info("");
}

main().catch((e: Error) => {
  logger.error(`❌ Failed: ${e.message}`, e);
  process.exit(1);
});
