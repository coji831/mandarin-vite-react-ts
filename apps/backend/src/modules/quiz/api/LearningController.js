/**
 * @file apps/backend/src/modules/quiz/api/LearningController.js
 * @description Learning controller handling HTTP requests for quiz-based learning endpoints
 * Story 15.11 Phase 8: Separated from QuizSessionController for clean architecture
 * Clean architecture: API layer - handles HTTP mapping only, delegates to service layer
 */

import { createLogger } from "../../../shared/utils/logger.js";

const logger = createLogger("LearningController");

/**
 * LearningController class with dependency injection
 */
export class LearningController {
  /**
   * @param {object} learningService - LearningService instance
   */
  constructor(learningService) {
    this.learningService = learningService;
  }

  /**
   * Get user's struggling vocabulary (leeches)
   * GET /api/v1/learning/leeches?minLapseCount=5&limit=20
   */
  async getLeeches(req, res) {
    try {
      const userId = req.userId;
      const { minLapseCount, limit } = req.query;

      logger.info("Fetching leeches", { userId, minLapseCount, limit });

      const minLapses = minLapseCount ? parseInt(minLapseCount, 10) : 5;
      if (isNaN(minLapses) || minLapses < 1) {
        return res.status(400).json({
          error: "Bad Request",
          code: "INVALID_MIN_LAPSE_COUNT",
          message: "minLapseCount must be a positive number",
        });
      }

      const maxCount = limit ? parseInt(limit, 10) : 20;
      if (isNaN(maxCount) || maxCount < 1 || maxCount > 100) {
        return res.status(400).json({
          error: "Bad Request",
          code: "INVALID_LIMIT",
          message: "limit must be between 1 and 100",
        });
      }

      const leeches = await this.learningService.getLeechesByUser(userId, minLapses, maxCount);
      logger.info("Successfully fetched leeches", { userId, count: leeches.length });

      res.status(200).json({ leeches });
    } catch (error) {
      logger.error("Error fetching leeches", {
        error: error.message,
        userId: req.userId,
        stack: error.stack,
      });

      res.status(500).json({
        error: "Internal Server Error",
        code: "FETCH_LEECHES_FAILED",
        message: "Failed to fetch leeches",
      });
    }
  }

  /**
   * Get words due for review (stateless)
   * GET /api/v1/learning/due?date=YYYY-MM-DD&limit=10
   */
  async getDueWords(req, res) {
    try {
      const userId = req.userId;
      const { date, limit } = req.query;

      logger.info("Fetching due words", { userId, date, limit });

      const targetDate = date ? new Date(date) : new Date();
      if (isNaN(targetDate.getTime())) {
        return res.status(400).json({
          error: "Bad Request",
          code: "INVALID_DATE",
          message: "Invalid date format. Use YYYY-MM-DD",
        });
      }

      const maxWords = limit ? parseInt(limit, 10) : 10;
      if (isNaN(maxWords) || maxWords < 1 || maxWords > 50) {
        return res.status(400).json({
          error: "Bad Request",
          code: "INVALID_LIMIT",
          message: "limit must be between 1 and 50",
        });
      }

      const words = await this.learningService.getDueWords(userId, targetDate, maxWords);
      logger.info("Successfully fetched due words", { userId, count: words.length });

      res.status(200).json({ words });
    } catch (error) {
      logger.error("Error fetching due words", {
        error: error.message,
        userId: req.userId,
        stack: error.stack,
      });

      res.status(500).json({
        error: "Internal Server Error",
        code: "FETCH_DUE_WORDS_FAILED",
        message: "Failed to fetch due words",
      });
    }
  }

  /**
   * Save quiz answer and update spaced repetition (stateless)
   * POST /api/v1/learning/result
   */
  async saveResult(req, res) {
    try {
      const userId = req.userId;
      const { wordId, correct, questionType, timeSpentMs } = req.body;

      logger.info("Saving quiz result", { userId, wordId, correct, questionType });

      if (!wordId || typeof correct !== "boolean" || !questionType) {
        return res.status(400).json({
          error: "Bad Request",
          code: "MISSING_REQUIRED_FIELDS",
          message: "wordId, correct (boolean), and questionType are required",
        });
      }

      const result = await this.learningService.recordQuizResult({
        userId,
        wordId,
        correct,
        questionType,
        timeSpentMs,
      });

      logger.info("Successfully saved quiz result", { userId, wordId, isLeech: result.isLeech });
      res.status(200).json(result);
    } catch (error) {
      logger.error("Error saving quiz result", {
        error: error.message,
        userId: req.userId,
        stack: error.stack,
      });

      res.status(500).json({
        error: "Internal Server Error",
        code: "SAVE_RESULT_FAILED",
        message: "Failed to save quiz result",
      });
    }
  }
}

export default LearningController;
