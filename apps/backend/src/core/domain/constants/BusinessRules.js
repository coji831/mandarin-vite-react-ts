/**
 * Business Rules Constants
 *
 * Central location for all business rule magic numbers and thresholds.
 * These values define the core business logic of the learning system.
 *
 * @module core/domain/constants/BusinessRules
 */

/**
 * Leech detection threshold
 * A word becomes a "leech" when it has been answered incorrectly this many times or more
 */
export const LEECH_THRESHOLD = 5;

/**
 * XP points awarded per correct answer
 */
export const XP_PER_CORRECT_ANSWER = 10;

/**
 * Session expiration time in milliseconds (1 hour)
 */
export const SESSION_EXPIRATION_MS = 60 * 60 * 1000;

/**
 * Quiz result storage expiration in days
 * Results older than this are considered stale and may be cleaned up
 */
export const RESULT_EXPIRATION_DAYS = 7;

/**
 * Percentage multiplier for accuracy calculations
 * Used to convert decimal accuracy (0.0-1.0) to percentage (0-100)
 */
export const PERCENTAGE_MULTIPLIER = 100;

/**
 * Streak grace period in hours
 * User can maintain streak if they study within this window after midnight
 */
export const STREAK_GRACE_PERIOD_HOURS = 48;

/**
 * Helper function to check if a lapse count indicates a leech word
 * @param {number} lapseCount - Number of incorrect attempts
 * @returns {boolean} True if word is a leech
 */
export function isLeech(lapseCount) {
  return lapseCount >= LEECH_THRESHOLD;
}

/**
 * Helper function to calculate XP for correct answers
 * @param {number} correctCount - Number of correct answers
 * @returns {number} Total XP earned
 */
export function calculateXP(correctCount) {
  return correctCount * XP_PER_CORRECT_ANSWER;
}

/**
 * Helper function to calculate accuracy percentage
 * @param {number} correctCount - Number of correct answers
 * @param {number} totalCount - Total number of questions
 * @returns {number} Accuracy percentage (0-100), or 0 if totalCount is 0
 */
export function calculateAccuracy(correctCount, totalCount) {
  if (totalCount === 0) return 0;
  return (correctCount / totalCount) * PERCENTAGE_MULTIPLIER;
}

/**
 * Helper function to get end of day (midnight) timestamp
 * Used for daily quiz session expiration
 * @param {Date} date - The date to calculate end of day for (defaults to today)
 * @returns {Date} Date object set to 23:59:59.999 of the given day
 */
export function getEndOfDay(date = new Date()) {
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  return endOfDay;
}
