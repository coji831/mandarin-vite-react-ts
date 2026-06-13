/**
 * @file apps/frontend/src/features/quiz/services/__tests__/progressService.test.ts
 * @description Unit tests for progressApi service (Story 14.4)
 *
 * Tests migration to apiClient with Axios, typed responses, and error handling
 *
 * Moved from features/mandarin/services/__tests__/ (Phase 2 restructure)
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import MockAdapter from "axios-mock-adapter";
import { apiClient } from "../../../../shared/api/axiosClient";
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
          lapseCount: 0,
          currentDelay: null,
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
          lapseCount: 0,
          currentDelay: null,
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
        lapseCount: 0,
        currentDelay: null,
      };

      mock.onGet("/v1/progress/word1").reply(200, mockProgress);

      const result = await progressApi.getWordProgress("word1");

      expect(result).toEqual(mockProgress);
      expect(result?.wordId).toBe("word1");
    });

    it("should return null on 404", async () => {
      mock.onGet("/v1/progress/nonexistent").reply(404);

      const result = await progressApi.getWordProgress("nonexistent");

      expect(result).toBeNull();
    });

    it("should throw user-friendly error on 500", async () => {
      mock.onGet("/v1/progress/word1").reply(500);

      await expect(progressApi.getWordProgress("word1")).rejects.toThrow(
        "Failed to load word progress. Please try again.",
      );
    });
  });

  describe("updateWordProgress", () => {
    it("should update progress and return updated data", async () => {
      const updateData = { studyCount: 6, confidence: 0.9 };
      const updatedProgress: WordProgress = {
        wordId: "word1",
        userId: "user1",
        studyCount: 6,
        correctCount: 4,
        confidence: 0.9,
        learnedAt: "2026-01-01T00:00:00Z",
        nextReviewDate: "2026-02-01T00:00:00Z",
        lastReviewedAt: "2026-01-15T00:00:00Z",
        createdAt: "2025-12-01T00:00:00Z",
        updatedAt: "2026-01-15T00:00:00Z",
        lapseCount: 0,
        currentDelay: null,
      };

      mock.onPut("/v1/progress/word1").reply(200, updatedProgress);

      const result = await progressApi.updateWordProgress("word1", updateData);

      expect(result.studyCount).toBe(6);
      expect(result.confidence).toBe(0.9);
    });
  });
});
