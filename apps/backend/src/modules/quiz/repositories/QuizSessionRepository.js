/**
 * @file apps/backend/src/modules/quiz/repositories/QuizSessionRepository.js
 * @description Prisma-based repository for quiz session persistence
 *
 * Clean Architecture: Infrastructure Layer - Data Access
 * Encapsulates Prisma queries and session data mapping
 *
 * Story 15.11 Phase 8 - Backend-centric quiz session architecture
 */

import { prisma } from "../../../shared/infrastructure/database/client.js";

export class QuizSessionRepository {
  /**
   * Create a new quiz session
   * @param {object} data - Session data
   * @param {string} data.userId - User ID
   * @param {Array} data.questions - Array of question objects
   * @param {Date} data.expiresAt - Session expiration timestamp
   * @returns {Promise<object>} Created quiz session
   */
  async create(data) {
    const { userId, questions, expiresAt } = data;

    const session = await prisma.quizSession.create({
      data: {
        userId,
        currentIndex: 0,
        status: "ACTIVE",
        startedAt: new Date(),
        expiresAt,
        questions: {
          createMany: {
            data: questions.map((q, i) => ({
              wordId: q.wordId,
              questionIndex: i,
              questionType: q.questionType,
              correctAnswer: q.correctAnswer,
              options: q.options ?? null,
              hanzi: q.word.simplified,
              pinyin: q.word.pinyin,
              english: q.word.english,
              traditional: q.word.traditional ?? q.word.simplified,
            })),
          },
        },
      },
      include: {
        questions: { orderBy: { questionIndex: "asc" } },
      },
    });

    return this._mapSession(session);
  }

  /**
   * Find quiz session by ID
   * @param {string} sessionId - Session ID
   * @returns {Promise<object|null>} Quiz session or null
   */
  async findById(sessionId) {
    const session = await prisma.quizSession.findUnique({
      where: { id: sessionId },
      include: {
        questions: { orderBy: { questionIndex: "asc" } },
      },
    });

    if (!session) return null;
    return this._mapSession(session);
  }

  /**
   * Find quiz session by ID and userId (composite lookup for authorization)
   * @param {string} sessionId - Session ID
   * @param {string} userId - User ID
   * @returns {Promise<object|null>} Quiz session or null
   */
  async findByIdAndUserId(sessionId, userId) {
    const session = await prisma.quizSession.findFirst({
      where: { id: sessionId, userId },
      include: {
        questions: { orderBy: { questionIndex: "asc" } },
      },
    });

    if (!session) return null;
    return this._mapSession(session);
  }

  /**
   * Find active quiz session for user (if any)
   * @param {string} userId - User ID
   * @returns {Promise<object|null>} Active quiz session or null
   */
  async findActiveByUser(userId) {
    const session = await prisma.quizSession.findFirst({
      where: {
        userId,
        status: "ACTIVE",
        expiresAt: { gte: new Date() },
      },
      orderBy: { startedAt: "desc" },
      include: {
        questions: { orderBy: { questionIndex: "asc" } },
      },
    });

    if (!session) return null;
    return this._mapSession(session);
  }

  /**
   * Find the most recent session for a user regardless of status
   * @param {string} userId - User ID
   * @returns {Promise<object|null>} Most recent session or null
   */
  async findLatestByUserId(userId) {
    const session = await prisma.quizSession.findFirst({
      where: { userId },
      orderBy: { startedAt: "desc" },
      include: {
        questions: { orderBy: { questionIndex: "asc" } },
      },
    });

    return session ? this._mapSession(session) : null;
  }

  /**
   * Delete all sessions for a user (cascades: questions, answers, summary)
   * @param {string} userId - User ID
   * @returns {Promise<number>} Number of deleted sessions
   */
  async deleteAllForUser(userId) {
    const result = await prisma.quizSession.deleteMany({
      where: { userId },
    });
    return result.count;
  }

  /**
   * Update quiz session
   * @param {string} sessionId - Session ID
   * @param {object} data - Update data
   * @returns {Promise<object>} Updated quiz session
   */
  async update(sessionId, data) {
    const updateData = {};
    if (data.currentIndex !== undefined) updateData.currentIndex = data.currentIndex;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.completedAt !== undefined) updateData.completedAt = data.completedAt;

    const session = await prisma.quizSession.update({
      where: { id: sessionId },
      data: updateData,
      include: {
        questions: { orderBy: { questionIndex: "asc" } },
      },
    });

    return this._mapSession(session);
  }

  // ============================================================================
  // Private Helpers
  // ============================================================================

  _mapSession(session) {
    return {
      id: session.id,
      userId: session.userId,
      questions: session.questions.map((q) => ({
        id: q.id,
        wordId: q.wordId,
        questionIndex: q.questionIndex,
        questionType: q.questionType,
        correctAnswer: q.correctAnswer,
        options: q.options,
        word: {
          id: q.wordId,
          simplified: q.hanzi,
          traditional: q.traditional,
          pinyin: q.pinyin,
          english: q.english,
        },
      })),
      currentIndex: session.currentIndex,
      status: session.status,
      startedAt: session.startedAt,
      expiresAt: session.expiresAt,
      completedAt: session.completedAt,
    };
  }
}
