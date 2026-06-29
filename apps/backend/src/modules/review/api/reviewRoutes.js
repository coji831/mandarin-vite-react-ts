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

export default router;
