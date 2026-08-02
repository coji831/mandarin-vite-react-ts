/**
 * @file apps/backend/scripts/enrich/build-measure-word-words.ts
 * @description Enrich 7: Resolve measure word noun pairings to word IDs.
 *
 * Reads:
 *   - content/seed/phase1/measure-words.json
 *   - content/seed/phase2/words.json (from Enrich 4)
 *
 * Writes: content/seed/phase2/measure-word-words.json
 *
 * Also writes the enriched measure-words.json with generated IDs to
 * content/seed/phase2/measure-words.json (updating the pass-through copy).
 *
 * Idempotent: pure JSON-to-JSON transform.
 *
 * Run: cd apps/backend && npx tsx scripts/enrich/build-measure-word-words.ts
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { writeJsonAtomic, ensureDir } from "../utils.js";
import { scriptLogger } from "../logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logger = scriptLogger("enrich:mw-words");

// ── Paths ──

const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..", "..");
const PHASE1_DIR = path.join(PROJECT_ROOT, "content", "seed", "phase1");
const PHASE2_DIR = path.join(PROJECT_ROOT, "content", "seed", "phase2");

// ── Types ──

interface MeasureWordEntry {
  glyph: string;
  pinyin: string;
  meaning: string;
  hskLevel: number;
  nouns: string[];
}

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

interface MeasureWordRecord {
  id: string;
  glyph: string;
  pinyin: string;
  meaning: string;
  hskLevel: number;
  nouns: string[];
}

interface MeasureWordWordRecord {
  measureWordId: string;
  wordId: string;
  exampleSentence: string;
  isDefault: boolean;
}

// ── Main ──

async function main(): Promise<void> {
  logger.info("📦 Build Measure Word Words (Enrich 7)");
  logger.info("═══════════════════════════════════════\n");

  // ── Load inputs ──

  logger.info("Loading inputs...");

  const mwPath = path.join(PHASE1_DIR, "measure-words.json");
  if (!fs.existsSync(mwPath)) {
    logger.error(
      `  ❌ measure-words.json not found: ${mwPath}`,
      new Error("Missing measure-words.json"),
    );
    process.exit(1);
  }
  const measureWords: MeasureWordEntry[] = JSON.parse(fs.readFileSync(mwPath, "utf-8"));
  logger.info(`  📄 Measure words: ${measureWords.length}`);

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

  // ── Build word lookup ──

  // simplified → word (map with dedup — use the first match)
  const wordBySimplified = new Map<string, NewWordEntry>();
  for (const word of words) {
    if (!wordBySimplified.has(word.simplified)) {
      wordBySimplified.set(word.simplified, word);
    }
  }
  logger.info(`  📄 Word lookup: ${wordBySimplified.size} entries`);

  // ── Generate measure word IDs and records ──

  logger.info("Generating measure word records...");

  const mwRecords: MeasureWordRecord[] = [];
  const mwwRecords: MeasureWordWordRecord[] = [];
  let foundCount = 0;
  let skippedCount = 0;

  for (let i = 0; i < measureWords.length; i++) {
    const mw = measureWords[i];
    const mwId = `mw_${String(i + 1).padStart(3, "0")}`;

    mwRecords.push({
      id: mwId,
      glyph: mw.glyph,
      pinyin: mw.pinyin,
      meaning: mw.meaning,
      hskLevel: mw.hskLevel,
      nouns: mw.nouns,
    });

    // Resolve noun pairings
    let defaultSet = false;
    for (const nounGlyph of mw.nouns) {
      const word = wordBySimplified.get(nounGlyph);

      if (word) {
        // Build an example sentence: measure word + noun
        // e.g., "一个人", "一本书"
        const exampleSentence =
          mw.glyph === "个" ? `一${mw.glyph}${nounGlyph}` : `一${mw.glyph}${nounGlyph}`;

        mwwRecords.push({
          measureWordId: mwId,
          wordId: word.id,
          exampleSentence,
          isDefault: !defaultSet,
        });

        if (!defaultSet) defaultSet = true;
        foundCount++;
      } else {
        skippedCount++;
      }
    }
  }

  // Sort for deterministic output
  mwwRecords.sort((a, b) => {
    if (a.measureWordId !== b.measureWordId) return a.measureWordId.localeCompare(b.measureWordId);
    return a.wordId.localeCompare(b.wordId);
  });

  // ── Write outputs ──

  ensureDir(PHASE2_DIR);

  // Write measure-words.json (with IDs)
  const mwOutputPath = path.join(PHASE2_DIR, "measure-words.json");
  writeJsonAtomic(mwOutputPath, mwRecords);
  logger.info(`  ✅ Written ${mwRecords.length} measure words to ${mwOutputPath}`);

  // Write measure-word-words.json
  const mwwOutputPath = path.join(PHASE2_DIR, "measure-word-words.json");
  writeJsonAtomic(mwwOutputPath, mwwRecords);
  logger.info(`  ✅ Written ${mwwRecords.length} measure-word-words to ${mwwOutputPath}`);

  // ── Summary ──

  logger.info("\n═══════════════════════════════════════════");
  logger.info("  ✅ Measure Word Words Complete");
  logger.info("═══════════════════════════════════════════\n");
  logger.info(`  Measure words: ${mwRecords.length}`);
  logger.info(`  Word pairings found: ${foundCount}`);
  logger.info(`  Word pairings skipped (not in HSK): ${skippedCount}`);
  logger.info("");
}

main().catch((e: Error) => {
  logger.error(`❌ Failed: ${e.message}`, e);
  process.exit(1);
});
