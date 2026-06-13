/**
 * ProgressService (Domain Layer)
 * Business logic for vocabulary progress tracking and statistics.
 * Framework-agnostic service that depends on IProgressRepository interface.
 *
 * Story 15.11 Phase 8: Simplified to focus on progress CRUD and statistics
 * - Basic progress tracking for flashcards and manual updates
 * - Progress statistics and analytics
 * - Quiz-based learning moved to LearningService
 */

export class ProgressService {
  constructor(repository) {
    this.repository = repository;
  }

  // ============================================================================
  // Basic Progress CRUD Operations
  // ============================================================================

  async getProgressForUser(userId) {
    return this.repository.findByUser(userId);
  }

  async getProgressForWord(userId, wordId) {
    return this.repository.findByUserAndWord(userId, wordId);
  }

  async updateProgress(userId, wordId, data) {
    const { studyCount, correctCount, confidence } = data;

    return this.repository.upsert(userId, wordId, {
      ...(studyCount !== undefined && { studyCount }),
      ...(correctCount !== undefined && { correctCount }),
      ...(confidence !== undefined && { confidence }),
    });
  }

  async deleteProgress(userId, wordId) {
    return await this.repository.deleteByUserAndWord(userId, wordId);
  }

  async batchUpdateProgress(userId, updates) {
    const operations = updates.map((update) => {
      const { wordId, studyCount, correctCount, confidence } = update;

      return this.repository.upsert(userId, wordId, {
        ...(studyCount !== undefined && { studyCount }),
        ...(correctCount !== undefined && { correctCount }),
        ...(confidence !== undefined && { confidence }),
      });
    });

    return Promise.all(operations);
  }

  // ============================================================================
  // Statistics & Analytics
  // ============================================================================

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
}

export default ProgressService;
