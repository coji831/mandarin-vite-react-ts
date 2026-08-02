/**
 * @file packages/shared-utils/src/pinyin/pinyinNormalization.ts
 * Pinyin/tone normalization helpers shared across the app.
 *
 * G2 fix: neutral tone (轻声) can be represented as `0` (frontend neutral
 * button) or `5` (lexical data / PinyinSyllable). Grading must treat both
 * as equivalent, so `normalizeTone(0) === normalizeTone(5) === 0`.
 *
 * G9 fix: `correctPinyin` may be digit-suffixed (e.g. "xiang4" — tone marks
 * are stripped but trailing digits are not), while learners type digitless
 * pinyin ("xiang") per the UI label. Grading must accept both.
 */

/** Tone marks (with diacritics) → the plain vowel they decorate. */
const TONE_MARK_MAP: Record<string, string> = {
  ā: "a",
  á: "a",
  ǎ: "a",
  à: "a",
  ē: "e",
  é: "e",
  ě: "e",
  è: "e",
  ī: "i",
  í: "i",
  ǐ: "i",
  ì: "i",
  ō: "o",
  ó: "o",
  ǒ: "o",
  ò: "o",
  ū: "u",
  ú: "u",
  ǔ: "u",
  ù: "u",
  ǖ: "ü",
  ǘ: "ü",
  ǚ: "ü",
  ǜ: "ü",
};

/**
 * Normalize a tone number to its canonical representation.
 * Neutral tone (轻声) is canonically `0`; lexical data may encode it as `5`,
 * so 5 is mapped to 0. Tones 1-4 pass through unchanged.
 *
 * @param tone - Tone number (0-5)
 * @returns Canonical tone (0 for neutral, otherwise 1-4)
 */
export function normalizeTone(tone: number): number {
  if (tone === 5) return 0;
  return tone;
}

/**
 * Whether two tone numbers are equivalent for grading.
 * Neutral tone sent as `0` matches a stored `correctTone` of `5` (and vice
 * versa), so `0` and `5` are equivalent.
 *
 * @param a - Selected/user tone
 * @param b - Correct/expected tone
 * @returns true when both represent the same tone (incl. neutral 0 ≡ 5)
 */
export function areTonesEquivalent(a: number, b: number): boolean {
  return normalizeTone(a) === normalizeTone(b);
}

/**
 * Normalize a pinyin string for comparison so that "xiang", "xiang4" and
 * "xiàng" all compare equal (case-, whitespace-, diacritic- and trailing
 * digit-insensitive). Useful when grading pinyin input where the label says
 * "without tone" but the expected answer may carry a trailing tone digit.
 *
 * @param pinyin - Raw pinyin input or expected value
 * @returns Normalized lowercase pinyin without tone marks or trailing digits
 */
export function normalizePinyinForComparison(pinyin: string): string {
  const lower = (pinyin ?? "").trim().toLowerCase().normalize("NFKC");

  let plain = "";
  for (const ch of lower) {
    plain += TONE_MARK_MAP[ch] ?? ch;
  }

  // Strip a trailing tone digit (e.g. "xiang4" → "xiang", "ma5" → "ma")
  return plain.replace(/[0-5]$/, "").trim();
}
