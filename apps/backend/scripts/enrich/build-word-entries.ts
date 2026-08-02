/**
 * @file apps/backend/scripts/enrich/build-word-entries.ts
 * @description Enrich 4: Merge HSK CSV data with CC-CEDICT enrichment into
 *   enriched Word records.
 *
 * Reads:
 *   - content/seed/phase1/hsk-words.json
 *   - content/seed/phase1/cc-cedict-entries.json
 *   - content/seed/phase2/characters.json (from Enrich 1 — for character ID resolution)
 *   - content/words/words.json (existing — for existing enriched fields)
 *
 * Writes:
 *   - content/seed/phase2/words.json
 *   - content/seed/phase2/word-hsk-levels.json
 *
 * Idempotent: pure JSON-to-JSON transform.
 *
 * Run: cd apps/backend && npx tsx scripts/enrich/build-word-entries.ts
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { writeJsonAtomic, ensureDir, charsOf } from "../utils.js";
import { scriptLogger } from "../logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logger = scriptLogger("enrich:word-entries");

// ── Paths ──

const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..", "..");
const PHASE1_DIR = path.join(PROJECT_ROOT, "content", "seed", "phase1");
const PHASE2_DIR = path.join(PROJECT_ROOT, "content", "seed", "phase2");
const CONTENT_WORDS_DIR = path.join(PROJECT_ROOT, "content", "words");

// ── Types ──

interface HskWordEntry {
  hskLevel: number;
  hskNo: number;
  simplified: string;
  hanziAlt: string;
  usage: string;
}

interface CedictEntry {
  traditional: string;
  simplified: string;
  pinyinRaw: string;
  pinyinNumbered: string;
  definitions: string[];
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

interface WordHskLevelEntry {
  wordId: string;
  hskLevel: number;
}

interface ExistingWordEntry {
  simplified: string;
  pinyin: string | null;
  meaning: string | null;
  hskLevel: number;
  frequencyRank: number;
  wordClass: string | null;
  hskNo: number;
  hskUsage: string;
  characters: string[];
  sequenceOrder: number[];
}

interface ExistingWordsFile {
  version: number;
  updated_at: string;
  words: Record<string, ExistingWordEntry>;
}

// ── Helpers ──

/** Check if a string contains CJK characters. */
function hasCjk(text: string): boolean {
  return /[\u4e00-\u9fff\u3400-\u4dbf]/.test(text);
}

// ── Word class inference ──

const WORD_CLASS_KEYWORDS: Array<{ keywords: string[]; wordClass: string }> = [
  { keywords: ["verb", "v."], wordClass: "verb" },
  { keywords: ["noun", "n."], wordClass: "noun" },
  { keywords: ["adj.", "adjective"], wordClass: "adjective" },
  { keywords: ["adv.", "adverb"], wordClass: "adverb" },
  { keywords: ["prep.", "preposition"], wordClass: "preposition" },
  { keywords: ["conj.", "conjunction"], wordClass: "conjunction" },
  { keywords: ["pron.", "pronoun"], wordClass: "pronoun" },
  { keywords: ["num.", "numeral"], wordClass: "numeral" },
  { keywords: ["measure word", "m.w.", "mw.", "classifier"], wordClass: "measure_word" },
  { keywords: ["part.", "particle"], wordClass: "particle" },
  { keywords: ["suffix"], wordClass: "suffix" },
  { keywords: ["prefix"], wordClass: "prefix" },
];

function inferWordClass(definitions: string[]): string | null {
  const text = definitions.join(" ").toLowerCase();
  for (const { keywords, wordClass } of WORD_CLASS_KEYWORDS) {
    for (const kw of keywords) {
      if (text.includes(kw)) return wordClass;
    }
  }
  return null;
}

// ── Main ──

function main(): void {
  logger.info("📦 Build Word Entries (Enrich 4)");
  logger.info("══════════════════════════════════\n");

  // ── Load inputs ──

  logger.info("Loading inputs...");

  const hskWords: HskWordEntry[] = JSON.parse(
    fs.readFileSync(path.join(PHASE1_DIR, "hsk-words.json"), "utf-8"),
  );
  logger.info(`  📄 HSK words: ${hskWords.length}`);

  const cedictEntries: CedictEntry[] = JSON.parse(
    fs.readFileSync(path.join(PHASE1_DIR, "cc-cedict-entries.json"), "utf-8"),
  );
  logger.info(`  📄 CC-CEDICT entries: ${cedictEntries.length}`);

  const phase2CharsPath = path.join(PHASE2_DIR, "characters.json");
  if (!fs.existsSync(phase2CharsPath)) {
    logger.error(
      "  ❌ Phase 2 characters.json not found — run Enrich 1 first",
      new Error("Missing characters.json"),
    );
    process.exit(1);
  }
  const characters: Array<{ id: string; glyph: string }> = JSON.parse(
    fs.readFileSync(phase2CharsPath, "utf-8"),
  );
  logger.info(`  📄 Phase 2 characters: ${characters.length}`);

  // Load existing words
  let existingWordsFile: ExistingWordsFile = { version: 1, updated_at: "", words: {} };
  const existingWordsPath = path.join(CONTENT_WORDS_DIR, "words.json");
  if (fs.existsSync(existingWordsPath)) {
    existingWordsFile = JSON.parse(fs.readFileSync(existingWordsPath, "utf-8"));
    logger.info(`  📄 Existing words: ${Object.keys(existingWordsFile.words).length}`);
  } else {
    logger.warn("  ⚠️ Existing words.json not found");
  }

  // ── Build lookup maps ──

  // CC-CEDICT: simplified → entry (first match)
  const cedictBySimplified = new Map<string, CedictEntry>();
  for (const entry of cedictEntries) {
    if (!cedictBySimplified.has(entry.simplified)) {
      cedictBySimplified.set(entry.simplified, entry);
    }
  }
  logger.info(`  📄 CC-CEDICT lookup: ${cedictBySimplified.size} entries`);

  // Character glyph → ID
  const glyphToId = new Map<string, string>();
  for (const ch of characters) {
    glyphToId.set(ch.glyph, ch.id);
  }
  logger.info(`  📄 Character glyph→ID: ${glyphToId.size} entries`);

  // Existing words: simplified → existing entry
  const existingBySimplified = new Map<string, ExistingWordEntry>();
  for (const [, entry] of Object.entries(existingWordsFile.words)) {
    if (entry.simplified) {
      existingBySimplified.set(entry.simplified, entry);
    }
  }
  logger.info(`  📄 Existing word lookup: ${existingBySimplified.size} entries`);

  // ── Build word entries ──

  logger.info("Building word entries...");

  // Use a map keyed by simplified to deduplicate words that appear at multiple HSK levels.
  // Strategy: keep the "best" entry (lowest hskLevel, prefer CC-CEDICT enrichment, lower hskNo).
  const simplifiedWordMap = new Map<string, NewWordEntry>();
  // Track ALL HSK levels per simplified form (for word-hsk-levels.json)
  const hskLevelsBySimplified = new Map<string, Set<number>>();
  let maxIdNum = 0;
  let resolvedCharIds = 0;
  let unresolvedCharGlyphs = 0;
  let duplicateCount = 0;

  // Find max existing word ID
  for (const id of Object.keys(existingWordsFile.words)) {
    const match = id.match(/^w_(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxIdNum) maxIdNum = num;
    }
  }

  for (let i = 0; i < hskWords.length; i++) {
    const hsk = hskWords[i];
    const simplified = hsk.simplified;
    const frequencyRank = i + 1;

    // Accumulate ALL HSK levels for this simplified form
    if (!hskLevelsBySimplified.has(simplified)) {
      hskLevelsBySimplified.set(simplified, new Set());
    }
    hskLevelsBySimplified.get(simplified)!.add(hsk.hskLevel);

    // Look up in CC-CEDICT for pinyin, meaning, word class
    const cedictMatch = cedictBySimplified.get(simplified);
    let pinyin: string | null = null;
    let meaning: string | null = null;
    let wordClass: string | null = null;

    if (cedictMatch) {
      pinyin = cedictMatch.pinyinNumbered || cedictMatch.pinyinRaw || null;
      meaning = cedictMatch.definitions.join("; ") || null;
      wordClass = inferWordClass(cedictMatch.definitions);
    }

    // Preserve existing fields
    const existing = existingBySimplified.get(simplified);
    if (existing) {
      if (existing.pinyin && !pinyin) pinyin = existing.pinyin;
      if (existing.meaning && !meaning) meaning = existing.meaning;
      if (existing.wordClass) wordClass = existing.wordClass;
    }

    // Resolve character IDs (deduplicate repeated glyphs — belt-and-suspenders)
    const glyphs = charsOf(simplified);
    const charIds: string[] = [];
    const seqOrder: number[] = [];
    const seenCharIds = new Set<string>();

    for (let j = 0; j < glyphs.length; j++) {
      const glyph = glyphs[j];
      const charId = glyphToId.get(glyph);
      if (charId) {
        if (!seenCharIds.has(charId)) {
          seenCharIds.add(charId);
          charIds.push(charId);
          seqOrder.push(j + 1);
          resolvedCharIds++;
        }
      } else {
        // Character not in our set — still need to add something
        logger.warn(`  ⚠️ Character not found for glyph: "${glyph}" in word "${simplified}"`);
        unresolvedCharGlyphs++;
      }
    }

    // Check if this simplified form already has an entry (deduplication)
    const existingEntry = simplifiedWordMap.get(simplified);
    if (existingEntry) {
      // Duplicate — decide whether to replace with this "better" entry
      duplicateCount++;
      const shouldReplace =
        hsk.hskLevel < existingEntry.hskLevel! ||
        (hsk.hskLevel === existingEntry.hskLevel && pinyin && !existingEntry.pinyin) ||
        (hsk.hskLevel === existingEntry.hskLevel &&
          (pinyin || existingEntry.pinyin) &&
          hsk.hskNo < existingEntry.hskNo!);
      if (shouldReplace) {
        existingEntry.hskLevel = hsk.hskLevel;
        existingEntry.hskNo = hsk.hskNo;
        existingEntry.usage = hsk.usage || "";
        existingEntry.pinyin = pinyin || existingEntry.pinyin;
        existingEntry.meaning = meaning || existingEntry.meaning;
        existingEntry.wordClass = wordClass || existingEntry.wordClass;
        existingEntry.characters = charIds;
        existingEntry.sequenceOrder = seqOrder;
      }
      continue;
    }

    // Generate word ID
    let wordId: string;
    // Check if this simplified form already has an ID from existing data
    const existingId = Object.entries(existingWordsFile.words).find(
      ([, e]) => e.simplified === simplified,
    )?.[0];

    if (existingId) {
      wordId = existingId;
    } else {
      maxIdNum++;
      wordId = `w_${String(maxIdNum).padStart(5, "0")}`;
    }

    simplifiedWordMap.set(simplified, {
      id: wordId,
      simplified,
      pinyin,
      meaning,
      hskLevel: hsk.hskLevel,
      frequencyRank,
      wordClass,
      characters: charIds,
      sequenceOrder: seqOrder,
      hskNo: hsk.hskNo,
      usage: hsk.usage || "",
    });
  }

  // Convert map to array and sort
  const words = Array.from(simplifiedWordMap.values());
  words.sort((a, b) => a.id.localeCompare(b.id));

  // Build wordHskLevels — emit only the LOWEST (primary) HSK level per word
  // Schema uses @@id([wordId]), so only one level per word is supported.
  const wordHskLevels: WordHskLevelEntry[] = [];
  for (const [simplified, levels] of hskLevelsBySimplified) {
    const word = simplifiedWordMap.get(simplified);
    if (!word) continue; // Should never happen
    const primaryLevel = Math.min(...Array.from(levels));
    wordHskLevels.push({ wordId: word.id, hskLevel: primaryLevel });
  }
  wordHskLevels.sort((a, b) => {
    if (a.wordId !== b.wordId) return a.wordId.localeCompare(b.wordId);
    return a.hskLevel - b.hskLevel;
  });

  logger.info(`  📊 Duplicate simplified forms merged: ${duplicateCount}`);

  // ── Write outputs ──

  ensureDir(PHASE2_DIR);

  const wordsPath = path.join(PHASE2_DIR, "words.json");
  writeJsonAtomic(wordsPath, words);
  logger.info(`  ✅ Written ${words.length} words to ${wordsPath}`);

  const hskLevelsPath = path.join(PHASE2_DIR, "word-hsk-levels.json");
  writeJsonAtomic(hskLevelsPath, wordHskLevels);
  logger.info(`  ✅ Written ${wordHskLevels.length} word-hsk-levels to ${hskLevelsPath}`);

  // ── Summary ──

  const withPinyin = words.filter((w) => w.pinyin !== null).length;
  const withMeaning = words.filter((w) => w.meaning !== null).length;
  const withWordClass = words.filter((w) => w.wordClass !== null).length;

  logger.info("\n═══════════════════════════════════════════");
  logger.info("  ✅ Word Entries Complete");
  logger.info("═══════════════════════════════════════════\n");
  logger.info(`  Total words: ${words.length}`);
  logger.info(`  With pinyin: ${withPinyin}`);
  logger.info(`  With meaning: ${withMeaning}`);
  logger.info(`  With wordClass: ${withWordClass}`);
  logger.info(`  Resolved character IDs: ${resolvedCharIds}`);
  logger.info(`  Unresolved character glyphs: ${unresolvedCharGlyphs}`);
  logger.info(`  HSK level records: ${wordHskLevels.length}`);
  logger.info("");
}

try {
  main();
} catch (e) {
  logger.error(`❌ Failed: ${(e as Error).message}`, e as Error);
  process.exit(1);
}
