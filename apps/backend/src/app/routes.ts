/**
 * @file apps/backend/src/app/routes.js
 * @description Main router entry point for clean architecture routes
 */

import express from "express";
import type { Request, Response, NextFunction } from "express";
import authRouter from "../modules/auth/api/authRoutes.js";
import aiFeedbackRouter from "../modules/quiz/api/aiFeedbackRoutes.js";
import ttsRouter from "../modules/tts/api/ttsRoutes.js";
import healthRouter from "../modules/health/api/healthRoutes.js";
import progressionRouter from "../modules/progression/api/progressionRoutes.js";
import foundationsRoutes from "../modules/foundations/api/foundationsRoutes.js";
import quizRouter from "../modules/quiz/api/quizRoutes.js";
import reviewRouter from "../modules/review/api/reviewRoutes.js";
import radicalsRoutes from "../modules/radicals/api/radicalsRoutes.js";
import mnemonicsRoutes from "../modules/mnemonics/api/mnemonicsRoutes.js";
import wordsRoutes from "../modules/words/api/WordsRoutes.js";
import { createReadersRoutes } from "../modules/readers/api/readersRoutes.js";
import {
  quizController,
  reviewController,
  progressionController,
  foundationsController,
  radicalsController,
  mnemonicsController,
  wordsController,
  readersController,
  geminiService,
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

// AI Feedback routes (v1) — uses GeminiService directly
router.use((req: Request, res: Response, next: NextFunction) => {
  req.geminiService = geminiService;
  next();
});
router.use(aiFeedbackRouter);

// TTS routes
router.use(ttsRouter);

// Foundations data routes (v1) - Story 18.6
router.use((req: Request, res: Response, next: NextFunction) => {
  req.foundationsController = foundationsController;
  next();
});
router.use(foundationsRoutes);

// Radicals data routes (v1)
router.use((req: Request, res: Response, next: NextFunction) => {
  req.radicalsController = radicalsController;
  next();
});
router.use(radicalsRoutes);

// Progression routes (v1) - Story 18.1
router.use((req: Request, res: Response, next: NextFunction) => {
  req.progressionController = progressionController;
  next();
});
router.use(progressionRouter);

// Quiz routes (v1) - Generic strategy-based quiz endpoints
router.use((req: Request, res: Response, next: NextFunction) => {
  req.quizController = quizController;
  next();
});
router.use(quizRouter);

// Review routes (v1) - Phase 1: Flip-card SRS review
router.use((req: Request, res: Response, next: NextFunction) => {
  req.reviewController = reviewController;
  next();
});
router.use(reviewRouter);

// Mnemonics routes (v1) - Story 20.1
router.use((req: Request, res: Response, next: NextFunction) => {
  req.mnemonicsController = mnemonicsController;
  next();
});
router.use(mnemonicsRoutes);

// Words routes (v1) - Story 21.7
router.use((req: Request, res: Response, next: NextFunction) => {
  req.wordsController = wordsController;
  next();
});
router.use(wordsRoutes);

// Readers routes (v1) - Story 21.3
const readersRoutes = createReadersRoutes(readersController);
router.use(readersRoutes);

// Phonetic Clusters routes (v1) - Story 21.6
import phoneticClustersRoutes from "../modules/phonetic-clusters/api/phoneticClustersRoutes.js";
import { phoneticClustersController } from "./container.js";

router.use((req, res, next) => {
  req.phoneticClustersController = phoneticClustersController;
  next();
});
router.use(phoneticClustersRoutes);

// Characters routes (v1) — Story 21.10
import charactersRoutes from "../modules/characters/api/charactersRoutes.js";
import { charactersController } from "./container.js";

router.use((req, res, next) => {
  req.charactersController = charactersController;
  next();
});
router.use(charactersRoutes);

export default router;
