/**
 * @file apps/backend/src/modules/review/api/reviewRoutes.js
 * Review routes (mounted under /api in routes.js)
 */
import express from "express";
import { authenticateToken } from "../../../shared/middleware/authMiddleware.js";
import { asyncHandler } from "../../../shared/middleware/asyncHandler.js";
import { ROUTE_PATTERNS } from "@mandarin/shared-constants";

const router = express.Router();

router.get(
  ROUTE_PATTERNS.reviewItems,
  authenticateToken,
  asyncHandler((req, res) => req.reviewController.getReviewItems(req, res)),
);

router.post(
  ROUTE_PATTERNS.reviewResult,
  authenticateToken,
  asyncHandler((req, res) => req.reviewController.recordRating(req, res)),
);

router.get(
  ROUTE_PATTERNS.reviewDueCount,
  authenticateToken,
  asyncHandler((req, res) => req.reviewController.getDueCount(req, res)),
);

/**
 * GET /v1/review/pool/items
 * Get review items generated from the pinyin-tones pool.
 */
router.get(
  ROUTE_PATTERNS.reviewPoolItems,
  authenticateToken,
  asyncHandler((req, res) => req.reviewController.getPoolReviewItems(req, res)),
);

export default router;
