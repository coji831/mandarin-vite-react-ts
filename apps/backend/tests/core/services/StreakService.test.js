/**
 * Unit tests for StreakService
 * Tests streak tracking, freeze management, and business logic
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import StreakService from "../../../src/core/services/StreakService.js";

describe("StreakService", () => {
  let streakService;
  let mockStreakRepo;
  let mockAnswerRepo;

  beforeEach(() => {
    // Mock StreakRepository
    mockStreakRepo = {
      findByUser: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
      incrementStreak: vi.fn(),
      updateLongestIfNeeded: vi.fn(),
    };

    // Mock QuizSessionAnswerRepository
    mockAnswerRepo = {
      findRecentByUser: vi.fn(),
    };

    streakService = new StreakService(mockStreakRepo, mockAnswerRepo);
  });

  describe("updateStreak", () => {
    it("should initialize streak for new user", async () => {
      const userId = "user123";
      mockStreakRepo.findByUser.mockResolvedValue(null);
      mockStreakRepo.upsert.mockResolvedValue({
        userId,
        currentStreak: 1,
        longestStreak: 1,
        lastActivityDate: new Date(),
        freezeCount: 0,
      });

      const result = await streakService.updateStreak(userId);

      expect(mockStreakRepo.findByUser).toHaveBeenCalledWith(userId);
      expect(mockStreakRepo.upsert).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          currentStreak: 1,
          longestStreak: 1,
          freezeCount: 0,
        }),
      );
      expect(result.currentStreak).toBe(1);
      expect(result.longestStreak).toBe(1);
    });

    it("should increment streak when within 48h grace period", async () => {
      const userId = "user123";
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago

      mockStreakRepo.findByUser.mockResolvedValue({
        userId,
        currentStreak: 5,
        longestStreak: 10,
        lastActivityDate: yesterday,
        freezeCount: 2,
      });

      mockStreakRepo.upsert.mockResolvedValue({
        userId,
        currentStreak: 6,
        longestStreak: 10,
        lastActivityDate: now,
        freezeCount: 2,
      });

      const result = await streakService.updateStreak(userId);

      expect(mockStreakRepo.upsert).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          currentStreak: 6,
          freezeCount: 2,
        }),
      );
      expect(result.currentStreak).toBe(6);
    });

    it("should maintain streak when exactly at 48h boundary", async () => {
      const userId = "user123";
      const now = new Date();
      const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

      mockStreakRepo.findByUser.mockResolvedValue({
        userId,
        currentStreak: 7,
        longestStreak: 10,
        lastActivityDate: fortyEightHoursAgo,
        freezeCount: 1,
      });

      mockStreakRepo.upsert.mockResolvedValue({
        userId,
        currentStreak: 8,
        longestStreak: 10,
        lastActivityDate: now,
        freezeCount: 1,
      });

      const result = await streakService.updateStreak(userId);

      expect(mockStreakRepo.upsert).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          currentStreak: 8,
        }),
      );
      expect(result.currentStreak).toBe(8);
    });

    it("should reset streak when beyond 48h grace period", async () => {
      const userId = "user123";
      const now = new Date();
      const threeDaysAgo = new Date(now.getTime() - 72 * 60 * 60 * 1000); // 3 days ago

      mockStreakRepo.findByUser.mockResolvedValue({
        userId,
        currentStreak: 7,
        longestStreak: 15,
        lastActivityDate: threeDaysAgo,
        freezeCount: 0,
      });

      mockStreakRepo.upsert.mockResolvedValue({
        userId,
        currentStreak: 1,
        longestStreak: 15,
        lastActivityDate: now,
        freezeCount: 0,
      });

      const result = await streakService.updateStreak(userId);

      expect(mockStreakRepo.upsert).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          currentStreak: 1,
        }),
      );
      expect(result.currentStreak).toBe(1);
    });

    it("should update longestStreak when currentStreak exceeds it", async () => {
      const userId = "user123";
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      mockStreakRepo.findByUser.mockResolvedValue({
        userId,
        currentStreak: 10,
        longestStreak: 10,
        lastActivityDate: yesterday,
        freezeCount: 1,
      });

      mockStreakRepo.upsert.mockResolvedValue({
        userId,
        currentStreak: 11,
        longestStreak: 11,
        lastActivityDate: now,
        freezeCount: 1,
      });

      const result = await streakService.updateStreak(userId);

      expect(mockStreakRepo.upsert).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          currentStreak: 11,
          longestStreak: 11,
        }),
      );
      expect(result.longestStreak).toBe(11);
    });

    it("should not update longestStreak when currentStreak is lower", async () => {
      const userId = "user123";
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      mockStreakRepo.findByUser.mockResolvedValue({
        userId,
        currentStreak: 5,
        longestStreak: 20,
        lastActivityDate: yesterday,
        freezeCount: 0,
      });

      mockStreakRepo.upsert.mockResolvedValue({
        userId,
        currentStreak: 6,
        longestStreak: 20,
        lastActivityDate: now,
        freezeCount: 0,
      });

      const result = await streakService.updateStreak(userId);

      expect(mockStreakRepo.upsert).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          longestStreak: 20,
        }),
      );
      expect(result.longestStreak).toBe(20);
    });
  });

  describe("spendFreeze", () => {
    it("should spend freeze when streak is at risk and freeze available", async () => {
      const userId = "user123";
      const now = new Date();
      const fiftyHoursAgo = new Date(now.getTime() - 50 * 60 * 60 * 1000); // 50 hours ago (beyond 48h)

      mockStreakRepo.findByUser.mockResolvedValue({
        userId,
        currentStreak: 10,
        longestStreak: 15,
        lastActivityDate: fiftyHoursAgo,
        freezeCount: 3,
      });

      const extendedDate = new Date(fiftyHoursAgo.getTime() + 24 * 60 * 60 * 1000);
      mockStreakRepo.update.mockResolvedValue({
        userId,
        currentStreak: 10,
        longestStreak: 15,
        lastActivityDate: extendedDate,
        freezeCount: 2,
      });

      const result = await streakService.spendFreeze(userId);

      expect(mockStreakRepo.update).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          freezeCount: 2,
        }),
      );
      expect(result.freezeCount).toBe(2);
    });

    it("should fail when no freeze available", async () => {
      const userId = "user123";
      const now = new Date();
      const fiftyHoursAgo = new Date(now.getTime() - 50 * 60 * 60 * 1000);

      mockStreakRepo.findByUser.mockResolvedValue({
        userId,
        currentStreak: 7,
        longestStreak: 10,
        lastActivityDate: fiftyHoursAgo,
        freezeCount: 0,
      });

      await expect(streakService.spendFreeze(userId)).rejects.toThrow("No freezes available");
    });

    it("should fail when streak is not at risk (within 48h)", async () => {
      const userId = "user123";
      const now = new Date();
      const twentyHoursAgo = new Date(now.getTime() - 20 * 60 * 60 * 1000); // 20 hours ago (within 48h)

      mockStreakRepo.findByUser.mockResolvedValue({
        userId,
        currentStreak: 5,
        longestStreak: 10,
        lastActivityDate: twentyHoursAgo,
        freezeCount: 2,
      });

      await expect(streakService.spendFreeze(userId)).rejects.toThrow(
        "Streak not at risk (within 48h grace period)",
      );
    });

    it("should fail when user has no streak record", async () => {
      const userId = "user123";
      mockStreakRepo.findByUser.mockResolvedValue(null);

      await expect(streakService.spendFreeze(userId)).rejects.toThrow("No streak record found");
    });

    it("should extend lastActivityDate by exactly 24 hours", async () => {
      const userId = "user123";
      const now = new Date();
      const fiftyHoursAgo = new Date(now.getTime() - 50 * 60 * 60 * 1000);

      mockStreakRepo.findByUser.mockResolvedValue({
        userId,
        currentStreak: 8,
        longestStreak: 12,
        lastActivityDate: fiftyHoursAgo,
        freezeCount: 1,
      });

      const expectedExtendedDate = new Date(fiftyHoursAgo.getTime() + 24 * 60 * 60 * 1000);

      let capturedUpdateData;
      mockStreakRepo.update.mockImplementation(async (uid, data) => {
        capturedUpdateData = data;
        return {
          userId,
          currentStreak: 8,
          longestStreak: 12,
          lastActivityDate: data.lastActivityDate,
          freezeCount: 0,
        };
      });

      await streakService.spendFreeze(userId);

      expect(capturedUpdateData.lastActivityDate.getTime()).toBe(expectedExtendedDate.getTime());
    });
  });

  describe("checkAndAwardFreeze", () => {
    it("should award freeze when 10 consecutive perfect quizzes completed", async () => {
      const userId = "user123";

      // Mock 10 consecutive perfect quizzes (correct Boolean field)
      const perfectQuizzes = Array.from({ length: 10 }, (_, i) => ({
        userId,
        correct: true,
        answeredAt: new Date(Date.now() - i * 60000), // 1 minute apart
      }));
      mockAnswerRepo.findRecentByUser.mockResolvedValue(perfectQuizzes);

      mockStreakRepo.findByUser.mockResolvedValue({
        userId,
        currentStreak: 15,
        longestStreak: 20,
        lastActivityDate: new Date(),
        freezeCount: 2,
      });

      mockStreakRepo.update.mockResolvedValue({
        userId,
        currentStreak: 15,
        longestStreak: 20,
        lastActivityDate: new Date(),
        freezeCount: 3,
      });

      const result = await streakService.checkAndAwardFreeze(userId);

      expect(result).toBe(true);
      expect(mockStreakRepo.update).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          freezeCount: 3,
        }),
      );
    });

    it("should not award freeze when less than 10 perfect quizzes", async () => {
      const userId = "user123";

      // Mock only 8 quizzes
      const quizzes = Array.from({ length: 8 }, (_, i) => ({
        userId,
        correct: true,
        answeredAt: new Date(Date.now() - i * 60000),
      }));
      mockAnswerRepo.findRecentByUser.mockResolvedValue(quizzes);

      const result = await streakService.checkAndAwardFreeze(userId);

      expect(result).toBe(false);
      expect(mockStreakRepo.update).not.toHaveBeenCalled();
    });

    it("should not award freeze when one quiz has incorrect answers", async () => {
      const userId = "user123";

      // Mock 10 quizzes with one imperfect
      const quizzes = Array.from({ length: 10 }, (_, i) => ({
        userId,
        correct: i !== 5, // Quiz #5 is incorrect
        answeredAt: new Date(Date.now() - i * 60000),
      }));
      mockAnswerRepo.findRecentByUser.mockResolvedValue(quizzes);

      const result = await streakService.checkAndAwardFreeze(userId);

      expect(result).toBe(false);
      expect(mockStreakRepo.update).not.toHaveBeenCalled();
    });

    it("should not award freeze when already at cap (5 freezes)", async () => {
      const userId = "user123";

      const perfectQuizzes = Array.from({ length: 10 }, (_, i) => ({
        userId,
        correct: true,
        answeredAt: new Date(Date.now() - i * 60000),
      }));
      mockAnswerRepo.findRecentByUser.mockResolvedValue(perfectQuizzes);

      mockStreakRepo.findByUser.mockResolvedValue({
        userId,
        currentStreak: 20,
        longestStreak: 25,
        lastActivityDate: new Date(),
        freezeCount: 5, // Already at cap
      });

      const result = await streakService.checkAndAwardFreeze(userId);

      expect(result).toBe(false);
      expect(mockStreakRepo.update).not.toHaveBeenCalled();
    });

    it("should handle user with no streak record", async () => {
      const userId = "user123";

      const perfectQuizzes = Array.from({ length: 10 }, (_, i) => ({
        userId,
        correct: true,
        answeredAt: new Date(Date.now() - i * 60000),
      }));
      mockAnswerRepo.findRecentByUser.mockResolvedValue(perfectQuizzes);

      mockStreakRepo.findByUser.mockResolvedValue(null);

      const result = await streakService.checkAndAwardFreeze(userId);

      expect(result).toBe(false);
      expect(mockStreakRepo.update).not.toHaveBeenCalled();
    });

    it("should handle repository errors gracefully", async () => {
      const userId = "user123";

      mockAnswerRepo.findRecentByUser.mockRejectedValue(new Error("Database error"));

      await expect(streakService.checkAndAwardFreeze(userId)).rejects.toThrow("Database error");
    });
  });
});
