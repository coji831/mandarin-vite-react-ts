/**
 * @file apps/backend/src/modules/quiz/use-cases/StreakService.js
 * @description Core business logic for study streak tracking and freeze management
 * Story 15.3: Streak & Gamification Backend APIs
 */

/**
 * StreakService
 * Manages study streaks with 48-hour grace period and freeze protection
 *
 * SOLID: Dependency Inversion Principle - depends on abstractions (interfaces)
 * All dependencies must be injected via constructor (no default instantiation)
 */
export class StreakService {
  constructor(streakRepository, answerRepository) {
    if (!streakRepository || !answerRepository) {
      throw new Error("StreakService requires streakRepository and answerRepository");
    }
    this.streakRepository = streakRepository;
    this.answerRepository = answerRepository;
  }

  async getStreak(userId) {
    const streak = await this.streakRepository.findByUser(userId);

    if (!streak) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: null,
        freezeCount: 0,
      };
    }

    return streak;
  }

  async updateStreak(userId) {
    const streak = await this.streakRepository.findByUser(userId);
    const now = new Date();

    if (!streak) {
      return await this.streakRepository.upsert(userId, {
        currentStreak: 1,
        longestStreak: 1,
        lastActivityDate: now,
        freezeCount: 0,
      });
    }

    const lastActivity = new Date(streak.lastActivityDate);
    const hoursSinceLastActivity = (now - lastActivity) / (1000 * 60 * 60);

    if (hoursSinceLastActivity <= 48) {
      const lastActivityDay = lastActivity.toISOString().split("T")[0];
      const nowDay = now.toISOString().split("T")[0];

      if (lastActivityDay === nowDay) {
        return await this.streakRepository.upsert(userId, {
          currentStreak: streak.currentStreak,
          longestStreak: streak.longestStreak,
          lastActivityDate: now,
          freezeCount: streak.freezeCount,
        });
      }

      const newStreak = streak.currentStreak + 1;
      const newLongest = Math.max(newStreak, streak.longestStreak);

      return await this.streakRepository.upsert(userId, {
        currentStreak: newStreak,
        longestStreak: newLongest,
        lastActivityDate: now,
        freezeCount: streak.freezeCount,
      });
    } else {
      return await this.streakRepository.upsert(userId, {
        currentStreak: 1,
        longestStreak: streak.longestStreak,
        lastActivityDate: now,
        freezeCount: streak.freezeCount,
      });
    }
  }

  async spendFreeze(userId) {
    const streak = await this.streakRepository.findByUser(userId);

    if (!streak) {
      throw new Error("No streak record found");
    }

    if (streak.freezeCount < 1) {
      throw new Error("No freezes available");
    }

    const now = new Date();
    const lastActivity = new Date(streak.lastActivityDate);
    const hoursSinceLastActivity = (now - lastActivity) / (1000 * 60 * 60);

    if (hoursSinceLastActivity <= 48) {
      throw new Error("Streak not at risk (within 48h grace period)");
    }

    const extendedDate = new Date(lastActivity);
    extendedDate.setHours(extendedDate.getHours() + 24);

    return await this.streakRepository.update(userId, {
      freezeCount: streak.freezeCount - 1,
      lastActivityDate: extendedDate,
    });
  }

  async checkAndAwardFreeze(userId) {
    const recentResults = await this.answerRepository.findRecentByUser(userId, 10);

    if (recentResults.length < 10) {
      return false;
    }

    const allCorrect = recentResults.every((result) => result.correct === true);

    if (!allCorrect) {
      return false;
    }

    const streak = await this.streakRepository.findByUser(userId);

    if (!streak) {
      return false;
    }

    if (streak.freezeCount >= 5) {
      return false;
    }

    await this.streakRepository.update(userId, {
      freezeCount: streak.freezeCount + 1,
    });

    return true;
  }
}

export default StreakService;
