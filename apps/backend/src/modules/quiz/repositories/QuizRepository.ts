/**
 * @file apps/backend/src/modules/quiz/repositories/QuizRepository.ts
 * Prisma-based data access for quiz attempts.
 */
import { prisma } from "../../../shared/infrastructure/database/client.js";
import type { QuizAttempt, QuizAttemptAnswer, Prisma } from "@prisma/client";

export class QuizRepository {
  async createQuizAttempt({
    userId,
    quizType,
    phase,
  }: {
    userId: string;
    quizType: string;
    phase?: number | null;
  }): Promise<QuizAttempt> {
    return prisma.quizAttempt.create({ data: { userId, quizType, phase } });
  }

  async findQuizAttemptById(id: string): Promise<QuizAttempt | null> {
    return prisma.quizAttempt.findUnique({ where: { id } });
  }

  async findQuizAttemptsByUser(userId: string): Promise<QuizAttempt[]> {
    return prisma.quizAttempt.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
  }

  async completeQuizAttempt(
    id: string,
    { totalScore, maxScore, passed }: { totalScore: number; maxScore: number; passed: boolean },
  ): Promise<QuizAttempt> {
    return prisma.quizAttempt.update({
      where: { id },
      data: { totalScore, maxScore, passed, completedAt: new Date() },
    });
  }

  async createQuizAttemptAnswer(
    data: Prisma.QuizAttemptAnswerCreateInput,
  ): Promise<QuizAttemptAnswer> {
    return prisma.quizAttemptAnswer.create({ data });
  }

  async findQuizAttemptAnswers(attemptId: string): Promise<QuizAttemptAnswer[]> {
    return prisma.quizAttemptAnswer.findMany({
      where: { attemptId },
      orderBy: { questionIndex: "asc" },
    });
  }
}
