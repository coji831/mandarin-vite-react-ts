/**
 * @file GamificationService.js
 * @description Core business logic for badges, XP, and mystery box rewards
 * Story 15.3: Streak & Gamification Backend APIs
 */

import { calculateXP as calcXP, getMysteryBoxDropRate } from "../domain/constants/BusinessRules.js";

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
  { rewardType: "xp_boost", rewardValue: 50, name: "Bonus XP", icon: "⭐" },
  { rewardType: "freeze", rewardValue: 1, name: "Streak Freeze", icon: "❄️" },
  {
    rewardType: "cosmetic",
    rewardValue: "golden_flame_rare",
    name: "Golden Flame (Rare)",
    icon: "✨",
  },
];

/**
 * GamificationService
 * Manages badge awards, XP calculation, and mystery box drops
 *
 * SOLID: Dependency Inversion Principle - depends on abstractions (interfaces)
 * All dependencies must be injected via constructor (no default instantiation)
 */
export class GamificationService {
  constructor(badgeRepository, streakRepository) {
    if (!badgeRepository || !streakRepository) {
      throw new Error("GamificationService requires badgeRepository and streakRepository");
    }
    this.badgeRepository = badgeRepository;
    this.streakRepository = streakRepository;
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
   * Calculate XP earned for quiz session
   * Delegates to BusinessRules.calculateXP for single source of truth
   *
   * @param {number} correctCount - Number of correct answers in session
   * @param {number} currentStreak - User's current streak value
   * @returns {number} Total XP earned
   */
  calculateXP(correctCount, currentStreak) {
    return calcXP(correctCount, currentStreak);
  }

  /**
   * Check if mystery box should drop based on accuracy-based rates
   * Delegates to BusinessRules.getMysteryBoxDropRate for single source of truth
   *
   * @param {number} accuracyRate - Quiz accuracy (0-100)
   * @returns {object|null} Reward object or null if no drop
   */
  checkMysteryBoxDrop(accuracyRate) {
    const dropRate = getMysteryBoxDropRate(accuracyRate);

    // Roll for drop
    const roll = Math.random();
    if (roll < dropRate) {
      // Random reward from pool
      const reward = MYSTERY_BOX_REWARDS[Math.floor(Math.random() * MYSTERY_BOX_REWARDS.length)];
      return {
        ...reward,
        droppedAt: new Date(),
        accuracyRate,
      };
    }

    return null; // No drop this time
  }

  /**
   * Get badge objects by their IDs (for reconstructing newBadges in session summary)
   * @param {string[]} badgeIds - Array of badge IDs
   * @returns {array} Badge objects matching the given IDs
   */
  getBadgesByIds(badgeIds) {
    return BADGE_MILESTONES.filter((badge) => badgeIds.includes(badge.id));
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
