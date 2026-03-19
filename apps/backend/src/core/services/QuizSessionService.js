/**
 * QuizSessionService (Core Layer)
 * Business logic for quiz session management with server-side validation
 * Story 15.11 Phase 8: Backend-centric quiz architecture for security and consistency
 *
 * Responsibilities:
 * - Create quiz sessions with interleaved question generation
 * - Validate answers server-side (prevents client-side cheating)
 * - Update progress and gamification after each answer
 * - Manage session lifecycle (expiration, completion)
 *
 * Clean Architecture: Application Layer Service
 * Orchestrates domain entities and infrastructure
 *
 * Dependencies injected via options object (Node.js idiom for 3+ deps):
 * - sessionRepository    IQuizSessionRepository
 * - learningService      LearningService
 * - gamificationService  GamificationService
 * - vocabularyRepository IVocabularyRepository
 * - aiFeedbackService    CachedAIFeedbackService (optional)
 * - streakService        StreakService (optional)
 * - summaryRepository    IQuizSessionSummaryRepository (optional)
 * - answerRepository     IQuizSessionAnswerRepository (optional)
 *
 * Docs: docs/architecture.md § Core Layer — Services
 */

import { QuizSession } from "../domain/entities/QuizSession.js";
import {
  calculateAccuracy,
  getEndOfDay,
  QUIZ_WORDS_DEFAULT,
  PERFECT_ACCURACY,
} from "../domain/constants/BusinessRules.js";
import { createLogger } from "../../utils/logger.js";

export class QuizSessionService {
  /**
   * @param {object} deps - Injected dependencies
   * @param {object} deps.sessionRepository    - IQuizSessionRepository implementation
   * @param {object} deps.learningService      - LearningService instance
   * @param {object} deps.gamificationService  - GamificationService instance
   * @param {object} deps.vocabularyRepository - IVocabularyRepository implementation
   * @param {object} [deps.aiFeedbackService]  - CachedAIFeedbackService (optional)
   * @param {object} [deps.streakService]      - StreakService (optional)
   * @param {object} [deps.summaryRepository]  - IQuizSessionSummaryRepository (optional)
   * @param {object} [deps.answerRepository]   - IQuizSessionAnswerRepository (optional)
   */
  constructor({
    sessionRepository,
    learningService,
    gamificationService,
    vocabularyRepository,
    aiFeedbackService = null,
    streakService = null,
    summaryRepository = null,
    answerRepository = null,
  }) {
    this.sessionRepository = sessionRepository;
    this.learningService = learningService;
    this.gamificationService = gamificationService;
    this.vocabularyRepository = vocabularyRepository;
    this.aiFeedbackService = aiFeedbackService;
    this.streakService = streakService;
    this.summaryRepository = summaryRepository;
    this.answerRepository = answerRepository;
    this.logger = createLogger("QuizSessionService");
  }

  // ============================================================================
  // Public API
  // ============================================================================

  /**
   * Create a new quiz session with generated questions
   * Story 15.11 Phase 8: Server-side question generation
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
    // Summary is not bundled here — frontend fetches it via GET /session/:id/summary when needed
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
   * Story 15.11 Phase 8: Server-side answer validation with authorization
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
    const question = await this._loadQuestion(session, sessionId, questionId);

    const isCorrect = this._validateAnswer(userAnswer, question);

    // Update progress FIRST (spaced repetition) — lapseCount needed for answer record
    const progressUpdate = await this.learningService.recordQuizResult({
      userId: session.userId,
      wordId: question.wordId,
      correct: isCorrect,
      questionType: question.questionType,
      timeSpentMs,
    });

    await this._persistAnswerRecord(
      sessionId,
      session,
      question,
      userAnswer,
      isCorrect,
      timeSpentMs,
      progressUpdate,
    );

    const newIndex = session.currentIndex + 1;
    const isComplete = newIndex >= session.questions.length;

    await this.sessionRepository.update(sessionId, {
      currentIndex: newIndex,
      status: isComplete ? "COMPLETE" : "ACTIVE",
      completedAt: isComplete ? new Date() : undefined,
    });

    // Uses _getCorrectAnswerForType — single source of truth for questionType → answer mapping
    const aiFeedback =
      !isCorrect && question.word
        ? {
            explanation: `the answer is ${this._getCorrectAnswerForType(question.word, question.questionType)}`,
            errorType: "feedback",
          }
        : null;
    const gamificationData = isComplete
      ? await this._processSessionCompletion(sessionId, session)
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
    // Get session with authorization (repository composite lookup)
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
   * Story 15.11 Phase 8: Backend-calculated metrics with authorization
   *
   * @param {string} sessionId - Session ID
   * @param {string} userId - User ID for authorization
   * @returns {Promise<object>} Session summary with all gamification data
   * @throws {Error} If session not found or user not authorized
   */
  async getSessionSummary(sessionId, userId) {
    if (!this.summaryRepository) return this._calculateSummaryFromAnswers(sessionId, userId);

    try {
      const summary = await this.summaryRepository.findBySessionIdAndUserId(sessionId, userId);
      if (!summary) return this._calculateSummaryFromAnswers(sessionId, userId);
      return await this._buildSummaryFromRecord(summary, sessionId, userId);
    } catch (err) {
      this.logger.warn("Failed to read summary from database, falling back to recalculation", {
        error: err.message,
        sessionId,
      });
      return this._calculateSummaryFromAnswers(sessionId, userId);
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Verify the session belongs to the user and is in a submittable state
   * @private
   * @param {string} sessionId - Session ID
   * @param {string} userId    - User ID for authorization
   * @returns {Promise<object>} Authorized session record
   */
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

  /**
   * Find the question within the session and assert it has not been answered yet
   * @private
   * @param {object} session    - Authorized session record
   * @param {string} sessionId  - Session ID (for answerRepository lookup)
   * @param {string} questionId - Question ID to locate
   * @returns {Promise<object>} Question record
   */
  async _loadQuestion(session, sessionId, questionId) {
    const question = session.questions.find((q) => q.id === questionId);
    if (!question) {
      const error = new Error("Question not found in session");
      error.code = "INVALID_QUESTION_ID";
      throw error;
    }

    if (this.answerRepository) {
      const existingAnswer = await this.answerRepository.findByQuestionId(questionId);
      if (existingAnswer) {
        const error = new Error("Question already answered");
        error.code = "ALREADY_ANSWERED";
        throw error;
      }
    }

    return question;
  }

  /**
   * Persist a QuizSessionAnswer record; no-op when answerRepository is not injected
   * @private
   */
  async _persistAnswerRecord(
    sessionId,
    session,
    question,
    userAnswer,
    isCorrect,
    timeSpentMs,
    progressUpdate,
  ) {
    if (!this.answerRepository) return;
    await this.answerRepository.create({
      sessionId,
      userId: session.userId,
      wordId: question.wordId,
      questionId: question.id,
      userAnswer,
      correct: isCorrect,
      timeSpentMs,
      lapseCount: progressUpdate.lapseCount,
      isLeech: progressUpdate.isLeech,
      nextReviewDate: progressUpdate.nextReviewDate,
    });
  }

  /**
   * Resume an active session: reload persisted answers and return sanitized questions
   * @private
   * @param {object} existingSession - Raw session record from repository
   * @returns {Promise<object>} Resume response
   */
  async _resumeActiveSession(existingSession) {
    let answers = [];
    if (this.answerRepository) {
      const dbAnswers = await this.answerRepository.findBySession(existingSession.id);
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

  /**
   * Delete an expired or stale session; logs but does not throw on failure
   * @private
   * @param {string} userId - User ID
   * @param {string} previousStatus - Status of the session being deleted (for logging)
   */
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

  /**
   * Build a word list, generate questions, persist and return a brand-new session
   * @private
   * @param {string} userId - User ID
   * @param {Date}   date  - Target date for due words
   * @param {number} limit - Maximum number of words
   * @returns {Promise<object>} New session response
   */
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

  /**
   * Build a summary response object from a persisted QuizSessionSummary record (fast path)
   * @private
   * @param {object} summary  - Persisted summary record from summaryRepository
   * @param {string} sessionId - Session ID
   * @param {string} userId   - User ID
   * @returns {Promise<object>} Formatted summary response
   */
  async _buildSummaryFromRecord(summary, sessionId, userId) {
    const { currentStreak, availableFreezes } = await this._fetchStreakData(userId);

    const dbAnswers = this.answerRepository
      ? await this.answerRepository.findBySession(sessionId)
      : [];

    const allAnswers = dbAnswers.map((a) => this._mapAnswerRow(a));
    const incorrectWords = allAnswers.filter((a) => !a.correct);
    const leechWordIds = [...new Set(allAnswers.filter((a) => a.isLeech).map((a) => a.wordId))];
    const newBadges =
      summary.newBadgeIds?.length === 0
        ? []
        : this.gamificationService.getBadgesByIds(summary.newBadgeIds);
    const mysteryBox = !summary.mysteryBoxDrop
      ? null
      : { rewardType: summary.mysteryBoxType, rewardValue: null, opened: null };

    return {
      sessionId: summary.sessionId,
      accuracyRate: summary.accuracyRate,
      correctCount: summary.correctCount,
      incorrectCount: summary.incorrectCount,
      totalQuestions: summary.totalQuestions,
      allAnswers,
      incorrectWords,
      leechWords: incorrectWords.filter((w) => w.isLeech),
      leechCount: leechWordIds.length,
      leechWordIds,
      xpEarned: summary.xpEarned,
      newBadges,
      mysteryBox,
      currentStreak,
      availableFreezes,
      freezeAwarded: summary.freezeAwarded,
    };
  }

  /**
   * Calculate summary by re-aggregating QuizSessionAnswer rows (fallback path)
   * Used when no persisted QuizSessionSummary record exists
   * @private
   * @param {string} sessionId - Session ID
   * @param {string} userId   - User ID for authorization
   * @returns {Promise<object>} Calculated summary response
   * @throws {Error} If session not found or user not authorized
   */
  async _calculateSummaryFromAnswers(sessionId, userId) {
    const session = await this.sessionRepository.findByIdAndUserId(sessionId, userId, {
      includeAnswers: true,
      includeQuestions: true,
      includeWords: true,
    });

    if (!session) {
      const error = new Error("Session not found");
      error.statusCode = 404;
      error.code = "SESSION_NOT_FOUND";
      throw error;
    }

    const { currentStreak, availableFreezes } = await this._fetchStreakData(userId);

    const dbAnswers = this.answerRepository
      ? await this.answerRepository.findBySession(sessionId)
      : [];

    const allAnswers = dbAnswers.map((a) => this._mapAnswerRow(a));
    const correctCount = allAnswers.filter((a) => a.correct).length;
    const incorrectCount = allAnswers.filter((a) => !a.correct).length;
    const totalQuestions = session.questions.length;
    const accuracyRate = calculateAccuracy(correctCount, totalQuestions);
    const incorrectWords = allAnswers.filter((a) => !a.correct);
    const leechWordIds = [...new Set(allAnswers.filter((a) => a.isLeech).map((a) => a.wordId))];

    return {
      sessionId,
      accuracyRate,
      correctCount,
      incorrectCount,
      totalQuestions,
      allAnswers,
      incorrectWords,
      leechWords: incorrectWords.filter((w) => w.isLeech),
      leechCount: leechWordIds.length,
      leechWordIds,
      xpEarned: 0, // Not available without QuizSessionSummary
      newBadges: [],
      mysteryBox: null,
      currentStreak,
      availableFreezes,
      freezeAwarded: false,
    };
  }

  /**
   * Map a QuizSessionAnswer DB row to the standard answer shape used across the service
   * @private
   * @param {object} a - Raw DB answer row with included question relation
   * @returns {object} Normalized answer shape
   */
  _mapAnswerRow(a) {
    return {
      wordId: a.wordId,
      hanzi: a.question.hanzi,
      pinyin: a.question.pinyin,
      english: a.question.english,
      questionType: a.question.questionType,
      userAnswer: a.userAnswer,
      correct: a.correct,
      correctAnswer: a.question.correctAnswer,
      lapseCount: a.lapseCount,
      isLeech: a.isLeech,
      nextReviewDate: a.nextReviewDate?.toISOString() || null,
    };
  }

  /**
   * Fetch live streak data for a user; returns zero-defaults on failure or missing service
   * @private
   * @param {string} userId - User ID
   * @returns {Promise<{ currentStreak: number, availableFreezes: number }>}
   */
  async _fetchStreakData(userId) {
    if (!this.streakService) return { currentStreak: 0, availableFreezes: 0 };
    try {
      const streakData = await this.streakService.getStreak(userId);
      return {
        currentStreak: streakData.currentStreak || 0,
        availableFreezes: streakData.freezeCount || 0,
      };
    } catch (err) {
      this.logger.warn("Failed to fetch streak data", { error: err.message, userId });
      return { currentStreak: 0, availableFreezes: 0 };
    }
  }

  /**
   * Process gamification pipeline on session completion:
   * update streak → calculate XP (BusinessRules.calculateXP) → award badges →
   * roll mystery box (BusinessRules.getMysteryBoxDropRate) → check freeze → persist summary
   * @private
   * @param {string} sessionId - Session ID
   * @param {object} session   - Session data (questions, userId)
   * @returns {Promise<object>} Gamification result for the response
   */
  async _processSessionCompletion(sessionId, session) {
    const allAnswers = this.answerRepository
      ? await this.answerRepository.findBySession(sessionId)
      : [];

    const correctCount = allAnswers.filter((a) => a.correct).length;
    // calculateAccuracy from BusinessRules: (correctCount / total) * PERCENTAGE_MULTIPLIER
    const accuracyRate = calculateAccuracy(correctCount, session.questions.length);

    // Update streak FIRST — XP and badge calculations must use post-session streak values
    let updatedStreak = { currentStreak: 0, longestStreak: 0 };
    if (this.streakService) {
      try {
        const result = await this.streakService.updateStreak(session.userId);
        updatedStreak = {
          currentStreak: result.currentStreak || 0,
          longestStreak: result.longestStreak || 0,
        };
      } catch (err) {
        this.logger.warn("Failed to update streak (non-critical)", {
          error: err.message,
          userId: session.userId,
        });
      }
    }

    // calculateXP delegates to BusinessRules.calculateXP (base + streak bonus)
    const xpEarned = this.gamificationService.calculateXP(
      correctCount,
      updatedStreak.currentStreak,
    );

    // Award badges using longestStreak (badges survive streak resets)
    let newBadges = [];
    try {
      newBadges = await this.gamificationService.checkAndAwardBadges(
        session.userId,
        updatedStreak.longestStreak,
      );
    } catch (err) {
      this.logger.warn("Failed to award badges (non-critical)", {
        error: err.message,
        userId: session.userId,
      });
    }

    // checkMysteryBoxDrop uses BusinessRules.getMysteryBoxDropRate
    const mysteryBox = this.gamificationService.checkMysteryBoxDrop(accuracyRate);

    let freezeAwarded = false;
    if (accuracyRate === PERFECT_ACCURACY && this.streakService) {
      try {
        freezeAwarded = await this.streakService.checkAndAwardFreeze(session.userId);
      } catch (err) {
        this.logger.warn("Failed to check freeze award (non-critical)", {
          error: err.message,
          userId: session.userId,
        });
      }
    }

    if (this.summaryRepository) {
      try {
        await this.summaryRepository.create({
          userId: session.userId,
          sessionId,
          totalQuestions: session.questions.length,
          correctCount,
          incorrectCount: allAnswers.length - correctCount,
          accuracyRate,
          xpEarned,
          newBadgeIds: newBadges.map((b) => b.id),
          mysteryBoxDrop: !!mysteryBox,
          mysteryBoxType: mysteryBox?.rewardType || null,
          freezeAwarded,
        });
      } catch (err) {
        this.logger.warn("Failed to persist session summary (non-critical)", {
          error: err.message,
          sessionId,
        });
      }
    }

    return {
      xpEarned,
      newBadges,
      mysteryBox,
      freezeAwarded,
      currentStreak: updatedStreak.currentStreak,
    };
  }

  /**
   * Build a quiz word list using 4-tier strategy (always produces words for a session)
   *
   * Tier 1: Scheduled due words (nextReview <= today)
   * Tier 2: New unlearned words (fill remaining slots)
   * Tier 3: Review fallback words (future due, for when nothing else is available)
   *
   * @private
   * @param {string} userId - User ID
   * @param {Date} date - Target date for due words
   * @param {number} limit - Maximum words to return
   * @returns {Promise<Array>} Enriched word list
   */
  async _buildWordList(userId, date, limit) {
    const words = [];

    // Tier 1: Scheduled due words
    const dueWords = await this.learningService.getDueWordsOnly(userId, date, limit);
    words.push(...dueWords);

    // Tier 2: Fill with new unlearned words
    if (words.length < limit) {
      const newWords = await this.learningService.getNewWords(userId, limit - words.length);
      words.push(...newWords);
    }

    // Tier 3: Fill with review fallback (words with future nextReview)
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

  /**
   * Generate one random question type per word with shuffled multiple-choice options
   * @private
   * @param {Array} words - Due words array
   * @returns {Array} Questions array
   */
  _generateInterleavedQuestions(words) {
    const questionTypes = ["multiple_choice", "type_pinyin", "type_character"];

    return words.map((word, index) => {
      // Pick one random question type per word
      const questionType = questionTypes[Math.floor(Math.random() * questionTypes.length)];

      // Generate MC options: 1 correct + 3 distractors from other words
      // Filter out same-index and same-english to prevent duplicate options
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

  /**
   * Fisher-Yates shuffle — unbiased, O(n) array shuffle
   * @private
   * @param {Array} array - Array to shuffle (not mutated)
   * @returns {Array} New shuffled array
   */
  _shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /**
   * Get correct answer for question type
   * @private
   * @param {object} word - Word object
   * @param {string} questionType - Question type
   * @returns {string|Array} Correct answer(s)
   */
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

  /**
   * Validate user answer against correct answer
   * Handles normalization and multi-answer support
   * @private
   * @param {string} userAnswer - User's answer
   * @param {object} question - Question object with correctAnswer
   * @returns {boolean} True if correct
   */
  _validateAnswer(userAnswer, question) {
    const { questionType, correctAnswer } = question;

    // Normalize user input
    const normalizedUser = this._normalizeAnswer(userAnswer, questionType);
    const normalizedCorrect = this._normalizeAnswer(correctAnswer, questionType);

    // Handle multi-answer support (semicolon, comma, or pipe separated)
    if (typeof normalizedCorrect === "string" && /[;,，；|｜]/.test(normalizedCorrect)) {
      const acceptableAnswers = normalizedCorrect
        .split(/[;,，；|｜]/)
        .map((ans) => ans.trim())
        .filter(Boolean);

      // If the user selected a combined option (e.g. "go back; return"),
      // split the user's answer as well and accept if any segment matches
      const userSegments =
        typeof normalizedUser === "string" && /[;,，；|｜]/.test(normalizedUser)
          ? normalizedUser
              .split(/[;,，；|｜]/)
              .map((s) => s.trim())
              .filter(Boolean)
          : [normalizedUser];

      return userSegments.some((segment) =>
        acceptableAnswers.some((acceptable) =>
          this._answersMatch(segment, acceptable, questionType),
        ),
      );
    }

    // Single answer comparison
    return this._answersMatch(normalizedUser, normalizedCorrect, questionType);
  }

  /**
   * Normalize answer for comparison
   * @private
   * @param {string} answer - Answer to normalize
   * @param {string} questionType - Question type
   * @returns {string} Normalized answer
   */
  _normalizeAnswer(answer, questionType) {
    if (!answer) return "";

    let normalized = answer.toString().trim().toLowerCase();

    // Question-specific normalization
    if (questionType === "type_pinyin") {
      // Remove extra spaces between syllables (optional normalization)
      normalized = normalized.replace(/\s+/g, " ");
    } else if (questionType === "type_character") {
      // No spaces allowed in character answers
      normalized = normalized.replace(/\s+/g, "");
    }

    return normalized;
  }

  /**
   * Check if two normalized answers match
   * @private
   * @param {string} userAnswer - Normalized user answer
   * @param {string} correctAnswer - Normalized correct answer
   * @param {string} questionType - Question type
   * @returns {boolean} True if match
   */
  _answersMatch(userAnswer, correctAnswer, questionType) {
    if (questionType === "type_pinyin") {
      // Pinyin: Allow space variations (e.g., "hěn hǎo" vs "hěnhǎo")
      const userNoSpace = userAnswer.replace(/\s+/g, "");
      const correctNoSpace = correctAnswer.replace(/\s+/g, "");
      return userNoSpace === correctNoSpace || userAnswer === correctAnswer;
    }

    // Default: exact match after normalization
    return userAnswer === correctAnswer;
  }

  // Note: _sanitizeQuestionsForClient method moved to QuizSession domain entity
  // Use: QuizSession.sanitizeQuestionsForClient(questions)
}

export default QuizSessionService;
