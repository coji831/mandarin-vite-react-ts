/**
 * HSK word and character counts per level.
 * Based on HSK 3.0 (2021) standard.
 *
 * Source: Official HSK 3.0 vocabulary guidelines
 * Band 1 (Elementary): 500 words, 300 characters
 * Band 2 (Intermediate): 1272 words, 600 characters
 * Band 3 (Intermediate-Advanced): 2245 words, 900 characters
 * Band 4 (Advanced): 3245 words, 1200 characters
 * Band 5 (Advanced-Plus): 4316 words, 1500 characters
 * Band 6 (Proficient): 5456 words, 1800 characters
 */

export const HSK_WORD_COUNTS = Object.freeze({
  1: 500,
  2: 1272,
  3: 2245,
  4: 3245,
  5: 4316,
  6: 5456,
});

export const HSK_CHAR_COUNTS = Object.freeze({
  1: 300,
  2: 600,
  3: 900,
  4: 1200,
  5: 1500,
  6: 1800,
});

/**
 * Get the cumulative word count up to a given HSK level.
 * e.g., cumulative up to HSK 2 = 500 + 1272 = 1772
 */
export function getCumulativeWordCount(hskLevel) {
  let total = 0;
  for (let i = 1; i <= hskLevel; i++) {
    total += HSK_WORD_COUNTS[i] || 0;
  }
  return total;
}

/**
 * Get the cumulative character count up to a given HSK level.
 */
export function getCumulativeCharCount(hskLevel) {
  let total = 0;
  for (let i = 1; i <= hskLevel; i++) {
    total += HSK_CHAR_COUNTS[i] || 0;
  }
  return total;
}
