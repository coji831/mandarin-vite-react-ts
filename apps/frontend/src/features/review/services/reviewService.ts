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
   * Get review items generated from the pinyin-tones pool.
   */
  async getPoolReviewItems(limit: number = 20): Promise<ReviewItem[]> {
    const response = await apiClient.get(ROUTE_PATTERNS.reviewPoolItems, {
      params: { limit },
    });
    return response.data;
  }

  /**
   * Rate a review item to update its SRS schedule.
   */
  async rateReviewItem(itemId: string, rating: "again" | "good" | "easy"): Promise<ReviewItem> {
    const response = await apiClient.put(ROUTE_PATTERNS.reviewItemRate(itemId), { rating });
    return response.data;
  }
}

export const reviewService = new ReviewService();
