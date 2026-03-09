/**
 * LearningService (Core Layer)
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

import { isLeech, LEECH_THRESHOLD } from "../domain/constants/BusinessRules.js";

export class LearningService {
  constructor(progressRepository, quizResultRepository, vocabularyRepository) {
    this.progressRepository = progressRepository; // IProgressRepository
    this.quizResultRepository = quizResultRepository; // IQuizResultRepository
    this.vocabularyRepository = vocabularyRepository; // IVocabularyRepository
  }

  // ============================================================================
  // Spaced Repetition Algorithm
  // ============================================================================

  /**
   * Calculate next review date using exponential backoff spaced repetition
   * Story 15.11: Exponential backoff algorithm for quiz-based learning
   *
   * Formula: newDelay = correct ? min(365, currentDelay * 2) : 1
   * - Correct answer: Double the interval (exponential backoff), capped at 365 days
   * - Incorrect answer: Reset to 1 day (immediate review)
   *
   * Progression example: 1 → 2 → 4 → 8 → 16 → 32 → 64 → 128 → 256 → 365 days
   *
   * @param {number} currentDelay - Current delay in days (from progress.currentDelay)
   * @param {boolean} correct - Whether the answer was correct
   * @returns {Date} - Next review date
   */
  calculateNextReview(currentDelay, correct) {
    const maxDays = 365; // One year maximum for well-mastered words

    // Exponential backoff: double on success, reset to 1 on failure
    const delayDays = correct ? Math.min(maxDays, currentDelay * 2) : 1;

    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + delayDays);
    return nextReview;
  }

  // ============================================================================
  // Public API - Quiz Learning Operations
  // ============================================================================

  /**
   * Record a quiz result and update progress with exponential backoff spaced repetition
   * Story 15.11: Quiz-based learning with proper delay compounding
   *
   * Uses exponential backoff:
   * - Correct answer: Double the interval (currentDelay * 2), capped at 365 days
   * - Incorrect answer: Reset to 1 day (immediate review)
   *
   * Progression example: 1 → 2 → 4 → 8 → 16 → 32 → 64 → 128 → 256 → 365 days
   *
   * @param {object} data - Quiz result data
   * @param {string} data.userId - User ID
   * @param {string} data.wordId - Word ID
   * @param {boolean} data.correct - Whether answer was correct
   * @param {string} data.questionType - Question type (multiple_choice, type_pinyin, type_character)
   * @param {number} [data.timeSpentMs] - Time spent on question in milliseconds
   * @returns {Promise<object>} Updated progress with { nextReviewDate, lapseCount, isLeech }
   */
  async recordQuizResult(data) {
    const { userId, wordId, correct, questionType, timeSpentMs } = data;

    // Get current progress (or null if word never studied)
    const currentProgress = await this.progressRepository.findByUserAndWord(userId, wordId);

    // Get current delay (default to 1 day for new words)
    const currentDelay = currentProgress?.currentDelay || 1;

    // Calculate next review using exponential backoff
    const nextReview = this.calculateNextReview(currentDelay, correct);

    // Calculate new delay in days
    const delayDays = Math.round((nextReview - new Date()) / (1000 * 60 * 60 * 24));

    // Update lapse count (increment on incorrect, reset on correct)
    const lapseCount = correct ? 0 : (currentProgress?.lapseCount || 0) + 1;

    // Update progress with new values
    const updatedProgress = await this.progressRepository.upsert(userId, wordId, {
      studyCount: (currentProgress?.studyCount || 0) + 1,
      correctCount: correct
        ? (currentProgress?.correctCount || 0) + 1
        : currentProgress?.correctCount,
      nextReview,
      lapseCount,
      currentDelay: delayDays,
      confidence: currentProgress?.confidence || 0, // Preserve legacy flashcard data
    });

    // Return result summary (use database values to ensure consistency)
    return {
      nextReviewDate: updatedProgress.nextReview,
      lapseCount: updatedProgress.lapseCount,
      isLeech: isLeech(updatedProgress.lapseCount),
    };
  }

  /**
   * Get vocabulary words due for review
   * Story 15.8: Enhanced with 70/30 strategy (70% due words, 30% new words)
   * Story 15.11 Phase 8: Moved to LearningService for quiz-specific logic
   *
   * @param {string} userId - User ID
   * @param {Date} date - Target date (defaults to today)
   * @param {number} [limit=10] - Maximum words to return
   * @returns {Promise<Array>} Enriched words with progress data
   */
  async getDueWords(userId, date = new Date(), limit = 10) {
    // Fetch due progress records
    let progressRecords = await this.progressRepository.findDueByUserAndDate(userId, date, limit);

    // Backfill with new words if needed (70/30 strategy)
    const newWordsNeeded = this._calculateNewWordsNeeded(progressRecords.length, limit);
    if (newWordsNeeded > 0) {
      const newProgressRecords = await this._backfillWithNewWords(userId, newWordsNeeded);
      progressRecords = [...progressRecords, ...newProgressRecords];
    }

    // Enrich with vocabulary details
    return this._enrichProgressWithVocabulary(progressRecords);
  }

  /**
   * Get user's struggling vocabulary (leeches)
   * Story 15.2: Identify words with high lapse count
   * Story 15.11 Phase 8: Moved to LearningService for quiz-specific logic
   *
   * @param {string} userId - User ID
   * @param {number} [minLapseCount=5] - Minimum lapses to qualify as leech
   * @param {number} [limit=20] - Maximum leeches to return
   * @returns {Promise<Array>} Enriched leech words with progress data
   */
  async getLeechesByUser(userId, minLapseCount = 5, limit = 20) {
    // Fetch progress records with high lapse count
    const progressRecords = await this.progressRepository.findLeechesByUser(
      userId,
      minLapseCount,
      limit,
    );

    if (!this.vocabularyRepository) {
      return progressRecords; // Return raw if vocabulary not available
    }

    // Batch fetch vocabulary words
    const wordIds = progressRecords.map((p) => p.wordId);
    const words = await this.vocabularyRepository.findByIds(wordIds);
    const wordMap = new Map(words.map((w) => [w.id, w]));

    // Merge progress + vocabulary data (includes correctCount for leeches)
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

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Calculate how many new words needed based on 70/30 review/new strategy
   * @private
   * @param {number} currentCount - Current number of due words
   * @param {number} limit - Target limit
   * @returns {number} Number of new words to add
   */
  _calculateNewWordsNeeded(currentCount, limit) {
    if (currentCount >= limit || !this.vocabularyRepository) {
      return 0;
    }

    const targetNewWords = Math.ceil(limit * 0.3); // 30% of limit
    const availableSlots = limit - currentCount;
    return Math.min(targetNewWords, availableSlots);
  }

  /**
   * Backfill progress with new unlearned words
   * @private
   * @param {string} userId - User ID
   * @param {number} count - Number of new words to add
   * @returns {Promise<Array>} Array of newly created progress records
   */
  async _backfillWithNewWords(userId, count) {
    // Get learned word IDs
    const allProgress = await this.progressRepository.findByUser(userId);
    const learnedWordIds = allProgress.map((p) => p.wordId);

    // Fetch unlearned words
    const unlearnedWords = await this.vocabularyRepository.findUnlearnedWords(
      learnedWordIds,
      count,
    );

    // Create initial progress for each new word
    const newProgressRecords = [];
    for (const word of unlearnedWords) {
      const progress = await this._createInitialProgress(userId, word.id);
      newProgressRecords.push(progress);
    }

    return newProgressRecords;
  }

  /**
   * Create initial progress record for a new word
   * @private
   * @param {string} userId - User ID
   * @param {number} wordId - Vocabulary word ID
   * @returns {Promise<Object>} Created progress record
   */
  async _createInitialProgress(userId, wordId) {
    return await this.progressRepository.upsert(userId, wordId, {
      studyCount: 0,
      correctCount: 0,
      confidence: 0,
      nextReview: new Date(), // Due immediately for first quiz
      lapseCount: 0,
      currentDelay: 1, // Initial 1-day delay
    });
  }

  /**
   * Enrich progress records with vocabulary details (batch operation)
   * @private
   * @param {Array} progressRecords - Progress records to enrich
   * @returns {Promise<Array>} Enriched records with vocabulary data
   */
  async _enrichProgressWithVocabulary(progressRecords) {
    if (!this.vocabularyRepository) {
      return progressRecords; // Return raw if vocabulary not available
    }

    // Batch fetch vocabulary words
    const wordIds = progressRecords.map((p) => p.wordId);
    const words = await this.vocabularyRepository.findByIds(wordIds);
    const wordMap = new Map(words.map((w) => [w.id, w]));

    // Merge progress + vocabulary data
    return progressRecords
      .map((progress) => this._mergeProgressWithVocabulary(progress, wordMap))
      .filter(Boolean);
  }

  /**
   * Merge single progress record with vocabulary data
   * @private
   * @param {Object} progress - Progress record
   * @param {Map} wordMap - Map of word ID to vocabulary data
   * @returns {Object|null} Merged record or null if word not found
   */
  _mergeProgressWithVocabulary(progress, wordMap) {
    const word = wordMap.get(progress.wordId);
    if (!word) return null; // Skip missing vocabulary

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
