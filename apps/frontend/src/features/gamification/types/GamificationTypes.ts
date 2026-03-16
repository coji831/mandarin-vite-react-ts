/**
 * Type definitions for gamification features (Streak, Badges, XP)
 * Story 15.7: Gamification & AI Feedback Display UI
 * Story 15.11 Flow 2.6: Badge type used by BadgeCelebrationModal
 */

export type StreakData = {
  currentStreak: number;
  longestStreak: number;
  freezeCount: number;
  lastActivityDate: Date;
};

export type Badge = {
  id: string;
  name: string;
  description?: string; // Optional: not always provided by backend
  icon: string;
  streakRequired?: number;
  earnedDate?: Date;
  progress?: number;
  percentComplete?: number;
};

export type XPData = {
  currentXP: number;
};

/**
 * Mystery box reward (5% drop chance on streak milestones)
 * Story 15.9: Gamification rewards - mystery box system
 * Aligned with backend API: POST /api/v1/gamification/mystery-box/:id/open
 */
export type MysteryBox = {
  id?: string; // Mystery box ID
  rewardType: "xp_boost" | "freeze" | "cosmetic"; // Backend enum values
  rewardValue: number | string; // Numeric for XP/freeze, string for cosmetic ID
  opened?: boolean; // True if already opened
  // UI display fields (frontend-only)
  name?: string;
  icon?: string;
};
