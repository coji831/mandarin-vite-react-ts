/**
 * AI Feedback Routes
 * Routes for AI-powered quiz error explanations
 * Dependency wiring follows TTS/Conversation pattern
 */

import express from "express";
import { rateLimit } from "express-rate-limit";
import { AIFeedbackController } from "../controllers/AIFeedbackController.js";
import { CachedAIFeedbackService } from "../../core/services/CachedAIFeedbackService.js";
import { VocabularyRepository } from "../../infrastructure/repositories/VocabularyRepository.js";
import { getCacheService } from "../../infrastructure/cache/index.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { registerCacheMetrics } from "../middleware/cacheMetrics.js";

const router = express.Router();

// Initialize dependencies (matches TTS/Conversation architecture)
const cacheService = getCacheService();
const vocabularyRepo = new VocabularyRepository();
const feedbackService = new CachedAIFeedbackService(vocabularyRepo, cacheService);
const controller = new AIFeedbackController(feedbackService);

// Register cache metrics for monitoring
registerCacheMetrics("AIFeedback", () => feedbackService.getMetrics());

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
  asyncHandler(controller.generateAIFeedback.bind(controller)),
);

export default router;
