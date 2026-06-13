/**
 * @file apps/backend/src/modules/quiz/repositories/QuizSessionAnswerRepository.js
 * @description Prisma-based repository for per-answer records within a quiz session
 *
 * Clean Architecture: Infrastructure Layer - Data Access
 *
 * Story 15.11 Phase 8 - Backend-centric quiz session architecture
 */

import { prisma } from "../../../shared/infrastructure/database/client.js";

export class QuizSessionAnswerRepository {
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

  async findBySession(sessionId) {
    return prisma.quizSessionAnswer.findMany({
      where: { sessionId },
      include: { question: true },
      orderBy: { question: { questionIndex: "asc" } },
    });
  }

  async findByQuestionId(questionId) {
    return prisma.quizSessionAnswer.findUnique({
      where: { questionId },
    });
  }

  async findRecentByUser(userId, limit = 10) {
    return prisma.quizSessionAnswer.findMany({
      where: { userId },
      orderBy: { answeredAt: "desc" },
      take: limit,
    });
  }
}

export default QuizSessionAnswerRepository;
