/**
 * @file apps/backend/src/modules/quiz/repositories/QuizRepository.js
 * Prisma-based data access for quiz attempts.
 */
import { prisma } from "../../../shared/infrastructure/database/client.js";

export class QuizRepository {
  async createQuizAttempt({ userId, quizType, phase }) {
    return prisma.quizAttempt.create({ data: { userId, quizType, phase } });
  }

  async findQuizAttemptById(id) {
    return prisma.quizAttempt.findUnique({ where: { id } });
  }

  async findQuizAttemptsByUser(userId) {
    return prisma.quizAttempt.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
  }

  async completeQuizAttempt(id, { totalScore, maxScore, passed }) {
    return prisma.quizAttempt.update({
      where: { id },
      data: { totalScore, maxScore, passed, completedAt: new Date() },
    });
  }

  async createQuizAttemptAnswer(data) {
    return prisma.quizAttemptAnswer.create({ data });
  }

  async findQuizAttemptAnswers(attemptId) {
    return prisma.quizAttemptAnswer.findMany({
      where: { attemptId },
      orderBy: { questionIndex: "asc" },
    });
  }
}
