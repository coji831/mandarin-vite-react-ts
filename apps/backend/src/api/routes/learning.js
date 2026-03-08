/**
 * @file apps/backend/src/api/routes/learning.js
 * @description Learning routes for quiz-based learning endpoints (mounted under /api in index.js)
 * Story 15.11 Phase 8: Separated from quizSession routes for clean architecture
 */

import express from "express";
import { LearningController } from "../controllers/learningController.js";
import { LearningService } from "../../core/services/LearningService.js";
import { ProgressRepository } from "../../infrastructure/repositories/ProgressRepository.js";
import { QuizResultRepository } from "../../infrastructure/repositories/QuizResultRepository.js";
import { VocabularyRepository } from "../../infrastructure/repositories/VocabularyRepository.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = express.Router();

// Initialize dependencies with proper injection
const progressRepository = new ProgressRepository();
const quizResultRepository = new QuizResultRepository();
const vocabularyRepository = new VocabularyRepository();

// LearningService handles quiz-based learning with spaced repetition
const learningService = new LearningService(
  progressRepository,
  quizResultRepository,
  vocabularyRepository,
);

const learningController = new LearningController(learningService);

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

export default router;
