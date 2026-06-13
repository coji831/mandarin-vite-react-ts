/**
 * QuizSessionOrchestrator (Domain Layer) — Orchestrator
 * Coordinates quiz session lifecycle, answer recording, and session summary.
 * Delegates answer validation/persistence to AnswerRecordingService and
 * session summary/gamification to SummaryService.
 *
 * Renamed from QuizSessionService during modular monolith migration (Phase 3).
 *
 * Story 15.11 Phase 8: Backend-centric quiz architecture for security and consistency
 * Story BE7: Decomposed from god service into QuizSessionOrchestrator +
 *            AnswerRecordingService + SummaryService
 *
 * Responsibilities:
 * - Create quiz sessions with interleaved question generation
 * - Coordinate answer submission flow (delegates to AnswerRecordingService)
 * - Manage session lifecycle (expiration, completion)
 * - Delegate session summary to SummaryService
 *
 * Clean Architecture: Domain Layer - Use Case / Application Service
 * Orchestrates domain entities and sub-services
 *
 * Dependencies injected via options object:
 * - sessionRepository       IQuizSessionRepository
 * - learningService         LearningService
 * - answerRecordingService  AnswerRecordingService
 * - summaryService          SummaryService
 */

import { QuizSession } from "../domain/entities/QuizSession.js";
import { getEndOfDay, QUIZ_WORDS_DEFAULT } from "../../gamification/domain/BusinessRules.js";
import { createLogger } from "../../../shared/utils/logger.js";

export class QuizSessionOrchestrator {
  /**
   * @param {object} deps - Injected dependencies
   * @param {object} deps.sessionRepository       - IQuizSessionRepository implementation
   * @param {object} deps.learningService         - LearningService instance
   * @param {object} deps.answerRecordingService  - AnswerRecordingService instance
   * @param {object} deps.summaryService          - SummaryService instance
   */
  constructor({ sessionRepository, learningService, answerRecordingService, summaryService }) {
    this.sessionRepository = sessionRepository;
    this.learningService = learningService;
    this.answerRecordingService = answerRecordingService;
    this.summaryService = summaryService;
    this.logger = createLogger("QuizSessionOrchestrator");
  }

  // ============================================================================
  // Public API
  // ============================================================================

  /**
   * Create a new quiz session with generated questions
   *
   * @param {string} userId - User ID
   * @param {Date} [date] - Target date for due words (defaults to today)
   * @param {number} [limit] - Maximum number of words to include
   * @returns {Promise<object>} Created session with { sessionId, questions (without answers), expiresAt }
   */
  async createSession(userId, date = new Date(), limit = QUIZ_WORDS_DEFAULT) {
    const existingSession = await this.sessionRepository.findLatestByUserId(userId);

    if (!existingSession) return this._createNewSession(userId, date, limit);

    const now = new Date();

    // Branch A: Active session within daily window (expiresAt = midnight) → resume
    if (existingSession.status === "ACTIVE" && now < new Date(existingSession.expiresAt)) {
      return this._resumeActiveSession(existingSession);
    }

    // Branch B: Completed session still within daily window (expiresAt = midnight)
    if (existingSession.status === "COMPLETE" && now < new Date(existingSession.expiresAt)) {
      return {
        alreadyCompleted: true,
        sessionId: existingSession.id,
        expiresAt: existingSession.expiresAt,
        questions: [],
      };
    }

    // Expired or past daily window → delete and create fresh
    await this._deleteExpiredSession(userId, existingSession.status);
    return this._createNewSession(userId, date, limit);
  }

  /**
   * Submit an answer for validation and update progress
   *
   * @param {string} sessionId - Session ID
   * @param {string} userId - User ID for authorization
   * @param {string} questionId - Question identifier (format: wordId_questionType)
   * @param {string} userAnswer - User's answer
   * @param {number} timeSpentMs - Time spent on question in milliseconds
   * @returns {Promise<object>} Result with { correct, correctAnswer, feedback, gamification, nextQuestion }
   */
  async submitAnswer(sessionId, userId, questionId, userAnswer, timeSpentMs) {
    const session = await this._authorizeSession(sessionId, userId);

    const { isCorrect, question, progressUpdate, aiFeedback } =
      await this.answerRecordingService.recordAnswer(
        session,
        sessionId,
        questionId,
        userAnswer,
        timeSpentMs,
      );

    const newIndex = session.currentIndex + 1;
    const isComplete = newIndex >= session.questions.length;

    await this.sessionRepository.update(sessionId, {
      currentIndex: newIndex,
      status: isComplete ? "COMPLETE" : "ACTIVE",
      completedAt: isComplete ? new Date() : undefined,
    });

    const gamificationData = isComplete
      ? await this.summaryService.processSessionCompletion(sessionId, session)
      : null;
    const nextQuestion = !isComplete
      ? QuizSession.sanitizeQuestionsForClient([session.questions[newIndex]])[0]
      : null;

    return {
      correct: isCorrect,
      correctAnswer: question.correctAnswer,
      nextReviewDate: progressUpdate.nextReviewDate,
      lapseCount: progressUpdate.lapseCount,
      isLeech: progressUpdate.isLeech,
      gamification: gamificationData,
      aiFeedback,
      nextQuestion,
      sessionComplete: isComplete,
      progress: { current: newIndex, total: session.questions.length },
    };
  }

  /**
   * Get session details (for resume or review)
   * @param {string} sessionId - Session ID
   * @param {string} userId - User ID for authorization
   * @returns {Promise<object>} Session details
   */
  async getSession(sessionId, userId) {
    const session = await this.sessionRepository.findByIdAndUserId(sessionId, userId);
    if (!session) {
      const error = new Error("Session not found");
      error.statusCode = 404;
      error.code = "SESSION_NOT_FOUND";
      throw error;
    }

    return {
      sessionId: session.id,
      status: session.status,
      currentIndex: session.currentIndex,
      totalQuestions: session.questions.length,
      questionsAnswered: session.currentIndex,
      questions: QuizSession.sanitizeQuestionsForClient(session.questions),
      expiresAt: session.expiresAt,
      completedAt: session.completedAt,
    };
  }

  /**
   * Abandon current session (mark as expired)
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} True if session was abandoned
   */
  async abandonSession(userId) {
    const session = await this.sessionRepository.findActiveByUser(userId);
    if (!session) {
      return false;
    }

    await this.sessionRepository.update(session.id, {
      status: "EXPIRED",
    });

    return true;
  }

  /**
   * Get session summary with gamification data
   *
   * @param {string} sessionId - Session ID
   * @param {string} userId - User ID for authorization
   * @returns {Promise<object>} Session summary with all gamification data
   */
  async getSessionSummary(sessionId, userId) {
    return this.summaryService.getSessionSummary(sessionId, userId);
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  async _authorizeSession(sessionId, userId) {
    const session = await this.sessionRepository.findByIdAndUserId(sessionId, userId);
    if (!session) {
      const error = new Error("Session not found");
      error.statusCode = 404;
      error.code = "SESSION_NOT_FOUND";
      throw error;
    }

    if (session.status !== "ACTIVE") {
      const error = new Error(`Session is ${session.status.toLowerCase()}`);
      error.code = "INVALID_SESSION_STATUS";
      throw error;
    }

    if (new Date() > new Date(session.expiresAt)) {
      await this.sessionRepository.update(sessionId, { status: "EXPIRED" });
      const error = new Error("Session expired");
      error.code = "SESSION_EXPIRED";
      throw error;
    }

    return session;
  }

  async _resumeActiveSession(existingSession) {
    let answers = [];
    if (this.answerRecordingService && this.answerRecordingService.answerRepository) {
      const dbAnswers = await this.answerRecordingService.answerRepository.findBySession(
        existingSession.id,
      );
      answers = dbAnswers.map((a) => ({
        wordId: a.wordId,
        questionType: a.question.questionType,
        userAnswer: a.userAnswer,
        correct: a.correct,
        timestamp: a.answeredAt,
        nextReviewDate: a.nextReviewDate?.toISOString() || null,
        lapseCount: a.lapseCount,
        isLeech: a.isLeech,
      }));
    }

    const sessionEntity = new QuizSession(existingSession);

    return {
      alreadyCompleted: false,
      sessionId: sessionEntity.id,
      questions: sessionEntity.getSanitizedQuestions(),
      currentIndex: sessionEntity.currentIndex,
      expiresAt: sessionEntity.expiresAt,
      isResume: true,
      answers,
    };
  }

  async _deleteExpiredSession(userId, previousStatus) {
    try {
      await this.sessionRepository.deleteAllForUser(userId);
      this.logger.info("Deleted previous session data for new quiz (single-session model)", {
        userId,
        previousStatus,
      });
    } catch (err) {
      this.logger.warn("Failed to delete previous session (proceeding anyway)", {
        error: err.message,
        userId,
      });
    }
  }

  async _createNewSession(userId, date, limit) {
    const dueWords = await this._buildWordList(userId, date, limit);

    if (dueWords.length === 0) {
      return {
        alreadyCompleted: false,
        noDueWords: true,
        questions: [],
        message: "No vocabulary available for review. Add vocabulary to start practicing.",
      };
    }

    const questions = this._generateInterleavedQuestions(dueWords);
    const expiresAt = getEndOfDay();

    const session = await this.sessionRepository.create({ userId, questions, expiresAt });

    return {
      alreadyCompleted: false,
      sessionId: session.id,
      questions: QuizSession.sanitizeQuestionsForClient(session.questions),
      expiresAt: session.expiresAt,
      isResume: false,
    };
  }

  async _buildWordList(userId, date, limit) {
    const words = [];

    const dueWords = await this.learningService.getDueWordsOnly(userId, date, limit);
    words.push(...dueWords);

    if (words.length < limit) {
      const newWords = await this.learningService.getNewWords(userId, limit - words.length);
      words.push(...newWords);
    }

    if (words.length < limit) {
      const existingIds = new Set(words.map((w) => w.id));
      const reviewWords = await this.learningService.getReviewFallbackWords(
        userId,
        limit - words.length,
        existingIds,
      );
      words.push(...reviewWords);
    }

    return words;
  }

  _generateInterleavedQuestions(words) {
    const questionTypes = ["multiple_choice", "type_pinyin", "type_character"];

    return words.map((word, index) => {
      const questionType = questionTypes[Math.floor(Math.random() * questionTypes.length)];

      let options;
      if (questionType === "multiple_choice") {
        const distractors = this._shuffle(
          words.filter((w, i) => i !== index && w.english !== word.english),
        )
          .slice(0, 3)
          .map((w) => w.english);
        options = this._shuffle([...distractors, word.english]);
      }

      return {
        id: `${word.id}_${questionType}`,
        wordId: word.id,
        questionType,
        word: word,
        correctAnswer: this._getCorrectAnswerForType(word, questionType),
        ...(options && { options }),
      };
    });
  }

  _shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  _getCorrectAnswerForType(word, questionType) {
    switch (questionType) {
      case "multiple_choice":
        return word.english;
      case "type_pinyin":
        return word.pinyin;
      case "type_character":
        return word.simplified;
      default:
        throw new Error(`Unknown question type: ${questionType}`);
    }
  }
}
