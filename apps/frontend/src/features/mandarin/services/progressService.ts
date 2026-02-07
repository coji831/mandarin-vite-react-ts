/**
 * @file apps/frontend/src/features/mandarin/services/progressService.ts
 * @description API service for progress tracking
 *
 * Story 14.4: Migrated to apiClient with full TypeScript type safety
 * Uses Axios with automatic token refresh and retry logic
 *
 * @see docs/issue-implementation/epic-14-api-modernization/story-14-4-progress-service-migration.md
 */

import { ROUTE_PATTERNS } from "@mandarin/shared-constants";
import type {
  BatchUpdateRequest,
  ProgressStatsResponse,
  UpdateProgressRequest,
  WordProgress,
} from "@mandarin/shared-types";
import type { AxiosError } from "axios";
import { apiClient } from "services";

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
      // Backend returns array directly, not wrapped in { success, data }
      const response = await apiClient.get<WordProgress[]>(ROUTE_PATTERNS.progress);
      return response.data;
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
      // Backend returns object directly, not wrapped
      const response = await apiClient.get<WordProgress>(ROUTE_PATTERNS.progressWord(wordId));
      return response.data;
    } catch (error: unknown) {
      // 404 means no progress exists yet (valid case)
      const axiosError = error as AxiosError;
      if (axiosError?.response?.status === 404 || (error as { status?: number })?.status === 404) {
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
      // Backend returns updated object directly
      const response = await apiClient.put<WordProgress>(ROUTE_PATTERNS.progressWord(wordId), data);
      return response.data;
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
      // Backend returns { updated, results } directly
      const response = await apiClient.post<{ updated: number; results: WordProgress[] }>(
        ROUTE_PATTERNS.progressBatch,
        updates,
      );
      return response.data.results;
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
      await apiClient.delete(ROUTE_PATTERNS.progressWord(wordId));
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
      // Backend returns stats object directly
      const response = await apiClient.get<ProgressStatsResponse>(ROUTE_PATTERNS.progressStats);
      return response.data;
    } catch (error) {
      console.error("[progressApi] Failed to fetch progress stats:", error);
      throw new Error("Failed to load progress statistics. Please try again.");
    }
  },
};
