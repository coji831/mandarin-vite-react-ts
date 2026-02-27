/**
 * Quiz Answer Validation Utilities
 * Story 15.10: Quiz UX Polish
 *
 * Provides pinyin validation with space normalization to accept
 * multiple input formats (e.g., "ni hao" === "nǐhǎo")
 */

/**
 * Normalize pinyin by removing all whitespace and converting to lowercase
 * @param input - Raw pinyin string (may contain spaces, mixed case)
 * @returns Normalized lowercase string without whitespace
 *
 * @example
 * normalizePinyin("ni hao") // "nihao"
 * normalizePinyin("Nǐ Hǎo") // "nǐhǎo"
 * normalizePinyin("ma3 ma4") // "ma3ma4"
 */
export function normalizePinyin(input: string): string {
  return input.replace(/\s+/g, "").toLowerCase();
}

/**
 * Validate pinyin answer with space-insensitive comparison
 * @param userAnswer - User's input answer
 * @param correctAnswer - Expected correct answer
 * @returns True if answers match after normalization
 *
 * @example
 * validatePinyinAnswer("ni hao", "nǐhǎo") // true
 * validatePinyinAnswer("ma3 ma4", "mǎmà") // true
 * validatePinyinAnswer("ma3ma4", "mǎmà") // true
 */
export function validatePinyinAnswer(userAnswer: string, correctAnswer: string): boolean {
  return normalizePinyin(userAnswer) === normalizePinyin(correctAnswer);
}
