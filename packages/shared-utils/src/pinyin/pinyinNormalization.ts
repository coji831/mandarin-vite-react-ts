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
 * Public alias of the internal `TONE_MARK_MAP`, so consumers (e.g. the
 * backend) can reuse the canonical tone-mark → plain-vowel mapping instead
 * of re-implementing it.
 */
export const toneMarkToPlain: Readonly<Record<string, string>> = TONE_MARK_MAP;

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
 * Strip tone marks AND a trailing tone digit from a pinyin string, returning
 * plain lowercase ASCII/ü. Marks are removed wherever they appear; only a
 * single trailing tone digit (0-5) is stripped.
 *
 * This is the comparison/TTS/display variant. For marks-ONLY stripping use
 * `stripToneMarks` (toneSandhiUtils), which is safe to re-mark from.
 *
 * Multi-syllable input ("nǐ hǎo") is processed whole-string: every tone mark
 * is removed, matching `normalizePinyinForComparison` semantics. A trailing
 * digit is only stripped from the very end of the whole string.
 *
 * @param pinyin - Raw pinyin input (e.g., "bā", "ba1", "ma5", "nǐ hǎo")
 * @returns Lowercase plain pinyin without tone marks or trailing digit
 */
export function stripToneAndDigits(pinyin: string): string {
  const lower = (pinyin ?? "").trim().toLowerCase().normalize("NFKC");

  let plain = "";
  for (const ch of lower) {
    plain += TONE_MARK_MAP[ch] ?? ch;
  }

  // Strip a trailing tone digit (e.g. "xiang4" → "xiang", "ma5" → "ma")
  return plain.replace(/[0-5]$/, "").trim();
}

/** Tone-marked vowel → the tone number (1-4) it encodes. */
const TONE_MARK_TO_NUMBER: Record<string, number> = {
  ā: 1,
  á: 2,
  ǎ: 3,
  à: 4,
  ē: 1,
  é: 2,
  ě: 3,
  è: 4,
  ī: 1,
  í: 2,
  ǐ: 3,
  ì: 4,
  ō: 1,
  ó: 2,
  ǒ: 3,
  ò: 4,
  ū: 1,
  ú: 2,
  ǔ: 3,
  ù: 4,
  ǖ: 1,
  ǘ: 2,
  ǚ: 3,
  ǜ: 4,
};

/**
 * Extract the tone number from a pinyin string in EITHER representation:
 * - Marked pinyin: "mà" → 4 (incl. ü-marked vowels "lǜ" → 4, "lǚ" → 3)
 * - Digit-suffixed: "ma1" → 1; neutral "ma5" / "ma0" → 0
 * - Plain (no mark, no digit): "ma" → 0
 *
 * @param pinyin - Pinyin input or expected value
 * @returns Tone number 0-4 (0 = neutral / no tone)
 */
export function extractToneNumber(pinyin: string): number {
  const normalized = (pinyin ?? "").trim().toLowerCase().normalize("NFKC");
  if (normalized === "") return 0;

  // Digit-suffixed form takes precedence ("ma1" → 1; 5 and 0 → neutral 0).
  const digitMatch = normalized.match(/[0-5]$/);
  if (digitMatch) return normalizeTone(Number(digitMatch[0]));

  // Marked form: return the tone of the first tone-marked vowel.
  for (const ch of normalized) {
    const tone = TONE_MARK_TO_NUMBER[ch];
    if (tone) return tone;
  }

  return 0;
}

/**
 * Whether a string contains any CJK Unified Ideograph (Hanzi) glyph.
 * Uses the CJK Unified Ideographs block range; not exhaustive for all CJK
 * extension blocks, but sufficient for app-level Hanzi detection.
 *
 * @param text - Arbitrary text (pinyin, Hanzi, mixed, empty)
 * @returns true if the string contains at least one Hanzi character
 */
export function isHanziText(text: string): boolean {
  return /[\u3400-\u9FFF]/.test(text ?? "");
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
  return stripToneAndDigits(pinyin);
}
