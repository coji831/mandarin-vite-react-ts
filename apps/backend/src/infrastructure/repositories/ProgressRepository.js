/**
 * ProgressRepository
 * Prisma-based implementation of IProgressRepository
 * Handles CRUD operations for user progress data
 */

import { prisma } from "../database/client.js";

export class ProgressRepository {
  /**
   * Get all progress records for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Progress records
   */
  async findByUser(userId) {
    return prisma.progress.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });
  }

  /**
   * Get progress for a specific word
   * @param {string} userId - User ID
   * @param {string} wordId - Word ID
   * @returns {Promise<object|null>} Progress record or null
   */
  async findByUserAndWord(userId, wordId) {
    return prisma.progress.findUnique({
      where: {
        userId_wordId: { userId, wordId },
      },
    });
  }

  /**
   * Create or update progress for a word
   * Story 15.1: Updated to support lapseCount and currentDelay fields
   *
   * @param {string} userId - User ID
   * @param {string} wordId - Word ID
   * @param {object} data - Progress data { studyCount?, correctCount?, confidence?, nextReview?, lapseCount?, currentDelay? }
   * @returns {Promise<object>} Updated progress record
   */
  async upsert(userId, wordId, data) {
    const { studyCount, correctCount, confidence, nextReview, lapseCount, currentDelay } = data;

    return prisma.progress.upsert({
      where: {
        userId_wordId: { userId, wordId },
      },
      update: {
        ...(studyCount !== undefined && { studyCount }),
        ...(correctCount !== undefined && { correctCount }),
        ...(confidence !== undefined && { confidence }),
        ...(nextReview && { nextReview }),
        ...(lapseCount !== undefined && { lapseCount }),
        ...(currentDelay !== undefined && { currentDelay }),
      },
      create: {
        userId,
        wordId,
        studyCount: studyCount || 0,
        correctCount: correctCount || 0,
        confidence: confidence || 0,
        nextReview: nextReview || new Date(),
        lapseCount: lapseCount || 0,
        currentDelay: currentDelay || null,
      },
    });
  }

  /**
   * Query progress with filters
   * @param {object} filters - Query filters
   * @returns {Promise<Array>} Matching progress records
   */
  async findMany(filters) {
    return prisma.progress.findMany({
      where: filters,
    });
  }

  /**
   * Delete progress for a specific word
   * @param {string} userId - User ID
   * @param {string} wordId - Word ID
   * @returns {Promise<boolean>} - True if deleted, false if not found
   */
  async deleteByUserAndWord(userId, wordId) {
    try {
      await prisma.progress.delete({
        where: {
          userId_wordId: { userId, wordId },
        },
      });
      return true;
    } catch (error) {
      // Record not found - return false (Prisma error code P2025)
      if (error.code === "P2025") {
        return false;
      }
      throw error;
    }
  }

  /**
   * Find progress records due for review
   * Story 15.2: New method for quiz system
   *
   * @param {string} userId - User ID
   * @param {Date} date - Target date (find words where nextReview <= date)
   * @param {number} [limit=50] - Maximum number of words to return
   * @returns {Promise<Array>} Progress records ordered by due date (oldest first)
   */
  async findDueByUserAndDate(userId, date, limit = 50) {
    return prisma.progress.findMany({
      where: {
        userId,
        nextReview: {
          lte: date,
        },
      },
      orderBy: {
        nextReview: "asc", // Oldest due first (fairness)
      },
      take: limit,
    });
  }

  /**
   * Find words user struggles with (high lapse count)
   * Story 15.2: New method for leech identification
   *
   * @param {string} userId - User ID
   * @param {number} [minLapseCount=5] - Minimum lapse count to qualify as leech
   * @param {number} [limit=20] - Maximum number of leeches to return
   * @returns {Promise<Array>} Progress records ordered by lapse count (worst first)
   */
  async findLeechesByUser(userId, minLapseCount = 5, limit = 20) {
    return prisma.progress.findMany({
      where: {
        userId,
        lapseCount: {
          gte: minLapseCount,
        },
      },
      orderBy: {
        lapseCount: "desc", // Worst leeches first
      },
      take: limit,
    });
  }
}

export default ProgressRepository;
