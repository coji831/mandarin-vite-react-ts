/**
 * @file apps/backend/src/modules/quiz/api/quizRoutes.js
 * Generic quiz routes (mounted under /api in routes.js)
 * quizType is passed in request body — the strategy registry resolves it.
 */
import express from "express";
import type { Request, Response } from "express";
import { optionalAuth, requireAuth } from "../../../shared/middleware/authMiddleware.js";
import { asyncHandler } from "../../../shared/middleware/asyncHandler.js";
import { ROUTE_PATTERNS } from "@mandarin/shared-constants";

const router = express.Router();

router.get(
  ROUTE_PATTERNS.quizConfig,
  optionalAuth,
  asyncHandler((req: Request, res: Response) => req.quizController!.getConfig(req, res)),
);

router.get(
  ROUTE_PATTERNS.quizQuestions,
  optionalAuth,
  asyncHandler((req: Request, res: Response) => req.quizController!.getQuestions(req, res)),
);

router.post(
  ROUTE_PATTERNS.quizAttempts,
  optionalAuth,
  asyncHandler((req: Request, res: Response) => req.quizController!.createQuizAttempt(req, res)),
);

router.post(
  ROUTE_PATTERNS.quizAttemptAnswer(":id"),
  optionalAuth,
  asyncHandler((req: Request, res: Response) => req.quizController!.submitAnswer(req, res)),
);

router.put(
  ROUTE_PATTERNS.quizAttemptComplete(":id"),
  optionalAuth,
  asyncHandler((req: Request, res: Response) => req.quizController!.completeQuizAttempt(req, res)),
);

router.get(
  ROUTE_PATTERNS.quizAttempts,
  requireAuth,
  asyncHandler((req: Request, res: Response) => req.quizController!.getQuizAttempts(req, res)),
);

export default router;
