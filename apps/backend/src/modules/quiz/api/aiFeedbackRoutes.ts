/**
 * AI Feedback Routes
 * Uses GeminiService (Application Service) directly via req middleware.
 */

import express from "express";
import type { Request, Response } from "express";
import { rateLimit } from "express-rate-limit";
import { requireAuth } from "../../../shared/middleware/authMiddleware.js";
import { asyncHandler } from "../../../shared/middleware/asyncHandler.js";

const router = express.Router();

const feedbackLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: "Too many feedback requests.", code: "RATE_LIMIT" },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * POST /api/v1/quiz/feedback
 * Generate AI-powered explanation for incorrect quiz answer.
 * Uses GeminiService directly (no AIFeedbackService intermediate).
 */
router.post(
  "/v1/quiz/feedback",
  requireAuth,
  feedbackLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { wordId, userAnswer, correctAnswer, questionType } = req.body;

    if (!wordId || !userAnswer || !correctAnswer || !questionType) {
      return res.status(400).json({
        error: "Failed to generate feedback",
        code: "VALIDATION_ERROR",
        message: "wordId, userAnswer, correctAnswer, questionType are all required",
      });
    }

    const prompt = buildFeedbackPrompt({ wordId, userAnswer, correctAnswer, questionType });
    const explanation = await req.geminiService!.generateText(prompt, { timeout: 5000 });

    return res.json({ explanation, errorType: "ai_feedback" });
  }),
);

function buildFeedbackPrompt(params: {
  wordId: string;
  userAnswer: string;
  correctAnswer: string;
  questionType: string;
}): string {
  return `You are a Mandarin Chinese tutor. The student answered incorrectly.
    Question type: ${params.questionType}
    Student answered: "${params.userAnswer}"
    Correct answer: "${params.correctAnswer}"
    Explain the mistake briefly (2-3 sentences).`;
}

export default router;
