/**
 * Business Rules Constants
 *
 * Central location for all business rule magic numbers and thresholds.
 * These values define the core business logic of the learning system.
 *
 * @module modules/gamification/domain/BusinessRules
 */

/**
 * Leech detection threshold
 * A word becomes a "leech" when it has been answered incorrectly this many times or more
 */
export const LEECH_THRESHOLD = 5;

/**
 * XP points awarded per correct answer (base value)
 */
export const XP_PER_CORRECT_ANSWER = 10;

/**
 * Streak threshold for XP bonus eligibility
 * Users with streaks >= this value get bonus XP per correct answer
 */
export const STREAK_BONUS_THRESHOLD = 7; // days

/**
 * Bonus XP awarded per correct answer when streak >= STREAK_BONUS_THRESHOLD
 */
export const STREAK_BONUS_XP = 5;

/**
 * Mystery box drop rates based on quiz accuracy
 */
export const MYSTERY_BOX_RATES = {
  POOR: { threshold: 50, rate: 0.03 }, // <50%: 3% chance
  FAIR: { threshold: 80, rate: 0.05 }, // 50-79%: 5% chance
  GOOD: { threshold: 95, rate: 0.08 }, // 80-94%: 8% chance
  PERFECT: { threshold: 100, rate: 0.1 }, // 95-100%: 10% chance
};

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
 * Quiz session word count limits
 * Bounds and default for the ?limit= query parameter on session start
 */
export const QUIZ_WORDS_DEFAULT = 5;
export const QUIZ_WORDS_MIN = 1;
export const QUIZ_WORDS_MAX = 50;

/**
 * Spaced repetition (SRS) algorithm constants
 * Exponential backoff: correct → double interval (capped), incorrect → reset to 1 day
 */
export const SRS_MAX_INTERVAL_DAYS = 365;
export const SRS_LAPSE_RESET_DAYS = 1;

/**
 * Ratio of new (unseen) words injected into a quiz session via the 70/30 strategy
 * 30% new words, 70% scheduled reviews
 */
export const NEW_WORDS_RATIO = 0.3;

/**
 * Accuracy threshold (%) that qualifies as a perfect quiz
 * Used to gate streak-freeze awards
 */
export const PERFECT_ACCURACY = 100;

/**
 * Helper function to check if a lapse count indicates a leech word
 * @param {number} lapseCount - Number of incorrect attempts
 * @returns {boolean} True if word is a leech
 */
export function isLeech(lapseCount) {
  return lapseCount >= LEECH_THRESHOLD;
}

/**
 * Helper function to calculate XP for correct answers with streak bonus
 * Formula: base XP (correctCount * 10) + streak bonus (correctCount * 5 if streak >= 7)
 * @param {number} correctCount - Number of correct answers
 * @param {number} currentStreak - User's current streak value (default: 0)
 * @returns {number} Total XP earned
 */
export function calculateXP(correctCount, currentStreak = 0) {
  const baseXP = correctCount * XP_PER_CORRECT_ANSWER;
  const streakBonus = currentStreak >= STREAK_BONUS_THRESHOLD ? correctCount * STREAK_BONUS_XP : 0;
  return baseXP + streakBonus;
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
 * Helper function to determine mystery box drop rate based on accuracy
 * Tiered rates: <50%=3%, 50-79%=5%, 80-94%=8%, 95-100%=10%
 * @param {number} accuracyRate - Quiz accuracy (0-100)
 * @returns {number} Drop rate (0.0-1.0)
 */
export function getMysteryBoxDropRate(accuracyRate) {
  if (accuracyRate >= MYSTERY_BOX_RATES.PERFECT.threshold) {
    return MYSTERY_BOX_RATES.PERFECT.rate;
  } else if (accuracyRate >= MYSTERY_BOX_RATES.GOOD.threshold) {
    return MYSTERY_BOX_RATES.GOOD.rate;
  } else if (accuracyRate >= MYSTERY_BOX_RATES.FAIR.threshold) {
    return MYSTERY_BOX_RATES.FAIR.rate;
  } else {
    return MYSTERY_BOX_RATES.POOR.rate;
  }
}

/**
 * Helper function to get end of day (midnight) timestamp
 * Used for daily quiz session expiration
 * @param {Date} date - The date to calculate end of day for (defaults to today)
 * @returns {Date} Date object set to 23:59:59.999 of the given day
 *
 * @deprecated Import directly from utils/dateUtils.js instead
 */
export { getEndOfDay } from "../../../shared/utils/dateUtils.js";
