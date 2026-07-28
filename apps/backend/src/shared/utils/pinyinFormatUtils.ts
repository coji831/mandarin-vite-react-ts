/**
 * @file apps/backend/src/shared/utils/pinyinFormatUtils.ts
 * @description Pinyin tone-number to tone-mark conversion utilities.
 *
 * Converts "hao3" → "hǎo", "ai4 hao4" → "ài hào".
 * Handles CC-CEDICT u: → ü format (nu:3 → nǚ).
 * Neutral tone (5) → unmarked.
 *
 * Tone mark placement rules:
 * - 'a' or 'e' always gets the mark
 * - 'ou' → mark on the 'o'
 * - Otherwise → mark on the second vowel
 */

const TONE_MARKS: Record<string, [string, string, string, string]> = {
  a: ["ā", "á", "ǎ", "à"],
  e: ["ē", "é", "ě", "è"],
  i: ["ī", "í", "ǐ", "ì"],
  o: ["ō", "ó", "ǒ", "ò"],
  u: ["ū", "ú", "ǔ", "ù"],
  ü: ["ǖ", "ǘ", "ǚ", "ǜ"],
};

/**
 * Convert a single pinyin syllable with tone number to tone marks.
 *
 * @param numbered - A single pinyin syllable, e.g. "ma1", "nu:3", "hao3"
 * @returns The syllable with tone marks, e.g. "mā", "nǚ", "hǎo"
 */
export function numberedToToneMark(numbered: string): string {
  if (!numbered) return "";

  // Normalize u: → ü (CC-CEDICT format)
  let normalized = numbered.replace(/u:/g, "ü").replace(/U:/g, "Ü");

  // Extract tone number from the end
  const toneMatch = normalized.match(/^([a-zA-ZüÜ]+)([1-5])$/);
  if (!toneMatch) return normalized; // No tone number found

  const base = toneMatch[1].toLowerCase();
  const tone = parseInt(toneMatch[2], 10);

  // Neutral tone (5) → unmarked
  if (tone === 5) return base;

  const toneIdx = tone - 1;

  // Determine which vowel gets the tone mark
  let markIndex = -1;

  // Rule 1: 'a' or 'e' always gets the mark
  const aPos = base.indexOf("a");
  if (aPos >= 0) {
    markIndex = aPos;
  } else {
    const ePos = base.indexOf("e");
    if (ePos >= 0) {
      markIndex = ePos;
    } else {
      // Rule 2: 'ou' → mark on 'o'
      const ouPos = base.indexOf("ou");
      if (ouPos >= 0) {
        markIndex = ouPos; // mark on 'o'
      } else {
        // Rule 3: Otherwise, mark on the second vowel
        const vowels = ["i", "o", "u", "ü"];
        let lastVowelPos = -1;
        for (const v of vowels) {
          const pos = base.lastIndexOf(v);
          if (pos >= 0) {
            lastVowelPos = pos;
            break;
          }
        }
        if (lastVowelPos >= 0) {
          markIndex = lastVowelPos;
        }
      }
    }
  }

  if (markIndex < 0) return base;

  const char = base[markIndex];
  const marks = TONE_MARKS[char as keyof typeof TONE_MARKS];
  if (!marks) return base;

  const result = base.split("");
  result[markIndex] = marks[toneIdx];

  // Preserve original casing
  const original = toneMatch[1];
  if (original[markIndex] === original[markIndex].toUpperCase()) {
    result[markIndex] = result[markIndex].toUpperCase();
  }

  return result.join("");
}

/**
 * Convert a full multi-syllable pinyin string from tone numbers to tone marks.
 *
 * @param numbered - Pinyin with tone numbers, e.g. "hao3 bu4 hao3"
 * @returns Pinyin with tone marks, e.g. "hǎo bù hǎo"
 */
export function pinyinStringToToneMarks(numbered: string): string {
  return numbered
    .split(/\s+/)
    .map((s) => numberedToToneMark(s))
    .join(" ");
}
