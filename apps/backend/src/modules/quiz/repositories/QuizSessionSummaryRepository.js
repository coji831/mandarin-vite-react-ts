/**
 * @file apps/backend/src/modules/quiz/repositories/QuizSessionSummaryRepository.js
 * @description Prisma-based repository for quiz session summary persistence
 *
 * Clean Architecture: Infrastructure Layer - Data Access
 *
 * Story 15.11 Flow 5 - Database storage for quiz results (replacing localStorage)
 */

import { prisma } from "../../../shared/infrastructure/database/client.js";

export class QuizSessionSummaryRepository {
  async create(data) {
    const {
      userId,
      sessionId,
      totalQuestions,
      correctCount,
      incorrectCount,
      accuracyRate,
      xpEarned,
      newBadgeIds,
      mysteryBoxDrop,
      mysteryBoxType,
      freezeAwarded,
    } = data;

    return prisma.quizSessionSummary.create({
      data: {
        userId,
        sessionId,
        totalQuestions,
        correctCount,
        incorrectCount,
        accuracyRate,
        xpEarned,
        newBadgeIds,
        mysteryBoxDrop,
        mysteryBoxType,
        freezeAwarded,
      },
    });
  }

  async findBySessionId(sessionId) {
    const summary = await prisma.quizSessionSummary.findUnique({
      where: { sessionId },
    });
    return summary || null;
  }

  async findBySessionIdAndUserId(sessionId, userId) {
    const summary = await prisma.quizSessionSummary.findFirst({
      where: { sessionId, userId },
    });
    return summary || null;
  }

  async deleteAllForUser(userId) {
    const result = await prisma.quizSessionSummary.deleteMany({
      where: { userId },
    });
    return result.count;
  }
}
