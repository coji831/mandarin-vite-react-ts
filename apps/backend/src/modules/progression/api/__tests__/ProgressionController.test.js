/**
 * @file modules/progression/api/__tests__/ProgressionController.test.js
 * @description Unit tests for ProgressionController — radical progress HTTP handlers
 * Story 19.3: RadicalProgress + SRS Review Integration
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { ProgressionController } from "../ProgressionController.js";

describe("ProgressionController", () => {
  let progressionController;
  let mockProgressionService;
  let mockReviewService;
  let mockReq;
  let mockRes;

  beforeEach(() => {
    // Mock ProgressionService
    mockProgressionService = {
      getRadicalProgress: vi.fn(),
      getRadicalProgressById: vi.fn(),
      upsertRadicalProgress: vi.fn(),
    };

    // Mock ReviewService
    mockReviewService = {
      recordRating: vi.fn(),
    };

    progressionController = new ProgressionController(mockProgressionService, mockReviewService);

    // Mock Express request and response (userId set by auth middleware)
    mockReq = {
      userId: "user123",
      params: {},
      body: {},
    };

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
  });

  describe("getRadicalProgress", () => {
    it("should return 200 with array of radical progress records", async () => {
      const mockProgress = [
        { userId: "user123", radicalId: "rad_0001", memorized: true, recognitionLevel: 3 },
        { userId: "user123", radicalId: "rad_0002", memorized: false, recognitionLevel: 1 },
      ];
      mockProgressionService.getRadicalProgress.mockResolvedValue(mockProgress);

      await progressionController.getRadicalProgress(mockReq, mockRes);

      expect(mockProgressionService.getRadicalProgress).toHaveBeenCalledWith("user123");
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockProgress);
    });

    it("should return 200 with empty array when user has no progress", async () => {
      mockProgressionService.getRadicalProgress.mockResolvedValue([]);

      await progressionController.getRadicalProgress(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith([]);
    });

    it("should return 500 on service error", async () => {
      mockProgressionService.getRadicalProgress.mockRejectedValue(new Error("DB error"));

      await progressionController.getRadicalProgress(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Failed to load radical progress",
        code: "LOAD_ERROR",
      });
    });
  });

  describe("getRadicalProgressById", () => {
    it("should return 200 with the progress record when found", async () => {
      const mockRecord = {
        userId: "user123",
        radicalId: "rad_0001",
        memorized: true,
        recognitionLevel: 3,
      };
      mockReq.params = { radicalId: "rad_0001" };
      mockProgressionService.getRadicalProgressById.mockResolvedValue(mockRecord);

      await progressionController.getRadicalProgressById(mockReq, mockRes);

      expect(mockProgressionService.getRadicalProgressById).toHaveBeenCalledWith(
        "user123",
        "rad_0001",
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockRecord);
    });

    it("should return 404 when radical progress not found", async () => {
      mockReq.params = { radicalId: "rad_9999" };
      mockProgressionService.getRadicalProgressById.mockResolvedValue(null);

      await progressionController.getRadicalProgressById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Failed to load radical progress",
        code: "NOT_FOUND",
      });
    });

    it("should return 500 on service error", async () => {
      mockReq.params = { radicalId: "rad_0001" };
      mockProgressionService.getRadicalProgressById.mockRejectedValue(new Error("DB error"));

      await progressionController.getRadicalProgressById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Failed to load radical progress",
        code: "LOAD_ERROR",
      });
    });
  });

  describe("upsertRadicalProgress", () => {
    it("should return 200 on successful upsert", async () => {
      const mockRecord = {
        userId: "user123",
        radicalId: "rad_0001",
        memorized: true,
        recognitionLevel: 3,
      };
      mockReq.params = { radicalId: "rad_0001" };
      mockReq.body = { memorized: true, recognitionLevel: 3 };
      mockProgressionService.upsertRadicalProgress.mockResolvedValue(mockRecord);
      mockReviewService.recordRating.mockResolvedValue({
        nextReview: new Date(),
        intervalDays: 2,
        studyCount: 1,
      });

      await progressionController.upsertRadicalProgress(mockReq, mockRes);

      expect(mockProgressionService.upsertRadicalProgress).toHaveBeenCalledWith(
        "user123",
        "rad_0001",
        {
          memorized: true,
          recognitionLevel: 3,
        },
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockRecord);
    });

    it("should use default values when body fields are omitted", async () => {
      const mockRecord = {
        userId: "user123",
        radicalId: "rad_0001",
        memorized: false,
        recognitionLevel: 0,
      };
      mockReq.params = { radicalId: "rad_0001" };
      mockReq.body = {};
      mockProgressionService.upsertRadicalProgress.mockResolvedValue(mockRecord);

      await progressionController.upsertRadicalProgress(mockReq, mockRes);

      expect(mockProgressionService.upsertRadicalProgress).toHaveBeenCalledWith(
        "user123",
        "rad_0001",
        {
          memorized: false,
          recognitionLevel: 0,
        },
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockRecord);
    });

    it("should return 400 when radicalId is invalid", async () => {
      mockReq.params = { radicalId: "rad_9999" };
      mockReq.body = { memorized: true };
      mockProgressionService.upsertRadicalProgress.mockRejectedValue(
        new Error("Invalid radicalId: rad_9999"),
      );

      await progressionController.upsertRadicalProgress(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Failed to update radical progress",
        code: "VALIDATION_ERROR",
      });
    });

    it("should return 500 on unexpected service error", async () => {
      mockReq.params = { radicalId: "rad_0001" };
      mockReq.body = { memorized: true };
      mockProgressionService.upsertRadicalProgress.mockRejectedValue(
        new Error("DB connection lost"),
      );

      await progressionController.upsertRadicalProgress(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Failed to update radical progress",
        code: "INTERNAL_ERROR",
      });
    });

    it("should call reviewService.recordRating when memorized=true", async () => {
      const mockRecord = {
        userId: "user123",
        radicalId: "rad_0001",
        memorized: true,
        recognitionLevel: 3,
      };
      mockReq.params = { radicalId: "rad_0001" };
      mockReq.body = { memorized: true, recognitionLevel: 3 };
      mockProgressionService.upsertRadicalProgress.mockResolvedValue(mockRecord);
      mockReviewService.recordRating.mockResolvedValue({
        nextReview: new Date(),
        intervalDays: 2,
        studyCount: 1,
      });

      await progressionController.upsertRadicalProgress(mockReq, mockRes);

      expect(mockReviewService.recordRating).toHaveBeenCalledWith("user123", {
        itemType: "radical",
        itemId: "rad_0001",
        rating: "good",
      });
      expect(mockReviewService.recordRating).toHaveBeenCalledOnce();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockRecord);
    });

    it("should NOT call reviewService.recordRating when memorized=false", async () => {
      const mockRecord = {
        userId: "user123",
        radicalId: "rad_0001",
        memorized: false,
        recognitionLevel: 1,
      };
      mockReq.params = { radicalId: "rad_0001" };
      mockReq.body = { memorized: false, recognitionLevel: 1 };
      mockProgressionService.upsertRadicalProgress.mockResolvedValue(mockRecord);

      await progressionController.upsertRadicalProgress(mockReq, mockRes);

      expect(mockReviewService.recordRating).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockRecord);
    });

    it("should still return 200 when reviewService.recordRating throws (side-effect failure is caught)", async () => {
      const mockRecord = {
        userId: "user123",
        radicalId: "rad_0001",
        memorized: true,
        recognitionLevel: 3,
      };
      mockReq.params = { radicalId: "rad_0001" };
      mockReq.body = { memorized: true, recognitionLevel: 3 };
      mockProgressionService.upsertRadicalProgress.mockResolvedValue(mockRecord);
      mockReviewService.recordRating.mockRejectedValue(new Error("SRS error"));

      await progressionController.upsertRadicalProgress(mockReq, mockRes);

      // The .catch() on the side-effect means the response is still 200
      expect(mockReviewService.recordRating).toHaveBeenCalledWith("user123", {
        itemType: "radical",
        itemId: "rad_0001",
        rating: "good",
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockRecord);
    });
  });
});
