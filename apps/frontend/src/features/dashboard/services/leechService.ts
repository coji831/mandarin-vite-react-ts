/**
 * @file apps/frontend/src/features/dashboard/services/leechService.ts
 * @description API service for leech (struggling words) functionality
 *
 * Story 15.11 Phase 7: Created service layer for clean architecture
 * Provides abstraction for fetching struggling vocabulary words.
 * Enables backend mocking for UI/UX development via service layer.
 *
 * @see docs/issue-implementation/epic-15-learning-retention/story-15-11-spaced-repetition-refactoring.md
 */

import { ROUTE_PATTERNS } from "@mandarin/shared-constants";
import { apiClient } from "services";

// ============================================================================
// Types
// ============================================================================

/**
 * Struggling word with progress data
 * Matches backend GET /api/v1/learning/leeches response
 */
export type LeechWord = {
  id: string;
  simplified: string;
  traditional?: string;
  pinyin: string;
  english: string;
  lapseCount: number;
  studyCount: number;
  correctCount?: number;
};

/**
 * Response from GET /api/v1/learning/leeches
 */
export type LeechResponse = {
  count: number;
  leeches: LeechWord[];
};

/**
 * Parameters for fetching leeches
 */
export type GetLeechesParams = {
  minLapseCount?: number; // Default: 5
  limit?: number; // Default: 20
};

// ============================================================================
// Leech API Service
// ============================================================================

/**
 * Leech API service using Axios with typed responses
 * Provides clean abstraction for struggling words operations
 */
export const leechApi = {
  /**
   * Fetch user's struggling vocabulary (leeches)
   * GET /api/v1/learning/leeches
   *
   * @param params Query parameters (minLapseCount, limit)
   * @returns LeechResponse with count and leeches array
   * @throws Error with user-friendly message on failure
   */
  async getLeeches(params: GetLeechesParams = {}): Promise<LeechResponse> {
    try {
      const response = await apiClient.get<LeechResponse>(ROUTE_PATTERNS.learningLeeches, {
        params: {
          minLapseCount: params.minLapseCount ?? 5,
          limit: params.limit ?? 20,
        },
      });

      // Validate response shape
      if (!response.data || !Array.isArray(response.data.leeches)) {
        throw new Error("Invalid response format from server");
      }

      return response.data;
    } catch (error) {
      console.error("[leechApi] Failed to fetch leeches:", error);
      // Re-throw Error instances to preserve specific messages
      // Only wrap network/unknown errors with generic message
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to load struggling words. Please try again.");
    }
  },
};
