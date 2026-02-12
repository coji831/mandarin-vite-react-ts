/**
 * @file StreakRepository.js
 * @description Infrastructure layer for StudyStreak data access
 * Story 15.3: Streak & Gamification Backend APIs
 */

import { prisma } from "../database/client.js";

/**
 * StreakRepository
 * Handles CRUD operations for study streak tracking with atomic updates
 */
export class StreakRepository {
  /**
   * Find streak record by user ID
   * @param {string} userId - User ID
   * @returns {Promise<object|null>} Streak record or null if not found
   */
  async findByUser(userId) {
    return await prisma.studyStreak.findUnique({
      where: { userId },
    });
  }

  /**
   * Create or update streak record (atomic upsert to prevent race conditions)
   * @param {string} userId - User ID
   * @param {object} data - Streak data to upsert
   * @returns {Promise<object>} Created or updated streak record
   */
  async upsert(userId, data) {
    return await prisma.studyStreak.upsert({
      where: { userId },
      update: data,
      create: {
        userId,
        ...data,
      },
    });
  }

  /**
   * Update existing streak record (partial update)
   * @param {string} userId - User ID
   * @param {object} data - Partial streak data to update
   * @returns {Promise<object>} Updated streak record
   */
  async update(userId, data) {
    return await prisma.studyStreak.update({
      where: { userId },
      data,
    });
  }

  /**
   * Increment current streak atomically (prevents race conditions)
   * @param {string} userId - User ID
   * @param {Date} lastActivityDate - New last activity date
   * @returns {Promise<object>} Updated streak record
   */
  async incrementStreak(userId, lastActivityDate) {
    return await prisma.studyStreak.update({
      where: { userId },
      data: {
        currentStreak: { increment: 1 },
        lastActivityDate,
      },
    });
  }

  /**
   * Update longest streak if current streak exceeds it
   * @param {string} userId - User ID
   * @param {number} currentStreak - Current streak value
   * @returns {Promise<object>} Updated streak record
   */
  async updateLongestIfNeeded(userId, currentStreak) {
    const existing = await this.findByUser(userId);
    if (!existing || currentStreak > existing.longestStreak) {
      return await prisma.studyStreak.update({
        where: { userId },
        data: { longestStreak: currentStreak },
      });
    }
    return existing;
  }
}

export default StreakRepository;
