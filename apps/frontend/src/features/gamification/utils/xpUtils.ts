/**
 * XP (Experience Points) utility functions
 * Story 15.7: Gamification & AI Feedback Display UI
 */

/**
 * Calculate the user's level based on total XP
 * Formula: Level = floor(totalXP / 100)
 * @param totalXP - Total experience points earned
 * @returns Current level (0-based)
 */
export function calculateLevel(totalXP: number): number {
  return Math.floor(totalXP / 100);
}

/**
 * Calculate XP progress within the current level
 * Formula: XP within level = totalXP % 100
 * @param totalXP - Total experience points earned
 * @returns XP earned in current level (0-99)
 */
export function getXPWithinLevel(totalXP: number): number {
  return totalXP % 100;
}
