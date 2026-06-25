/**
 * @file types/index.ts
 * @description Gamification type definitions barrel export
 */

export type { StreakData, Badge, XPData, MysteryBox } from "./GamificationTypes";

// ─── API Response Types ───

export type StreakResponse = {
  currentStreak: number;
  longestStreak: number;
  freezeCount: number;
  lastActivityDate: string;
};

export type BadgeItem = {
  id: string;
  name: string;
  streakRequired: number;
  icon: string;
  earnedDate?: string;
  progress?: number;
  percentComplete?: number;
};

export type BadgeResponse = {
  earned: BadgeItem[];
  available: BadgeItem[];
};

export type FreezeResponse = {
  success: boolean;
  freezeCount: number;
  message: string;
};
