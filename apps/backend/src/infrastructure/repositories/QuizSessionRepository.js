/**
 * @file QuizSessionRepository.js
 * @description Prisma-based repository for quiz session persistence
 *
 * Clean Architecture: Infrastructure Layer - Data Access
 * Encapsulates Prisma queries and session data mapping
 *
 * Responsibilities:
 * - Persist quiz sessions with questions and answers
 * - Fetch sessions for resumption or review
 * - Clean up expired sessions (TTL)
 * - Map Prisma models to domain entities
 *
 * Story 15.11 Phase 8 - Backend-centric quiz session architecture
 */

import { prisma } from "../database/client.js";

export class QuizSessionRepository {
  /**
   * Create a new quiz session
   * @param {object} data - Session data
   * @param {string} data.userId - User ID
   * @param {Array} data.questions - Array of question objects with wordId, questionType, correctAnswer
   * @param {Date} data.expiresAt - Session expiration timestamp (midnight end-of-day, set at creation)
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
   * @returns {Promise<object|null>} Quiz session or null if not found
   */
  async findById(sessionId) {
    const session = await prisma.quizSession.findUnique({
      where: { id: sessionId },
      include: {
        questions: { orderBy: { questionIndex: "asc" } },
      },
    });

    if (!session) {
      return null;
    }

    return this._mapSession(session);
  }

  /**
   * Find quiz session by ID and userId (composite lookup for authorization)
   * @param {string} sessionId - Session ID
   * @param {string} userId - User ID
   * @returns {Promise<object|null>} Quiz session or null if not found or unauthorized
   */
  async findByIdAndUserId(sessionId, userId) {
    const session = await prisma.quizSession.findFirst({
      where: {
        id: sessionId,
        userId: userId,
      },
      include: {
        questions: { orderBy: { questionIndex: "asc" } },
      },
    });

    if (!session) {
      return null;
    }

    return this._mapSession(session);
  }

  /**
   * Find active quiz session for user (if any)
   * Used to check if user has an incomplete session
   * @param {string} userId - User ID
   * @returns {Promise<object|null>} Active quiz session or null
   */
  async findActiveByUser(userId) {
    const session = await prisma.quizSession.findFirst({
      where: {
        userId,
        status: "ACTIVE",
        expiresAt: {
          gte: new Date(), // Not expired
        },
      },
      orderBy: {
        startedAt: "desc",
      },
      include: {
        questions: { orderBy: { questionIndex: "asc" } },
      },
    });

    if (!session) {
      return null;
    }

    return this._mapSession(session);
  }

  /**
   * Find the most recent session for a user regardless of status
   * Used for the "single-session model" — check existing session before creating new
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
   * Used on new quiz start to enforce single-session model
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
   * @param {Array} [data.answers] - Updated answers array
   * @param {number} [data.currentIndex] - Updated question index
   * @param {string} [data.status] - Updated status (ACTIVE | COMPLETE | EXPIRED)
   * @param {Date} [data.completedAt] - Completion timestamp
   * @returns {Promise<object>} Updated quiz session
   */
  async update(sessionId, data) {
    const updateData = {};

    if (data.currentIndex !== undefined) {
      updateData.currentIndex = data.currentIndex;
    }
    if (data.status !== undefined) {
      updateData.status = data.status;
    }
    if (data.completedAt !== undefined) {
      updateData.completedAt = data.completedAt;
    }

    const session = await prisma.quizSession.update({
      where: { id: sessionId },
      data: updateData,
      include: {
        questions: { orderBy: { questionIndex: "asc" } },
      },
    });

    return this._mapSession(session);
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  /**
   * Map a DB session row (with included questions) to the shape expected by services.
   * Converts QuizSessionQuestion rows into the legacy question shape so no service
   * code needs to change.
   */
  _mapSession(session) {
    return {
      ...session,
      questions: (session.questions ?? []).map((q) => this._mapQuestion(q)),
    };
  }

  /**
   * Map a QuizSessionQuestion DB row to the question shape used by services/domain:
   * { id, wordId, questionType, word: { id, simplified, traditional, pinyin, english }, correctAnswer, options? }
   */
  _mapQuestion(q) {
    return {
      id: q.id,
      wordId: q.wordId,
      questionType: q.questionType,
      correctAnswer: q.correctAnswer,
      word: {
        id: q.wordId,
        simplified: q.hanzi,
        traditional: q.traditional,
        pinyin: q.pinyin,
        english: q.english,
      },
      ...(q.options != null && { options: q.options }),
    };
  }
}

export default QuizSessionRepository;
