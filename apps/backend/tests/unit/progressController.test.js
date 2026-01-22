/**
 * @file apps/backend/tests/unit/progressController.test.js
 * @description Unit tests for ProgressController
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { ProgressController } from "../../src/api/controllers/ProgressController.js";
import { ProgressService } from "../../src/core/services/ProgressService.js";

// Mock ProgressService
vi.mock("../../src/core/services/ProgressService.js");

// Mock logger
vi.mock("../../src/utils/logger.js", () => ({
  createLogger: () => ({
    error: vi.fn(),
    info: vi.fn(),
  }),
}));

describe("ProgressController", () => {
  let mockReq;
  let mockRes;
  let mockService;
  let progressController;

  beforeEach(() => {
    mockReq = {
      userId: "user1",
      params: {},
      body: {},
    };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    mockService = new ProgressService();
    progressController = new ProgressController(mockService);
    vi.clearAllMocks();
  });

  describe("getAllProgress", () => {
    it("should return all progress for user", async () => {
      const mockProgress = [{ id: "1", userId: "user1", wordId: "word1", confidence: 0.5 }];
      mockService.getProgressForUser.mockResolvedValue(mockProgress);

      await progressController.getAllProgress(mockReq, mockRes);

      expect(mockService.getProgressForUser).toHaveBeenCalledWith("user1");
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockProgress);
    });

    it("should handle service errors", async () => {
      mockService.getProgressForUser.mockRejectedValue(new Error("DB error"));

      await progressController.getAllProgress(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Internal Server Error",
          code: "FETCH_PROGRESS_FAILED",
        }),
      );
    });
  });

  describe("getWordProgress", () => {
    it("should return progress for specific word", async () => {
      mockReq.params.wordId = "word1";
      const mockProgress = {
        id: "1",
        userId: "user1",
        wordId: "word1",
        confidence: 0.5,
      };
      mockService.getProgressForWord.mockResolvedValue(mockProgress);

      await progressController.getWordProgress(mockReq, mockRes);

      expect(mockService.getProgressForWord).toHaveBeenCalledWith("user1", "word1");
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockProgress);
    });

    it("should return 404 if progress not found", async () => {
      mockReq.params.wordId = "word1";
      mockService.getProgressForWord.mockResolvedValue(null);

      await progressController.getWordProgress(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: "PROGRESS_NOT_FOUND",
        }),
      );
    });

    it("should return 400 if wordId missing", async () => {
      mockReq.params.wordId = undefined;

      await progressController.getWordProgress(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: "MISSING_WORD_ID",
        }),
      );
    });
  });

  describe("updateWordProgress", () => {
    it("should update word progress", async () => {
      mockReq.params.wordId = "word1";
      mockReq.body = { studyCount: 5, confidence: 0.8 };
      const mockUpdated = {
        id: "1",
        userId: "user1",
        wordId: "word1",
        studyCount: 5,
        confidence: 0.8,
      };
      mockService.updateProgress.mockResolvedValue(mockUpdated);

      await progressController.updateWordProgress(mockReq, mockRes);

      expect(mockService.updateProgress).toHaveBeenCalledWith("user1", "word1", {
        studyCount: 5,
        confidence: 0.8,
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockUpdated);
    });

    it("should validate confidence range", async () => {
      mockReq.params.wordId = "word1";
      mockReq.body = { confidence: 1.5 };

      await progressController.updateWordProgress(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: "INVALID_CONFIDENCE",
        }),
      );
    });

    it("should validate studyCount is non-negative", async () => {
      mockReq.params.wordId = "word1";
      mockReq.body = { studyCount: -1 };

      await progressController.updateWordProgress(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: "INVALID_STUDY_COUNT",
        }),
      );
    });
  });

  describe("batchUpdateProgress", () => {
    it("should batch update multiple words", async () => {
      mockReq.body = {
        updates: [
          { wordId: "word1", confidence: 0.5 },
          { wordId: "word2", confidence: 0.8 },
        ],
      };
      const mockResults = [
        { id: "1", userId: "user1", wordId: "word1", confidence: 0.5 },
        { id: "2", userId: "user1", wordId: "word2", confidence: 0.8 },
      ];
      mockService.batchUpdateProgress.mockResolvedValue(mockResults);

      await progressController.batchUpdateProgress(mockReq, mockRes);

      expect(mockService.batchUpdateProgress).toHaveBeenCalledWith("user1", mockReq.body.updates);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockResults);
    });

    it("should return 400 if updates not array", async () => {
      mockReq.body = { updates: "not-array" };

      await progressController.batchUpdateProgress(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: "INVALID_UPDATES",
        }),
      );
    });

    it("should return 400 if updates array empty", async () => {
      mockReq.body = { updates: [] };

      await progressController.batchUpdateProgress(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: "EMPTY_UPDATES",
        }),
      );
    });

    it("should validate each update has wordId", async () => {
      mockReq.body = {
        updates: [{ confidence: 0.5 }],
      };

      await progressController.batchUpdateProgress(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: "MISSING_WORD_ID",
        }),
      );
    });
  });

  describe("getProgressStats", () => {
    it("should return progress statistics", async () => {
      const mockStats = {
        totalWords: 10,
        studiedWords: 8,
        masteredWords: 5,
        totalStudyCount: 50,
        averageConfidence: 0.65,
        wordsToReviewToday: 3,
      };
      mockService.getProgressStats.mockResolvedValue(mockStats);

      await progressController.getProgressStats(mockReq, mockRes);

      expect(mockService.getProgressStats).toHaveBeenCalledWith("user1");
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockStats);
    });

    it("should handle service errors", async () => {
      mockService.getProgressStats.mockRejectedValue(new Error("DB error"));

      await progressController.getProgressStats(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Internal Server Error",
          code: "FETCH_STATS_FAILED",
        }),
      );
    });
  });
});
