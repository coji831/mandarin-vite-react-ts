/**
 * @file utils/pinyinUtils.ts
 * @description Pinyin utility functions: tone color mapping, combination lookup, tone helpers
 * Story 18.2: Pinyin System Guide
 */

import type { PinyinCombination, PinyinData } from "../types";

/**
 * Tone color scheme:
 * 1st tone (flat)   → #FF4444 (red)
 * 2nd tone (rising) → #FF8C00 (orange)
 * 3rd tone (dip)    → #4CAF50 (green)
 * 4th tone (falling) → #2196F3 (blue)
 * Neutral (no tone) → #9E9E9E (gray)
 */
export const TONE_COLORS: Record<number, string> = {
  1: "#FF4444",
  2: "#FF8C00",
  3: "#4CAF50",
  4: "#2196F3",
  0: "#9E9E9E",
};

/**
 * Find a valid combination for the given initial + final pair.
 * Returns null if no valid combination exists.
 */
export function getCombination(
  initial: string,
  final: string,
  data: PinyinData,
): PinyinCombination | null {
  return data.combinations.find((c) => c.initial === initial && c.final === final) ?? null;
}

/**
 * Extract the tone number from a pinyin syllable with tone marks.
 * Returns 0-4 where 0 = neutral, 1 = first tone, etc.
 */
export function extractToneNumber(pinyin: string): number {
  const toneMap: Record<string, number> = {
    ā: 1,
    á: 2,
    ǎ: 3,
    à: 4,
    ō: 1,
    ó: 2,
    ǒ: 3,
    ò: 4,
    ē: 1,
    é: 2,
    ě: 3,
    è: 4,
    ī: 1,
    í: 2,
    ǐ: 3,
    ì: 4,
    ū: 1,
    ú: 2,
    ǔ: 3,
    ù: 4,
    ǖ: 1,
    ǘ: 2,
    ǚ: 3,
    ǜ: 4,
  };

  for (const char of pinyin) {
    if (toneMap[char] !== undefined) {
      return toneMap[char];
    }
  }
  return 0; // neutral
}

/**
 * Remove tone marks from a pinyin syllable, returning plain ASCII pinyin.
 */
export function stripToneMarks(pinyin: string): string {
  const stripMap: Record<string, string> = {
    ā: "a",
    á: "a",
    ǎ: "a",
    à: "a",
    ō: "o",
    ó: "o",
    ǒ: "o",
    ò: "o",
    ē: "e",
    é: "e",
    ě: "e",
    è: "e",
    ī: "i",
    í: "i",
    ǐ: "i",
    ì: "i",
    ū: "u",
    ú: "u",
    ǔ: "u",
    ù: "u",
    ǖ: "ü",
    ǘ: "ü",
    ǚ: "ü",
    ǜ: "ü",
  };

  return pinyin
    .split("")
    .map((char) => stripMap[char] ?? char)
    .join("");
}

/**
 * Determine which vowel in a pinyin syllable carries the tone mark.
 * Returns the index and the vowel character.
 * Used for applying tone color to the correct character.
 */
export function getToneVowelIndex(pinyin: string): number {
  const toneMarks = new Set([
    "ā",
    "á",
    "ǎ",
    "à",
    "ō",
    "ó",
    "ǒ",
    "ò",
    "ē",
    "é",
    "ě",
    "è",
    "ī",
    "í",
    "ǐ",
    "ì",
    "ū",
    "ú",
    "ǔ",
    "ù",
    "ǖ",
    "ǘ",
    "ǚ",
    "ǜ",
  ]);
  const vowelPriority = ["a", "e", "o", "i", "u", "ü"];

  // First check if there's already a tone mark
  for (let i = 0; i < pinyin.length; i++) {
    if (toneMarks.has(pinyin[i])) {
      return i;
    }
  }

  // Find the vowel that carries the tone
  // If there are multiple vowels, a and e take priority, then o, then rest
  for (const v of vowelPriority) {
    const idx = pinyin.indexOf(v);
    if (idx !== -1) return idx;
  }

  return 0; // fallback
}
