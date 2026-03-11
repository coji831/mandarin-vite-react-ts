/**
 * @file QuizSessionAnswerRepository.js
 * @description Prisma-based repository for per-answer records within a quiz session
 *
 * Clean Architecture: Infrastructure Layer - Data Access
 * Encapsulates answer persistence and retrieval logic
 *
 * Responsibilities:
 * - Record individual quiz answers with correctness and spaced repetition data
 * - Retrieve answers for session review and metrics calculation
 * - Support cascade deletion via session FK
 *
 * DB Refactor (Option D): QuizSessionAnswer no longer stores word snapshot fields.
 * Word context (hanzi, pinyin, english, correctAnswer, questionType) is read
 * from the related QuizSessionQuestion row via the question FK.
 * - questionId is a FK to QuizSessionQuestion
 * - findBySession includes { question: true } for downstream mapping
 *
 * Story 15.11 Phase 8 - Backend-centric quiz session architecture
 */

import { prisma } from "../database/client.js";

export class QuizSessionAnswerRepository {
  /**
   * Create a new answer record for a quiz session question
   * @param {object} data
   * @param {string} data.sessionId
   * @param {string} data.userId
   * @param {string} data.wordId
   * @param {string} data.questionId  - FK to QuizSessionQuestion.id
   * @param {string} data.userAnswer
   * @param {boolean} data.correct
   * @param {number} [data.timeSpentMs]
   * @param {number} [data.lapseCount]
   * @param {boolean} [data.isLeech]
   * @param {Date|string} [data.nextReviewDate]
   * @returns {Promise<object>} Created answer record
   */
  async create(data) {
    const {
      sessionId,
      userId,
      wordId,
      questionId,
      userAnswer,
      correct,
      timeSpentMs,
      lapseCount,
      isLeech,
      nextReviewDate,
    } = data;

    return prisma.quizSessionAnswer.create({
      data: {
        sessionId,
        userId,
        wordId,
        questionId,
        userAnswer,
        correct,
        timeSpentMs: timeSpentMs || null,
        lapseCount: lapseCount || 0,
        isLeech: isLeech || false,
        nextReviewDate: nextReviewDate ? new Date(nextReviewDate) : null,
        answeredAt: new Date(),
      },
    });
  }

  /**
   * Find all answers for a session ordered by question index
   * Returns each answer with nested `question` (QuizSessionQuestion) for word context.
   * @param {string} sessionId
   * @returns {Promise<Array>} Answer records in question order
   */
  async findBySession(sessionId) {
    return prisma.quizSessionAnswer.findMany({
      where: { sessionId },
      include: { question: true },
      orderBy: { question: { questionIndex: "asc" } },
    });
  }

  /**
   * Find a specific answer by questionId (for duplicate-answer check)
   * questionId is @unique on QuizSessionAnswer, so no sessionId needed.
   * @param {string} sessionId  - kept for API compatibility (not used in query)
   * @param {string} questionId - FK to QuizSessionQuestion.id
   * @returns {Promise<object|null>}
   */
  async findBySessionAndQuestion(sessionId, questionId) {
    return prisma.quizSessionAnswer.findUnique({
      where: { questionId },
    });
  }

  /**
   * Get N most recent answers for a user across all sessions (newest first)
   * Replaces QuizResultRepository.findRecent — used by StreakService freeze check
   * @param {string} userId
   * @param {number} [limit=10]
   * @returns {Promise<Array>}
   */
  async findRecentByUser(userId, limit = 10) {
    return prisma.quizSessionAnswer.findMany({
      where: { userId },
      orderBy: { answeredAt: "desc" },
      take: limit,
    });
  }
}

export default QuizSessionAnswerRepository;
