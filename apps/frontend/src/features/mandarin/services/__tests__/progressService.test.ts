import { vi } from 'vitest';
/**
 * @file apps/frontend/src/features/mandarin/services/__tests__/progressApiService.test.ts
 * @description Unit tests for progressApi service
 */

import { progressApi, ProgressApiService } from "../progressService";
import { API_ENDPOINTS } from "@mandarin/shared-constants";

// Mock fetch globally
global.fetch = vi.fn();

describe("ProgressApiService", () => {
  let service: ProgressApiService;
  const mockToken = "test-token-123";

  beforeEach(() => {
    service = new ProgressApiService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("getAllProgress", () => {
    it("should fetch all progress with auth headers", async () => {
      const mockResponse = [{ id: "1", wordId: "word1", studyCount: 5, confidence: 0.8 }];

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await service.getAllProgress();

      expect(global.fetch).toHaveBeenCalledWith(API_ENDPOINTS.PROGRESS, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${mockToken}`,
        },
      });
      expect(result).toEqual(mockResponse);
    });

    it("should throw error on failed request", async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
      });

      await expect(service.getAllProgress()).rejects.toThrow("Failed to fetch progress: 500");
    });
  });

  describe("getWordProgress", () => {
    it("should fetch progress for specific word", async () => {
      const mockResponse = {
        id: "1",
        wordId: "word1",
        studyCount: 5,
        confidence: 0.8,
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await service.getWordProgress("word1");

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/word1"),
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockToken}`,
          }),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it("should throw specific error on 404", async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 404,
      });

      await expect(service.getWordProgress("word1")).rejects.toThrow(
        "Progress not found for this word"
      );
    });
  });

  describe("updateWordProgress", () => {
    it("should update word progress with data", async () => {
      const updateData = { studyCount: 6, confidence: 0.9 };
      const mockResponse = {
        id: "1",
        wordId: "word1",
        studyCount: 6,
        confidence: 0.9,
        nextReview: "2026-01-15",
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await service.updateWordProgress("word1", updateData);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/word1"),
        expect.objectContaining({
          method: "PUT",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            Authorization: `Bearer ${mockToken}`,
          }),
          body: JSON.stringify(updateData),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it("should throw error on failed update", async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 400,
      });

      await expect(service.updateWordProgress("word1", { confidence: 0.5 })).rejects.toThrow(
        "Failed to update word progress: 400"
      );
    });
  });

  describe("batchUpdateProgress", () => {
    it("should batch update multiple words", async () => {
      const updates = {
        updates: [
          { wordId: "word1", confidence: 0.5 },
          { wordId: "word2", confidence: 0.8 },
        ],
      };
      const mockResponse = [
        { id: "1", wordId: "word1", confidence: 0.5 },
        { id: "2", wordId: "word2", confidence: 0.8 },
      ];

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await service.batchUpdateProgress(updates);

      expect(global.fetch).toHaveBeenCalledWith(
        API_ENDPOINTS.PROGRESS_BATCH,
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            Authorization: `Bearer ${mockToken}`,
          }),
          body: JSON.stringify(updates),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it("should throw error on batch update failure", async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
      });

      await expect(service.batchUpdateProgress({ updates: [] })).rejects.toThrow(
        "Failed to batch update progress: 500"
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

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockStats,
      });

      const result = await service.getProgressStats();

      expect(global.fetch).toHaveBeenCalledWith(
        API_ENDPOINTS.PROGRESS_STATS,
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockToken}`,
          }),
        })
      );
      expect(result).toEqual(mockStats);
    });

    it("should throw error on stats fetch failure", async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
      });

      await expect(service.getProgressStats()).rejects.toThrow(
        "Failed to fetch progress stats: 500"
      );
    });
  });

  describe("Singleton instance", () => {
    it("should export singleton progressApi instance", () => {
      expect(progressApi).toBeInstanceOf(ProgressApiService);
    });
  });
});
