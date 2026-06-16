/**
 * @file apps/backend/src/modules/progress/api/progressRoutes.js
 * @description Progress tracking routes (mounted under /api in index.js)
 * Story 15.11 Phase 8: Quiz endpoints moved to /v1/quiz/* (see quizSessionRoutes.js)
 */

import express from "express";
import { authenticateToken } from "../../../shared/middleware/authMiddleware.js";
import { asyncHandler } from "../../../shared/middleware/asyncHandler.js";
import { ROUTE_PATTERNS } from "@mandarin/shared-constants";
import { progressController, gamificationController } from "../../../app/container.js";

const router = express.Router();

// All progress routes require authentication

router.get(
  ROUTE_PATTERNS.progress,
  authenticateToken,
  asyncHandler(progressController.getAllProgress.bind(progressController)),
);

router.get(
  ROUTE_PATTERNS.progressStats,
  authenticateToken,
  asyncHandler(progressController.getProgressStats.bind(progressController)),
);

// Story 15.3: Streak endpoints (must come BEFORE /:wordId to avoid "streak" being captured as wordId)
router.get(
  ROUTE_PATTERNS.progressStreak,
  authenticateToken,
  asyncHandler(gamificationController.getStreak),
);

router.post(
  ROUTE_PATTERNS.progressStreakFreeze,
  authenticateToken,
  asyncHandler(gamificationController.spendFreeze),
);

// IMPORTANT: /:wordId routes must come LAST to avoid capturing specific endpoints
router.get(
  ROUTE_PATTERNS.progressWord(":wordId"),
  authenticateToken,
  asyncHandler(progressController.getWordProgress.bind(progressController)),
);

router.put(
  ROUTE_PATTERNS.progressWord(":wordId"),
  authenticateToken,
  asyncHandler(progressController.updateWordProgress.bind(progressController)),
);

router.delete(
  ROUTE_PATTERNS.progressWord(":wordId"),
  authenticateToken,
  asyncHandler(progressController.deleteWordProgress.bind(progressController)),
);

router.post(
  ROUTE_PATTERNS.progressBatch,
  authenticateToken,
  asyncHandler(progressController.batchUpdateProgress.bind(progressController)),
);

export default router;
