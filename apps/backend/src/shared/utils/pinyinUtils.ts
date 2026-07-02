/**
 * @file apps/backend/src/shared/utils/pinyinUtils.js
 * @description Utility functions for parsing accented pinyin.
 * Extracts plain (tone-free) pinyin and tone numbers from Unicode accented forms.
 */

/**
 * Parse accented pinyin into plain text and tone number.
 *
 * @param {string} accented - Pinyin with tone marks (e.g., "mā", "lǜ", "ài hào")
 * @returns {{ plain: string, tone: number }} Plain pinyin (lowercase) and last tone number found
 *
 * @example
 * parsePinyin("mā")   // → { plain: "ma", tone: 1 }
 * parsePinyin("lǜ")   // → { plain: "lv", tone: 4 }
 * parsePinyin("ài hào") // → { plain: "ai hao", tone: 4 }
 * parsePinyin("ba")   // → { plain: "ba", tone: 0 }
 */
function parsePinyin(accented: string): { plain: string; tone: number } {
  const toneMarks: Record<string, [string, number]> = {
    ā: ["a", 1],
    á: ["a", 2],
    ǎ: ["a", 3],
    à: ["a", 4],
    ē: ["e", 1],
    é: ["e", 2],
    ě: ["e", 3],
    è: ["e", 4],
    ī: ["i", 1],
    í: ["i", 2],
    ǐ: ["i", 3],
    ì: ["i", 4],
    ō: ["o", 1],
    ó: ["o", 2],
    ǒ: ["o", 3],
    ò: ["o", 4],
    ū: ["u", 1],
    ú: ["u", 2],
    ǔ: ["u", 3],
    ù: ["u", 4],
    ǖ: ["v", 1],
    ǘ: ["v", 2],
    ǚ: ["v", 3],
    ǜ: ["v", 4],
    ü: ["v", 0],
    Ā: ["A", 1],
    Á: ["A", 2],
    Ǎ: ["A", 3],
    À: ["A", 4],
    Ē: ["E", 1],
    É: ["E", 2],
    Ě: ["E", 3],
    È: ["E", 4],
    Ī: ["I", 1],
    Í: ["I", 2],
    Ǐ: ["I", 3],
    Ì: ["I", 4],
    Ō: ["O", 1],
    Ó: ["O", 2],
    Ǒ: ["O", 3],
    Ò: ["O", 4],
    Ū: ["U", 1],
    Ú: ["U", 2],
    Ǔ: ["U", 3],
    Ù: ["U", 4],
  };

  let plain = "";
  let tone = 0;

  for (const char of accented) {
    const mark = toneMarks[char];
    if (mark) {
      plain += mark[0];
      tone = mark[1]; // last tone mark wins
    } else {
      plain += char;
    }
  }

  return { plain: plain.toLowerCase(), tone };
}

export { parsePinyin };
