/**
 * Pinyin Tone Conversion Utilities
 *
 * Converts numeric tone notation to Unicode tone marks and vice versa.
 * Used by PinyinToneInput component for quiz pinyin input.
 *
 * Examples:
 * - convertToneMarks("ma3") → "mǎ"
 * - convertToneMarks("ni3hao3") → "nǐhǎo"
 * - removeToneMarks("nǐhǎo") → "nihao"
 */

import { toneMap, toneMapKeys } from "../../../shared/constants/toneMap";

/**
 * Converts pinyin with numeric tone notation to Unicode tone marks
 *
 * @param input - Pinyin string with numbers (e.g., "ma3", "ban1")
 * @returns Pinyin with tone marks (e.g., "mǎ", "bān")
 *
 * @example
 * convertToneMarks("ma3") // "mǎ"
 * convertToneMarks("ni3hao3") // "nǐhǎo"
 * convertToneMarks("liu2") // "liú"
 */
export function convertToneMarks(input: string): string {
  if (!input) return "";

  let result = input.toLowerCase();

  // Use pre-sorted keys to match longer patterns before shorter ones
  // This ensures "ang1" matches before "an1" or "a1"
  toneMapKeys.forEach((key) => {
    const regex = new RegExp(key, "g");
    result = result.replace(regex, toneMap[key]);
  });

  // Remove remaining numbers (neutral tone - no mark needed)
  return result.replace(/[0-9]/g, "");
}

/**
 * Removes tone marks from pinyin, returning base letters
 * Useful for pinyin-to-character lookup where tone may be ignored
 *
 * @param pinyin - Pinyin string with tone marks (e.g., "mǎ", "nǐhǎo")
 * @returns Pinyin without tone marks (e.g., "ma", "nihao")
 *
 * @example
 * removeToneMarks("mǎ") // "ma"
 * removeToneMarks("nǐhǎo") // "nihao"
 */
export function removeToneMarks(pinyin: string): string {
  if (!pinyin) return "";

  // Map of tone-marked vowels to base vowels
  const toneMarkMap: Record<string, string> = {
    // a tones
    ā: "a",
    á: "a",
    ǎ: "a",
    à: "a",
    // e tones
    ē: "e",
    é: "e",
    ě: "e",
    è: "e",
    // i tones
    ī: "i",
    í: "i",
    ǐ: "i",
    ì: "i",
    // o tones
    ō: "o",
    ó: "o",
    ǒ: "o",
    ò: "o",
    // u tones
    ū: "u",
    ú: "u",
    ǔ: "u",
    ù: "u",
    // ü tones
    ǖ: "ü",
    ǘ: "ü",
    ǚ: "ü",
    ǜ: "ü",
  };

  let result = pinyin.toLowerCase();

  // Replace each tone-marked vowel with base vowel
  Object.entries(toneMarkMap).forEach(([marked, base]) => {
    result = result.replace(new RegExp(marked, "g"), base);
  });

  return result;
}
