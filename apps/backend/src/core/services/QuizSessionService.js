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

 */

import { QuizSession } from "../domain/entities/QuizSession.js";
import { calculateAccuracy } from "../domain/constants/BusinessRules.js";
import { getEndOfDay } from "../domain/constants/BusinessRules.js";

export class QuizSessionService {
  constructor(
    sessionRepository,
    learningService,
    gamificationService,
    vocabularyRepository,
    aiFeedbackService = null,
    streakService = null,
    summaryRepository = null,
    answerRepository = null,
  ) {
    this.sessionRepository = sessionRepository;
    this.learningService = learningService;
    this.gamificationService = gamificationService;
    this.vocabularyRepository = vocabularyRepository;
    this.aiFeedbackService = aiFeedbackService;
    this.streakService = streakService;
    this.summaryRepository = summaryRepository;
    this.answerRepository = answerRepository;
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
   * @param {number} [limit=10] - Maximum number of words to include
   * @returns {Promise<object>} Created session with { sessionId, questions (without answers), expiresAt }
   */
  async createSession(userId, date = new Date(), limit = 10) {
    // Flow 5: Cleanup expired quiz session summaries on new quiz start (7-day TTL)
    if (this.summaryRepository) {
      try {
        await this.summaryRepository.deleteExpired(userId);
      } catch (err) {
        const logger = (await import("../../utils/logger.js")).createLogger("QuizSessionService");
        logger.warn("Failed to cleanup expired summaries (non-critical)", {
          error: err.message,
          userId,
        });
      }
    }

    // Check for non-expired completed session (daily quiz limit)
    const completedSession = await this.sessionRepository.findMostRecentCompleted(userId);
    if (completedSession && new Date() < new Date(completedSession.expiresAt)) {
      // User already completed quiz today, return summary instead
      const summary = await this.getSessionSummary(completedSession.id, userId);
      return {
        alreadyCompleted: true,
        sessionId: completedSession.id,
        summary,
        expiresAt: completedSession.expiresAt,
        questions: [], // No new questions when already completed
      };
    }

    // Check for existing active session
    const existingSession = await this.sessionRepository.findActiveByUser(userId);
    if (existingSession) {
      // Return existing session (client can resume or abandon)
      const sessionEntity = new QuizSession(existingSession);

      // Load previous answers from QuizSessionAnswer table
      let answers = [];
      if (this.answerRepository) {
        const dbAnswers = await this.answerRepository.findBySession(existingSession.id);
        answers = dbAnswers.map((a) => ({
          wordId: a.wordId,
          questionType: a.question.questionType,
          userAnswer: a.userAnswer,
          correct: a.correct,
          timestamp: a.answeredAt,
          nextReview: a.nextReviewDate?.toISOString() || null,
          lapseCount: a.lapseCount,
          isLeech: a.isLeech,
        }));
      }

      return {
        alreadyCompleted: false,
        sessionId: sessionEntity.id,
        questions: sessionEntity.getSanitizedQuestions(),
        currentIndex: sessionEntity.currentIndex,
        expiresAt: sessionEntity.expiresAt,
        isResume: true,
        answers, // Include previous answers for resume
      };
    }

    // Fetch due words from learning service
    const dueWords = await this.learningService.getDueWords(userId, date, limit);

    // Flow 1.2: No due words available (all caught up)
    if (dueWords.length === 0) {
      return {
        alreadyCompleted: false,
        noDueWords: true,
        sessionId: null,
        questions: [],
        expiresAt: null,
        isResume: false,
        message: "You're all caught up! Come back later for more practice.",
      };
    }

    // Generate interleaved questions (3 types per word, shuffled)
    const questions = this._generateInterleavedQuestions(dueWords);

    // Create session (expires in 1 hour)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    const session = await this.sessionRepository.create({
      userId,
      questions,
      expiresAt,
    });

    // Return sanitized questions (without correct answers)
    return {
      alreadyCompleted: false,
      sessionId: session.id,
      questions: QuizSession.sanitizeQuestionsForClient(session.questions),
      expiresAt: session.expiresAt,
      isResume: false,
    };
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
    // Get session with authorization (repository composite lookup)
    const session = await this.sessionRepository.findByIdAndUserId(sessionId, userId);
    if (!session) {
      const error = new Error("Session not found");
      error.statusCode = 404;
      throw error;
    }

    // Validate session status
    if (session.status !== "ACTIVE") {
      throw new Error(`Session is ${session.status.toLowerCase()}`);
    }

    // Check expiration
    if (new Date() > new Date(session.expiresAt)) {
      await this.sessionRepository.update(sessionId, { status: "EXPIRED" });
      throw new Error("Session expired");
    }

    // Find question in session
    const question = session.questions.find((q) => q.id === questionId);
    if (!question) {
      throw new Error("Question not found in session");
    }

    // Check if already answered (DB lookup via QuizSessionAnswer)
    if (this.answerRepository) {
      const existingAnswer = await this.answerRepository.findBySessionAndQuestion(
        sessionId,
        questionId,
      );
      if (existingAnswer) {
        throw new Error("Question already answered");
      }
    }

    // Validate answer
    const isCorrect = this._validateAnswer(userAnswer, question);

    // Update progress FIRST (spaced repetition) - need lapseCount for answer record
    const progressUpdate = await this.learningService.recordQuizResult({
      userId: session.userId,
      wordId: question.wordId,
      correct: isCorrect,
      questionType: question.questionType,
      timeSpentMs,
    });

    // Create answer record in QuizSessionAnswer table
    if (this.answerRepository) {
      await this.answerRepository.create({
        sessionId,
        userId: session.userId,
        wordId: question.wordId,
        questionId,
        userAnswer,
        correct: isCorrect,
        timeSpentMs,
        lapseCount: progressUpdate.lapseCount,
        isLeech: progressUpdate.isLeech,
        nextReviewDate: progressUpdate.nextReviewDate,
      });
    }

    const newIndex = session.currentIndex + 1;
    const isComplete = newIndex >= session.questions.length;

    // Update session state (no answers JSON — stored in QuizSessionAnswer table)
    await this.sessionRepository.update(sessionId, {
      currentIndex: newIndex,
      status: isComplete ? "COMPLETE" : "ACTIVE",
      completedAt: isComplete ? new Date() : undefined,
      expiresAt: isComplete ? getEndOfDay() : undefined,
    });

    // Generate AI feedback automatically for incorrect answers (Story 15.11 Phase 9)
    // Non-blocking with 3-second timeout to avoid delaying quiz flow
    let aiFeedback = null;
    if (!isCorrect && this.aiFeedbackService) {
      try {
        const feedbackPromise = this.aiFeedbackService.generateFeedback({
          wordId: question.wordId,
          userAnswer,
          correctAnswer: this._getCorrectAnswer(question),
          questionType: question.questionType,
        });

        // Wait max 3 seconds for AI feedback (don't block response)
        aiFeedback = await Promise.race([
          feedbackPromise,
          new Promise((resolve) => setTimeout(() => resolve(null), 3000)),
        ]);
      } catch (err) {
        // AI feedback generation is non-critical - log and continue
        const logger = (await import("../../utils/logger.js")).createLogger("QuizSessionService");
        logger.warn("AI feedback generation failed (non-critical)", {
          error: err.message,
          wordId: question.wordId,
        });
      }
    }

    // Process gamification ONLY on session completion
    let gamificationData = null;
    if (isComplete) {
      // Load all session answers from DB for completion calculations
      const allAnswers = this.answerRepository
        ? await this.answerRepository.findBySession(sessionId)
        : [];

      // Calculate session stats
      const correctCount = allAnswers.filter((a) => a.correct).length;
      const accuracyRate = (correctCount / session.questions.length) * 100;

      // Get current streak
      let currentStreak = 0;
      if (this.streakService) {
        try {
          const streak = await this.streakService.getStreak(session.userId);
          currentStreak = streak.currentStreak || 0;
        } catch (err) {
          const logger = (await import("../../utils/logger.js")).createLogger("QuizSessionService");
          logger.warn("Failed to get current streak (non-critical)", {
            error: err.message,
            userId: session.userId,
          });
        }
      }

      // Calculate XP (base + streak bonus) for ALL correct answers
      const xpEarned = this.gamificationService.calculateXP(correctCount, currentStreak);

      // Check and award badges based on streak milestones
      let newBadges = [];
      try {
        const longestStreak = currentStreak; // Use current as longest for now
        newBadges = await this.gamificationService.checkAndAwardBadges(
          session.userId,
          longestStreak,
        );
      } catch (err) {
        const logger = (await import("../../utils/logger.js")).createLogger("QuizSessionService");
        logger.warn("Failed to award badges (non-critical)", {
          error: err.message,
          userId: session.userId,
        });
      }

      // Roll mystery box (accuracy-based rates: 3%/5%/8%/10%)
      const mysteryBox = this.gamificationService.checkMysteryBoxDrop(accuracyRate);

      // Update streak (48h grace period, increment or reset)
      // Story 15.11 Flow 2 Step 5e: Update Streak
      if (this.streakService) {
        try {
          await this.streakService.updateStreak(session.userId);
        } catch (err) {
          const logger = (await import("../../utils/logger.js")).createLogger("QuizSessionService");
          logger.warn("Failed to update streak (non-critical)", {
            error: err.message,
            userId: session.userId,
          });
        }
      }

      // Check freeze award (10 consecutive perfect sessions)
      // Story 15.11 Flow 2 Step 5f: Check Freeze Award
      let freezeAwarded = false;
      if (accuracyRate === 100 && this.streakService) {
        try {
          freezeAwarded = await this.streakService.checkAndAwardFreeze(session.userId);
        } catch (err) {
          const logger = (await import("../../utils/logger.js")).createLogger("QuizSessionService");
          logger.warn("Failed to check freeze award (non-critical)", {
            error: err.message,
            userId: session.userId,
          });
        }
      }

      gamificationData = {
        xpEarned,
        newBadges,
        mysteryBox,
        freezeAwarded,
        currentStreak,
      };

      // Flow 5: Persist session summary to database (7-day TTL for review mistakes)
      if (this.summaryRepository) {
        try {
          const completedAt = new Date();
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 7); // 7-day TTL

          await this.summaryRepository.create({
            userId: session.userId,
            sessionId,
            completedAt,
            totalQuestions: session.questions.length,
            correctCount,
            incorrectCount: allAnswers.length - correctCount,
            accuracyRate,
            xpEarned,
            newBadgeIds: newBadges.map((b) => b.id),
            mysteryBoxDrop: !!mysteryBox,
            mysteryBoxType: mysteryBox?.rewardType || null,
            freezeAwarded,
            expiresAt,
            // incorrectWords and leechWordIds removed — derived from QuizSessionAnswer at query time
          });
        } catch (err) {
          const logger = (await import("../../utils/logger.js")).createLogger("QuizSessionService");
          logger.warn("Failed to persist session summary (non-critical)", {
            error: err.message,
            sessionId,
          });
        }
      }
    }

    // Get next question (if any)
    const nextQuestion = !isComplete
      ? QuizSession.sanitizeQuestionsForClient([session.questions[newIndex]])[0]
      : null;

    // Return response with flat structure (aligned with type audit)
    return {
      correct: isCorrect,
      correctAnswer: this._getCorrectAnswer(question),
      // Flat progress properties (not nested in feedback object)
      nextReviewDate: progressUpdate.nextReviewDate,
      lapseCount: progressUpdate.lapseCount,
      isLeech: progressUpdate.isLeech,
      // Gamification (only if session complete)
      gamification: gamificationData,
      // AI feedback (only if incorrect)
      aiFeedback: aiFeedback
        ? {
            explanation: aiFeedback.explanation,
            errorType: aiFeedback.errorType,
          }
        : null,
      nextQuestion,
      sessionComplete: isComplete,
      progress: {
        current: newIndex,
        total: session.questions.length,
      },
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
   * Get session summary with calculated statistics
   * Story 15.11: Move business logic to backend - session metrics calculation
   *
   * @param {string} sessionId - Session ID
   * @returns {Promise<object>} Session summary with accuracy, XP, leech words, etc.
   * @throws {Error} If session not found
   */
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
    // Flow 5: Try to read from database first (faster, already calculated)
    if (this.summaryRepository) {
      try {
        const summary = await this.summaryRepository.findBySessionIdAndUserId(sessionId, userId);
        if (summary) {
          // Fetch current streak and available freezes (dynamic data)
          let currentStreak = 0;
          let availableFreezes = 0;

          if (this.streakService) {
            try {
              const streakData = await this.streakService.getStreak(userId);
              currentStreak = streakData.currentStreak || 0;
              availableFreezes = streakData.freezeCount || 0;
            } catch (error) {
              console.warn("[QuizSessionService] Failed to fetch streak data:", error.message);
            }
          }

          // Load all per-answer rows from QuizSessionAnswer table
          const dbAnswers = this.answerRepository
            ? await this.answerRepository.findBySession(sessionId)
            : [];

          const allAnswers = dbAnswers.map((a) => ({
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
            nextReview: a.nextReviewDate?.toISOString() || null,
          }));

          const incorrectWords = allAnswers.filter((a) => !a.correct);
          const leechWordIds = [
            ...new Set(allAnswers.filter((a) => a.isLeech).map((a) => a.wordId)),
          ];

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
            newBadges: [],
            mysteryBox: summary.mysteryBoxDrop
              ? {
                  rewardType: summary.mysteryBoxType,
                  rewardValue: null,
                  opened: null,
                }
              : null,
            currentStreak,
            availableFreezes,
            completedAt: summary.completedAt.toISOString(),
            expiresAt: summary.expiresAt.toISOString(),
          };
        }
      } catch (err) {
        const logger = (await import("../../utils/logger.js")).createLogger("QuizSessionService");
        logger.warn("Failed to read summary from database, falling back to recalculation", {
          error: err.message,
          sessionId,
        });
      }
    }

    // Fallback: Calculate from session questions + QuizSessionAnswer rows
    const session = await this.sessionRepository.findByIdAndUserId(sessionId, userId, {
      includeAnswers: true,
      includeQuestions: true,
      includeWords: true,
    });

    if (!session) {
      const error = new Error("Session not found");
      error.statusCode = 404;
      throw error;
    }

    // Fetch current streak and available freezes
    let currentStreak = 0;
    let availableFreezes = 0;

    if (this.streakService) {
      try {
        const streakData = await this.streakService.getStreak(userId);
        currentStreak = streakData.currentStreak || 0;
        availableFreezes = streakData.freezeCount || 0;
      } catch (error) {
        console.warn("[QuizSessionService] Failed to fetch streak data:", error.message);
      }
    }

    // Load answer rows (empty for sessions before migration)
    const dbAnswers = this.answerRepository
      ? await this.answerRepository.findBySession(sessionId)
      : [];

    const allAnswers = dbAnswers.map((a) => ({
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
      nextReview: a.nextReviewDate?.toISOString() || null,
    }));

    const correctCount = allAnswers.filter((a) => a.correct).length;
    const incorrectCount = allAnswers.filter((a) => !a.correct).length;
    const totalQuestions = session.questions.length;
    const accuracyRate =
      totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 10000) / 100 : 0;

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
      completedAt: session.completedAt?.toISOString() || new Date().toISOString(),
      expiresAt: session.expiresAt?.toISOString() || new Date().toISOString(),
    };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Generate interleaved questions (3 types per word, shuffled)
   * Fisher-Yates shuffle per word for consistent randomization
   * @private
   * @param {Array} words - Due words array
   * @returns {Array} Interleaved questions
   */
  _generateInterleavedQuestions(words) {
    const questionTypes = ["multiple_choice", "type_pinyin", "type_character"];

    return words.map((word, index) => {
      // Pick one random question type per word
      const questionType = questionTypes[Math.floor(Math.random() * questionTypes.length)];

      // Generate MC options: 1 correct + 3 distractors from other words
      let options;
      if (questionType === "multiple_choice") {
        const distractors = words
          .filter((_, i) => i !== index)
          .sort(() => Math.random() - 0.5)
          .slice(0, 3)
          .map((w) => w.english);
        options = [...distractors, word.english].sort(() => Math.random() - 0.5);
      }

      return {
        id: `${word.id}_${questionType}`,
        wordId: word.id,
        questionType,
        word: {
          id: word.id,
          simplified: word.simplified,
          traditional: word.traditional,
          pinyin: word.pinyin,
          english: word.english,
        },
        correctAnswer: this._getCorrectAnswerForType(word, questionType),
        ...(options && { options }),
      };
    });
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
   * Get correct answer from question object
   * @private
   * @param {object} question - Question object
   * @returns {string} Correct answer
   */
  _getCorrectAnswer(question) {
    return question.correctAnswer;
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

    // Handle multi-answer support (semicolon or comma separated)
    if (
      typeof normalizedCorrect === "string" &&
      (normalizedCorrect.includes(";") || normalizedCorrect.includes(","))
    ) {
      const acceptableAnswers = normalizedCorrect.split(/[;,]/).map((ans) => ans.trim());
      return acceptableAnswers.some((acceptable) =>
        this._answersMatch(normalizedUser, acceptable, questionType),
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
