/**
 * @file modules/readers/api/__tests__/ReadersController.test.ts
 * @description Unit tests for ReadersController
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("../../../shared/utils/logger", () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    cacheHit: vi.fn(),
  })),
}));

import { ReadersController } from "../ReadersController.js";
import {
  PassageNotFoundError,
  RateLimitExceededError,
  PassageGenerationError,
} from "../../types/readers-errors.js";

describe("ReadersController", () => {
  let controller: ReadersController;
  let mockReadersService: any;
  let mockReq: any;
  let mockRes: any;

  const mockPassage = {
    id: "passage-1",
    hskLevel: 2,
    passageIndex: 0,
    title: "Test Topic",
    content: { sentences: [{ index: 0, text: "你好。" }] },
    wordCount: 1,
    knownWordRatio: 1.0,
    targetHskLevel: 2,
    generatedById: null,
    generatedAt: new Date("2026-07-01"),
    accessCount: 0,
    lastAccessedAt: null,
    createdAt: new Date("2026-07-01"),
    updatedAt: new Date("2026-07-01"),
  };

  const mockSegments = [{ text: "你好", wordId: "w_00001", start: 0, end: 2 }];
  const mockHskProfile = {
    distribution: { 1: 1.0 },
    unknownRatio: 0,
    knownWordRatio: 1.0,
    totalWords: 1,
  };

  beforeEach(() => {
    mockReadersService = {
      listPassages: vi.fn(),
      getPassage: vi.fn(),
      generatePassage: vi.fn(),
    };

    controller = new ReadersController(mockReadersService);

    mockReq = {
      params: {},
      query: {},
      body: {},
      userId: "user-1",
    };

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
  });

  describe("listPassages", () => {
    it("should list passages without hskLevel filter", async () => {
      mockReadersService.listPassages.mockResolvedValue([mockPassage]);

      await controller.listPassages(mockReq, mockRes);

      expect(mockReadersService.listPassages).toHaveBeenCalledWith(undefined, "user-1");
      expect(mockRes.json).toHaveBeenCalledWith({ data: [mockPassage] });
    });

    it("should list passages filtered by hskLevel", async () => {
      mockReq.query = { hskLevel: "2" };
      mockReadersService.listPassages.mockResolvedValue([mockPassage]);

      await controller.listPassages(mockReq, mockRes);

      expect(mockReadersService.listPassages).toHaveBeenCalledWith(2, "user-1");
      expect(mockRes.json).toHaveBeenCalledWith({ data: [mockPassage] });
    });

    it("should return 400 for invalid hskLevel", async () => {
      mockReq.query = { hskLevel: "abc" };

      await controller.listPassages(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Failed to list passages",
        code: "VALIDATION_ERROR",
      });
    });

    it("should handle anonymous user gracefully", async () => {
      mockReq.userId = undefined;
      mockReadersService.listPassages.mockResolvedValue([mockPassage]);

      await controller.listPassages(mockReq, mockRes);

      expect(mockReadersService.listPassages).toHaveBeenCalledWith(undefined, undefined);
      expect(mockRes.json).toHaveBeenCalledWith({ data: [mockPassage] });
    });

    it("should return 500 on service error", async () => {
      mockReadersService.listPassages.mockRejectedValue(new Error("DB error"));

      await controller.listPassages(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Failed to list passages",
        code: "INTERNAL_ERROR",
      });
    });
  });

  describe("getPassage", () => {
    it("should return passage with segments", async () => {
      mockReq.params = { id: "passage-1" };
      mockReadersService.getPassage.mockResolvedValue({
        passage: mockPassage,
        segments: mockSegments,
        hskProfile: mockHskProfile,
      });

      await controller.getPassage(mockReq, mockRes);

      expect(mockReadersService.getPassage).toHaveBeenCalledWith("passage-1");
      expect(mockRes.json).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id: "passage-1",
          segments: mockSegments,
          hskProfile: mockHskProfile,
        }),
      });
    });

    it("should return 404 when passage not found", async () => {
      mockReq.params = { id: "nonexistent" };
      mockReadersService.getPassage.mockRejectedValue(new PassageNotFoundError("nonexistent"));

      await controller.getPassage(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Failed to get passage",
        code: "NOT_FOUND",
      });
    });

    it("should return 400 when ID is missing", async () => {
      mockReq.params = { id: "" };

      await controller.getPassage(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe("generatePassage", () => {
    it("should generate a passage successfully", async () => {
      mockReq.body = { topic: "学校生活" };
      const generatedPassage = {
        ...mockPassage,
        generatedById: "user-1",
      };
      mockReadersService.generatePassage.mockResolvedValue({
        passage: generatedPassage,
        segments: mockSegments,
        hskProfile: mockHskProfile,
      });

      await controller.generatePassage(mockReq, mockRes);

      expect(mockReadersService.generatePassage).toHaveBeenCalledWith("学校生活", "user-1");
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id: "passage-1",
          generatedById: "user-1",
        }),
      });
    });

    it("should return 401 when user is not authenticated", async () => {
      mockReq.userId = undefined;

      await controller.generatePassage(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Failed to generate passage",
        code: "AUTH_ERROR",
      });
    });

    it("should return 400 when topic is missing", async () => {
      mockReq.body = {};

      await controller.generatePassage(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Failed to generate passage",
        code: "VALIDATION_ERROR",
      });
    });

    it("should return 429 on rate limit exceeded", async () => {
      mockReq.body = { topic: "学校生活" };
      mockReadersService.generatePassage.mockRejectedValue(
        new RateLimitExceededError("Daily generation limit reached (5/day)"),
      );

      await controller.generatePassage(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(429);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Failed to generate passage",
        code: "RATE_LIMIT",
      });
    });

    it("should return 502 on generation failure", async () => {
      mockReq.body = { topic: "学校生活" };
      mockReadersService.generatePassage.mockRejectedValue(
        new PassageGenerationError("Gemini API error"),
      );

      await controller.generatePassage(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(502);
    });

    it("should return 400 when topic exceeds 100 characters", async () => {
      mockReq.body = { topic: "a".repeat(101) };

      await controller.generatePassage(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Failed to generate passage",
        code: "VALIDATION_ERROR",
      });
    });
  });
});
