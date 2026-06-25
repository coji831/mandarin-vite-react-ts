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
import progressionRouter from "../modules/progression/api/progressionRoutes.js";
import foundationsRoutes from "../modules/foundations/api/foundationsRoutes.js";
import quizRouter from "../modules/quiz/api/quizRoutes.js";
import reviewRouter from "../modules/review/api/reviewRoutes.js";
import {
  quizController,
  reviewController,
  progressionController,
  aiFeedbackController,
  foundationsController,
} from "./container.js";

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
router.use((req, res, next) => {
  req.aiFeedbackController = aiFeedbackController;
  next();
});
router.use(aiFeedbackRouter);

// TTS routes
router.use(ttsRouter);

// Word routes (v1) - Phase 1: WordModule
router.use(wordRouter);

// Vocabulary routes (v1)
router.use(vocabularyRouter);
// Examples routes (v1)
router.use(examplesRoute);

// Foundations data routes (v1) - Story 18.6
router.use((req, res, next) => {
  req.foundationsController = foundationsController;
  next();
});
router.use(foundationsRoutes);

// Progression routes (v1) - Story 18.1
router.use((req, res, next) => {
  req.progressionController = progressionController;
  next();
});
router.use(progressionRouter);

// Quiz routes (v1) - Generic strategy-based quiz endpoints
router.use((req, res, next) => {
  req.quizController = quizController;
  next();
});
router.use(quizRouter);

// Review routes (v1) - Phase 1: Flip-card SRS review
router.use((req, res, next) => {
  req.reviewController = reviewController;
  next();
});
router.use(reviewRouter);

export default router;
