/**
 * reviewService.ts
 * Phase 1 Review — API calls for fetching items and recording ratings.
 */
import { apiClient } from "../../../shared/api/axiosClient";
import { ROUTE_PATTERNS } from "@mandarin/shared-constants";
import type { ReviewItem, Rating, RatingResult } from "../types";

class ReviewService {
  /**
   * Fetch review items from the specified source and type.
   */
  async fetchItems(source: string, type: string, limit: number = 20): Promise<ReviewItem[]> {
    const response = await apiClient.get(ROUTE_PATTERNS.reviewItems, {
      params: { source, type, limit },
    });
    return response.data;
  }

  /**
   * Record a rating for a review item.
   */
  async recordRating(itemType: string, itemId: string, rating: Rating): Promise<RatingResult> {
    const response = await apiClient.post(ROUTE_PATTERNS.reviewResult, {
      itemType,
      itemId,
      rating,
    });
    return response.data;
  }

  /**
   * Get count of due items for a given type.
   */
  async getDueCount(type: string): Promise<{ count: number }> {
    const response = await apiClient.get(ROUTE_PATTERNS.reviewDueCount, {
      params: { type },
    });
    return response.data;
  }
}

export const reviewService = new ReviewService();
