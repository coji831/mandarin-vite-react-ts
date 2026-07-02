/**
 * @file apps/backend/src/modules/review/api/ReviewController.js
 * HTTP controller for review endpoints.
 */
import { createLogger } from "../../../shared/utils/logger.js";
import type { Request, Response } from "express";

const logger = createLogger("ReviewController");

export class ReviewController {
  private reviewService: any;

  constructor(reviewService: any) {
    this.reviewService = reviewService;
    this.getReviewItems = this.getReviewItems.bind(this);
    this.recordRating = this.recordRating.bind(this);
    this.getDueCount = this.getDueCount.bind(this);
  }

  async getReviewItems(req: Request, res: Response): Promise<any> {
    try {
      const userId = req.userId;
      const { source, type, limit } = req.query;
      const items = await this.reviewService.getReviewItems(userId, {
        source: source || "due",
        type: type || "",
        limit: limit ? parseInt(limit as string, 10) : 20,
      });
      return res.status(200).json(items);
    } catch (error) {
      logger.error("Error fetching review items", error);
      return res.status(500).json({ error: "Failed to fetch review items", code: "LOAD_FAILED" });
    }
  }

  async recordRating(req: Request, res: Response): Promise<any> {
    try {
      const userId = req.userId;
      const { itemType, itemId, rating } = req.body;
      const result = await this.reviewService.recordRating(userId, { itemType, itemId, rating });
      return res.status(200).json(result);
    } catch (error) {
      if (
        (error as any).message?.startsWith("itemType") ||
        (error as any).message?.startsWith("rating must be")
      ) {
        return res.status(400).json({ error: (error as any).message, code: "MISSING_FIELDS" });
      }
      logger.error("Error recording rating", error);
      return res.status(500).json({ error: "Failed to record rating", code: "UPDATE_FAILED" });
    }
  }

  async getDueCount(req: Request, res: Response): Promise<any> {
    try {
      const userId = req.userId;
      const { type } = req.query;
      const count = await this.reviewService.getDueCount(userId, type || "");
      return res.status(200).json({ count });
    } catch (error) {
      logger.error("Error fetching due count", error);
      return res.status(500).json({ error: "Failed to fetch due count", code: "LOAD_FAILED" });
    }
  }
}
