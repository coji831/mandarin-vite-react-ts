/**
 * AI Feedback Controller
 * HTTP layer for AI-powered quiz error explanations.
 * Handles request validation, service orchestration, and error mapping.
 */

import { generateFeedback } from "../../core/services/AIFeedbackService.js";
import { redisCacheService } from "../../infrastructure/cache/index.js";
import { VocabularyRepository } from "../../infrastructure/repositories/VocabularyRepository.js";
import { createLogger } from "../../utils/logger.js";

const logger = createLogger("AIFeedbackController");

// Initialize vocabulary repository
const vocabularyRepo = new VocabularyRepository();

/**
 * Generate AI feedback for incorrect quiz answer
 * POST /api/v1/quiz/feedback
 * Body: { wordId, userAnswer, correctAnswer, questionType }
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 */
export async function generateAIFeedback(req, res) {
  try {
    const { wordId, userAnswer, correctAnswer, questionType } = req.body;

    // Validate required fields
    if (!wordId || !userAnswer || !correctAnswer || !questionType) {
      return res.status(400).json({
        error:
          "Missing required fields: wordId, userAnswer, correctAnswer, questionType are all required",
      });
    }

    // Validate wordId is a number
    const wordIdNum = parseInt(wordId, 10);
    if (isNaN(wordIdNum) || wordIdNum <= 0) {
      return res.status(400).json({
        error: "Invalid wordId: must be a positive number",
      });
    }

    // Validate answer fields are strings
    if (typeof userAnswer !== "string" || typeof correctAnswer !== "string") {
      return res.status(400).json({
        error: "Invalid input: userAnswer and correctAnswer must be strings",
      });
    }

    // Validate question type is valid enum
    const validQuestionTypes = [
      "tone_audio",
      "character_choice",
      "pinyin_choice",
      "english_choice",
      "character_input",
    ];
    if (!validQuestionTypes.includes(questionType)) {
      return res.status(400).json({
        error: `Invalid questionType: must be one of ${validQuestionTypes.join(", ")}`,
      });
    }

    logger.info(`Generating feedback for wordId=${wordIdNum}, user=${req.user?.id || "unknown"}`);

    // Generate feedback
    const feedback = await generateFeedback(
      {
        wordId: wordIdNum,
        userAnswer,
        correctAnswer,
        questionType,
      },
      redisCacheService,
      vocabularyRepo,
    );

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
