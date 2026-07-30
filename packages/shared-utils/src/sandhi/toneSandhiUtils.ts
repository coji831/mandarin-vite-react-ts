/**
 * @file packages/shared-utils/src/sandhi/toneSandhiUtils.ts
 * Sandhi-related shared utilities for the Mandarin Learning App.
 * Handles tone sandhi rules including 3-3 sandhi, bù sandhi, and yī sandhi.
 */

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
 * Apply tone mark to a plain pinyin syllable based on the tone number.
 *
 * @param pinyin - Plain pinyin without tone marks (e.g., "ni")
 * @param tone - Tone number (1-4, where 0 or 5 = neutral/no mark)
 * @returns Pinyin with tone mark applied (e.g., "nǐ")
 */
export function applyToneMark(pinyin: string, tone: number): string {
  if (tone === 0 || tone === 5) return pinyin;

  const toneMarks: Record<string, [string, string, string, string]> = {
    a: ["ā", "á", "ǎ", "à"],
    o: ["ō", "ó", "ǒ", "ò"],
    e: ["ē", "é", "ě", "è"],
    i: ["ī", "í", "ǐ", "ì"],
    u: ["ū", "ú", "ǔ", "ù"],
    ü: ["ǖ", "ǘ", "ǚ", "ǜ"],
  };

  // Find the vowel to place the tone mark on.
  // Priority: a, e, o, then the last vowel (i, u, ü)
  const vowelPriority = ["a", "e", "o", "i", "u", "ü"];
  const lower = pinyin.toLowerCase();
  let targetVowel = "";
  let targetIndex = -1;

  for (const v of vowelPriority) {
    const idx = lower.indexOf(v);
    if (idx !== -1) {
      // For i/u combinations, prefer the second vowel
      if ((v === "i" || v === "u") && lower.includes("a")) continue;
      if ((v === "i" || v === "u") && lower.includes("e")) continue;
      targetVowel = v;
      targetIndex = idx;
      break;
    }
  }

  // Fallback: use last vowel found
  if (targetIndex === -1) {
    const vowels = lower.match(/[aeiouü]/g);
    if (vowels && vowels.length > 0) {
      targetVowel = vowels[vowels.length - 1];
      targetIndex = lower.lastIndexOf(targetVowel);
    } else {
      return pinyin;
    }
  }

  const mark = toneMarks[targetVowel]?.[tone - 1];
  if (!mark) return pinyin;

  return pinyin.slice(0, targetIndex) + mark + pinyin.slice(targetIndex + 1);
}
