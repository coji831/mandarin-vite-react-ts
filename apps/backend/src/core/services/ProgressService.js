/**
 * ProgressService (Core Layer)
 * Business logic for vocabulary progress tracking with spaced repetition.
 * Framework-agnostic service that depends on IProgressRepository interface.
 */

export class ProgressService {
  constructor(repository) {
    this.repository = repository; // IProgressRepository
  }

  /**
   * Calculate next review date based on confidence level using spaced repetition
   * @param {number} confidence - Confidence score (0.0 - 1.0)
   * @returns {Date} - Next review date
   */
  calculateNextReview(confidence) {
    const minDays = 1;
    const maxDays = 30;
    const days = minDays + (maxDays - minDays) * Math.pow(confidence, 2);

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
}

export default ProgressService;
