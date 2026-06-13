/**
 * Gamification API service
 * Story 15.9: Gamification & AI Integration
 *
 * API functions for streak tracking, badge management, and freeze spending.
 * Extracted from useGamificationAPI.ts for clean service-layer architecture.
 */

import { apiClient } from "shared/api";
import { ROUTE_PATTERNS } from "@mandarin/shared-constants";

// ============================================================================
// Types
// ============================================================================

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

// ============================================================================
// API Functions
// ============================================================================

export async function fetchStreak(): Promise<StreakResponse> {
  const response = await apiClient.get(ROUTE_PATTERNS.progressStreak);
  return response.data;
}

export async function fetchBadges(): Promise<BadgeResponse> {
  const response = await apiClient.get(ROUTE_PATTERNS.gamificationBadges);
  return response.data;
}

export async function spendFreeze(): Promise<FreezeResponse> {
  const response = await apiClient.post(ROUTE_PATTERNS.progressStreakFreeze);
  return response.data;
}
