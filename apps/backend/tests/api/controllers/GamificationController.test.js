/**
 * Unit tests for GamificationController
 * Tests HTTP handlers for streak and badge endpoints
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import GamificationController from "../../../src/api/controllers/GamificationController.js";

describe("GamificationController", () => {
  let gamificationController;
  let mockStreakService;
  let mockGamificationService;
  let mockRequest;
  let mockResponse;

  beforeEach(() => {
    // Mock StreakService
    mockStreakService = {
      getStreak: vi.fn(),
      spendFreeze: vi.fn(),
    };

    // Mock GamificationService
    mockGamificationService = {
      getBadges: vi.fn(),
    };

    gamificationController = new GamificationController(mockStreakService, mockGamificationService);

    // Mock Express request and response
    mockRequest = {
      user: { id: "user123" },
      body: {},
    };

    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
  });

  describe("getStreak", () => {
    it("should return streak data for authenticated user", async () => {
      const mockStreakData = {
        userId: "user123",
        currentStreak: 10,
        longestStreak: 15,
        freezeCount: 2,
        lastActivityDate: new Date("2025-01-15"),
      };

      mockStreakService.getStreak.mockResolvedValue(mockStreakData);

      await gamificationController.getStreak(mockRequest, mockResponse);

      expect(mockStreakService.getStreak).toHaveBeenCalledWith("user123");
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        currentStreak: 10,
        longestStreak: 15,
        freezeCount: 2,
        lastActivityDate: mockStreakData.lastActivityDate,
      });
    });

    it("should handle service errors gracefully", async () => {
      mockStreakService.getStreak.mockRejectedValue(new Error("Database error"));

      await gamificationController.getStreak(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Failed to fetch streak data",
      });
    });

    it("should return 0 values when user has no streak", async () => {
      mockStreakService.getStreak.mockResolvedValue({
        userId: "user123",
        currentStreak: 0,
        longestStreak: 0,
        freezeCount: 0,
        lastActivityDate: null,
      });

      await gamificationController.getStreak(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        currentStreak: 0,
        longestStreak: 0,
        freezeCount: 0,
        lastActivityDate: null,
      });
    });
  });

  describe("spendFreeze", () => {
    it("should successfully spend freeze when conditions are met", async () => {
      const mockResult = {
        userId: "user123",
        currentStreak: 10,
        longestStreak: 15,
        freezeCount: 1,
        lastActivityDate: new Date("2025-01-16"),
      };

      mockStreakService.spendFreeze.mockResolvedValue(mockResult);

      await gamificationController.spendFreeze(mockRequest, mockResponse);

      expect(mockStreakService.spendFreeze).toHaveBeenCalledWith("user123");
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Freeze spent successfully",
        currentStreak: 10,
        freezeCount: 1,
        lastActivityDate: mockResult.lastActivityDate,
      });
    });

    it("should return 400 when freeze cannot be spent", async () => {
      mockStreakService.spendFreeze.mockRejectedValue(new Error("No freezes available"));

      await gamificationController.spendFreeze(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "No freezes available",
      });
    });

    it("should return 400 when streak is not at risk", async () => {
      mockStreakService.spendFreeze.mockRejectedValue(
        new Error("Streak not at risk (within 48h grace period)"),
      );

      await gamificationController.spendFreeze(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Streak not at risk (within 48h grace period)",
      });
    });

    it("should handle service errors gracefully", async () => {
      mockStreakService.spendFreeze.mockRejectedValue(new Error("Database error"));

      await gamificationController.spendFreeze(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Failed to spend freeze",
      });
    });
  });

  describe("getBadges", () => {
    it("should return earned and available badges", async () => {
      const mockBadges = {
        earned: [
          {
            badgeId: "7-day-streak",
            name: "7-Day Warrior",
            tier: "bronze",
            earnedDate: new Date("2025-01-10"),
          },
        ],
        available: [
          {
            badgeId: "30-day-streak",
            name: "30-Day Champion",
            tier: "silver",
            progress: 50,
            requirement: 30,
          },
          {
            badgeId: "100-day-streak",
            name: "100-Day Master",
            tier: "gold",
            progress: 15,
            requirement: 100,
          },
        ],
      };

      mockGamificationService.getBadges.mockResolvedValue(mockBadges);

      await gamificationController.getBadges(mockRequest, mockResponse);

      expect(mockGamificationService.getBadges).toHaveBeenCalledWith("user123");
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockBadges);
    });

    it("should return empty arrays when user has no badges", async () => {
      const mockBadges = {
        earned: [],
        available: [],
      };

      mockGamificationService.getBadges.mockResolvedValue(mockBadges);

      await gamificationController.getBadges(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockBadges);
    });

    it("should handle service errors gracefully", async () => {
      mockGamificationService.getBadges.mockRejectedValue(new Error("Database error"));

      await gamificationController.getBadges(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Failed to fetch badges",
      });
    });
  });
});
