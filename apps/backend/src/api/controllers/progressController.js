/**
 * @file apps/backend/src/api/controllers/progressController.js
 * @description Progress tracking controller handling HTTP requests for progress endpoints
 * Clean architecture: API layer - handles HTTP mapping only, delegates to service layer
 */

import { createLogger } from "../../utils/logger.js";

const logger = createLogger("ProgressController");

/**
 * ProgressController class with dependency injection
 */
export class ProgressController {
  /**
   * @param {object} progressService - ProgressService instance
   */
  constructor(progressService) {
    this.progressService = progressService;
  }

  /**
   * Get all progress for authenticated user
   * GET /api/v1/progress
   */
  async getAllProgress(req, res) {
    try {
      const userId = req.userId; // Injected by auth middleware
      logger.info("Fetching all progress", { userId });

      const progress = await this.progressService.getProgressForUser(userId);
      logger.info("Successfully fetched progress", { userId, count: progress.length });

      res.status(200).json(progress);
    } catch (error) {
      logger.error("Error fetching user progress", { error: error.message, userId: req.userId });
      res.status(500).json({
        error: "Internal Server Error",
        code: "FETCH_PROGRESS_FAILED",
        message: "Failed to fetch progress",
      });
    }
  }

  /**
   * Get progress for specific word
   * GET /api/v1/progress/:wordId
   */
  async getWordProgress(req, res) {
    try {
      const userId = req.userId;
      const { wordId } = req.params;

      if (!wordId) {
        return res.status(400).json({
          error: "Bad Request",
          code: "MISSING_WORD_ID",
          message: "Word ID is required",
        });
      }

      const progress = await this.progressService.getProgressForWord(userId, wordId);

      if (!progress) {
        return res.status(404).json({
          error: "Not Found",
          code: "PROGRESS_NOT_FOUND",
          message: "Progress not found for this word",
        });
      }

      res.status(200).json(progress);
    } catch (error) {
      logger.error("Error fetching word progress", {
        error: error.message,
        userId: req.userId,
        wordId: req.params.wordId,
      });
      res.status(500).json({
        error: "Internal Server Error",
        code: "FETCH_WORD_PROGRESS_FAILED",
        message: "Failed to fetch word progress",
      });
    }
  }

  /**
   * Update progress for specific word
   * PUT /api/v1/progress/:wordId
   * Body: { studyCount?, correctCount?, confidence? }
   */
  async updateWordProgress(req, res) {
    try {
      const userId = req.userId;
      const { wordId } = req.params;
      const { studyCount, correctCount, confidence } = req.body;

      if (!wordId) {
        return res.status(400).json({
          error: "Bad Request",
          code: "MISSING_WORD_ID",
          message: "Word ID is required",
        });
      }

      // Validate input types
      if (studyCount !== undefined && (typeof studyCount !== "number" || studyCount < 0)) {
        return res.status(400).json({
          error: "Bad Request",
          code: "INVALID_STUDY_COUNT",
          message: "studyCount must be a non-negative number",
        });
      }

      if (correctCount !== undefined && (typeof correctCount !== "number" || correctCount < 0)) {
        return res.status(400).json({
          error: "Bad Request",
          code: "INVALID_CORRECT_COUNT",
          message: "correctCount must be a non-negative number",
        });
      }

      if (
        confidence !== undefined &&
        (typeof confidence !== "number" || confidence < 0 || confidence > 1)
      ) {
        return res.status(400).json({
          error: "Bad Request",
          code: "INVALID_CONFIDENCE",
          message: "confidence must be a number between 0 and 1",
        });
      }

      const updated = await this.progressService.updateProgress(userId, wordId, {
        studyCount,
        correctCount,
        confidence,
      });

      res.status(200).json(updated);
    } catch (error) {
      logger.error("Error updating word progress", {
        error: error.message,
        userId: req.userId,
        wordId: req.params.wordId,
      });
      res.status(500).json({
        error: "Internal Server Error",
        code: "UPDATE_PROGRESS_FAILED",
        message: "Failed to update progress",
      });
    }
  }

  /**
   * Batch update progress for multiple words
   * POST /api/v1/progress/batch
   * Body: { updates: [{ wordId, studyCount?, correctCount?, confidence? }] }
   */
  async batchUpdateProgress(req, res) {
    try {
      const userId = req.userId;
      const { updates } = req.body;

      if (!Array.isArray(updates)) {
        return res.status(400).json({
          error: "Bad Request",
          code: "INVALID_UPDATES",
          message: "updates must be an array",
        });
      }

      if (updates.length === 0) {
        return res.status(400).json({
          error: "Bad Request",
          code: "EMPTY_UPDATES",
          message: "updates array cannot be empty",
        });
      }

      // Validate each update
      for (const update of updates) {
        if (!update.wordId) {
          return res.status(400).json({
            error: "Bad Request",
            code: "MISSING_WORD_ID",
            message: "Each update must have a wordId",
          });
        }

        if (
          update.studyCount !== undefined &&
          (typeof update.studyCount !== "number" || update.studyCount < 0)
        ) {
          return res.status(400).json({
            error: "Bad Request",
            code: "INVALID_STUDY_COUNT",
            message: "studyCount must be a non-negative number",
          });
        }

        if (
          update.correctCount !== undefined &&
          (typeof update.correctCount !== "number" || update.correctCount < 0)
        ) {
          return res.status(400).json({
            error: "Bad Request",
            code: "INVALID_CORRECT_COUNT",
            message: "correctCount must be a non-negative number",
          });
        }

        if (
          update.confidence !== undefined &&
          (typeof update.confidence !== "number" || update.confidence < 0 || update.confidence > 1)
        ) {
          return res.status(400).json({
            error: "Bad Request",
            code: "INVALID_CONFIDENCE",
            message: "confidence must be a number between 0 and 1",
          });
        }
      }

      const results = await this.progressService.batchUpdateProgress(userId, updates);

      res.status(200).json(results);
    } catch (error) {
      logger.error("Error batch updating progress", {
        error: error.message,
        userId: req.userId,
        updateCount: req.body?.updates?.length,
      });
      res.status(500).json({
        error: "Internal Server Error",
        code: "BATCH_UPDATE_FAILED",
        message: "Failed to batch update progress",
      });
    }
  }

  /**
   * Delete progress for specific word
   * DELETE /api/v1/progress/:wordId
   */
  async deleteWordProgress(req, res) {
    try {
      const userId = req.userId;
      const { wordId } = req.params;

      if (!wordId) {
        return res.status(400).json({
          error: "Bad Request",
          code: "MISSING_WORD_ID",
          message: "Word ID is required",
        });
      }

      const deleted = await this.progressService.deleteProgress(userId, wordId);

      if (!deleted) {
        return res.status(404).json({
          error: "Not Found",
          code: "PROGRESS_NOT_FOUND",
          message: "Progress not found for this word",
        });
      }

      res.status(204).send();
    } catch (error) {
      logger.error("Error deleting word progress", {
        error: error.message,
        userId: req.userId,
        wordId: req.params.wordId,
      });
      res.status(500).json({
        error: "Internal Server Error",
        code: "DELETE_PROGRESS_FAILED",
        message: "Failed to delete progress",
      });
    }
  }

  /**
   * Get progress statistics for authenticated user
   * GET /api/v1/progress/stats
   */
  async getProgressStats(req, res) {
    try {
      const userId = req.userId;

      const stats = await this.progressService.getProgressStats(userId);

      res.status(200).json(stats);
    } catch (error) {
      logger.error("Error fetching progress stats", { error: error.message, userId: req.userId });
      res.status(500).json({
        error: "Internal Server Error",
        code: "FETCH_STATS_FAILED",
        message: "Failed to fetch progress statistics",
      });
    }
  }

  /**
   * Get vocabulary words due for review
   * Story 15.2: New quiz system endpoint
   * GET /api/v1/progress/due?date=YYYY-MM-DD
   */
  async getDueWords(req, res) {
    try {
      const userId = req.userId;
      const dateParam = req.query.date;

      // Parse and validate date
      const requestedDate = dateParam ? new Date(dateParam) : new Date();

      if (isNaN(requestedDate.getTime())) {
        return res.status(400).json({
          error: "Bad Request",
          code: "INVALID_DATE",
          message: "Invalid date format. Use YYYY-MM-DD.",
        });
      }

      logger.info("Fetching due words", {
        userId,
        date: requestedDate.toISOString().split("T")[0],
      });

      const dueWords = await this.progressService.getDueWords(userId, requestedDate);

      logger.info("Successfully fetched due words", { userId, count: dueWords.length });

      res.status(200).json({
        date: requestedDate.toISOString().split("T")[0],
        count: dueWords.length,
        words: dueWords,
      });
    } catch (error) {
      logger.error("Error fetching due words", { error: error.message, userId: req.userId });
      res.status(500).json({
        error: "Internal Server Error",
        code: "FETCH_DUE_WORDS_FAILED",
        message: "Failed to fetch due words",
      });
    }
  }

  /**
   * Save quiz answer and update progress
   * Story 15.2: New quiz system endpoint (uses Story 15.1's recordQuizResult)
   * POST /api/v1/progress/test-result
   * Body: { wordId, correct, questionType, timeSpentMs }
   */
  async saveTestResult(req, res) {
    try {
      const userId = req.userId;
      const { wordId, correct, questionType, timeSpentMs } = req.body;

      // Validate required fields
      if (!wordId || typeof correct !== "boolean" || !questionType) {
        return res.status(400).json({
          error: "Bad Request",
          code: "MISSING_REQUIRED_FIELDS",
          message: "Missing required fields: wordId, correct, questionType",
        });
      }

      // Validate questionType
      const validQuestionTypes = ["multiple_choice", "type_pinyin", "type_character"];
      if (!validQuestionTypes.includes(questionType)) {
        return res.status(400).json({
          error: "Bad Request",
          code: "INVALID_QUESTION_TYPE",
          message: "questionType must be: multiple_choice, type_pinyin, or type_character",
        });
      }

      // Validate timeSpentMs if provided
      if (timeSpentMs !== undefined && (typeof timeSpentMs !== "number" || timeSpentMs < 0)) {
        return res.status(400).json({
          error: "Bad Request",
          code: "INVALID_TIME_SPENT",
          message: "timeSpentMs must be a non-negative number",
        });
      }

      logger.info("Recording quiz result", { userId, wordId, correct, questionType });

      // Call Story 15.1 method: recordQuizResult()
      const result = await this.progressService.recordQuizResult({
        userId,
        wordId,
        correct,
        questionType,
        timeSpentMs,
      });

      logger.info("Successfully recorded quiz result", {
        userId,
        wordId,
        correct,
        isLeech: result.isLeech,
      });

      res.status(200).json({
        wordId,
        correct,
        nextReview: result.nextReviewDate,
        lapseCount: result.lapseCount,
        isLeech: result.isLeech,
      });
    } catch (error) {
      logger.error("Error saving test result", { error: error.message, userId: req.userId });

      // Handle specific errors
      if (error.message.includes("QuizResultRepository not injected")) {
        return res.status(503).json({
          error: "Service Unavailable",
          code: "QUIZ_SUPPORT_DISABLED",
          message: "Quiz functionality is not available",
        });
      }

      res.status(500).json({
        error: "Internal Server Error",
        code: "SAVE_TEST_RESULT_FAILED",
        message: "Failed to save quiz result",
      });
    }
  }

  /**
   * Get user's struggling vocabulary (leeches)
   * Story 15.2: New quiz system endpoint
   * GET /api/v1/progress/leeches?minLapseCount=5
   */
  async getLeeches(req, res) {
    try {
      const userId = req.userId;
      const minLapseCount = parseInt(req.query.minLapseCount, 10) || 5;

      if (isNaN(minLapseCount) || minLapseCount < 1) {
        return res.status(400).json({
          error: "Bad Request",
          code: "INVALID_LAPSE_COUNT",
          message: "minLapseCount must be a positive integer",
        });
      }

      logger.info("Fetching leeches", { userId, minLapseCount });

      const leeches = await this.progressService.getLeechesByUser(userId, minLapseCount);

      logger.info("Successfully fetched leeches", { userId, count: leeches.length });

      res.status(200).json({
        minLapseCount,
        count: leeches.length,
        leeches,
      });
    } catch (error) {
      logger.error("Error fetching leeches", { error: error.message, userId: req.userId });
      res.status(500).json({
        error: "Internal Server Error",
        code: "FETCH_LEECHES_FAILED",
        message: "Failed to fetch struggling vocabulary",
      });
    }
  }
}
