/**
 * SummaryService (Domain Layer)
 * Handles session summary calculation, gamification processing, and streak data.
 * Extracted from QuizSessionOrchestrator during god service decomposition (BE7).
 *
 * Responsibilities:
 * - Calculate and retrieve session summaries
 * - Process session completion gamification (XP, badges, mystery boxes, freezes)
 * - Fetch streak data for summary responses
 *
 * Clean Architecture: Domain Layer - Use Case / Application Service
 *
 * Dependencies injected via options object:
 * - summaryRepository    IQuizSessionSummaryRepository
 * - streakService        StreakService (optional)
 * - gamificationService  GamificationService
 * - answerRepository     IQuizSessionAnswerRepository (optional)
 * - sessionRepository    IQuizSessionRepository (for fallback summary path)
 */

import { calculateAccuracy, PERFECT_ACCURACY } from "../../gamification/domain/BusinessRules.js";
import { createLogger } from "../../../shared/utils/logger.js";

export class SummaryService {
  /**
   * @param {object} deps - Injected dependencies
   * @param {object} [deps.summaryRepository]   - IQuizSessionSummaryRepository (optional)
   * @param {object} [deps.streakService]       - StreakService (optional)
   * @param {object} deps.gamificationService   - GamificationService instance
   * @param {object} [deps.answerRepository]    - IQuizSessionAnswerRepository (optional)
   * @param {object} [deps.sessionRepository]   - IQuizSessionRepository (for fallback summary path)
   */
  constructor({
    summaryRepository = null,
    streakService = null,
    gamificationService,
    answerRepository = null,
    sessionRepository = null,
  }) {
    this.summaryRepository = summaryRepository;
    this.streakService = streakService;
    this.gamificationService = gamificationService;
    this.answerRepository = answerRepository;
    this.sessionRepository = sessionRepository;
    this.logger = createLogger("SummaryService");
  }

  // ============================================================================
  // Public API
  // ============================================================================

  /**
   * Get session summary with gamification data
   *
   * @param {string} sessionId - Session ID
   * @param {string} userId    - User ID for authorization
   * @returns {Promise<object>} Session summary with all gamification data
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

  /**
   * Process gamification pipeline on session completion:
   * update streak → calculate XP → award badges →
   * roll mystery box → check freeze → persist summary
   *
   * @param {string} sessionId - Session ID
   * @param {object} session   - Session data (questions, userId)
   * @returns {Promise<object>} Gamification result for the response
   */
  async processSessionCompletion(sessionId, session) {
    const allAnswers = this.answerRepository
      ? await this.answerRepository.findBySession(sessionId)
      : [];

    const correctCount = allAnswers.filter((a) => a.correct).length;
    const accuracyRate = calculateAccuracy(correctCount, session.questions.length);

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

    const xpEarned = this.gamificationService.calculateXP(
      correctCount,
      updatedStreak.currentStreak,
    );

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

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

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
      xpEarned: 0,
      newBadges: [],
      mysteryBox: null,
      currentStreak,
      availableFreezes,
      freezeAwarded: false,
    };
  }

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
}

export default SummaryService;
