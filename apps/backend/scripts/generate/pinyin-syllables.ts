/**
 * @file apps/backend/scripts/generate/pinyin-syllables.ts
 * @description Phase 1 extractor: algorithmically generates all valid Mandarin
 *   syllable+tone combinations and writes to content/seed/phase1/pinyin-syllables.json.
 *
 * Does NOT read any external file — the pinyin inventory (initials, finals, tone rules)
 * is embedded in the script logic.
 *
 * No enrichment, no DB writes, no ID resolution.
 * Idempotent: always overwrites output.
 *
 * Run: cd apps/backend && npx tsx scripts/generate/pinyin-syllables.ts
 */

import path from "path";
import { fileURLToPath } from "url";
import { writeJsonAtomic, ensureDir } from "../utils.js";
import { scriptLogger } from "../logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logger = scriptLogger("gen:pinyin-syllables");

// ── Paths ──

const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..", "..");
const OUTPUT_DIR = path.join(PROJECT_ROOT, "content", "seed", "phase1");
const OUTPUT_PATH = path.join(OUTPUT_DIR, "pinyin-syllables.json");

// ── Tone mark helpers ──

const TONE_MARKS: Record<string, string[]> = {
  a: ["ā", "á", "ǎ", "à", "a"],
  e: ["ē", "é", "ě", "è", "e"],
  i: ["ī", "í", "ǐ", "ì", "i"],
  o: ["ō", "ó", "ǒ", "ò", "o"],
  u: ["ū", "ú", "ǔ", "ù", "u"],
  ü: ["ǖ", "ǘ", "ǚ", "ǜ", "ü"],
};

/**
 * Apply tone mark to a pinyin string (with tone number 1-5).
 * Uses standard tone placement rules.
 */
function applyTone(pinyin: string, tone: number): string {
  if (tone === 5) return pinyin; // neutral tone: no mark

  // Find the vowel to place the mark on (priority: a, e, o)
  const vowelOrder = ["a", "e", "o"];
  let targetVowel: string | null = null;
  let targetIdx = -1;

  for (const v of vowelOrder) {
    const idx = pinyin.indexOf(v);
    if (idx !== -1) {
      targetVowel = v;
      targetIdx = idx;
      break;
    }
  }

  // If no a/e/o found, check i, u, ü
  if (targetVowel === null) {
    for (const v of ["i", "u", "ü"]) {
      const idx = pinyin.indexOf(v);
      if (idx !== -1) {
        targetVowel = v;
        targetIdx = idx;
        break;
      }
    }
  }

  if (targetVowel === null) return pinyin;

  // For "iu" and "ui", the tone goes on the second vowel
  if (pinyin.endsWith("iu") || pinyin.endsWith("ui")) {
    const secondVowel = pinyin[pinyin.length - 1];
    if ("aeiouü".includes(secondVowel)) {
      targetVowel = secondVowel;
      targetIdx = pinyin.length - 1;
    }
  }

  const marks = TONE_MARKS[targetVowel];
  if (!marks) return pinyin;

  return pinyin.slice(0, targetIdx) + marks[tone - 1] + pinyin.slice(targetIdx + 1);
}

/**
 * Normalize ü to u for j, q, x, y initials.
 */
function normalizeUmlaut(syllable: string, initial: string): string {
  if (["j", "q", "x", "y"].includes(initial)) {
    return syllable
      .replace(/ǖ/g, "ū")
      .replace(/ǘ/g, "ú")
      .replace(/ǚ/g, "ǔ")
      .replace(/ǜ/g, "ù")
      .replace(/ü/g, "u");
  }
  return syllable;
}

// ── Validity map ──

const VALID_FINALS_BY_INITIAL: Record<string, string[]> = {
  b: ["a", "ai", "an", "ang", "ao", "ei", "eng", "i", "ian", "iao", "ie", "in", "ing", "o", "u"],
  p: [
    "a",
    "ai",
    "an",
    "ang",
    "ao",
    "ei",
    "en",
    "eng",
    "i",
    "ian",
    "iao",
    "ie",
    "in",
    "ing",
    "o",
    "ou",
    "u",
  ],
  m: [
    "a",
    "ai",
    "an",
    "ang",
    "ao",
    "e",
    "ei",
    "en",
    "eng",
    "i",
    "ian",
    "iao",
    "ie",
    "in",
    "ing",
    "iu",
    "o",
    "ou",
    "u",
  ],
  f: ["a", "an", "ang", "ei", "en", "eng", "o", "ou", "u"],

  d: [
    "a",
    "ai",
    "an",
    "ang",
    "ao",
    "e",
    "ei",
    "eng",
    "i",
    "ia",
    "ian",
    "iang",
    "iao",
    "ie",
    "ing",
    "iu",
    "ong",
    "ou",
    "u",
    "uan",
    "ui",
    "un",
    "uo",
  ],
  t: [
    "a",
    "ai",
    "an",
    "ang",
    "ao",
    "e",
    "eng",
    "i",
    "ian",
    "iao",
    "ie",
    "ing",
    "ong",
    "ou",
    "u",
    "uan",
    "ui",
    "un",
    "uo",
  ],
  n: [
    "a",
    "ai",
    "an",
    "ang",
    "ao",
    "e",
    "ei",
    "eng",
    "i",
    "ia",
    "ian",
    "iang",
    "iao",
    "ie",
    "in",
    "ing",
    "iu",
    "ong",
    "ou",
    "u",
    "uan",
    "ui",
    "un",
    "uo",
    "ü",
    "üe",
  ],
  l: [
    "a",
    "ai",
    "an",
    "ang",
    "ao",
    "e",
    "ei",
    "eng",
    "i",
    "ia",
    "ian",
    "iang",
    "iao",
    "ie",
    "in",
    "ing",
    "iu",
    "ong",
    "ou",
    "u",
    "uan",
    "ui",
    "un",
    "uo",
    "ü",
    "üe",
  ],

  g: [
    "a",
    "ai",
    "an",
    "ang",
    "ao",
    "e",
    "ei",
    "en",
    "eng",
    "ong",
    "ou",
    "u",
    "ua",
    "uai",
    "uan",
    "uang",
    "ui",
    "un",
    "uo",
  ],
  k: [
    "a",
    "ai",
    "an",
    "ang",
    "ao",
    "e",
    "ei",
    "en",
    "eng",
    "ong",
    "ou",
    "u",
    "ua",
    "uai",
    "uan",
    "uang",
    "ui",
    "un",
    "uo",
  ],
  h: [
    "a",
    "ai",
    "an",
    "ang",
    "ao",
    "e",
    "ei",
    "en",
    "eng",
    "ong",
    "ou",
    "u",
    "ua",
    "uai",
    "uan",
    "uang",
    "ui",
    "un",
    "uo",
  ],

  j: ["i", "ia", "ian", "iang", "iao", "ie", "in", "ing", "iong", "iu", "ü", "üe", "uan"],
  q: ["i", "ia", "ian", "iang", "iao", "ie", "in", "ing", "iong", "iu", "ü", "üe", "uan"],
  x: ["i", "ia", "ian", "iang", "iao", "ie", "in", "ing", "iong", "iu", "ü", "üe", "uan"],

  zh: [
    "a",
    "ai",
    "an",
    "ang",
    "ao",
    "e",
    "ei",
    "en",
    "eng",
    "i",
    "ong",
    "ou",
    "u",
    "ua",
    "uai",
    "uan",
    "uang",
    "ui",
    "un",
    "uo",
  ],
  ch: [
    "a",
    "ai",
    "an",
    "ang",
    "ao",
    "e",
    "ei",
    "en",
    "eng",
    "i",
    "ong",
    "ou",
    "u",
    "ua",
    "uai",
    "uan",
    "uang",
    "ui",
    "un",
    "uo",
  ],
  sh: [
    "a",
    "ai",
    "an",
    "ang",
    "ao",
    "e",
    "ei",
    "en",
    "eng",
    "i",
    "ou",
    "u",
    "ua",
    "uai",
    "uan",
    "uang",
    "ui",
    "un",
    "uo",
  ],
  r: ["an", "ang", "ao", "e", "en", "eng", "i", "ong", "ou", "u", "uan", "ui", "un", "uo"],

  z: [
    "a",
    "ai",
    "an",
    "ang",
    "ao",
    "e",
    "ei",
    "en",
    "eng",
    "i",
    "ong",
    "ou",
    "u",
    "uan",
    "ui",
    "un",
    "uo",
  ],
  c: [
    "a",
    "ai",
    "an",
    "ang",
    "ao",
    "e",
    "ei",
    "en",
    "eng",
    "i",
    "ong",
    "ou",
    "u",
    "uan",
    "ui",
    "un",
    "uo",
  ],
  s: [
    "a",
    "ai",
    "an",
    "ang",
    "ao",
    "e",
    "ei",
    "en",
    "eng",
    "i",
    "ong",
    "ou",
    "u",
    "uan",
    "ui",
    "un",
    "uo",
  ],
};

// Zero-initial syllables (finals that can stand alone with y-/w- prefixing)
const ZERO_INITIAL_FINALS: string[] = [
  "a",
  "ai",
  "an",
  "ang",
  "ao",
  "e",
  "ei",
  "en",
  "eng",
  "er",
  "o",
  "ou",
  "ya",
  "yan",
  "yang",
  "yao",
  "ye",
  "yi",
  "yin",
  "ying",
  "yo",
  "yong",
  "you",
  "wa",
  "wai",
  "wan",
  "wang",
  "wei",
  "wen",
  "wo",
  "wu",
  "yu",
  "yue",
  "yuan",
  "yun",
];

// Map from colloquial spelling (y-/w- prefixed) to canonical final
const COLLOQUIAL_TO_CANONICAL: Record<string, string> = {
  ya: "ia",
  yan: "ian",
  yang: "iang",
  yao: "iao",
  ye: "ie",
  yi: "i",
  yin: "in",
  ying: "ing",
  yo: "io",
  yong: "iong",
  you: "iu",
  wa: "ua",
  wai: "uai",
  wan: "uan",
  wang: "uang",
  wei: "ui",
  wen: "un",
  wo: "uo",
  wu: "u",
  yu: "ü",
  yue: "üe",
  yuan: "üan",
  yun: "ün",
};

// ── Types ──

interface PinyinSyllableEntry {
  initial: string | null;
  final: string | null;
  tone: number;
  syllable: string;
  syllablePretty: string;
}

// ── Main ──

function main(): void {
  logger.info("=== Phase 1: Generate Pinyin Syllables ===");

  const entries: PinyinSyllableEntry[] = [];
  const seen = new Set<string>();

  // 1. Generate initial × final combinations
  for (const [initial, finals] of Object.entries(VALID_FINALS_BY_INITIAL)) {
    for (const fin of finals) {
      for (let tone = 1; tone <= 5; tone++) {
        const baseSyllable = initial + fin;
        const toned = applyTone(baseSyllable, tone);
        const syllablePretty = normalizeUmlaut(toned, initial);
        const syllable = baseSyllable + tone;

        const compositeKey = `${initial}_${fin}_${tone}`;
        if (seen.has(compositeKey)) continue;
        seen.add(compositeKey);

        entries.push({
          initial,
          final: fin,
          tone,
          syllable,
          syllablePretty,
        });
      }
    }
  }

  // 2. Generate zero-initial syllables
  for (const colloquial of ZERO_INITIAL_FINALS) {
    const canonical = COLLOQUIAL_TO_CANONICAL[colloquial] || colloquial;

    for (let tone = 1; tone <= 5; tone++) {
      const syllablePretty = applyTone(colloquial, tone);
      const syllable = colloquial + tone;
      const compositeKey = `__${canonical}_${tone}`;

      if (seen.has(compositeKey)) continue;
      seen.add(compositeKey);

      entries.push({
        initial: null,
        final: canonical,
        tone,
        syllable,
        syllablePretty,
      });
    }
  }

  logger.info(`Generated ${entries.length} pinyin syllables`);

  // Ensure output directory
  ensureDir(OUTPUT_DIR);

  // Write output
  writeJsonAtomic(OUTPUT_PATH, entries);
  logger.info(`Wrote ${entries.length} entries to ${OUTPUT_PATH}`);

  logger.info("Done.");
}

main();
