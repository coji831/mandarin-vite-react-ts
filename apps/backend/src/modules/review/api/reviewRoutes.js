/**
 * @file apps/backend/src/modules/review/api/reviewRoutes.js
 * Review routes (mounted under /api in routes.js)
 */
import express from "express";
import { authenticateToken } from "../../../shared/middleware/authMiddleware.js";
import { asyncHandler } from "../../../shared/middleware/asyncHandler.js";

const router = express.Router();

router.get(
  "/v1/review/items",
  authenticateToken,
  asyncHandler((req, res) => req.reviewController.getReviewItems(req, res)),
);

router.post(
  "/v1/review/result",
  authenticateToken,
  asyncHandler((req, res) => req.reviewController.recordRating(req, res)),
);

router.get(
  "/v1/review/due-count",
  authenticateToken,
  asyncHandler((req, res) => req.reviewController.getDueCount(req, res)),
);

/**
 * GET /v1/review/pool/items
 * Get review items generated from the pinyin-tones pool.
 */
router.get(
  "/v1/review/pool/items",
  authenticateToken,
  asyncHandler((req, res) => req.reviewController.getPoolReviewItems(req, res)),
);

/**
 * PUT /v1/review/items/:id/rate
 * Rate a review item (again/good/easy) to update SRS schedule.
 */
router.put(
  "/v1/review/items/:id/rate",
  authenticateToken,
  asyncHandler((req, res) => req.reviewController.rateReviewItem(req, res)),
);

export default router;
