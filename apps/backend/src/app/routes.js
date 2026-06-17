/**
 * @file apps/backend/src/app/routes.js
 * @description Main router entry point for clean architecture routes
 */

import express from "express";
import authRouter from "../modules/auth/api/authRoutes.js";
import progressRouter from "../modules/progress/api/progressRoutes.js";
import { eventRoutes as progressEventRouter } from "../modules/progress/api/eventRoutes.js";
import wordRouter from "../modules/word/api/wordRoutes.js";
import gamificationRouter from "../modules/gamification/api/gamificationRoutes.js";
import aiFeedbackRouter from "../modules/quiz/api/aiFeedbackRoutes.js";
import examplesRoute from "../modules/examples/api/examplesRoutes.js";
import ttsRouter from "../modules/tts/api/ttsRoutes.js";
import vocabularyRouter from "../modules/vocabulary/api/vocabularyRoutes.js";
import healthRouter from "../modules/health/api/healthRoutes.js";
import quizSessionRouter from "../modules/quiz/api/quizSessionRoutes.js";
import learningRouter from "../modules/quiz/api/learningRoutes.js";
import progressionRouter from "../modules/progression/api/progressionRoutes.js";

const router = express.Router();

// TODO(A10): Apply /v1 prefix once here (router.use('/v1', xRouter)) instead of repeating it
// in every route file. Blocked by: ROUTE_PATTERNS in @mandarin/shared-constants already bake in
// /v1/ and are shared with the frontend — stripping the prefix from routes would require a
// coordinated change across both packages to avoid breaking the API contract.

// Health check routes
router.use(healthRouter);

// Authentication routes (v1)
router.use(authRouter);

// Progress routes (v1)
router.use(progressRouter);

// Progress event routes (v1) - Story 17.3
router.use(progressEventRouter);

// Gamification routes (v1) - Story 15.3
router.use(gamificationRouter);

// AI Feedback routes (v1) - Story 15.4
router.use(aiFeedbackRouter);

// Learning routes (v1) - Story 15.11 Phase 8: Quiz-based learning endpoints
router.use(learningRouter);

// Quiz Session routes (v1) - Story 15.11 Phase 8: Session-based quiz endpoints
router.use(quizSessionRouter);

// TTS routes
router.use(ttsRouter);

// Word routes (v1) - Phase 1: WordModule
router.use(wordRouter);

// Vocabulary routes (v1)
router.use(vocabularyRouter);
// Examples routes (v1)
router.use(examplesRoute);

// Progression routes (v1) - Story 18.1
router.use(progressionRouter);

export default router;
