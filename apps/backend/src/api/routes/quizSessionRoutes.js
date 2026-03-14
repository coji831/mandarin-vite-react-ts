/**
 * @file apps/backend/src/api/routes/quizSession.js
 * @description Quiz session routes (mounted under /api in index.js)
 * Story 15.11 Phase 8: Backend-centric quiz session architecture (session-based endpoints only)
 */

import express from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { quizSessionController } from "../../container.js";

const router = express.Router();

// All quiz session routes require authentication
// Note: These are relative paths - main app mounts them under /api

// ============================================================================
// Session-Based Quiz Endpoints (Phase 8 - Recommended)
// ============================================================================

// Start a new quiz session (or resume existing)
// POST /v1/quiz/session/start?date=YYYY-MM-DD&limit=10
router.post(
  "/v1/quiz/session/start",
  authenticateToken,
  asyncHandler(quizSessionController.startSession.bind(quizSessionController)),
);

// Submit an answer for validation
// POST /v1/quiz/session/:sessionId/answer
router.post(
  "/v1/quiz/session/:sessionId/answer",
  authenticateToken,
  asyncHandler(quizSessionController.submitAnswer.bind(quizSessionController)),
);

// Get session details (for resume or review)
// GET /v1/quiz/session/:sessionId
router.get(
  "/v1/quiz/session/:sessionId",
  authenticateToken,
  asyncHandler(quizSessionController.getSession.bind(quizSessionController)),
);

// Get session summary with calculated statistics
// GET /v1/quiz/session/:sessionId/summary
// Story 15.11: Backend-calculated metrics (accuracy, XP, leech words)
router.get(
  "/v1/quiz/session/:sessionId/summary",
  authenticateToken,
  asyncHandler(quizSessionController.getSessionSummary.bind(quizSessionController)),
);

export default router;
