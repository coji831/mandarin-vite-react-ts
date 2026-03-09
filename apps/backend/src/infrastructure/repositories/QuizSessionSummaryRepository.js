/**
 * QuizSessionSummaryRepository
 * Prisma-based repository for quiz session summary persistence
 * Story 15.11 Flow 5: Database storage for quiz results (replacing localStorage)
 *
 * Manages session summary lifecycle: creation, retrieval, and expiration cleanup
 * Supports 7-day TTL for review mistakes feature
 */

import { prisma } from "../database/client.js";

export class QuizSessionSummaryRepository {
  /**
   * Create a new quiz session summary
   * @param {object} data - Summary data
   * @param {string} data.userId - User ID
   * @param {string} data.sessionId - Quiz session ID
   * @param {Date} data.completedAt - Completion timestamp
   * @param {number} data.totalQuestions - Total questions in quiz
   * @param {number} data.correctCount - Number of correct answers
   * @param {number} data.incorrectCount - Number of incorrect answers
   * @param {number} data.accuracyRate - Accuracy percentage (0-100)
   * @param {number} data.xpEarned - XP earned in session
   * @param {string[]} data.newBadgeIds - IDs of newly awarded badges
   * @param {boolean} data.mysteryBoxDrop - Whether mystery box was awarded
   * @param {string|null} data.mysteryBoxType - Mystery box type ('xp_boost' | 'freeze' | 'cosmetic')
   * @param {boolean} data.freezeAwarded - Whether freeze was awarded
   * @param {string[]} data.leechWordIds - IDs of leech words (lapseCount >= 5)
   * @param {Array} data.incorrectWords - Array of IncorrectWordDetail objects
   * @param {Date} data.expiresAt - Expiration timestamp (completedAt + 7 days)
   * @returns {Promise<object>} Created quiz session summary
   */
  async create(data) {
    const {
      userId,
      sessionId,
      completedAt,
      totalQuestions,
      correctCount,
      incorrectCount,
      accuracyRate,
      xpEarned,
      newBadgeIds,
      mysteryBoxDrop,
      mysteryBoxType,
      freezeAwarded,
      expiresAt,
    } = data;

    return prisma.quizSessionSummary.create({
      data: {
        userId,
        sessionId,
        completedAt,
        totalQuestions,
        correctCount,
        incorrectCount,
        accuracyRate,
        xpEarned,
        newBadgeIds,
        mysteryBoxDrop,
        mysteryBoxType,
        freezeAwarded,
        expiresAt,
      },
    });
  }

  /**
   * Find quiz session summary by session ID
   * @param {string} sessionId - Quiz session ID
   * @returns {Promise<object|null>} Quiz session summary or null if not found
   */
  async findBySessionId(sessionId) {
    const summary = await prisma.quizSessionSummary.findUnique({
      where: { sessionId },
    });

    if (!summary) {
      return null;
    }

    return summary;
  }

  /**
   * Find quiz session summary by session ID and user ID (authorization check)
   * @param {string} sessionId - Quiz session ID
   * @param {string} userId - User ID
   * @returns {Promise<object|null>} Quiz session summary or null if not found/unauthorized
   */
  async findBySessionIdAndUserId(sessionId, userId) {
    const summary = await prisma.quizSessionSummary.findFirst({
      where: {
        sessionId,
        userId,
      },
    });

    if (!summary) {
      return null;
    }

    return summary;
  }

  /**
   * Delete expired summaries for a specific user
   * Called on new quiz start to cleanup old results (7-day TTL)
   * @param {string} userId - User ID
   * @returns {Promise<number>} Number of deleted summaries
   */
  async deleteExpired(userId) {
    const result = await prisma.quizSessionSummary.deleteMany({
      where: {
        userId,
        expiresAt: {
          lt: new Date(), // Expired (expiresAt < now)
        },
      },
    });

    return result.count;
  }

  /**
   * Delete all summaries for a specific user
   * Used for testing or account cleanup
   * @param {string} userId - User ID
   * @returns {Promise<number>} Number of deleted summaries
   */
  async deleteAllForUser(userId) {
    const result = await prisma.quizSessionSummary.deleteMany({
      where: { userId },
    });

    return result.count;
  }
}
