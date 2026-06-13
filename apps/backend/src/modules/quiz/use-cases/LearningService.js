/**
 * LearningService (Domain Layer)
 * Business logic for quiz-based learning with spaced repetition algorithm.
 * Manages quiz results, due word selection, and leech identification.
 *
 * Story 15.11 Phase 8: Extracted from ProgressService for separation of concerns
 * - ProgressService: Basic CRUD operations (flashcards, direct updates, stats)
 * - LearningService: Quiz-based learning with spaced repetition (quiz system)
 *
 * Responsibilities:
 * - Record quiz results and update progress with exponential backoff
 * - Calculate next review dates using spaced repetition algorithm
 * - Fetch due words with 70/30 review/new strategy
 * - Identify struggling words (leeches) based on lapse count
 */

import {
  isLeech,
  LEECH_THRESHOLD,
  SRS_MAX_INTERVAL_DAYS,
  SRS_LAPSE_RESET_DAYS,
  NEW_WORDS_RATIO,
} from "../../gamification/domain/BusinessRules.js";

export class LearningService {
  constructor(progressRepository, wordRepository) {
    this.progressRepository = progressRepository;
    this.wordRepository = wordRepository;
  }

  // ============================================================================
  // Spaced Repetition Algorithm
  // ============================================================================

  /**
   * Calculate next review date using exponential backoff spaced repetition
   *
   * Formula: newDelay = correct ? min(365, currentDelay * 2) : 1
   * - Correct answer: Double the interval (exponential backoff), capped at 365 days
   * - Incorrect answer: Reset to 1 day (immediate review)
   *
   * @param {number} currentDelay - Current delay in days
   * @param {boolean} correct - Whether the answer was correct
   * @returns {Date} - Next review date
   */
  calculateNextReview(currentDelay, correct) {
    const delayDays = correct
      ? Math.min(SRS_MAX_INTERVAL_DAYS, currentDelay * 2)
      : SRS_LAPSE_RESET_DAYS;

    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + delayDays);
    return nextReview;
  }

  // ============================================================================
  // Public API - Quiz Learning Operations
  // ============================================================================

  /**
   * Record a quiz result and update progress with exponential backoff spaced repetition
   *
   * @param {object} data - Quiz result data
   * @param {string} data.userId - User ID
   * @param {string} data.wordId - Word ID
   * @param {boolean} data.correct - Whether answer was correct
   * @param {string} data.questionType - Question type
   * @param {number} [data.timeSpentMs] - Time spent on question in milliseconds
   * @returns {Promise<object>} Updated progress with { nextReviewDate, lapseCount, isLeech }
   */
  async recordQuizResult(data) {
    const { userId, wordId, correct, questionType, timeSpentMs } = data;

    const currentProgress = await this.progressRepository.findByUserAndWord(userId, wordId);
    const currentDelay = currentProgress?.currentDelay || 1;
    const nextReview = this.calculateNextReview(currentDelay, correct);
    const delayDays = Math.round((nextReview - new Date()) / (1000 * 60 * 60 * 24));
    const lapseCount = correct ? 0 : (currentProgress?.lapseCount || 0) + 1;

    const updatedProgress = await this.progressRepository.upsert(userId, wordId, {
      studyCount: (currentProgress?.studyCount || 0) + 1,
      correctCount: correct
        ? (currentProgress?.correctCount || 0) + 1
        : currentProgress?.correctCount,
      nextReview,
      lapseCount,
      currentDelay: delayDays,
      confidence: currentProgress?.confidence || 0,
    });

    return {
      nextReviewDate: updatedProgress.nextReview,
      lapseCount: updatedProgress.lapseCount,
      isLeech: isLeech(updatedProgress.lapseCount),
    };
  }

  /**
   * Get vocabulary words due for review
   *
   * @param {string} userId - User ID
   * @param {Date} date - Target date (defaults to today)
   * @param {number} [limit=10] - Maximum words to return
   * @returns {Promise<Array>} Enriched words with progress data
   */
  async getDueWords(userId, date = new Date(), limit = 10) {
    let progressRecords = await this.progressRepository.findDueByUserAndDate(userId, date, limit);

    const newWordsNeeded = this._calculateNewWordsNeeded(progressRecords.length, limit);
    if (newWordsNeeded > 0) {
      const newProgressRecords = await this._backfillWithNewWords(userId, newWordsNeeded);
      progressRecords = [...progressRecords, ...newProgressRecords];
    }

    return this._enrichProgressWithVocabulary(progressRecords);
  }

  /**
   * Get user's struggling vocabulary (leeches)
   *
   * @param {string} userId - User ID
   * @param {number} [minLapseCount=5] - Minimum lapses to qualify as leech
   * @param {number} [limit=20] - Maximum leeches to return
   * @returns {Promise<Array>} Enriched leech words with progress data
   */
  async getLeechesByUser(userId, minLapseCount = 5, limit = 20) {
    const progressRecords = await this.progressRepository.findLeechesByUser(
      userId,
      minLapseCount,
      limit,
    );

    if (!this.wordRepository) {
      return progressRecords;
    }

    const wordIds = progressRecords.map((p) => p.wordId);
    const words = await this.wordRepository.findByIds(wordIds);
    const wordMap = new Map(words.map((w) => [w.id, w]));

    return progressRecords
      .map((progress) => {
        const word = wordMap.get(progress.wordId);
        if (!word) return null;

        return {
          id: word.id,
          simplified: word.simplified,
          traditional: word.traditional,
          pinyin: word.pinyin,
          english: word.english,
          lapseCount: progress.lapseCount,
          studyCount: progress.studyCount,
          correctCount: progress.correctCount || 0,
          nextReview: progress.nextReview,
          categories: word.categories?.map((wc) => wc.category?.name).filter(Boolean) || [],
        };
      })
      .filter(Boolean);
  }

  /**
   * Get vocabulary words due for review without 70/30 backfill (pure scheduled words only)
   *
   * @param {string} userId - User ID
   * @param {Date} [date] - Target date (defaults to today)
   * @param {number} [limit=10] - Maximum words to return
   * @returns {Promise<Array>} Enriched due words
   */
  async getDueWordsOnly(userId, date = new Date(), limit = 10) {
    const progressRecords = await this.progressRepository.findDueByUserAndDate(userId, date, limit);
    return this._enrichProgressWithVocabulary(progressRecords);
  }

  /**
   * Get new (unlearned) words for use in a quiz session
   *
   * @param {string} userId - User ID
   * @param {number} count - Number of new words to get
   * @returns {Promise<Array>} Enriched new words
   */
  async getNewWords(userId, count) {
    if (count <= 0) return [];
    const progressRecords = await this._backfillWithNewWords(userId, count);
    return this._enrichProgressWithVocabulary(progressRecords);
  }

  /**
   * Get review fallback words (words with future nextReview, not due today)
   *
   * @param {string} userId - User ID
   * @param {number} limit - Maximum words to return
   * @param {Set<string>} [excludeWordIds] - Word IDs to exclude (already in session)
   * @returns {Promise<Array>} Enriched review fallback words
   */
  async getReviewFallbackWords(userId, limit, excludeWordIds = new Set()) {
    try {
      const allProgress = await this.progressRepository.findByUser(userId);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const reviewableProgress = allProgress
        .filter(
          (p) => p.nextReview && new Date(p.nextReview) > today && !excludeWordIds.has(p.wordId),
        )
        .slice(0, limit);

      return this._enrichProgressWithVocabulary(reviewableProgress);
    } catch (_) {
      return [];
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  _calculateNewWordsNeeded(currentCount, limit) {
    if (currentCount >= limit || !this.wordRepository) {
      return 0;
    }

    const targetNewWords = Math.ceil(limit * NEW_WORDS_RATIO);
    const availableSlots = limit - currentCount;
    return Math.min(targetNewWords, availableSlots);
  }

  async _backfillWithNewWords(userId, count) {
    const allProgress = await this.progressRepository.findByUser(userId);
    const learnedWordIds = allProgress.map((p) => p.wordId);

    const unlearnedWords = await this.wordRepository.findUnlearnedWords(learnedWordIds, count);

    const newProgressRecords = [];
    for (const word of unlearnedWords) {
      const progress = await this._createInitialProgress(userId, word.id);
      newProgressRecords.push(progress);
    }

    return newProgressRecords;
  }

  async _createInitialProgress(userId, wordId) {
    return await this.progressRepository.upsert(userId, wordId, {
      studyCount: 0,
      correctCount: 0,
      confidence: 0,
      nextReview: new Date(),
      lapseCount: 0,
      currentDelay: 1,
    });
  }

  async _enrichProgressWithVocabulary(progressRecords) {
    if (!this.wordRepository) {
      return progressRecords;
    }

    const wordIds = progressRecords.map((p) => p.wordId);
    const words = await this.wordRepository.findByIds(wordIds);
    const wordMap = new Map(words.map((w) => [w.id, w]));

    return progressRecords
      .map((progress) => this._mergeProgressWithVocabulary(progress, wordMap))
      .filter(Boolean);
  }

  _mergeProgressWithVocabulary(progress, wordMap) {
    const word = wordMap.get(progress.wordId);
    if (!word) return null;

    return {
      id: word.id,
      simplified: word.simplified,
      traditional: word.traditional,
      pinyin: word.pinyin,
      english: word.english,
      nextReview: progress.nextReview,
      studyCount: progress.studyCount,
      lapseCount: progress.lapseCount || 0,
      currentDelay: progress.currentDelay || null,
      categories: word.categories?.map((wc) => wc.category?.name).filter(Boolean) || [],
    };
  }
}

export default LearningService;
