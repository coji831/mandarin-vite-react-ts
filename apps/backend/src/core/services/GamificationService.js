/**
 * @file GamificationService.js
 * @description Core business logic for badges, XP, and mystery box rewards
 * Story 15.3: Streak & Gamification Backend APIs
 */

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
   * Formula: base XP (correctCount * 10) + streak bonus (correctCount * 5 if streak >= 7)
   *
   * @param {number} correctCount - Number of correct answers in session
   * @param {number} currentStreak - User's current streak value
   * @returns {number} Total XP earned
   */
  calculateXP(correctCount, currentStreak) {
    const baseXP = correctCount * 10;
    const streakBonus = currentStreak >= 7 ? correctCount * 5 : 0;
    return baseXP + streakBonus;
  }

  /**
   * Check if mystery box should drop based on accuracy-based rates
   * Drop rates: <50%=3%, 50-79%=5%, 80-94%=8%, 95-100%=10%
   * Rolls on EVERY quiz completion (not milestone-based)
   *
   * @param {number} accuracyRate - Quiz accuracy (0-100)
   * @returns {object|null} Reward object or null if no drop
   */
  checkMysteryBoxDrop(accuracyRate) {
    // Get drop rate based on accuracy
    let dropRate;
    if (accuracyRate >= 95) {
      dropRate = 0.1; // 95-100%: 10% chance
    } else if (accuracyRate >= 80) {
      dropRate = 0.08; // 80-94%: 8% chance
    } else if (accuracyRate >= 50) {
      dropRate = 0.05; // 50-79%: 5% chance
    } else {
      dropRate = 0.03; // <50%: 3% chance
    }

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
   * Get badge milestone definitions (for reference)
   * @returns {array} Badge milestone definitions
   */
  getBadgeMilestones() {
    return BADGE_MILESTONES;
  }
}

export default GamificationService;
