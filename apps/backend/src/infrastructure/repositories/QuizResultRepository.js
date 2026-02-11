/**
 * QuizResultRepository
 * Prisma-based repository for quiz result audit trail
 * Minimal implementation for Story 15.1 (service layer foundation)
 */

import { prisma } from "../database/client.js";

export class QuizResultRepository {
  /**
   * Create a new quiz result record
   * @param {object} data - Quiz result data
   * @param {string} data.userId - User ID
   * @param {string} data.wordId - Word ID
   * @param {boolean} data.correct - Whether answer was correct
   * @param {string} data.questionType - Type of question (multiple_choice, type_pinyin, type_character)
   * @param {number} [data.timeSpentMs] - Time spent on question in milliseconds
   * @returns {Promise<object>} Created quiz result
   */
  async create(data) {
    const { userId, wordId, correct, questionType, timeSpentMs } = data;

    return prisma.quizResult.create({
      data: {
        userId,
        wordId,
        correct,
        questionType,
        timeSpentMs: timeSpentMs || null,
        answeredAt: new Date(),
      },
    });
  }

  /**
   * Find the most recent quiz result for a specific user and word
   * Used for feature detection (quiz vs flashcard algorithm priority)
   * @param {string} userId - User ID
   * @param {string} wordId - Word ID
   * @returns {Promise<object|null>} Latest quiz result or null
   */
  async findLatestByUserAndWord(userId, wordId) {
    return prisma.quizResult.findFirst({
      where: {
        userId,
        wordId,
      },
      orderBy: {
        answeredAt: "desc",
      },
    });
  }
}

export default QuizResultRepository;
