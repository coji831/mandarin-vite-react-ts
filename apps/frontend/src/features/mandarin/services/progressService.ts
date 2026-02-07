/**
 * @file apps/frontend/src/features/mandarin/services/progressService.ts
 * @description API service for progress tracking
 *
 * Story 14.4: Migrated to apiClient with full TypeScript type safety
 * Uses Axios with automatic token refresh and retry logic
 *
 * @see docs/issue-implementation/epic-14-api-modernization/story-14-4-progress-service-migration.md
 */

import { apiClient } from "../../../services/axiosClient";
import type {
  WordProgress,
  ProgressApiResponse,
  SingleProgressApiResponse,
  UpdateProgressRequest,
  BatchUpdateRequest,
  BatchUpdateApiResponse,
  ProgressStatsResponse,
} from "@mandarin/shared-types";

/**
 * Progress API service using Axios with typed responses
 * Replaces authFetch with automatic token refresh and retry logic
 */
export const progressApi = {
  /**
   * Get all progress for current user
   * @returns Array of WordProgress items
   * @throws Error with user-friendly message on failure
   */
  async getAllProgress(): Promise<WordProgress[]> {
    try {
      const response = await apiClient.get<ProgressApiResponse>("/api/v1/progress");
      return response.data.data;
    } catch (error) {
      console.error("[progressApi] Failed to fetch all progress:", error);
      throw new Error("Failed to load your progress. Please try again.");
    }
  },

  /**
   * Get progress for specific word
   * @param wordId - The ID of the word
   * @returns WordProgress item or null if not found
   * @throws Error with user-friendly message on failure (except 404)
   */
  async getWordProgress(wordId: string): Promise<WordProgress | null> {
    try {
      const response = await apiClient.get<SingleProgressApiResponse>(`/api/v1/progress/${wordId}`);
      return response.data.data;
    } catch (error: any) {
      // 404 means no progress exists yet (valid case)
      if (error.response?.status === 404) {
        return null;
      }
      console.error(`[progressApi] Failed to fetch progress for ${wordId}:`, error);
      throw new Error("Failed to load word progress. Please try again.");
    }
  },

  /**
   * Update progress for specific word
   * @param wordId - The ID of the word
   * @param data - Partial progress data to update
   * @returns Updated WordProgress item
   * @throws Error with user-friendly message on failure
   */
  async updateWordProgress(wordId: string, data: UpdateProgressRequest): Promise<WordProgress> {
    try {
      const response = await apiClient.put<SingleProgressApiResponse>(
        `/api/v1/progress/${wordId}`,
        data,
      );
      return response.data.data;
    } catch (error) {
      console.error(`[progressApi] Failed to update progress for ${wordId}:`, error);
      throw new Error("Failed to save your progress. Please try again.");
    }
  },

  /**
   * Batch update progress for multiple words
   * @param updates - Array of word IDs and their update data
   * @returns Array of updated WordProgress items
   * @throws Error with user-friendly message on failure
   */
  async batchUpdateProgress(updates: BatchUpdateRequest): Promise<WordProgress[]> {
    try {
      const response = await apiClient.post<BatchUpdateApiResponse>(
        "/api/v1/progress/batch",
        updates,
      );
      return response.data.data.results;
    } catch (error) {
      console.error("[progressApi] Failed to batch update progress:", error);
      throw new Error("Failed to save your progress. Please try again.");
    }
  },

  /**
   * Delete progress for specific word (reset to untouched)
   * @param wordId - The ID of the word
   * @throws Error with user-friendly message on failure
   */
  async deleteProgress(wordId: string): Promise<void> {
    try {
      await apiClient.delete(`/api/v1/progress/${wordId}`);
    } catch (error) {
      console.error(`[progressApi] Failed to delete progress for ${wordId}:`, error);
      throw new Error("Failed to reset word progress. Please try again.");
    }
  },

  /**
   * Get progress statistics for authenticated user
   * @returns Progress statistics summary
   * @throws Error with user-friendly message on failure
   */
  async getProgressStats(): Promise<ProgressStatsResponse> {
    try {
      const response = await apiClient.get<{ success: boolean; data: ProgressStatsResponse }>(
        "/api/v1/progress/stats",
      );
      return response.data.data;
    } catch (error) {
      console.error("[progressApi] Failed to fetch progress stats:", error);
      throw new Error("Failed to load progress statistics. Please try again.");
    }
  },
};
