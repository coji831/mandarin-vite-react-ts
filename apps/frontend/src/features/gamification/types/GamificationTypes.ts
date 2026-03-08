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
