/**
 * @file packages/shared-utils/src/sandhi/toneSandhiUtils.ts
 * Sandhi-related shared utilities for the Mandarin Learning App.
 * Handles tone sandhi rules including 3-3 sandhi, bù sandhi, and yī sandhi.
 */

import { toneMarkToPlain } from "../pinyin/pinyinNormalization.js";

/**
 * Determine whether a selected tone is acceptable given the correct tone
 * and an optional sandhi rule.
 *
 * In Mandarin tone sandhi:
 * - 3-3 sandhi: When two 3rd-tone syllables appear consecutively,
 *   the first syllable is pronounced as 2nd tone. Accepting tone 2
 *   when the correct answer is tone 3 (with sandhiRule="3-3") allows
 *   this natural pronunciation shift.
 * - bu-before-4th: "bù" (tone 4) before a 4th-tone syllable becomes "bú" (tone 2).
 * - yi-before-4th: "yī" (tone 1) before a 4th-tone syllable becomes "yí" (tone 2).
 * - yi-before-non4th: "yī" (tone 1) before a 1st/2nd/3rd-tone syllable becomes "yì" (tone 4).
 *
 * @param correctTone - The lexically correct tone (0-4)
 * @param selectedTone - The tone the user selected (0-4)
 * @param isSandhiQuestion - Whether the question involves a sandhi pattern
 * @param sandhiRule - The sandhi rule identifier (e.g., "3-3", "bu-before-4th")
 * @returns true if the selected tone is acceptable under sandhi rules
 */
export function isSandhiAcceptable(
  correctTone: number,
  selectedTone: number,
  isSandhiQuestion?: boolean,
  sandhiRule?: string,
): boolean {
  // Exact match is always acceptable, regardless of sandhi rules
  if (correctTone === selectedTone) return true;

  if (!isSandhiQuestion || !sandhiRule) return false;

  switch (sandhiRule) {
    case "3-3":
      // In 3-3 sandhi, the first 3 becomes 2
      return correctTone === 3 && selectedTone === 2;
    case "bu-before-4th":
      // "bù" (tone 4) before 4th tone → "bú" (tone 2)
      return correctTone === 4 && selectedTone === 2;
    case "yi-before-4th":
      // "yī" (tone 1) before 4th tone → "yí" (tone 2)
      return correctTone === 1 && selectedTone === 2;
    case "yi-before-non4th":
      // "yī" (tone 1) before 1st/2nd/3rd → "yì" (tone 4)
      return correctTone === 1 && selectedTone === 4;
    default:
      return false;
  }
}

/**
 * Standard Mandarin tone-mark placement (a o e i u ü).
 *
 * The mark is placed:
 * 1. On "a" if present.
 * 2. Otherwise on "o" or "e" (whichever occurs first).
 * 3. Otherwise on the LAST vowel, except for the diphthongs "iu" and "ui"
 *    where the mark goes on the SECOND vowel (liú, huì).
 * 4. "ü" always takes its own mark when it is the target (nǚ, lǜ).
 */
export function findToneVowel(pinyin: string): { vowel: string; index: number } | null {
  const lower = pinyin.toLowerCase();

  // 1. "a" always takes the mark (biān, tiān, guān)
  const aIndex = lower.indexOf("a");
  if (aIndex !== -1) return { vowel: "a", index: aIndex };

  // 2. Otherwise "o" or "e" (guǒ, xuē, shuō, wèi)
  const oIndex = lower.indexOf("o");
  const eIndex = lower.indexOf("e");
  if (oIndex !== -1 && (eIndex === -1 || oIndex < eIndex)) {
    return { vowel: "o", index: oIndex };
  }
  if (eIndex !== -1) return { vowel: "e", index: eIndex };

  // 3. Otherwise only i/u/ü remain — for "iu"/"ui" the mark goes on the
  //    second vowel (liú, huì, qiū); otherwise on the last vowel (nǐ, shì, lǚ).
  const vowels = lower.match(/[iuü]/g);
  if (!vowels || vowels.length === 0) return null;

  if (vowels.length >= 2) {
    const second = vowels[1];
    return { vowel: second, index: lower.lastIndexOf(second) };
  }

  const only = vowels[0];
  return { vowel: only, index: lower.indexOf(only) };
}

/**
 * Strip tone marks from a pinyin syllable, returning plain ASCII/ü.
 * Handles already-marked input so tone operations are idempotent.
 *
 * Marks-ONLY: the input must not carry a trailing tone digit — `applyToneMark`
 * re-marks from this marks-only result. For the marks+digits variant used in
 * comparison/TTS/display, use `stripToneAndDigits` (pinyinNormalization).
 *
 * @param pinyin - Pinyin possibly carrying tone marks (e.g., "bù", "yī")
 * @returns Plain pinyin (e.g., "bu", "yi")
 */
export function stripToneMarks(pinyin: string): string {
  // Delegate to the canonical tone-mark → plain map in pinyinNormalization.
  let plain = "";
  for (const ch of pinyin) {
    plain += toneMarkToPlain[ch] ?? ch;
  }
  return plain;
}

/**
 * Tone-mark letters for each plain vowel, indexed by tone (1-4).
 */
const TONE_MARKS: Record<string, [string, string, string, string]> = {
  a: ["ā", "á", "ǎ", "à"],
  o: ["ō", "ó", "ǒ", "ò"],
  e: ["ē", "é", "ě", "è"],
  i: ["ī", "í", "ǐ", "ì"],
  u: ["ū", "ú", "ǔ", "ù"],
  ü: ["ǖ", "ǘ", "ǚ", "ǜ"],
};

/**
 * Apply tone mark to a pinyin syllable based on the tone number.
 *
 * A pre-existing tone mark (e.g., "bù", "yī") is stripped first so the new
 * mark is applied on the plain vowel — this keeps sandhi forms distinct from
 * dictionary forms even when the source reading is already tone-marked.
 *
 * @param pinyin - Plain pinyin without tone marks (e.g., "ni") or pre-marked ("nǐ")
 * @param tone - Tone number (1-4, where 0 or 5 = neutral/no mark)
 * @returns Pinyin with tone mark applied (e.g., "nǐ")
 */
export function applyToneMark(pinyin: string, tone: number): string {
  const plain = stripToneMarks(pinyin);
  if (tone === 0 || tone === 5) return plain;

  const target = findToneVowel(plain);
  if (!target) return plain;

  const mark = TONE_MARKS[target.vowel]?.[tone - 1];
  if (!mark) return plain;

  return plain.slice(0, target.index) + mark + plain.slice(target.index + 1);
}
