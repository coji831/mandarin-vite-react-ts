/**
 * @file apps/backend/src/api/routes/progress.js
 * @description Progress tracking routes (mounted under /api in index.js)
 * Story 15.2: Added quiz endpoints (due, test-result, leeches)
 */

import express from "express";
import { ProgressController } from "../controllers/progressController.js";
import { ProgressService } from "../../core/services/ProgressService.js";
import { ProgressRepository } from "../../infrastructure/repositories/ProgressRepository.js";
import { QuizResultRepository } from "../../infrastructure/repositories/QuizResultRepository.js";
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
// Story 15.2: Inject QuizResultRepository and VocabularyRepository for quiz support
// Story 15.3: Inject StreakService and GamificationService for gamification features
const progressRepository = new ProgressRepository();
const quizResultRepository = new QuizResultRepository();
const vocabularyRepository = new VocabularyRepository();
const streakRepository = new StreakRepository();
const badgeRepository = new BadgeRepository();

const progressService = new ProgressService(
  progressRepository,
  quizResultRepository,
  vocabularyRepository,
);
const streakService = new StreakService(streakRepository, quizResultRepository);
const gamificationService = new GamificationService(badgeRepository, streakRepository);

const progressController = new ProgressController(
  progressService,
  streakService,
  gamificationService,
);

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

// Story 15.2: Quiz system endpoints (must come BEFORE /:wordId to avoid route collision)
// OpenAPI spec: see docs/openapi.yaml#/paths/~1v1~1progress~1due
router.get(
  ROUTE_PATTERNS.progressDue,
  authenticateToken,
  asyncHandler(progressController.getDueWords.bind(progressController)),
);

// OpenAPI spec: see docs/openapi.yaml#/paths/~1v1~1progress~1test-result
router.post(
  ROUTE_PATTERNS.progressTestResult,
  authenticateToken,
  asyncHandler(progressController.saveTestResult.bind(progressController)),
);

// OpenAPI spec: see docs/openapi.yaml#/paths/~1v1~1progress~1leeches
router.get(
  ROUTE_PATTERNS.progressLeeches,
  authenticateToken,
  asyncHandler(progressController.getLeeches.bind(progressController)),
);

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
