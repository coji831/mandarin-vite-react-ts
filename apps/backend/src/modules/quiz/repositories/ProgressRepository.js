/**
 * @file apps/backend/src/modules/quiz/repositories/ProgressRepository.js
 * @description Prisma-based implementation of IProgressRepository
 *
 * Clean Architecture: Infrastructure Layer - Data Access
 */

import { prisma } from "../../../shared/infrastructure/database/client.js";

export class ProgressRepository {
  async findByUser(userId) {
    return prisma.progress.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });
  }

  async findByUserAndWord(userId, wordId) {
    return prisma.progress.findUnique({
      where: { userId_wordId: { userId, wordId } },
    });
  }

  async upsert(userId, wordId, data) {
    const { studyCount, correctCount, confidence, nextReview, lapseCount, currentDelay } = data;

    return prisma.progress.upsert({
      where: { userId_wordId: { userId, wordId } },
      update: {
        ...(studyCount !== undefined && { studyCount }),
        ...(correctCount !== undefined && { correctCount }),
        ...(confidence !== undefined && { confidence }),
        ...(nextReview && { nextReview }),
        ...(lapseCount !== undefined && { lapseCount }),
        ...(currentDelay !== undefined && { currentDelay }),
      },
      create: {
        userId,
        wordId,
        studyCount: studyCount || 0,
        correctCount: correctCount || 0,
        confidence: confidence || 0,
        nextReview: nextReview || new Date(),
        lapseCount: lapseCount || 0,
        currentDelay: currentDelay || null,
      },
    });
  }

  async findMany(filters) {
    return prisma.progress.findMany({ where: filters });
  }

  async deleteByUserAndWord(userId, wordId) {
    try {
      await prisma.progress.delete({
        where: { userId_wordId: { userId, wordId } },
      });
      return true;
    } catch (error) {
      if (error.code === "P2025") return false;
      throw error;
    }
  }

  async findDueByUserAndDate(userId, date, limit = 50) {
    return prisma.progress.findMany({
      where: { userId, nextReview: { lte: date } },
      orderBy: { nextReview: "asc" },
      take: limit,
    });
  }

  async findLeechesByUser(userId, minLapseCount = 5, limit = 20) {
    return prisma.progress.findMany({
      where: { userId, lapseCount: { gte: minLapseCount } },
      orderBy: { lapseCount: "desc" },
      take: limit,
    });
  }
}
