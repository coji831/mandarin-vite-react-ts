/**
 * @file modules/gamification/__tests__/GamificationService.test.js
 * @description Unit tests for GamificationService
 * Tests badge awards, XP calculation, and mystery box drops
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import GamificationService from "../services/GamificationService.js";

describe("GamificationService", () => {
  let gamificationService;
  let mockBadgeRepo;
  let mockStreakRepo;

  beforeEach(() => {
    // Mock BadgeRepository (always return arrays, never undefined)
    mockBadgeRepo = {
      findByUser: vi.fn().mockResolvedValue([]),
      create: vi.fn(),
    };

    // Mock StreakRepository
    mockStreakRepo = {
      findByUser: vi.fn(),
    };

    gamificationService = new GamificationService(mockBadgeRepo, mockStreakRepo);
  });

  describe("getBadges", () => {
    it("should return earned badges and available badges with progress", async () => {
      const userId = "user123";

      mockStreakRepo.findByUser.mockResolvedValue({
        userId,
        currentStreak: 15,
        longestStreak: 15,
        lastActivityDate: new Date(),
        freezeCount: 2,
      });

      mockBadgeRepo.findByUser.mockResolvedValue([
        { badgeId: "bronze_flame", earnedDate: new Date("2025-01-01") },
      ]);

      const result = await gamificationService.getBadges(userId);

      expect(result.earned).toHaveLength(1);
      expect(result.earned[0].id).toBe("bronze_flame");
      expect(result.available).toHaveLength(3); // 30, 100, 365 day badges
      expect(result.available[0].id).toBe("silver_flame");
      expect(result.available[0].percentComplete).toBe(50); // 15/30 = 50%
    });

    it("should calculate progress correctly for multiple available badges", async () => {
      const userId = "user123";

      mockStreakRepo.findByUser.mockResolvedValue({
        userId,
        currentStreak: 50,
        longestStreak: 50,
        lastActivityDate: new Date(),
        freezeCount: 0,
      });

      mockBadgeRepo.findByUser.mockResolvedValue([
        { badgeId: "bronze_flame", earnedDate: new Date("2025-01-01") },
        { badgeId: "silver_flame", earnedDate: new Date("2025-01-15") },
      ]);

      const result = await gamificationService.getBadges(userId);

      expect(result.earned).toHaveLength(2);
      expect(result.available).toHaveLength(2); // 100, 365 day badges
      expect(result.available[0].percentComplete).toBe(50); // 50/100 = 50%
      expect(result.available[1].percentComplete).toBe(14); // 50/365 ≈ 13.7%, rounds to 14%
    });

    it("should return earned array empty and all badges available with 0% when user has no streak", async () => {
      const userId = "user123";

      mockStreakRepo.findByUser.mockResolvedValue(null);
      mockBadgeRepo.findByUser.mockResolvedValue([]);

      const result = await gamificationService.getBadges(userId);

      expect(result.earned).toEqual([]);
      // Implementation returns all available badges with 0% progress even when no streak
      expect(result.available).toHaveLength(4);
      expect(result.available[0].percentComplete).toBe(0);
    });

    it("should show all badges as available when user has earned none", async () => {
      const userId = "user123";

      mockStreakRepo.findByUser.mockResolvedValue({
        userId,
        currentStreak: 3,
        longestStreak: 3,
        lastActivityDate: new Date(),
        freezeCount: 0,
      });

      mockBadgeRepo.findByUser.mockResolvedValue([]);

      const result = await gamificationService.getBadges(userId);

      expect(result.earned).toHaveLength(0);
      expect(result.available).toHaveLength(4); // All 4 badge tiers
      expect(result.available[0].id).toBe("bronze_flame");
      expect(result.available[0].percentComplete).toBe(43); // 3/7 ≈ 42.9%, rounds to 43%
    });
  });

  describe("checkAndAwardBadges", () => {
    it("should award 7-day badge when reaching 7 days", async () => {
      const userId = "user123";
      const longestStreak = 7;

      mockBadgeRepo.create.mockResolvedValue({
        userId,
        badgeId: "bronze_flame",
        earnedDate: new Date(),
      });

      const result = await gamificationService.checkAndAwardBadges(userId, longestStreak);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("bronze_flame");
      expect(result[0].tier).toBe("bronze");
      expect(mockBadgeRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          badgeId: "bronze_flame",
        }),
      );
    });

    it("should award multiple badges when reaching higher milestone", async () => {
      const userId = "user123";
      const longestStreak = 30;

      // User hasn't earned any badges yet
      mockBadgeRepo.create.mockResolvedValue({});

      const result = await gamificationService.checkAndAwardBadges(userId, longestStreak);

      expect(result).toHaveLength(2); // bronze and silver badges
      expect(result[0].id).toBe("bronze_flame");
      expect(result[1].id).toBe("silver_flame");
      expect(mockBadgeRepo.create).toHaveBeenCalledTimes(2);
    });

    it("should not award badge if already earned", async () => {
      const userId = "user123";
      const longestStreak = 10;

      mockBadgeRepo.findByUser.mockResolvedValue([
        { badgeId: "bronze_flame", earnedDate: new Date() },
      ]);

      const result = await gamificationService.checkAndAwardBadges(userId, longestStreak);

      expect(result).toHaveLength(0);
      expect(mockBadgeRepo.create).not.toHaveBeenCalled();
    });

    it("should award all 4 badge tiers when reaching 365 days", async () => {
      const userId = "user123";
      const longestStreak = 365;

      mockBadgeRepo.create.mockResolvedValue({});

      const result = await gamificationService.checkAndAwardBadges(userId, longestStreak);

      expect(result).toHaveLength(4);
      expect(result.map((b) => b.tier)).toEqual(["bronze", "silver", "gold", "diamond"]);
    });

    it("should not award badges when streak is below lowest milestone", async () => {
      const userId = "user123";
      const longestStreak = 5;

      const result = await gamificationService.checkAndAwardBadges(userId, longestStreak);

      expect(result).toHaveLength(0);
      expect(mockBadgeRepo.create).not.toHaveBeenCalled();
    });
  });

  describe("calculateXP", () => {
    it("should award base XP (10) for correct answer without streak bonus", () => {
      const currentStreak = 3;
      const correctCount = 1;

      const xp = gamificationService.calculateXP(correctCount, currentStreak);

      expect(xp).toBe(10);
    });

    it("should award base + bonus XP (15) for correct answer with 7-day streak", () => {
      const currentStreak = 7;
      const correctCount = 1;

      const xp = gamificationService.calculateXP(correctCount, currentStreak);

      expect(xp).toBe(15);
    });

    it("should award base + bonus XP (15) for correct answer with streak > 7", () => {
      const currentStreak = 25;
      const correctCount = 1;

      const xp = gamificationService.calculateXP(correctCount, currentStreak);

      expect(xp).toBe(15);
    });

    it("should award 0 XP for incorrect answer regardless of streak", () => {
      const currentStreak = 10;
      const correctCount = 0;

      const xp = gamificationService.calculateXP(correctCount, currentStreak);

      expect(xp).toBe(0);
    });

    it("should award 0 XP for incorrect answer with no streak", () => {
      const currentStreak = 0;
      const correctCount = 0;

      const xp = gamificationService.calculateXP(correctCount, currentStreak);

      expect(xp).toBe(0);
    });
  });

  describe("checkMysteryBoxDrop", () => {
    it("should return null when not on 7-day milestone", () => {
      const currentStreak = 5;

      const result = gamificationService.checkMysteryBoxDrop(currentStreak);

      expect(result).toBeNull();
    });

    it("should return mystery box on 7-day milestones", () => {
      const milestones = [7, 14, 21, 28, 35, 42, 49, 56, 63, 70];

      milestones.forEach((streak) => {
        // Mock Math.random to return 0.04 (below 0.05 threshold)
        vi.spyOn(Math, "random").mockReturnValue(0.04);

        const result = gamificationService.checkMysteryBoxDrop(streak);

        expect(result).not.toBeNull();
        expect(result).toHaveProperty("type");
        expect(result).toHaveProperty("name");
        expect(["xp", "freeze", "badge"]).toContain(result.type);

        vi.restoreAllMocks();
      });
    });

    it("should return null when random roll fails (96% of the time)", () => {
      const currentStreak = 7;

      // Mock Math.random to return 0.06 (above 0.05 threshold)
      vi.spyOn(Math, "random").mockReturnValue(0.06);

      const result = gamificationService.checkMysteryBoxDrop(currentStreak);

      expect(result).toBeNull();

      vi.restoreAllMocks();
    });

    it("should return one of three reward types randomly", () => {
      const currentStreak = 14;
      const rewards = new Set();

      // Test multiple times with different random values
      for (let i = 0; i < 3; i++) {
        vi.spyOn(Math, "random")
          .mockReturnValueOnce(0.01) // Pass 5% check
          .mockReturnValueOnce(i * 0.35); // Select different reward

        const result = gamificationService.checkMysteryBoxDrop(currentStreak);

        if (result) {
          rewards.add(result.type);
        }

        vi.restoreAllMocks();
      }

      expect(rewards.size).toBeGreaterThan(0);
      rewards.forEach((type) => {
        expect(["xp", "freeze", "badge"]).toContain(type);
      });
    });
  });
});
