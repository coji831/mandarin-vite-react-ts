/**
 * @file apps/backend/src/modules/quiz/api/quizRoutes.js
 * Generic quiz routes (mounted under /api in routes.js)
 * quizType is passed in request body — the strategy registry resolves it.
 */
import express from "express";
import { authenticateToken } from "../../../shared/middleware/authMiddleware.js";
import { asyncHandler } from "../../../shared/middleware/asyncHandler.js";
import { ROUTE_PATTERNS } from "@mandarin/shared-constants";

const router = express.Router();

router.get(
  ROUTE_PATTERNS.quizQuestions,
  authenticateToken,
  asyncHandler((req, res) => req.quizController.getQuestions(req, res)),
);

router.post(
  ROUTE_PATTERNS.quizAttempts,
  authenticateToken,
  asyncHandler((req, res) => req.quizController.createQuizAttempt(req, res)),
);

router.post(
  ROUTE_PATTERNS.quizAttemptAnswer(":id"),
  authenticateToken,
  asyncHandler((req, res) => req.quizController.submitAnswer(req, res)),
);

router.put(
  ROUTE_PATTERNS.quizAttemptComplete(":id"),
  authenticateToken,
  asyncHandler((req, res) => req.quizController.completeQuizAttempt(req, res)),
);

router.get(
  ROUTE_PATTERNS.quizAttempts,
  authenticateToken,
  asyncHandler((req, res) => req.quizController.getQuizAttempts(req, res)),
);

export default router;
