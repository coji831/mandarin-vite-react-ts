/**
 * @file packages/shared-utils/src/sandhi/toneSandhiUtils.ts
 * Sandhi-related shared utilities for the Mandarin Learning App.
 * Handles tone sandhi rules including 3-3 sandhi and neutral tone.
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
 *
 * @param correctTone - The lexically correct tone (0-4)
 * @param selectedTone - The tone the user selected (0-4)
 * @param isSandhiQuestion - Whether the question involves a sandhi pattern
 * @param sandhiRule - The sandhi rule identifier (e.g., "3-3")
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
    default:
      return false;
  }
}
