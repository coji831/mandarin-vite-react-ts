/**
 * @file apps/backend/src/api/controllers/QuizSessionController.js
 * @description Quiz session controller handling HTTP requests for quiz session endpoints
 * Story 15.11 Phase 8: Backend-centric quiz architecture
 * Clean architecture: API layer - handles HTTP mapping only, delegates to service layer
 */

import { createLogger } from "../../utils/logger.js";

const logger = createLogger("QuizSessionController");

/**
 * QuizSessionController class with dependency injection
 * Story 15.11 Phase 8: Session-based quiz endpoints only (legacy moved to LearningController)
 */
export class QuizSessionController {
  /**
   * @param {object} quizSessionService - QuizSessionService instance
   */
  constructor(quizSessionService) {
    this.quizSessionService = quizSessionService;
  }

  /**
   * Create a new quiz session (or resume existing)
   * POST /api/v1/quiz/session/start
   * Query params: ?date=YYYY-MM-DD&limit=10
   */
  async startSession(req, res) {
    try {
      const userId = req.userId; // Injected by auth middleware
      const { date, limit } = req.query;

      logger.info("Starting quiz session", { userId, date, limit });

      // Parse parameters
      const targetDate = date ? new Date(date) : new Date();
      const maxWords = limit ? parseInt(limit, 10) : 10;

      // Validate parameters
      if (isNaN(targetDate.getTime())) {
        return res.status(400).json({
          error: "Bad Request",
          code: "INVALID_DATE",
          message: "Invalid date format. Use YYYY-MM-DD",
        });
      }

      if (isNaN(maxWords) || maxWords < 1 || maxWords > 50) {
        return res.status(400).json({
          error: "Bad Request",
          code: "INVALID_LIMIT",
          message: "Limit must be between 1 and 50",
        });
      }

      // Create or resume session
      const session = await this.quizSessionService.createSession(userId, targetDate, maxWords);

      // Flow 1.2: Handle no due words (all caught up)
      if (session.noDueWords) {
        return res.status(200).json({
          success: true,
          noDueWords: true,
          questions: [],
          message: session.message || "No words due for review at this time",
        });
      }

      logger.info("Quiz session created/resumed", {
        userId,
        sessionId: session.sessionId,
        isResume: session.isResume || false,
        questionCount: session.questions.length,
      });

      res.status(session.isResume ? 200 : 201).json({
        sessionId: session.sessionId,
        questions: session.questions,
        currentIndex: session.currentIndex || 0,
        expiresAt: session.expiresAt,
        isResume: session.isResume || false,
      });
    } catch (error) {
      logger.error("Error starting quiz session", {
        error: error.message,
        userId: req.userId,
        stack: error.stack,
      });

      // Return generic 500 error (no more special handling for "No words due")
      res.status(500).json({
        error: "Internal Server Error",
        code: "START_SESSION_FAILED",
        message: "Failed to start quiz session",
      });
    }
  }

  /**
   * Submit an answer for validation
   * POST /api/v1/quiz/session/:sessionId/answer
   * Body: { questionId, userAnswer, timeSpentMs }
   */
  async submitAnswer(req, res) {
    try {
      const { sessionId } = req.params;
      const { questionId, userAnswer, timeSpentMs } = req.body;

      logger.info("Submitting quiz answer", { sessionId, questionId });

      // Validate required fields
      if (!sessionId) {
        return res.status(400).json({
          error: "Bad Request",
          code: "MISSING_SESSION_ID",
          message: "Session ID is required",
        });
      }

      if (!questionId) {
        return res.status(400).json({
          error: "Bad Request",
          code: "MISSING_QUESTION_ID",
          message: "Question ID is required",
        });
      }

      if (userAnswer === undefined || userAnswer === null || userAnswer === "") {
        return res.status(400).json({
          error: "Bad Request",
          code: "MISSING_ANSWER",
          message: "User answer is required",
        });
      }

      if (!timeSpentMs || typeof timeSpentMs !== "number" || timeSpentMs < 0) {
        return res.status(400).json({
          error: "Bad Request",
          code: "INVALID_TIME_SPENT",
          message: "timeSpentMs must be a positive number",
        });
      }

      // Submit answer
      const result = await this.quizSessionService.submitAnswer(
        sessionId,
        req.userId, // Authorization: verify user owns session
        questionId,
        userAnswer,
        timeSpentMs,
      );

      logger.info("Quiz answer submitted", {
        sessionId,
        questionId,
        correct: result.correct,
        sessionComplete: result.sessionComplete,
      });

      // Response aligned with type audit (flat structure, no nested feedback object)
      res.status(200).json({
        correct: result.correct,
        correctAnswer: result.correctAnswer,
        nextReviewDate: result.nextReviewDate,
        lapseCount: result.lapseCount,
        isLeech: result.isLeech,
        gamification: result.gamification,
        aiFeedback: result.aiFeedback,
        nextQuestion: result.nextQuestion,
        sessionComplete: result.sessionComplete,
        progress: result.progress,
      });
    } catch (error) {
      logger.error("Error submitting quiz answer", {
        error: error.message,
        sessionId: req.params.sessionId,
        stack: error.stack,
      });

      // Handle specific errors
      if (error.message === "Session not found" || error.statusCode === 404) {
        return res.status(404).json({
          error: "Not Found",
          code: "SESSION_NOT_FOUND",
          message: "Quiz session not found",
        });
      }

      if (error.message === "Session expired") {
        return res.status(410).json({
          error: "Gone",
          code: "SESSION_EXPIRED",
          message: "Quiz session has expired",
        });
      }

      if (error.message.includes("Session is")) {
        return res.status(400).json({
          error: "Bad Request",
          code: "INVALID_SESSION_STATUS",
          message: error.message,
        });
      }

      if (error.message === "Question not found in session") {
        return res.status(400).json({
          error: "Bad Request",
          code: "INVALID_QUESTION_ID",
          message: "Question not found in session",
        });
      }

      if (error.message === "Question already answered") {
        return res.status(409).json({
          error: "Conflict",
          code: "ALREADY_ANSWERED",
          message: "This question has already been answered",
        });
      }

      res.status(500).json({
        error: "Internal Server Error",
        code: "SUBMIT_ANSWER_FAILED",
        message: "Failed to submit answer",
      });
    }
  }

  /**
   * Get session details
   * GET /api/v1/quiz/session/:sessionId
   */
  async getSession(req, res) {
    try {
      const { sessionId } = req.params;

      logger.info("Fetching quiz session", { sessionId });

      if (!sessionId) {
        return res.status(400).json({
          error: "Bad Request",
          code: "MISSING_SESSION_ID",
          message: "Session ID is required",
        });
      }

      const session = await this.quizSessionService.getSession(sessionId, req.userId);

      logger.info("Quiz session fetched", { sessionId, status: session.status });

      res.status(200).json(session);
    } catch (error) {
      logger.error("Error fetching quiz session", {
        error: error.message,
        sessionId: req.params.sessionId,
        stack: error.stack,
      });

      if (error.message === "Session not found" || error.statusCode === 404) {
        return res.status(404).json({
          error: "Not Found",
          code: "SESSION_NOT_FOUND",
          message: "Quiz session not found",
        });
      }

      res.status(500).json({
        error: "Internal Server Error",
        code: "FETCH_SESSION_FAILED",
        message: "Failed to fetch quiz session",
      });
    }
  }

  /**
   * Abandon current session
   * DELETE /api/v1/quiz/session/current
   */
  async abandonSession(req, res) {
    try {
      const userId = req.userId;

      logger.info("Abandoning quiz session", { userId });

      const abandoned = await this.quizSessionService.abandonSession(userId);

      if (!abandoned) {
        return res.status(404).json({
          error: "Not Found",
          code: "NO_ACTIVE_SESSION",
          message: "No active session to abandon",
        });
      }

      logger.info("Quiz session abandoned", { userId });

      res.status(200).json({
        message: "Session abandoned successfully",
      });
    } catch (error) {
      logger.error("Error abandoning quiz session", {
        error: error.message,
        userId: req.userId,
        stack: error.stack,
      });

      res.status(500).json({
        error: "Internal Server Error",
        code: "ABANDON_SESSION_FAILED",
        message: "Failed to abandon session",
      });
    }
  }

  /**
   * Get session summary with calculated statistics
   * GET /api/v1/quiz/session/:sessionId/summary
   * Story 15.11: Move business logic to backend - return pre-calculated metrics with authorization
   */
  async getSessionSummary(req, res) {
    try {
      const { sessionId } = req.params;
      const userId = req.userId; // Injected by auth middleware

      logger.info("Fetching session summary", { sessionId, userId });

      if (!sessionId) {
        return res.status(400).json({
          error: "Bad Request",
          code: "MISSING_SESSION_ID",
          message: "Session ID is required",
        });
      }

      const summary = await this.quizSessionService.getSessionSummary(sessionId, userId);

      logger.info("Session summary fetched", {
        sessionId,
        userId,
        accuracy: summary.accuracyRate,
        xpEarned: summary.xpEarned,
      });

      res.status(200).json(summary);
    } catch (error) {
      logger.error("Error fetching session summary", {
        error: error.message,
        sessionId: req.params.sessionId,
        userId: req.userId,
        stack: error.stack,
      });

      if (error.message && error.message.includes("Session not found")) {
        return res.status(404).json({
          error: "Not Found",
          code: "SESSION_NOT_FOUND",
          message: "Quiz session not found",
        });
      }

      res.status(500).json({
        error: "Internal Server Error",
        code: "FETCH_SUMMARY_FAILED",
        message: "Failed to fetch session summary",
      });
    }
  }
}

export default QuizSessionController;
