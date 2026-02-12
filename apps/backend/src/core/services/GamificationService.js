/**
 * @file GamificationService.js
 * @description Core business logic for badges, XP, and mystery box rewards
 * Story 15.3: Streak & Gamification Backend APIs
 */

import { BadgeRepository } from "../../infrastructure/repositories/BadgeRepository.js";
import { StreakRepository } from "../../infrastructure/repositories/StreakRepository.js";

/**
 * Badge milestone definitions
 * Awards based on longestStreak (not currentStreak) to prevent badge loss on streak reset
 */
const BADGE_MILESTONES = [
  { id: "bronze_flame", name: "Bronze Flame", streakRequired: 7, icon: "🔥", tier: "bronze" },
  { id: "silver_flame", name: "Silver Flame", streakRequired: 30, icon: "🔥", tier: "silver" },
  { id: "gold_flame", name: "Gold Flame", streakRequired: 100, icon: "🔥", tier: "gold" },
  { id: "diamond_flame", name: "Diamond Flame", streakRequired: 365, icon: "💎", tier: "diamond" },
];

/**
 * Mystery box reward pool
 * Dropped at 5% rate on streak milestones (7-day multiples)
 */
const MYSTERY_BOX_REWARDS = [
  { type: "xp", amount: 50, name: "Bonus XP", icon: "⭐" },
  { type: "freeze", amount: 1, name: "Streak Freeze", icon: "❄️" },
  { type: "badge", id: "golden_flame_rare", name: "Golden Flame (Rare)", icon: "✨" },
];

/**
 * GamificationService
 * Manages badge awards, XP calculation, and mystery box drops
 */
export class GamificationService {
  constructor(badgeRepository = null, streakRepository = null) {
    this.badgeRepository = badgeRepository || new BadgeRepository();
    this.streakRepository = streakRepository || new StreakRepository();
  }

  /**
   * Get user's earned and available badges with progress
   * @param {string} userId - User ID
   * @returns {Promise<object>} { earned: [], available: [] }
   */
  async getBadges(userId) {
    const streak = await this.streakRepository.findByUser(userId);
    const userBadges = await this.badgeRepository.findByUser(userId);
    const earnedBadgeIds = userBadges.map((b) => b.badgeId);

    // Earned badges (with earned date)
    const earned = BADGE_MILESTONES.filter((badge) => earnedBadgeIds.includes(badge.id)).map(
      (badge) => ({
        ...badge,
        earnedDate: userBadges.find((ub) => ub.badgeId === badge.id).earnedDate,
      }),
    );

    // Available badges (not earned yet, with progress)
    const longestStreak = streak?.longestStreak || 0;
    const available = BADGE_MILESTONES.filter((badge) => !earnedBadgeIds.includes(badge.id)).map(
      (badge) => ({
        ...badge,
        progress: longestStreak,
        required: badge.streakRequired,
        percentComplete: Math.min(100, Math.round((longestStreak / badge.streakRequired) * 100)),
      }),
    );

    return { earned, available };
  }

  /**
   * Check and award badges for achieved milestones
   * @param {string} userId - User ID
   * @param {number} longestStreak - User's longest streak value
   * @returns {Promise<array>} Array of newly awarded badges
   */
  async checkAndAwardBadges(userId, longestStreak) {
    const userBadges = await this.badgeRepository.findByUser(userId);
    const earnedBadgeIds = userBadges.map((b) => b.badgeId);

    // Find badges user qualifies for but hasn't earned yet
    const newBadges = BADGE_MILESTONES.filter(
      (badge) => badge.streakRequired <= longestStreak && !earnedBadgeIds.includes(badge.id),
    );

    // Award each new badge
    for (const badge of newBadges) {
      await this.badgeRepository.create({
        userId,
        badgeId: badge.id,
        earnedDate: new Date(),
      });
    }

    return newBadges; // Return newly awarded badges for notification
  }

  /**
   * Calculate XP earned for quiz answer
   * Formula: base 10 (correct only) + 5 bonus (streak >= 7 days)
   *
   * @param {boolean} correct - Whether answer was correct
   * @param {number} currentStreak - User's current streak value
   * @returns {number} XP earned
   */
  calculateXP(correct, currentStreak) {
    if (!correct) {
      return 0; // No XP for incorrect answers
    }

    const baseXP = 10;
    const streakBonus = currentStreak >= 7 ? 5 : 0;

    return baseXP + streakBonus;
  }

  /**
   * Check if mystery box should drop (5% chance on 7-day milestone)
   * Mystery boxes only drop on streak milestones: 7,  14, 21, 28, ...
   *
   * @param {number} currentStreak - User's current streak value
   * @returns {object|null} Reward object or null if no drop
   */
  checkMysteryBoxDrop(currentStreak) {
    // Only check on 7-day milestones
    if (currentStreak % 7 !== 0) {
      return null;
    }

    // 5% drop rate
    const roll = Math.random();
    if (roll < 0.05) {
      // Random reward from pool
      const reward = MYSTERY_BOX_REWARDS[Math.floor(Math.random() * MYSTERY_BOX_REWARDS.length)];
      return {
        ...reward,
        droppedAt: new Date(),
        milestone: currentStreak,
      };
    }

    return null; // No drop this time
  }

  /**
   * Get badge milestone definitions (for reference)
   * @returns {array} Badge milestone definitions
   */
  getBadgeMilestones() {
    return BADGE_MILESTONES;
  }
}

export default GamificationService;
