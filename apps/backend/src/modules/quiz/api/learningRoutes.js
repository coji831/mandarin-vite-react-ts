/**
 * @file apps/backend/src/modules/quiz/api/learningRoutes.js
 * @description Learning routes for quiz-based learning endpoints (mounted under /api in index.js)
 * Story 15.11 Phase 8: Separated from quizSession routes for clean architecture
 */

import express from "express";
import { authenticateToken } from "../../../shared/middleware/authMiddleware.js";
import { asyncHandler } from "../../../shared/middleware/asyncHandler.js";
import { learningController } from "../../../app/container.js";

const router = express.Router();

// All learning routes require authentication

/**
 * Get user's struggling vocabulary (leeches)
 * GET /v1/learning/leeches?minLapseCount=5&limit=20
 */
router.get(
  "/v1/learning/leeches",
  authenticateToken,
  asyncHandler(learningController.getLeeches.bind(learningController)),
);

/**
 * Get words due for review (stateless)
 * GET /v1/learning/due?date=YYYY-MM-DD&limit=10
 */
router.get(
  "/v1/learning/due",
  authenticateToken,
  asyncHandler(learningController.getDueWords.bind(learningController)),
);

/**
 * Save quiz answer and update spaced repetition (stateless)
 * POST /v1/learning/result
 */
router.post(
  "/v1/learning/result",
  authenticateToken,
  asyncHandler(learningController.saveResult.bind(learningController)),
);

export default router;
