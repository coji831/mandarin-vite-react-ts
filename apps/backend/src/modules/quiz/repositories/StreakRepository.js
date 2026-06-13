/**
 * @file apps/backend/src/modules/quiz/repositories/StreakRepository.js
 * @description Infrastructure layer for StudyStreak data access
 * Story 15.3: Streak & Gamification Backend APIs
 */

import { prisma } from "../../../shared/infrastructure/database/client.js";

export class StreakRepository {
  async findByUser(userId) {
    return await prisma.studyStreak.findUnique({
      where: { userId },
    });
  }

  async upsert(userId, data) {
    return await prisma.studyStreak.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    });
  }

  async update(userId, data) {
    return await prisma.studyStreak.update({
      where: { userId },
      data,
    });
  }

  async incrementStreak(userId, lastActivityDate) {
    return await prisma.studyStreak.update({
      where: { userId },
      data: {
        currentStreak: { increment: 1 },
        lastActivityDate,
      },
    });
  }

  async updateLongestIfNeeded(userId, currentStreak) {
    const existing = await this.findByUser(userId);
    if (!existing || currentStreak > existing.longestStreak) {
      return await prisma.studyStreak.update({
        where: { userId },
        data: { longestStreak: currentStreak },
      });
    }
    return existing;
  }
}

export default StreakRepository;
