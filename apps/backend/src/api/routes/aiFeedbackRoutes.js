/**
 * AI Feedback Routes
 * Routes for AI-powered quiz error explanations
 */

import express from "express";
import { rateLimit } from "express-rate-limit";
import { generateAIFeedback } from "../controllers/AIFeedbackController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = express.Router();

// Rate limiter for AI feedback (10 requests per minute per user)
const feedbackLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Max 10 requests per minute per IP
  message: {
    error: "Too many feedback requests. Please wait a moment before requesting more explanations.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * POST /api/v1/quiz/feedback
 * Generate AI-powered explanation for incorrect quiz answer
 * Requires authentication
 * Rate limited to 10 requests/minute
 */
router.post(
  "/v1/quiz/feedback",
  authenticateToken,
  feedbackLimiter,
  asyncHandler(generateAIFeedback),
);

export default router;
