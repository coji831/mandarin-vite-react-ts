/**
 * @file apps/backend/src/api/routes/learning.js
 * @description Learning routes for quiz-based learning endpoints (mounted under /api in index.js)
 * Story 15.11 Phase 8: Separated from quizSession routes for clean architecture
 */

import express from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { learningController } from "../../container.js";

const router = express.Router();

// All learning routes require authentication
// Note: These are relative paths - main app mounts them under /api

/**
 * Get user's struggling vocabulary (leeches)
 * GET /v1/learning/leeches?minLapseCount=5&limit=20
 * Query params:
 *   - minLapseCount: Minimum lapses to qualify (default 5)
 *   - limit: Max leeches to return (1-100, default 20)
 * Response: { leeches: Array<EnrichedLeech> }
 */
router.get(
  "/v1/learning/leeches",
  authenticateToken,
  asyncHandler(learningController.getLeeches.bind(learningController)),
);

/**
 * Get words due for review (stateless - does not require an active session)
 * GET /v1/learning/due?date=YYYY-MM-DD&limit=10
 * Query params:
 *   - date: Target date for review (default: today)
 *   - limit: Max words to return (1-50, default 10)
 * Response: { words: Array<EnrichedWord> }
 */
router.get(
  "/v1/learning/due",
  authenticateToken,
  asyncHandler(learningController.getDueWords.bind(learningController)),
);

/**
 * Save quiz answer and update spaced repetition (stateless)
 * POST /v1/learning/result
 * Body: { wordId, correct, questionType, timeSpentMs? }
 * Response: { nextReviewDate, lapseCount, isLeech }
 */
router.post(
  "/v1/learning/result",
  authenticateToken,
  asyncHandler(learningController.saveResult.bind(learningController)),
);

export default router;
