/**
 * @file apps/frontend/src/features/mandarin/services/__tests__/progressService.test.ts
 * @description Unit tests for progressApi service (Story 14.4)
 *
 * Tests migration to apiClient with Axios, typed responses, and error handling
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import MockAdapter from "axios-mock-adapter";
import { apiClient } from "../../../../services/axiosClient";
import { progressApi } from "../progressService";
import type { WordProgress } from "@mandarin/shared-types";

describe("progressApi (Story 14.4)", () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(apiClient);
  });

  afterEach(() => {
    mock.restore();
  });

  describe("getAllProgress", () => {
    it("should fetch all progress and return typed data", async () => {
      const mockProgress: WordProgress[] = [
        {
          wordId: "word1",
          userId: "user1",
          studyCount: 5,
          correctCount: 4,
          confidence: 0.8,
          learnedAt: "2026-01-01T00:00:00Z",
          nextReviewDate: "2026-02-01T00:00:00Z",
          lastReviewedAt: "2026-01-15T00:00:00Z",
          createdAt: "2025-12-01T00:00:00Z",
          updatedAt: "2026-01-15T00:00:00Z",
        },
        {
          wordId: "word2",
          userId: "user1",
          studyCount: 2,
          correctCount: 1,
          confidence: 0.5,
          learnedAt: null,
          nextReviewDate: "2026-02-10T00:00:00Z",
          lastReviewedAt: "2026-01-20T00:00:00Z",
          createdAt: "2026-01-05T00:00:00Z",
          updatedAt: "2026-01-20T00:00:00Z",
        },
      ];

      mock.onGet("/v1/progress").reply(200, mockProgress);

      const result = await progressApi.getAllProgress();

      expect(result).toEqual(mockProgress);
      expect(result).toHaveLength(2);
      expect(result[0].wordId).toBe("word1"); // Type-safe access
      expect(result[1].confidence).toBe(0.5);
    });

    it("should throw user-friendly error on 500 failure", async () => {
      mock.onGet("/v1/progress").reply(500);

      await expect(progressApi.getAllProgress()).rejects.toThrow(
        "Failed to load your progress. Please try again.",
      );
    });

    it("should throw user-friendly error on network failure", async () => {
      mock.onGet("/v1/progress").networkError();

      await expect(progressApi.getAllProgress()).rejects.toThrow(
        "Failed to load your progress. Please try again.",
      );
    });
  });

  describe("getWordProgress", () => {
    it("should fetch progress for specific word", async () => {
      const mockProgress: WordProgress = {
        wordId: "word1",
        userId: "user1",
        studyCount: 5,
        correctCount: 4,
        confidence: 0.8,
        learnedAt: "2026-01-01T00:00:00Z",
        nextReviewDate: "2026-02-01T00:00:00Z",
        lastReviewedAt: "2026-01-15T00:00:00Z",
        createdAt: "2025-12-01T00:00:00Z",
        updatedAt: "2026-01-15T00:00:00Z",
      };

      mock.onGet("/v1/progress/word1").reply(200, {
        success: true,
        data: mockProgress,
      });

      const result = await progressApi.getWordProgress("word1");

      expect(result).toEqual(mockProgress);
      expect(result?.wordId).toBe("word1");
    });

    it("should return null on 404 (word not yet learned)", async () => {
      mock.onGet("/v1/progress/newword").reply(404);

      const result = await progressApi.getWordProgress("newword");

      expect(result).toBeNull();
    });

    it("should throw error on non-404 failure", async () => {
      mock.onGet("/v1/progress/word1").reply(500);

      await expect(progressApi.getWordProgress("word1")).rejects.toThrow(
        "Failed to load word progress. Please try again.",
      );
    });
  });

  describe("updateWordProgress", () => {
    it("should update word progress and return updated data", async () => {
      const updatedProgress: WordProgress = {
        wordId: "word1",
        userId: "user1",
        studyCount: 6,
        correctCount: 5,
        confidence: 0.9,
        learnedAt: "2026-01-01T00:00:00Z",
        nextReviewDate: "2026-02-05T00:00:00Z",
        lastReviewedAt: "2026-02-02T00:00:00Z",
        createdAt: "2025-12-01T00:00:00Z",
        updatedAt: "2026-02-02T00:00:00Z",
      };

      mock.onPut("/v1/progress/word1").reply(200, updatedProgress);

      const result = await progressApi.updateWordProgress("word1", {
        studyCount: 6,
        correctCount: 5,
        confidence: 0.9,
      });

      expect(result).toEqual(updatedProgress);
      expect(result.studyCount).toBe(6);
      expect(result.confidence).toBe(0.9);
    });

    it("should throw user-friendly error on update failure", async () => {
      mock.onPut("/v1/progress/word1").reply(500);

      await expect(progressApi.updateWordProgress("word1", { confidence: 0.5 })).rejects.toThrow(
        "Failed to save your progress. Please try again.",
      );
    });
  });

  describe("batchUpdateProgress", () => {
    it("should batch update multiple words and return results", async () => {
      const mockResults: WordProgress[] = [
        {
          wordId: "word1",
          userId: "user1",
          studyCount: 6,
          correctCount: 5,
          confidence: 0.9,
          learnedAt: "2026-02-02T00:00:00Z",
          nextReviewDate: "2026-02-10T00:00:00Z",
          lastReviewedAt: "2026-02-02T00:00:00Z",
          createdAt: "2025-12-01T00:00:00Z",
          updatedAt: "2026-02-02T00:00:00Z",
        },
        {
          wordId: "word2",
          userId: "user1",
          studyCount: 3,
          correctCount: 2,
          confidence: 0.7,
          learnedAt: null,
          nextReviewDate: "2026-02-08T00:00:00Z",
          lastReviewedAt: "2026-02-02T00:00:00Z",
          createdAt: "2026-01-05T00:00:00Z",
          updatedAt: "2026-02-02T00:00:00Z",
        },
      ];

      mock.onPost("/v1/progress/batch").reply(200, {
        success: true,
        data: {
          updated: 2,
          failed: 0,
          results: mockResults,
        },
      });

      const updates = {
        updates: [
          { wordId: "word1", data: { confidence: 0.9 } },
          { wordId: "word2", data: { confidence: 0.7 } },
        ],
      };

      const result = await progressApi.batchUpdateProgress(updates);

      expect(result).toEqual(mockResults);
      expect(result).toHaveLength(2);
    });

    it("should throw error on batch update failure", async () => {
      mock.onPost("/v1/progress/batch").reply(500);

      await expect(progressApi.batchUpdateProgress({ updates: [] })).rejects.toThrow(
        "Failed to save your progress. Please try again.",
      );
    });
  });

  describe("deleteProgress", () => {
    it("should delete word progress successfully", async () => {
      mock.onDelete("/v1/progress/word1").reply(204);

      await expect(progressApi.deleteProgress("word1")).resolves.toBeUndefined();
    });

    it("should throw user-friendly error on delete failure", async () => {
      mock.onDelete("/v1/progress/word1").reply(500);

      await expect(progressApi.deleteProgress("word1")).rejects.toThrow(
        "Failed to reset word progress. Please try again.",
      );
    });
  });

  describe("getProgressStats", () => {
    it("should fetch progress statistics", async () => {
      const mockStats = {
        totalWords: 10,
        studiedWords: 8,
        masteredWords: 5,
        totalStudyCount: 50,
        averageConfidence: 0.65,
        wordsToReviewToday: 3,
      };

      mock.onGet("/v1/progress/stats").reply(200, mockStats);

      const result = await progressApi.getProgressStats();

      expect(result).toEqual(mockStats);
      expect(result.totalWords).toBe(10);
      expect(result.studiedWords).toBe(8);
    });

    it("should throw error on stats fetch failure", async () => {
      mock.onGet("/v1/progress/stats").reply(500);

      await expect(progressApi.getProgressStats()).rejects.toThrow(
        "Failed to load progress statistics. Please try again.",
      );
    });
  });

  describe("Type safety", () => {
    it("should provide TypeScript autocomplete for WordProgress fields", async () => {
      const mockProgress: WordProgress = {
        wordId: "word1",
        userId: "user1",
        studyCount: 5,
        correctCount: 4,
        confidence: 0.8,
        learnedAt: "2026-01-01T00:00:00Z",
        nextReviewDate: "2026-02-01T00:00:00Z",
        lastReviewedAt: "2026-01-15T00:00:00Z",
        createdAt: "2025-12-01T00:00:00Z",
        updatedAt: "2026-01-15T00:00:00Z",
      };

      mock.onGet("/v1/progress/word1").reply(200, {
        success: true,
        data: mockProgress,
      });

      const result = await progressApi.getWordProgress("word1");

      // TypeScript should allow accessing these fields without errors
      if (result) {
        expect(result.wordId).toBeDefined();
        expect(result.confidence).toBeDefined();
        expect(result.learnedAt).toBeDefined();
        expect(result.nextReviewDate).toBeDefined();
      }
    });
  });
});
