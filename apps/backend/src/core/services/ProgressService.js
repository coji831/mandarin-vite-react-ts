/**
 * ProgressService (Core Layer)
 * Business logic for vocabulary progress tracking with spaced repetition.
 * Framework-agnostic service that depends on IProgressRepository interface.
 *
 * Story 15.1: Supports unified spaced repetition algorithm for both flashcard (confidence-based)
 * and quiz (performance-based) systems with automatic feature detection.
 * Story 15.2: Added quiz API support methods (getDueWords, getLeechesByUser)
 */

export class ProgressService {
  constructor(repository, quizResultRepository = null, vocabularyRepository = null) {
    this.repository = repository; // IProgressRepository
    this.quizResultRepository = quizResultRepository; // IQuizResultRepository (optional, for quiz support)
    this.vocabularyRepository = vocabularyRepository; // IVocabularyRepository (optional, for enrichment)
  }

  /**
   * Calculate next review date using unified spaced repetition algorithm
   * Story 15.1: Refactored to support both flashcard and quiz systems
   *
   * Formula: days = 1 + (30 - 1) * performanceMultiplier
   * - Flashcard mode: performanceMultiplier = confidence² (pass confidence, multiplier null)
   * - Quiz mode: performanceMultiplier = explicit value (pass any confidence, multiplier provided)
   *
   * @param {number} confidence - Confidence score (0.0 - 1.0) for flashcard mode
   * @param {number|null} performanceMultiplier - Explicit multiplier for quiz mode (overrides confidence²)
   * @returns {Date} - Next review date
   */
  calculateNextReview(confidence, performanceMultiplier = null) {
    const minDays = 1;
    const maxDays = 30;

    // Use explicit multiplier if provided (quiz mode), otherwise compute from confidence (flashcard mode)
    const multiplier =
      performanceMultiplier !== null
        ? performanceMultiplier
        : confidence !== null
          ? Math.pow(confidence, 2)
          : 1.0;

    const days = minDays + (maxDays - minDays) * multiplier;

    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + Math.round(days));
    return nextReview;
  }

  /**
   * Calculate mastery statistics for a user's progress on a vocabulary list
   * @param {string} userId - User ID
   * @param {string} listId - List ID (for context, not used in query)
   * @param {string[]} wordIds - Array of word IDs in the list
   * @returns {Promise<object>} Mastery statistics
   */
  async calculateMasteryStats(userId, listId, wordIds) {
    const progress = await this.repository.findByUser(userId);
    const masteredWords = wordIds.filter((wordId) => {
      const p = progress.find((pr) => pr.wordId === wordId);
      return p && (p.confidence >= 0.8 || p.correctCount >= 3);
    });

    return {
      masteredCount: masteredWords.length,
      totalWords: wordIds.length,
      progressPercent: Math.round((masteredWords.length / wordIds.length) * 100),
    };
  }

  async getProgressForUser(userId) {
    return this.repository.findByUser(userId);
  }

  async getProgressForWord(userId, wordId) {
    return this.repository.findByUserAndWord(userId, wordId);
  }

  async updateProgress(userId, wordId, data) {
    const { studyCount, correctCount, confidence } = data;
    const nextReview = confidence !== undefined ? this.calculateNextReview(confidence) : undefined;

    return this.repository.upsert(userId, wordId, {
      ...(studyCount !== undefined && { studyCount }),
      ...(correctCount !== undefined && { correctCount }),
      ...(confidence !== undefined && { confidence }),
      ...(nextReview && { nextReview }),
    });
  }

  async deleteProgress(userId, wordId) {
    return await this.repository.deleteByUserAndWord(userId, wordId);
  }

  async batchUpdateProgress(userId, updates) {
    const operations = updates.map((update) => {
      const { wordId, studyCount, correctCount, confidence } = update;
      const nextReview =
        confidence !== undefined ? this.calculateNextReview(confidence) : undefined;

      return this.repository.upsert(userId, wordId, {
        ...(studyCount !== undefined && { studyCount }),
        ...(correctCount !== undefined && { correctCount }),
        ...(confidence !== undefined && { confidence }),
        ...(nextReview && { nextReview }),
      });
    });

    return Promise.all(operations);
  }

  async getProgressStats(userId) {
    const allProgress = await this.repository.findByUser(userId);
    const now = new Date();
    const totalWords = allProgress.length;
    const studiedWords = allProgress.filter((p) => p.studyCount > 0).length;
    const masteredWords = allProgress.filter((p) => p.confidence >= 0.8).length;
    const totalStudyCount = allProgress.reduce((sum, p) => sum + p.studyCount, 0);
    const averageConfidence =
      totalWords > 0 ? allProgress.reduce((sum, p) => sum + p.confidence, 0) / totalWords : 0;
    const wordsToReviewToday = allProgress.filter((p) => new Date(p.nextReview) <= now).length;

    return {
      totalWords,
      studiedWords,
      masteredWords,
      totalStudyCount,
      averageConfidence,
      wordsToReviewToday,
    };
  }

  /**
   * Record a quiz result and update progress with quiz-specific spaced repetition
   * Story 15.1: New method for quiz system integration
   *
   * Uses performance-based multipliers:
   * - Correct answer: 2.0x (aggressive spacing) → 30 days
   * - Incorrect answer: 0.0x (immediate review) → 1 day
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

    if (!this.quizResultRepository) {
      throw new Error("QuizResultRepository not injected - quiz support disabled");
    }

    // Get current progress (or null if word never studied)
    const currentProgress = await this.repository.findByUserAndWord(userId, wordId);

    // Calculate performance multiplier (quiz-specific values)
    // Normalized to 0.0-1.0 scale for use with unified formula
    const performanceMultiplier = correct ? 1.0 : 0.0; // 1.0 = max days (30), 0.0 = min days (1)

    // Calculate next review using unified algorithm
    const nextReview = this.calculateNextReview(0, performanceMultiplier);

    // Calculate delay in days
    const delayDays = Math.round((nextReview - new Date()) / (1000 * 60 * 60 * 24));

    // Update lapse count (increment on incorrect, reset on correct)
    const lapseCount = correct ? 0 : (currentProgress?.lapseCount || 0) + 1;

    // Update progress with new values
    const updatedProgress = await this.repository.upsert(userId, wordId, {
      studyCount: (currentProgress?.studyCount || 0) + 1,
      correctCount: correct
        ? (currentProgress?.correctCount || 0) + 1
        : currentProgress?.correctCount,
      nextReview,
      lapseCount,
      currentDelay: delayDays,
      confidence: currentProgress?.confidence || 0, // Preserve flashcard confidence
    });

    // Insert quiz result audit record
    await this.quizResultRepository.create({
      userId,
      wordId,
      correct,
      questionType,
      timeSpentMs,
    });

    // Return result summary
    return {
      nextReviewDate: nextReview,
      lapseCount,
      isLeech: lapseCount >= 5,
    };
  }

  /**
   * Get vocabulary words due for review
   * Story 15.8: Enhanced with 70/30 strategy (70% due words, 30% new words)
   *
   * @param {string} userId - User ID
   * @param {Date} date - Target date (defaults to today)
   * @param {number} [limit=10] - Maximum words to return
   * @returns {Promise<Array>} Enriched words with progress data
   */
  async getDueWords(userId, date = new Date(), limit = 10) {
    // Fetch progress records where nextReview <= date
    let progressRecords = await this.repository.findDueByUserAndDate(userId, date, limit);

    // Story 15.8: Backfill with new words if fewer than requested (70/30 strategy)
    // Target: 70% review, 30% new words to prevent stagnation
    if (progressRecords.length < limit && this.vocabularyRepository) {
      const targetNewWords = Math.ceil(limit * 0.3); // 30% of limit
      const availableSlots = limit - progressRecords.length;
      const newWordsNeeded = Math.min(targetNewWords, availableSlots);

      const newWords = await this.getUnlearnedWords(userId, newWordsNeeded);

      // Auto-create initial progress for new words
      for (const word of newWords) {
        const initialProgress = await this.repository.upsert(userId, word.id, {
          studyCount: 0,
          correctCount: 0,
          confidence: 0,
          nextReview: new Date(), // Due immediately for first quiz
          lapseCount: 0,
          currentDelay: 1, // Initial 1-day delay
        });

        // Add to progress records for enrichment
        progressRecords.push(initialProgress);
      }
    }

    if (!this.vocabularyRepository) {
      // Return raw progress if vocabulary repository not available
      return progressRecords;
    }

    // Enrich with vocabulary details (batch operation)
    const wordIds = progressRecords.map((p) => p.wordId);
    const words = await this.vocabularyRepository.findByIds(wordIds);

    // Create lookup map for O(1) access
    const wordMap = new Map(words.map((w) => [w.id, w]));

    // Merge progress + vocabulary data
    return progressRecords
      .map((progress) => {
        const word = wordMap.get(progress.wordId);
        if (!word) return null; // Skip words that don't exist in vocabulary

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
      })
      .filter(Boolean); // Remove null entries
  }

  /**
   * Get unlearned vocabulary words (words without progress records)
   * Story 15.8: Helper method for new word introduction
   *
   * @param {string} userId - User ID
   * @param {number} limit - Maximum words to return
   * @returns {Promise<Array>} Vocabulary words without progress
   */
  async getUnlearnedWords(userId, limit = 10) {
    if (!this.vocabularyRepository) {
      return [];
    }

    // Get all wordIds user has studied
    const allProgress = await this.repository.findMany({ userId });
    const learnedWordIds = new Set(allProgress.map((p) => p.wordId));

    // Import prisma client to query vocabulary without progress
    const { prisma } = await import("../../infrastructure/database/client.js");

    // Fetch random vocabulary words that user hasn't studied
    const unlearnedWords = await prisma.vocabularyWord.findMany({
      where: {
        id: {
          notIn: Array.from(learnedWordIds),
        },
      },
      take: limit,
      orderBy: {
        id: "asc", // Simple ordering for consistency
      },
    });

    return unlearnedWords;
  }

  /**
   * Get user's struggling vocabulary (leeches)
   * Story 15.2: New method for quiz system
   *
   * @param {string} userId - User ID
   * @param {number} [minLapseCount=5] - Minimum lapses to qualify as leech
   * @param {number} [limit=20] - Maximum leeches to return
   * @returns {Promise<Array>} Enriched leech words with progress data
   */
  async getLeechesByUser(userId, minLapseCount = 5, limit = 20) {
    // Fetch progress records with high lapse count
    const progressRecords = await this.repository.findLeechesByUser(userId, minLapseCount, limit);

    if (!this.vocabularyRepository) {
      // Return raw progress if vocabulary repository not available
      return progressRecords;
    }

    // Enrich with vocabulary details (batch operation)
    const wordIds = progressRecords.map((p) => p.wordId);
    const words = await this.vocabularyRepository.findByIds(wordIds);

    // Create lookup map
    const wordMap = new Map(words.map((w) => [w.id, w]));

    // Merge progress + vocabulary data
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
   * Determine which algorithm should be used for a word (quiz vs flashcard)
   * Story 15.1: Feature detection based on most recent activity timestamp
   *
   * Rule: "Most recent activity type wins"
   * - If latest quiz result is newer than progress.updatedAt → use quiz algorithm
   * - Otherwise → use flashcard algorithm
   *
   * @param {string} userId - User ID
   * @param {string} wordId - Word ID
   * @returns {Promise<string>} Algorithm mode: 'quiz' or 'flashcard'
   */
  async determineAlgorithmMode(userId, wordId) {
    if (!this.quizResultRepository) {
      return "flashcard"; // No quiz support, default to flashcard
    }

    const latestQuiz = await this.quizResultRepository.findLatestByUserAndWord(userId, wordId);
    const progress = await this.repository.findByUserAndWord(userId, wordId);

    // No quiz results exist → flashcard mode
    if (!latestQuiz) {
      return "flashcard";
    }

    // No progress record → quiz mode (quiz result is only activity)
    if (!progress) {
      return "quiz";
    }

    // Compare timestamps: most recent activity wins
    const quizTimestamp = new Date(latestQuiz.answeredAt).getTime();
    const flashcardTimestamp = new Date(progress.updatedAt).getTime();

    return quizTimestamp > flashcardTimestamp ? "quiz" : "flashcard";
  }
}

export default ProgressService;
