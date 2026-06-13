/**
 * @file apps/backend/src/shared/utils/dateUtils.js
 * @description Date utility functions extracted from BusinessRules.js
 * Clean architecture: utility functions that can be used across layers
 */

/**
 * Calculate end of day (23:59:59.999) for a given date
 * Used for daily quiz session expiration
 * @param {Date} date - The date to calculate end of day for (defaults to today)
 * @returns {Date} Date object set to 23:59:59.999 of the given day
 */
export function getEndOfDay(date = new Date()) {
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  return endOfDay;
}
