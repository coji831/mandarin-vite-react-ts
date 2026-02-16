/**
 * AI Feedback Controller
 * HTTP layer for AI-powered quiz error explanations.
 * Handles request validation, service orchestration, and error mapping.
 * Follows class-based architecture matching TTS/Conversation controllers.
 */

import { createLogger } from "../../utils/logger.js";

const logger = createLogger("AIFeedbackController");

/**
 * AI Feedback Controller
 * Dependencies injected via constructor (following clean architecture)
 */
export class AIFeedbackController {
  /**
   * @param {import('../../core/services/CachedAIFeedbackService.js').CachedAIFeedbackService} feedbackService - AI Feedback service instance
   */
  constructor(feedbackService) {
    this.feedbackService = feedbackService;
    logger.info("AIFeedbackController initialized");
  }

  /**
   * Generate AI feedback for incorrect quiz answer
   * POST /api/v1/quiz/feedback
   * Body: { wordId, userAnswer, correctAnswer, questionType }
   * @param {import('express').Request} req - Express request
   * @param {import('express').Response} res - Express response
   */
  async generateAIFeedback(req, res) {
    try {
      const { wordId, userAnswer, correctAnswer, questionType } = req.body;

      // Validate required fields
      if (!wordId || !userAnswer || !correctAnswer || !questionType) {
        return res.status(400).json({
          error:
            "Missing required fields: wordId, userAnswer, correctAnswer, questionType are all required",
        });
      }

      // Validate wordId is a non-empty string (e.g., "hsk3-band1-125")
      if (typeof wordId !== "string" || wordId.trim().length === 0) {
        return res.status(400).json({
          error: "Invalid wordId: must be a non-empty string",
        });
      }

      // Validate answer fields are strings
      if (typeof userAnswer !== "string" || typeof correctAnswer !== "string") {
        return res.status(400).json({
          error: "Invalid input: userAnswer and correctAnswer must be strings",
        });
      }

      // Validate question type is valid enum (matches frontend QuestionMode)
      const validQuestionTypes = ["multiple_choice", "type_pinyin", "type_character"];
      if (!validQuestionTypes.includes(questionType)) {
        return res.status(400).json({
          error: `Invalid questionType: must be one of ${validQuestionTypes.join(", ")}`,
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
    } catch (error) {
      logger.error(`Error generating feedback: ${error.message}`, { error });

      // Map specific errors to appropriate status codes
      if (error.message.includes("Word not found")) {
        return res.status(404).json({
          error: "Word not found",
        });
      }

      if (error.message.includes("Missing or invalid GEMINI_API_CREDENTIALS_RAW")) {
        return res.status(503).json({
          error: "AI feedback service is temporarily unavailable",
        });
      }

      if (error.message.includes("Invalid input")) {
        return res.status(400).json({
          error: error.message,
        });
      }

      // Generic server error
      return res.status(500).json({
        error: "Failed to generate feedback. Please try again later.",
      });
    }
  }
}
