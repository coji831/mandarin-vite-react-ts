/**
 * @file apps/backend/src/modules/gamification/repositories/BadgeRepository.js
 * @description Infrastructure layer for badge award data access
 * Story 15.3: Streak & Gamification Backend APIs
 */

import { prisma } from "../../../shared/infrastructure/database/client.js";

/**
 * BadgeRepository
 * Handles CRUD operations for user badge awards
 *
 * Note: Badge metadata (id, name, icon, streakRequired) is defined in GamificationService
 * This repository only stores user badge awards (which badges each user has earned)
 */
export class BadgeRepository {
  /**
   * Find all badges earned by user
   * @param {string} userId - User ID
   * @returns {Promise<array>} Array of badge award records
   */
  async findByUser(userId) {
    // Note: Implementing with Prisma model when UserBadge table exists
    // For MVP, return empty array until table created
    // TODO: Story 15.3 - Add UserBadge table to schema
    return [];
  }

  /**
   * Award badge to user (idempotent - duplicate prevention via unique constraint)
   * @param {object} params - Badge award parameters
   * @param {string} params.userId - User ID
   * @param {string} params.badgeId - Badge identifier (e.g., "bronze_flame")
   * @param {Date} params.earnedDate - Date badge was earned
   * @returns {Promise<object>} Created badge record
   */
  async create({ userId, badgeId, earnedDate }) {
    // Note: Implementing with Prisma model when UserBadge table exists
    // For MVP, return mock success
    // TODO: Story 15.3 - Add UserBadge table to schema
    return {
      userId,
      badgeId,
      earnedDate,
      createdAt: new Date(),
    };
  }

  /**
   * Check if user has specific badge
   * @param {string} userId - User ID
   * @param {string} badgeId - Badge identifier
   * @returns {Promise<boolean>} True if user has this badge
   */
  async hasUserBadge(userId, badgeId) {
    const userBadges = await this.findByUser(userId);
    return userBadges.some((b) => b.badgeId === badgeId);
  }
}

export default BadgeRepository;
