/**
 * @file apps/backend/src/services/ProgressService.js
 * @description Progress tracking service for vocabulary learning with spaced repetition
 *
 * Handles:
 * - CRUD operations for user progress records
 * - Spaced repetition algorithm (nextReview calculation)
 * - Batch updates with atomic transactions
 * - Progress statistics aggregation
 * - Per-user data isolation
 */

import { prisma } from "../models/index.js";

export class ProgressService {
  /**
   * Calculate next review date based on confidence level using spaced repetition
   * @param {number} confidence - Confidence score (0.0 - 1.0)
   * @returns {Date} - Next review date
   */
  calculateNextReview(confidence) {
    // Exponential backoff: 1 day (0% confidence) to 30 days (100% confidence)
    // Formula: days = 1 + (29 * confidence^2) for exponential curve
    const minDays = 1;
    const maxDays = 30;
    const days = minDays + (maxDays - minDays) * Math.pow(confidence, 2);

    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + Math.round(days));
    return nextReview;
  }

  /**
   * Get all progress records for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} - Array of progress records
   */
  async getProgressForUser(userId) {
    return prisma.progress.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });
  }

  /**
   * Get progress for a specific word
   * @param {string} userId - User ID
   * @param {string} wordId - Word ID
   * @returns {Promise<object|null>} - Progress record or null
   */
  async getProgressForWord(userId, wordId) {
    return prisma.progress.findUnique({
      where: {
        userId_wordId: { userId, wordId },
      },
    });
  }

  /**
   * Update or create progress for a word
   * @param {string} userId - User ID
   * @param {string} wordId - Word ID
   * @param {object} data - Progress data { studyCount?, correctCount?, confidence? }
   * @returns {Promise<object>} - Updated progress record
   */
  async updateProgress(userId, wordId, data) {
    const { studyCount, correctCount, confidence } = data;

    // Calculate nextReview if confidence is provided
    const nextReview = confidence !== undefined ? this.calculateNextReview(confidence) : undefined;

    return prisma.progress.upsert({
      where: {
        userId_wordId: { userId, wordId },
      },
      update: {
        ...(studyCount !== undefined && { studyCount }),
        ...(correctCount !== undefined && { correctCount }),
        ...(confidence !== undefined && { confidence }),
        ...(nextReview && { nextReview }),
      },
      create: {
        userId,
        wordId,
        studyCount: studyCount || 0,
        correctCount: correctCount || 0,
        confidence: confidence || 0,
        nextReview: nextReview || new Date(),
      },
    });
  }

  /**
   * Delete progress for a specific word
   * @param {string} userId - User ID
   * @param {string} wordId - Word ID
   * @returns {Promise<object|null>} - Deleted record or null if not found
   */
  async deleteProgress(userId, wordId) {
    try {
      return await prisma.progress.delete({
        where: {
          userId_wordId: { userId, wordId },
        },
      });
    } catch (error) {
      // Record not found
      if (error.code === "P2025") {
        return null;
      }
      throw error;
    }
  }

  /**
   * Batch update progress for multiple words (atomic transaction)
   * @param {string} userId - User ID
   * @param {Array<{wordId: string, studyCount?: number, correctCount?: number, confidence?: number}>} updates
   * @returns {Promise<Array>} - Array of updated progress records
   */
  async batchUpdateProgress(userId, updates) {
    return prisma.$transaction(
      updates.map((update) => {
        const { wordId, studyCount, correctCount, confidence } = update;
        const nextReview =
          confidence !== undefined ? this.calculateNextReview(confidence) : undefined;

        return prisma.progress.upsert({
          where: {
            userId_wordId: { userId, wordId },
          },
          update: {
            ...(studyCount !== undefined && { studyCount }),
            ...(correctCount !== undefined && { correctCount }),
            ...(confidence !== undefined && { confidence }),
            ...(nextReview && { nextReview }),
          },
          create: {
            userId,
            wordId,
            studyCount: studyCount || 0,
            correctCount: correctCount || 0,
            confidence: confidence || 0,
            nextReview: nextReview || new Date(),
          },
        });
      })
    );
  }

  /**
   * Get progress statistics for a user
   * @param {string} userId - User ID
   * @returns {Promise<object>} - Statistics object
   */
  async getProgressStats(userId) {
    const allProgress = await prisma.progress.findMany({
      where: { userId },
    });

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
