/**
 * @file StreakService.js
 * @description Core business logic for study streak tracking and freeze management
 * Story 15.3: Streak & Gamification Backend APIs
 */

import { StreakRepository } from "../../infrastructure/repositories/StreakRepository.js";
import { QuizResultRepository } from "../../infrastructure/repositories/QuizResultRepository.js";

/**
 * StreakService
 * Manages study streaks with 48-hour grace period and freeze protection
 */
export class StreakService {
  constructor(streakRepository = null, quizResultRepository = null) {
    this.streakRepository = streakRepository || new StreakRepository();
    this.quizResultRepository = quizResultRepository || new QuizResultRepository();
  }

  /**
   * Get streak data for user
   * @param {string} userId - User ID
   * @returns {Promise<object>} Streak data or default values
   */
  async getStreak(userId) {
    const streak = await this.streakRepository.findByUser(userId);

    if (!streak) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: null,
        freezeCount: 0,
      };
    }

    return streak;
  }

  /**
   * Update streak after user activity (quiz completion)
   * Business rules:
   * - 48-hour grace period (not 24h - accommodates time zones/weekends)
   * - Auto-increment within grace period
   * - Auto-reset after grace period expires
   * - Track longest streak separately
   *
   * @param {string} userId - User ID
   * @returns {Promise<object>} Updated streak record
   */
  async updateStreak(userId) {
    const streak = await this.streakRepository.findByUser(userId);
    const now = new Date();

    if (!streak) {
      // First activity ever - initialize streak
      return await this.streakRepository.upsert(userId, {
        currentStreak: 1,
        longestStreak: 1,
        lastActivityDate: now,
        freezeCount: 0,
      });
    }

    const lastActivity = new Date(streak.lastActivityDate);
    const hoursSinceLastActivity = (now - lastActivity) / (1000 * 60 * 60);

    if (hoursSinceLastActivity <= 48) {
      // Within grace period: increment streak
      const newStreak = streak.currentStreak + 1;
      const newLongest = Math.max(newStreak, streak.longestStreak);

      return await this.streakRepository.upsert(userId, {
        currentStreak: newStreak,
        longestStreak: newLongest,
        lastActivityDate: now,
        freezeCount: streak.freezeCount, // Preserve freeze count
      });
    } else {
      // Grace period expired: reset streak to 1
      return await this.streakRepository.upsert(userId, {
        currentStreak: 1,
        longestStreak: streak.longestStreak, // Preserve longest
        lastActivityDate: now,
        freezeCount: streak.freezeCount, // Preserve freeze count
      });
    }
  }

  /**
   * Spend freeze to protect streak (extends grace period by 24h)
   * Business rules:
   * - Requires freezeCount >= 1
   * - Only spendable when streak at risk (>48h since last activity)
   * - Extends lastActivityDate by 24 hours
   * - Max 1 freeze spend per 7-day period (TODO: implement cooldown)
   *
   * @param {string} userId - User ID
   * @returns {Promise<object>} Updated streak record
   * @throws {Error} If no freezes available or streak not at risk
   */
  async spendFreeze(userId) {
    const streak = await this.streakRepository.findByUser(userId);

    if (!streak) {
      throw new Error("No streak record found");
    }

    if (streak.freezeCount < 1) {
      throw new Error("No freezes available");
    }

    const now = new Date();
    const lastActivity = new Date(streak.lastActivityDate);
    const hoursSinceLastActivity = (now - lastActivity) / (1000 * 60 * 60);

    if (hoursSinceLastActivity <= 48) {
      throw new Error("Streak not at risk (within 48h grace period)");
    }

    // Extend lastActivityDate by 24 hours
    const extendedDate = new Date(lastActivity);
    extendedDate.setHours(extendedDate.getHours() + 24);

    return await this.streakRepository.update(userId, {
      freezeCount: streak.freezeCount - 1,
      lastActivityDate: extendedDate,
    });
  }

  /**
   * Check if user earned freeze (10 consecutive perfect quizzes)
   * Business rules:
   * - Requires 10 consecutive correct quiz answers
   * - Resets counter if any quiz has incorrect answer
   * - Max 5 freezes stored per user (cap check)
   *
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} True if freeze was awarded
   */
  async checkAndAwardFreeze(userId) {
    // Fetch last 10 quiz results (ordered by answeredAt descending)
    const recentResults = await this.quizResultRepository.findRecent(userId, 10);

    if (recentResults.length < 10) {
      return false; // Not enough quizzes yet
    }

    // Check if all 10 are correct
    const allCorrect = recentResults.every((result) => result.correct === true);

    if (!allCorrect) {
      return false; // Mixed or all incorrect
    }

    // Award freeze if under cap (max 5)
    const streak = await this.streakRepository.findByUser(userId);

    if (!streak) {
      return false; // No streak record yet
    }

    if (streak.freezeCount >= 5) {
      return false; // At freeze cap
    }

    // Award freeze
    await this.streakRepository.update(userId, {
      freezeCount: streak.freezeCount + 1,
    });

    return true;
  }
}

export default StreakService;
