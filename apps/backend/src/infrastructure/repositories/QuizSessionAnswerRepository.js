/**
 * QuizSessionAnswerRepository
 * Prisma-based repository for per-answer records within a quiz session.
 *
 * DB Refactor (Option 2): Replaces both QuizSession.answers JSON blob and QuizResult table.
 * - Normalized rows with full word context (hanzi, pinyin, english, correctAnswer)
 * - Acts as permanent audit trail (rows survive QuizSession cleanup via CASCADE)
 * - Powers ResultsTable for all answers (correct + incorrect) without extra JOINs
 * - Powers StreakService freeze check (replaces QuizResultRepository.findRecent)
 */

import { prisma } from "../database/client.js";

export class QuizSessionAnswerRepository {
  /**
   * Create a new answer record for a quiz session question
   * @param {object} data
   * @param {string} data.sessionId
   * @param {string} data.userId
   * @param {string} data.wordId
   * @param {string} data.questionId  - e.g. "word123_type_pinyin" (unique within session)
   * @param {number} data.questionIndex - 0-based position in session
   * @param {string} data.questionType
   * @param {string} data.userAnswer
   * @param {string} data.correctAnswer
   * @param {boolean} data.correct
   * @param {number} [data.timeSpentMs]
   * @param {number} [data.lapseCount]
   * @param {boolean} [data.isLeech]
   * @param {Date|string} [data.nextReviewDate]
   * @param {string} data.hanzi       - Chinese simplified character(s)
   * @param {string} data.pinyin
   * @param {string} data.english
   * @returns {Promise<object>} Created answer record
   */
  async create(data) {
    const {
      sessionId,
      userId,
      wordId,
      questionId,
      questionIndex,
      questionType,
      userAnswer,
      correctAnswer,
      correct,
      timeSpentMs,
      lapseCount,
      isLeech,
      nextReviewDate,
      hanzi,
      pinyin,
      english,
    } = data;

    return prisma.quizSessionAnswer.create({
      data: {
        sessionId,
        userId,
        wordId,
        questionId,
        questionIndex,
        questionType,
        userAnswer,
        correctAnswer,
        correct,
        timeSpentMs: timeSpentMs || null,
        lapseCount: lapseCount || 0,
        isLeech: isLeech || false,
        nextReviewDate: nextReviewDate ? new Date(nextReviewDate) : null,
        hanzi,
        pinyin,
        english,
        answeredAt: new Date(),
      },
    });
  }

  /**
   * Find all answers for a session ordered by question index
   * @param {string} sessionId
   * @returns {Promise<Array>} Answer records in question order
   */
  async findBySession(sessionId) {
    return prisma.quizSessionAnswer.findMany({
      where: { sessionId },
      orderBy: { questionIndex: "asc" },
    });
  }

  /**
   * Find a specific answer by session + questionId (for duplicate-answer check)
   * @param {string} sessionId
   * @param {string} questionId
   * @returns {Promise<object|null>}
   */
  async findBySessionAndQuestion(sessionId, questionId) {
    return prisma.quizSessionAnswer.findUnique({
      where: { sessionId_questionId: { sessionId, questionId } },
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
