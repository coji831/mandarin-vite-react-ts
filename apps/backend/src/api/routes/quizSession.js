/**
 * @file apps/backend/src/api/routes/quizSession.js
 * @description Quiz session routes (mounted under /api in index.js)
 * Story 15.11 Phase 8: Backend-centric quiz session architecture (session-based endpoints only)
 */

import express from "express";
import { QuizSessionController } from "../controllers/quizSessionController.js";
import { QuizSessionService } from "../../core/services/QuizSessionService.js";
import { QuizSessionRepository } from "../../infrastructure/repositories/QuizSessionRepository.js";
import { QuizSessionSummaryRepository } from "../../infrastructure/repositories/QuizSessionSummaryRepository.js";
import { QuizSessionAnswerRepository } from "../../infrastructure/repositories/QuizSessionAnswerRepository.js";
import { LearningService } from "../../core/services/LearningService.js";
import { ProgressRepository } from "../../infrastructure/repositories/ProgressRepository.js";
import { VocabularyRepository } from "../../infrastructure/repositories/VocabularyRepository.js";
import { GamificationService } from "../../core/services/GamificationService.js";
import { StreakService } from "../../core/services/StreakService.js";
import { StreakRepository } from "../../infrastructure/repositories/StreakRepository.js";
import { BadgeRepository } from "../../infrastructure/repositories/BadgeRepository.js";
import { CachedAIFeedbackService } from "../../core/services/CachedAIFeedbackService.js";
import { getCacheService } from "../../infrastructure/cache/index.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = express.Router();

// Initialize dependencies with proper injection
const quizSessionRepository = new QuizSessionRepository();
const quizSessionSummaryRepository = new QuizSessionSummaryRepository();
const quizSessionAnswerRepository = new QuizSessionAnswerRepository();
const progressRepository = new ProgressRepository();
const vocabularyRepository = new VocabularyRepository();
const streakRepository = new StreakRepository();
const badgeRepository = new BadgeRepository();

// LearningService handles quiz-based learning with spaced repetition
const learningService = new LearningService(
  progressRepository,
  null, // quizResultRepository removed — answer audit handled by QuizSessionAnswerRepository
  vocabularyRepository,
);

const gamificationService = new GamificationService(badgeRepository, streakRepository);
const streakService = new StreakService(streakRepository, quizSessionAnswerRepository);

// AI Feedback Service for automatic error explanations (Story 15.11 Phase 9)
const cacheService = getCacheService();
const aiFeedbackService = new CachedAIFeedbackService(vocabularyRepository, cacheService);

const quizSessionService = new QuizSessionService({
  sessionRepository: quizSessionRepository,
  learningService,
  gamificationService,
  vocabularyRepository,
  aiFeedbackService, // automatic AI feedback for incorrect answers
  streakService, // streak tracking for gamification
  summaryRepository: quizSessionSummaryRepository, // Flow 5 summary persistence
  answerRepository: quizSessionAnswerRepository, // per-answer row storage
});

const quizSessionController = new QuizSessionController(quizSessionService);

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

// Abandon current session
// DELETE /v1/quiz/session/current
router.delete(
  "/v1/quiz/session/current",
  authenticateToken,
  asyncHandler(quizSessionController.abandonSession.bind(quizSessionController)),
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
