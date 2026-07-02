/**
 * AI Feedback Controller
 * HTTP layer for AI-powered quiz error explanations.
 * Handles request validation, service orchestration, and error mapping.
 * Follows class-based architecture matching TTS/Conversation controllers.
 */

import { createLogger } from "../../../shared/utils/logger.js";
import type { Request, Response } from "express";

const logger = createLogger("AIFeedbackController");

/**
 * AI Feedback Controller
 * Dependencies injected via constructor (following clean architecture)
 */
export class AIFeedbackController {
  feedbackService: any;

  /**
   * @param {import('../../core/services/CachedAIFeedbackService.js').CachedAIFeedbackService} feedbackService - AI Feedback service instance
   */
  constructor(feedbackService: any) {
    this.feedbackService = feedbackService;
    logger.info("AIFeedbackController initialized");
  }

  /**
   * Generate AI feedback for incorrect quiz answer
   * POST /api/v1/quiz/feedback
   * Body: { wordId, userAnswer, correctAnswer, questionType }
   */
  async generateAIFeedback(req: Request, res: Response) {
    try {
      const { wordId, userAnswer, correctAnswer, questionType } = req.body;

      // Validate required fields
      if (!wordId || !userAnswer || !correctAnswer || !questionType) {
        return res.status(400).json({
          error: "Failed to generate feedback",
          code: "MISSING_FIELDS",
          message: "wordId, userAnswer, correctAnswer, questionType are all required",
        });
      }

      // Validate wordId is a non-empty string (e.g., "hsk3-band1-125")
      if (typeof wordId !== "string" || wordId.trim().length === 0) {
        return res.status(400).json({
          error: "Failed to generate feedback",
          code: "VALIDATION_ERROR",
          message: "Invalid wordId: must be a non-empty string",
        });
      }

      // Validate answer fields are strings
      if (typeof userAnswer !== "string" || typeof correctAnswer !== "string") {
        return res.status(400).json({
          error: "Failed to generate feedback",
          code: "VALIDATION_ERROR",
          message: "userAnswer and correctAnswer must be strings",
        });
      }

      // Validate question type is valid enum (matches frontend QuestionMode)
      const validQuestionTypes = ["multiple_choice", "type_pinyin", "type_character"];
      if (!validQuestionTypes.includes(questionType)) {
        return res.status(400).json({
          error: "Failed to generate feedback",
          code: "VALIDATION_ERROR",
          message: `Invalid questionType: must be one of ${validQuestionTypes.join(", ")}`,
        });
      }

      logger.info(`Generating feedback for wordId=${wordId}, user=${req.user?.id || "unknown"}`);

      // Generate feedback via service
      const feedback = await this.feedbackService.generateFeedback({
        wordId,
        userAnswer,
        correctAnswer,
        questionType,
      });

      // Return successful response
      return res.status(200).json({
        explanation: feedback.explanation,
        errorType: feedback.errorType,
      });
    } catch (error: any) {
      logger.error(`Error generating feedback: ${error.message}`, { error });

      // Map specific errors to appropriate status codes
      if (error.message.includes("Word not found")) {
        return res.status(404).json({
          error: "Failed to generate feedback",
          code: "NOT_FOUND",
          message: "Word not found",
        });
      }

      if (error.message.includes("Missing or invalid GEMINI_API_CREDENTIALS_RAW")) {
        return res.status(503).json({
          error: "Failed to generate feedback",
          code: "SERVICE_UNAVAILABLE",
          message: "AI feedback service is temporarily unavailable",
        });
      }

      if (error.message.includes("Invalid input")) {
        return res.status(400).json({
          error: "Failed to generate feedback",
          code: "VALIDATION_ERROR",
          message: error.message,
        });
      }

      // Generic server error
      return res.status(500).json({
        error: "Failed to generate feedback",
        code: "FEEDBACK_FAILED",
        message: "An unexpected error occurred",
      });
    }
  }
}
