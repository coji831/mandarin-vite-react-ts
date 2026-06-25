/**
 * @file apps/backend/src/modules/review/api/ReviewController.js
 * HTTP controller for review endpoints.
 */
import { createLogger } from "../../../shared/utils/logger.js";

const logger = createLogger("ReviewController");

export class ReviewController {
  constructor(reviewService) {
    this.reviewService = reviewService;
    this.getReviewItems = this.getReviewItems.bind(this);
    this.recordRating = this.recordRating.bind(this);
    this.getDueCount = this.getDueCount.bind(this);
    this.getPoolReviewItems = this.getPoolReviewItems.bind(this);
  }

  async getReviewItems(req, res) {
    try {
      const userId = req.userId;
      const { source, type, limit } = req.query;
      const items = await this.reviewService.getReviewItems(userId, {
        source: source || "due",
        type: type || "",
        limit: limit ? parseInt(limit, 10) : 20,
      });
      return res.status(200).json(items);
    } catch (error) {
      logger.error("Error fetching review items", error);
      return res.status(500).json({ error: "Failed to fetch review items" });
    }
  }

  async recordRating(req, res) {
    try {
      const userId = req.userId;
      const { itemType, itemId, rating } = req.body;
      const result = await this.reviewService.recordRating(userId, { itemType, itemId, rating });
      return res.status(200).json(result);
    } catch (error) {
      if (error.message?.startsWith("itemType") || error.message?.startsWith("rating must be")) {
        return res.status(400).json({ error: error.message });
      }
      logger.error("Error recording rating", error);
      return res.status(500).json({ error: "Failed to record rating" });
    }
  }

  async getDueCount(req, res) {
    try {
      const userId = req.userId;
      const { type } = req.query;
      const count = await this.reviewService.getDueCount(userId, type || "");
      return res.status(200).json({ count });
    } catch (error) {
      logger.error("Error fetching due count", error);
      return res.status(500).json({ error: "Failed to fetch due count" });
    }
  }

  async getPoolReviewItems(req, res) {
    try {
      const { limit = 10 } = req.query;
      const items = await this.reviewService.getPoolReviewItems(req.userId, parseInt(limit, 10));
      return res.json(items);
    } catch (err) {
      logger.error("Failed to get pool review items", err);
      return res.status(500).json({ error: "Failed to get pool review items" });
    }
  }
}
