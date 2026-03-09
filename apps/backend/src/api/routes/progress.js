/**
 * @file apps/backend/src/api/routes/progress.js
 * @description Progress tracking routes (mounted under /api in index.js)
 * Story 15.11 Phase 8: Quiz endpoints moved to /v1/quiz/* (see quizSession.js)
 */

import express from "express";
import { ProgressController } from "../controllers/progressController.js";
import { GamificationController } from "../controllers/GamificationController.js";
import { ProgressService } from "../../core/services/ProgressService.js";
import { ProgressRepository } from "../../infrastructure/repositories/ProgressRepository.js";
import { QuizSessionAnswerRepository } from "../../infrastructure/repositories/QuizSessionAnswerRepository.js";
import { VocabularyRepository } from "../../infrastructure/repositories/VocabularyRepository.js";
import { StreakService } from "../../core/services/StreakService.js";
import { GamificationService } from "../../core/services/GamificationService.js";
import { StreakRepository } from "../../infrastructure/repositories/StreakRepository.js";
import { BadgeRepository } from "../../infrastructure/repositories/BadgeRepository.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { ROUTE_PATTERNS } from "@mandarin/shared-constants";

const router = express.Router();

// Initialize dependencies with proper injection
// Story 15.3: Inject StreakService and GamificationService for gamification features
// Story 15.11 Phase 8: ProgressService simplified - only handles basic progress CRUD
const progressRepository = new ProgressRepository();
const quizSessionAnswerRepository = new QuizSessionAnswerRepository();
const streakRepository = new StreakRepository();
const badgeRepository = new BadgeRepository();

const progressService = new ProgressService(progressRepository);
const streakService = new StreakService(streakRepository, quizSessionAnswerRepository);
const gamificationService = new GamificationService(badgeRepository, streakRepository);

const progressController = new ProgressController(
  progressService,
  streakService,
  gamificationService,
);

// Story 15.3: Instantiate GamificationController for streak routes
const gamificationController = new GamificationController(streakService, gamificationService);

// All progress routes require authentication
// Note: These are relative paths - main app mounts them under /api
// OpenAPI spec: see docs/openapi.yaml#/paths/~1v1~1progress
router.get(
  ROUTE_PATTERNS.progress,
  authenticateToken,
  asyncHandler(progressController.getAllProgress.bind(progressController)),
);

// OpenAPI spec: see docs/openapi.yaml#/paths/~1v1~1progress~1stats
router.get(
  ROUTE_PATTERNS.progressStats,
  authenticateToken,
  asyncHandler(progressController.getProgressStats.bind(progressController)),
);

// Story 15.3: Streak endpoints (must come BEFORE /:wordId to avoid "streak" being captured as wordId)
// OpenAPI spec: see docs/openapi.yaml#/paths/~1v1~1progress~1streak
router.get(
  ROUTE_PATTERNS.progressStreak,
  authenticateToken,
  asyncHandler(gamificationController.getStreak),
);

// OpenAPI spec: see docs/openapi.yaml#/paths/~1v1~1progress~1streak~1freeze
router.post(
  ROUTE_PATTERNS.progressStreakFreeze,
  authenticateToken,
  asyncHandler(gamificationController.spendFreeze),
);

// IMPORTANT: /:wordId routes must come LAST to avoid capturing specific endpoints
// OpenAPI spec: see docs/openapi.yaml#/paths/~1v1~1progress~1{wordId}
router.get(
  ROUTE_PATTERNS.progressWord(":wordId"),
  authenticateToken,
  asyncHandler(progressController.getWordProgress.bind(progressController)),
);

// OpenAPI spec: see docs/openapi.yaml#/paths/~1v1~1progress~1{wordId} (PUT)
router.put(
  ROUTE_PATTERNS.progressWord(":wordId"),
  authenticateToken,
  asyncHandler(progressController.updateWordProgress.bind(progressController)),
);

// OpenAPI spec: see docs/openapi.yaml#/paths/~1v1~1progress~1{wordId} (DELETE)
router.delete(
  ROUTE_PATTERNS.progressWord(":wordId"),
  authenticateToken,
  asyncHandler(progressController.deleteWordProgress.bind(progressController)),
);

// OpenAPI spec: see docs/openapi.yaml#/paths/~1v1~1progress~1batch
router.post(
  ROUTE_PATTERNS.progressBatch,
  authenticateToken,
  asyncHandler(progressController.batchUpdateProgress.bind(progressController)),
);

export default router;
