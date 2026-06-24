/**
 * @file apps/frontend/src/features/progress/services/progressService.ts
 * @description API service for progress tracking (extracted from quiz, Story 17.2)
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

export const progressApi = {
  async getAllProgress(): Promise<WordProgress[]> {
    try {
      const response = await apiClient.get<WordProgress[]>(ROUTE_PATTERNS.progress);
      return response.data;
    } catch (error) {
      // Failed to GET all word progress records from backend
      console.error("[progressApi] Failed to fetch all progress:", error);
      throw new Error("Failed to load your progress. Please try again.");
    }
  },

  async getWordProgress(wordId: string): Promise<WordProgress | null> {
    try {
      const response = await apiClient.get<WordProgress>(ROUTE_PATTERNS.progressWord(wordId));
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as AxiosError;
      if (axiosError?.response?.status === 404 || (error as { status?: number })?.status === 404) {
        return null;
      }
      // Failed to GET progress for a single word (404 already handled above)
      console.error(`[progressApi] Failed to fetch progress for ${wordId}:`, error);
      throw new Error("Failed to load word progress. Please try again.");
    }
  },

  async updateWordProgress(wordId: string, data: UpdateProgressRequest): Promise<WordProgress> {
    try {
      const response = await apiClient.put<WordProgress>(ROUTE_PATTERNS.progressWord(wordId), data);
      return response.data;
    } catch (error) {
      // Failed to PUT progress update for a specific word
      console.error(`[progressApi] Failed to update progress for ${wordId}:`, error);
      throw new Error("Failed to save your progress. Please try again.");
    }
  },

  async batchUpdateProgress(updates: BatchUpdateRequest): Promise<WordProgress[]> {
    try {
      const response = await apiClient.post<{ updated: number; results: WordProgress[] }>(
        ROUTE_PATTERNS.progressBatch,
        updates,
      );
      return response.data.results;
    } catch (error) {
      // Failed to POST batch progress update (multiple words at once)
      console.error("[progressApi] Failed to batch update progress:", error);
      throw new Error("Failed to save your progress. Please try again.");
    }
  },

  async deleteProgress(wordId: string): Promise<void> {
    try {
      await apiClient.delete(ROUTE_PATTERNS.progressWord(wordId));
    } catch (error) {
      // Failed to DELETE progress record for a specific word
      console.error(`[progressApi] Failed to delete progress for ${wordId}:`, error);
      throw new Error("Failed to reset word progress. Please try again.");
    }
  },

  async getProgressStats(): Promise<ProgressStatsResponse> {
    try {
      const response = await apiClient.get<ProgressStatsResponse>(ROUTE_PATTERNS.progressStats);
      return response.data;
    } catch (error) {
      // Failed to GET aggregate progress statistics
      console.error("[progressApi] Failed to fetch progress stats:", error);
      throw new Error("Failed to load progress statistics. Please try again.");
    }
  },

  async recordEvent(event: {
    type: string;
    feature: string;
    data: Record<string, unknown>;
  }): Promise<void> {
    await apiClient.post("/api/progress/event", event);
  },
};
