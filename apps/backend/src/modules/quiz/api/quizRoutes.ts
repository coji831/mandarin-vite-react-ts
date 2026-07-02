/**
 * @file apps/backend/src/modules/quiz/api/quizRoutes.js
 * Generic quiz routes (mounted under /api in routes.js)
 * quizType is passed in request body — the strategy registry resolves it.
 */
import express from "express";
import type { Request, Response } from "express";
import { authenticateToken } from "../../../shared/middleware/authMiddleware.js";
import { asyncHandler } from "../../../shared/middleware/asyncHandler.js";
import { ROUTE_PATTERNS } from "@mandarin/shared-constants";

const router = express.Router();

router.get(
  ROUTE_PATTERNS.quizConfig,
  authenticateToken,
  asyncHandler((req: Request, res: Response) => req.quizController!.getConfig(req, res)),
);

router.get(
  ROUTE_PATTERNS.quizQuestions,
  authenticateToken,
  asyncHandler((req: Request, res: Response) => req.quizController!.getQuestions(req, res)),
);

router.post(
  ROUTE_PATTERNS.quizAttempts,
  authenticateToken,
  asyncHandler((req: Request, res: Response) => req.quizController!.createQuizAttempt(req, res)),
);

router.post(
  ROUTE_PATTERNS.quizAttemptAnswer(":id"),
  authenticateToken,
  asyncHandler((req: Request, res: Response) => req.quizController!.submitAnswer(req, res)),
);

router.put(
  ROUTE_PATTERNS.quizAttemptComplete(":id"),
  authenticateToken,
  asyncHandler((req: Request, res: Response) => req.quizController!.completeQuizAttempt(req, res)),
);

router.get(
  ROUTE_PATTERNS.quizAttempts,
  authenticateToken,
  asyncHandler((req: Request, res: Response) => req.quizController!.getQuizAttempts(req, res)),
);

export default router;
