/**
 * @file apps/frontend/src/features/mandarin/services/progressService.ts
 * @description API service for progress tracking (Story 13.4)
 *
 * Uses authFetch wrapper which handles API base URL + auth headers
 * Implements BaseService for consistency with other services
 */

import { API_ENDPOINTS } from "@mandarin/shared-constants";
import type {
  ProgressResponse,
  ProgressStatsResponse,
  UpdateProgressRequest,
  BatchUpdateRequest,
} from "@mandarin/shared-types";
import { authFetch } from "../../auth/utils/authFetch";
import { BaseService } from "./interfaces";

export class ProgressApiService extends BaseService<
  [string?],
  ProgressResponse | ProgressResponse[]
> {
  /**
   * Required by BaseService: fetch progress (all or by wordId)
   */
  async fetch(wordId?: string): Promise<ProgressResponse | ProgressResponse[]> {
    if (wordId) {
      return this.getWordProgress(wordId);
    }
    return this.getAllProgress();
  }
  /**
   * Fetch all progress for authenticated user
   */
  async getAllProgress(): Promise<ProgressResponse[]> {
    console.log(API_ENDPOINTS);

    const response = await authFetch(API_ENDPOINTS.PROGRESS, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch progress: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Fetch progress for specific word
   */
  async getWordProgress(wordId: string): Promise<ProgressResponse> {
    const endpoint =
      typeof API_ENDPOINTS.PROGRESS_WORD === "function"
        ? API_ENDPOINTS.PROGRESS_WORD(wordId)
        : `/api/v1/progress/${wordId}`;

    const response = await authFetch(endpoint, {
      method: "GET",
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Progress not found for this word");
      }
      throw new Error(`Failed to fetch word progress: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Update progress for specific word
   */
  async updateWordProgress(wordId: string, data: UpdateProgressRequest): Promise<ProgressResponse> {
    const endpoint =
      typeof API_ENDPOINTS.PROGRESS_WORD === "function"
        ? API_ENDPOINTS.PROGRESS_WORD(wordId)
        : `/api/v1/progress/${wordId}`;

    const response = await authFetch(endpoint, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to update word progress: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Batch update progress for multiple words
   */
  async batchUpdateProgress(updates: BatchUpdateRequest): Promise<ProgressResponse[]> {
    const response = await authFetch(API_ENDPOINTS.PROGRESS_BATCH, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error(`Failed to batch update progress: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Delete progress for specific word
   */
  async deleteProgress(wordId: string): Promise<void> {
    const endpoint =
      typeof API_ENDPOINTS.PROGRESS_WORD === "function"
        ? API_ENDPOINTS.PROGRESS_WORD(wordId)
        : `/api/v1/progress/${wordId}`;

    const response = await authFetch(endpoint, {
      method: "DELETE",
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Progress not found for this word");
      }
      throw new Error(`Failed to delete progress: ${response.status}`);
    }
  }

  /**
   * Get progress statistics for authenticated user
   */
  async getProgressStats(): Promise<ProgressStatsResponse> {
    const response = await authFetch(API_ENDPOINTS.PROGRESS_STATS, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch progress stats: ${response.status}`);
    }

    return response.json();
  }
}

// Singleton instance (authFetch handles base URL)
export const progressApi = new ProgressApiService();
