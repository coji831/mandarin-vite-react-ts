/**
 * @file apps/backend/src/api/routes/index.js
 * @description Main router entry point for clean architecture routes
 */

import express from "express";
import authRouter from "./authRoutes.js";
import progressRouter from "./progressRoutes.js";
import gamificationRouter from "./gamificationRoutes.js";
import aiFeedbackRouter from "./aiFeedbackRoutes.js";
import conversationRouter from "./conversationRoutes.js";
import ttsRouter from "./ttsRoutes.js";
import vocabularyRouter from "./vocabularyRoutes.js";
import healthRouter from "./healthRoutes.js";
import quizSessionRouter from "./quizSessionRoutes.js";
import learningRouter from "./learningRoutes.js";

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

// Gamification routes (v1) - Story 15.3
router.use(gamificationRouter);

// AI Feedback routes (v1) - Story 15.4
router.use(aiFeedbackRouter);

// Learning routes (v1) - Story 15.11 Phase 8: Quiz-based learning endpoints
router.use(learningRouter);

// Quiz Session routes (v1) - Story 15.11 Phase 8: Session-based quiz endpoints
router.use(quizSessionRouter);

// Conversation routes
router.use(conversationRouter);

// TTS routes
router.use(ttsRouter);

// Vocabulary routes (v1)
router.use(vocabularyRouter);

export default router;
