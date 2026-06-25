/**
 * Gamification API service
 * Story 15.9: Gamification & AI Integration
 *
 * API functions for streak tracking, badge management, and freeze spending.
 * Extracted from useGamificationAPI.ts for clean service-layer architecture.
 */

import { apiClient } from "shared/api";
import { ROUTE_PATTERNS } from "@mandarin/shared-constants";
import { BadgeResponse, FreezeResponse, StreakResponse } from "../types";

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
