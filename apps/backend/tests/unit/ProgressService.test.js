/**
 * @file apps/backend/tests/unit/ProgressService.test.js
 * @description Unit tests for ProgressService
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { ProgressService } from "../../src/core/services/ProgressService.js";
import { prisma } from "../../src/infrastructure/database/client.js";

// Mock Prisma client
vi.mock("../../src/infrastructure/database/client.js", () => ({
  prisma: {
    progress: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

describe("ProgressService", () => {
  let progressService;
  let mockRepository;

  beforeEach(() => {
    // Create mock repository with all required methods
    mockRepository = {
      findByUser: vi.fn(),
      findByUserAndWord: vi.fn(),
      upsert: vi.fn(),
    };

    progressService = new ProgressService(mockRepository);
    vi.clearAllMocks();
  });

  describe("calculateNextReview", () => {
    it("should return 1 day for 0% confidence", () => {
      const result = progressService.calculateNextReview(0);
      const daysDiff = Math.round((result - new Date()) / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBe(1);
    });

    it("should return ~30 days for 100% confidence", () => {
      const result = progressService.calculateNextReview(1);
      const daysDiff = Math.round((result - new Date()) / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBe(30);
    });

    it("should return ~8 days for 50% confidence", () => {
      const result = progressService.calculateNextReview(0.5);
      const daysDiff = Math.round((result - new Date()) / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBeGreaterThanOrEqual(7);
      expect(daysDiff).toBeLessThanOrEqual(9);
    });

    it("should return ~19 days for 80% confidence (mastered)", () => {
      const result = progressService.calculateNextReview(0.8);
      const daysDiff = Math.round((result - new Date()) / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBeGreaterThanOrEqual(18);
      expect(daysDiff).toBeLessThanOrEqual(20);
    });
  });

  describe("getProgressForUser", () => {
    it("should return all progress records for user", async () => {
      const mockProgress = [
        { id: "1", userId: "user1", wordId: "word1", confidence: 0.5 },
        { id: "2", userId: "user1", wordId: "word2", confidence: 0.8 },
      ];
      mockRepository.findByUser.mockResolvedValue(mockProgress);

      const result = await progressService.getProgressForUser("user1");

      expect(mockRepository.findByUser).toHaveBeenCalledWith("user1");
      expect(result).toEqual(mockProgress);
    });

    it("should return empty array if no progress", async () => {
      mockRepository.findByUser.mockResolvedValue([]);

      const result = await progressService.getProgressForUser("user1");

      expect(result).toEqual([]);
    });
  });

  describe("getProgressForWord", () => {
    it("should return progress for specific word", async () => {
      const mockProgress = {
        id: "1",
        userId: "user1",
        wordId: "word1",
        confidence: 0.5,
      };
      mockRepository.findByUserAndWord.mockResolvedValue(mockProgress);

      const result = await progressService.getProgressForWord("user1", "word1");

      expect(mockRepository.findByUserAndWord).toHaveBeenCalledWith("user1", "word1");
      expect(result).toEqual(mockProgress);
    });

    it("should return null if progress not found", async () => {
      mockRepository.findByUserAndWord.mockResolvedValue(null);

      const result = await progressService.getProgressForWord("user1", "word1");

      expect(result).toBeNull();
    });
  });

  describe("updateProgress", () => {
    it("should update existing progress", async () => {
      const mockUpdated = {
        id: "1",
        userId: "user1",
        wordId: "word1",
        studyCount: 5,
        correctCount: 4,
        confidence: 0.8,
        nextReview: new Date("2026-01-15"),
      };
      mockRepository.upsert.mockResolvedValue(mockUpdated);

      const result = await progressService.updateProgress("user1", "word1", {
        studyCount: 5,
        correctCount: 4,
        confidence: 0.8,
      });

      expect(mockRepository.upsert).toHaveBeenCalled();
      expect(result).toEqual(mockUpdated);
    });

    it("should create new progress if not exists", async () => {
      const mockCreated = {
        id: "1",
        userId: "user1",
        wordId: "word1",
        studyCount: 1,
        correctCount: 0,
        confidence: 0,
        nextReview: expect.any(Date),
      };
      mockRepository.upsert.mockResolvedValue(mockCreated);

      const result = await progressService.updateProgress("user1", "word1", {
        studyCount: 1,
      });

      expect(mockRepository.upsert).toHaveBeenCalled();
      expect(result).toEqual(mockCreated);
    });

    it("should calculate nextReview when confidence is provided", async () => {
      mockRepository.upsert.mockResolvedValue({ id: "1" });

      await progressService.updateProgress("user1", "word1", {
        confidence: 0.8,
      });

      const call = mockRepository.upsert.mock.calls[0];
      // Third argument is the data object
      expect(call[2].nextReview).toBeInstanceOf(Date);
    });

    it("should not recalculate nextReview if confidence not provided", async () => {
      mockRepository.upsert.mockResolvedValue({ id: "1" });

      await progressService.updateProgress("user1", "word1", {
        studyCount: 5,
      });

      const call = mockRepository.upsert.mock.calls[0];
      expect(call[2].nextReview).toBeUndefined();
    });
  });

  describe("batchUpdateProgress", () => {
    it("should update multiple words atomically", async () => {
      const updates = [
        { wordId: "word1", confidence: 0.5 },
        { wordId: "word2", confidence: 0.8 },
      ];
      const mockResults = [
        { id: "1", userId: "user1", wordId: "word1", confidence: 0.5 },
        { id: "2", userId: "user1", wordId: "word2", confidence: 0.8 },
      ];
      mockRepository.upsert
        .mockResolvedValueOnce(mockResults[0])
        .mockResolvedValueOnce(mockResults[1]);

      const result = await progressService.batchUpdateProgress("user1", updates);

      expect(mockRepository.upsert).toHaveBeenCalledTimes(2);
      expect(result).toEqual(mockResults);
    });

    it("should handle empty updates array", async () => {
      const result = await progressService.batchUpdateProgress("user1", []);

      expect(mockRepository.upsert).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  describe("getProgressStats", () => {
    it("should calculate statistics correctly", async () => {
      const past = new Date();
      past.setDate(past.getDate() - 1); // Yesterday

      const future = new Date();
      future.setDate(future.getDate() + 5); // 5 days from now

      const mockProgress = [
        {
          id: "1",
          userId: "user1",
          wordId: "word1",
          studyCount: 5,
          correctCount: 4,
          confidence: 0.8,
          nextReview: past, // Past - due for review
        },
        {
          id: "2",
          userId: "user1",
          wordId: "word2",
          studyCount: 3,
          correctCount: 2,
          confidence: 0.6,
          nextReview: future, // Future - not due yet
        },
        {
          id: "3",
          userId: "user1",
          wordId: "word3",
          studyCount: 0,
          correctCount: 0,
          confidence: 0,
          nextReview: future,
        },
      ];
      mockRepository.findByUser.mockResolvedValue(mockProgress);

      const result = await progressService.getProgressStats("user1");

      expect(result).toEqual({
        totalWords: 3,
        studiedWords: 2,
        masteredWords: 1,
        totalStudyCount: 8,
        averageConfidence: (0.8 + 0.6 + 0) / 3,
        wordsToReviewToday: 1, // Only word1 with past nextReview
      });
    });

    it("should return zeros for user with no progress", async () => {
      mockRepository.findByUser.mockResolvedValue([]);

      const result = await progressService.getProgressStats("user1");

      expect(result).toEqual({
        totalWords: 0,
        studiedWords: 0,
        masteredWords: 0,
        totalStudyCount: 0,
        averageConfidence: 0,
        wordsToReviewToday: 0,
      });
    });
  });
});
