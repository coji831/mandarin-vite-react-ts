/**
 * @file apps/backend/src/modules/quiz/api/quizRoutes.js
 * Generic quiz routes (mounted under /api in routes.js)
 * quizType is passed in request body — the strategy registry resolves it.
 */
import express from "express";
import { authenticateToken } from "../../../shared/middleware/authMiddleware.js";
import { asyncHandler } from "../../../shared/middleware/asyncHandler.js";

const router = express.Router();

router.get(
  "/v1/quiz/questions",
  authenticateToken,
  asyncHandler((req, res) => req.quizController.getQuestions(req, res)),
);

router.post(
  "/v1/quiz/attempts",
  authenticateToken,
  asyncHandler((req, res) => req.quizController.createQuizAttempt(req, res)),
);

router.post(
  "/v1/quiz/attempts/:id/answers",
  authenticateToken,
  asyncHandler((req, res) => req.quizController.submitAnswer(req, res)),
);

router.put(
  "/v1/quiz/attempts/:id/complete",
  authenticateToken,
  asyncHandler((req, res) => req.quizController.completeQuizAttempt(req, res)),
);

router.get(
  "/v1/quiz/attempts",
  authenticateToken,
  asyncHandler((req, res) => req.quizController.getQuizAttempts(req, res)),
);

export default router;
