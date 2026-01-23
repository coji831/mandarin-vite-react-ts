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
   * @param {string} userId - User ID
   * @param {string} wordId - Word ID
   * @param {object} data - Progress data { studyCount?, correctCount?, confidence?, nextReview? }
   * @returns {Promise<object>} Updated progress record
   */
  async upsert(userId, wordId, data) {
    const { studyCount, correctCount, confidence, nextReview } = data;

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
}

export default ProgressRepository;
