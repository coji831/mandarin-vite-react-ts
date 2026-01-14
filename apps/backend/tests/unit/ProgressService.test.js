/**
 * @file apps/backend/tests/unit/ProgressService.test.js
 * @description Unit tests for ProgressService
 */

import { ProgressService } from "../../src/services/ProgressService.js";
import { prisma } from "../../src/models/index.js";

// Mock Prisma client
jest.mock("../../src/models/index.js", () => ({
  prisma: {
    progress: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

describe("ProgressService", () => {
  let progressService;

  beforeEach(() => {
    progressService = new ProgressService();
    jest.clearAllMocks();
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
      prisma.progress.findMany.mockResolvedValue(mockProgress);

      const result = await progressService.getProgressForUser("user1");

      expect(prisma.progress.findMany).toHaveBeenCalledWith({
        where: { userId: "user1" },
        orderBy: { updatedAt: "desc" },
      });
      expect(result).toEqual(mockProgress);
    });

    it("should return empty array if no progress", async () => {
      prisma.progress.findMany.mockResolvedValue([]);

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
      prisma.progress.findUnique.mockResolvedValue(mockProgress);

      const result = await progressService.getProgressForWord("user1", "word1");

      expect(prisma.progress.findUnique).toHaveBeenCalledWith({
        where: {
          userId_wordId: { userId: "user1", wordId: "word1" },
        },
      });
      expect(result).toEqual(mockProgress);
    });

    it("should return null if progress not found", async () => {
      prisma.progress.findUnique.mockResolvedValue(null);

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
      prisma.progress.upsert.mockResolvedValue(mockUpdated);

      const result = await progressService.updateProgress("user1", "word1", {
        studyCount: 5,
        correctCount: 4,
        confidence: 0.8,
      });

      expect(prisma.progress.upsert).toHaveBeenCalled();
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
      prisma.progress.upsert.mockResolvedValue(mockCreated);

      const result = await progressService.updateProgress("user1", "word1", {
        studyCount: 1,
      });

      expect(prisma.progress.upsert).toHaveBeenCalled();
      expect(result).toEqual(mockCreated);
    });

    it("should calculate nextReview when confidence is provided", async () => {
      prisma.progress.upsert.mockImplementation(({ create, update }) => {
        return Promise.resolve({ ...create, ...update });
      });

      await progressService.updateProgress("user1", "word1", {
        confidence: 0.8,
      });

      const call = prisma.progress.upsert.mock.calls[0][0];
      expect(call.update.nextReview).toBeInstanceOf(Date);
      expect(call.create.nextReview).toBeInstanceOf(Date);
    });

    it("should not recalculate nextReview if confidence not provided", async () => {
      prisma.progress.upsert.mockImplementation(({ create, update }) => {
        return Promise.resolve({ ...create, ...update });
      });

      await progressService.updateProgress("user1", "word1", {
        studyCount: 5,
      });

      const call = prisma.progress.upsert.mock.calls[0][0];
      expect(call.update.nextReview).toBeUndefined();
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
      prisma.$transaction.mockResolvedValue(mockResults);

      const result = await progressService.batchUpdateProgress("user1", updates);

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result).toEqual(mockResults);
    });

    it("should handle empty updates array", async () => {
      prisma.$transaction.mockResolvedValue([]);

      const result = await progressService.batchUpdateProgress("user1", []);

      expect(prisma.$transaction).toHaveBeenCalledWith([]);
      expect(result).toEqual([]);
    });
  });

  describe("getProgressStats", () => {
    it("should calculate statistics correctly", async () => {
      const mockProgress = [
        {
          id: "1",
          userId: "user1",
          wordId: "word1",
          studyCount: 5,
          correctCount: 4,
          confidence: 0.8,
          nextReview: new Date("2026-01-05"), // Past
        },
        {
          id: "2",
          userId: "user1",
          wordId: "word2",
          studyCount: 3,
          correctCount: 2,
          confidence: 0.6,
          nextReview: new Date("2026-01-12"), // Future
        },
        {
          id: "3",
          userId: "user1",
          wordId: "word3",
          studyCount: 0,
          correctCount: 0,
          confidence: 0,
          nextReview: new Date("2026-01-10"),
        },
      ];
      prisma.progress.findMany.mockResolvedValue(mockProgress);

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
      prisma.progress.findMany.mockResolvedValue([]);

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
