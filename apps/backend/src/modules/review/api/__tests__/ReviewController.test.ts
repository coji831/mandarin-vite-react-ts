/**
 * @file apps/backend/src/modules/review/api/__tests__/ReviewController.test.ts
 * @description P0-1 regression tests (Story 24-1) — `ReviewController` drops
 * `req.userId!` on getReviewItems / recordRating / getDueCount: a missing
 * authenticated user yields an explicit 401 (never a 500 from a null deref,
 * never a full-row read), and a present userId delegates to the service.
 *
 * Story 24-1: P0-1 Security Stopgap.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response } from "express";
import { ReviewController } from "../ReviewController.js";

vi.mock("../../../../shared/utils/logger.js", () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}));

function makeRes() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response & { status: ReturnType<typeof vi.fn>; json: ReturnType<typeof vi.fn> };
  return res;
}

function makeReq(overrides: Record<string, unknown> = {}) {
  return {
    userId: "user123",
    query: {},
    body: {},
    params: {},
    ...overrides,
  } as unknown as Request;
}

describe("ReviewController — P0-1 cross-tenant leak stopgap (Story 24-1)", () => {
  let controller: ReviewController;
  let mockService: {
    getReviewItems: ReturnType<typeof vi.fn>;
    recordRating: ReturnType<typeof vi.fn>;
    getDueCount: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockService = {
      getReviewItems: vi.fn(),
      recordRating: vi.fn(),
      getDueCount: vi.fn(),
    };
    controller = new ReviewController(mockService as never);
  });

  describe("getReviewItems", () => {
    it("returns 401 and never calls the service when req.userId is missing", async () => {
      const res = makeRes();
      const req = makeReq({ userId: undefined });

      await controller.getReviewItems(req, res);

      expect(mockService.getReviewItems).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: "Authentication required",
        code: "AUTH_ERROR",
      });
    });

    it("delegates to the service with req.userId when present", async () => {
      const res = makeRes();
      const req = makeReq();
      mockService.getReviewItems.mockResolvedValue([]);

      await controller.getReviewItems(req, res);

      expect(mockService.getReviewItems).toHaveBeenCalledWith("user123", {
        source: "due",
        type: "",
        limit: 20,
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("recordRating", () => {
    it("returns 401 and never calls the service when req.userId is missing", async () => {
      const res = makeRes();
      const req = makeReq({
        userId: undefined,
        body: { itemType: "radical", itemId: "rad_0001", rating: "good" },
      });

      await controller.recordRating(req, res);

      expect(mockService.recordRating).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: "Authentication required",
        code: "AUTH_ERROR",
      });
    });

    it("delegates to the service with req.userId when present", async () => {
      const res = makeRes();
      const req = makeReq({
        body: { itemType: "radical", itemId: "rad_0001", rating: "good" },
      });
      mockService.recordRating.mockResolvedValue({
        nextReview: new Date(),
        intervalDays: 1,
        studyCount: 1,
      });

      await controller.recordRating(req, res);

      expect(mockService.recordRating).toHaveBeenCalledWith("user123", {
        itemType: "radical",
        itemId: "rad_0001",
        rating: "good",
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe("getDueCount", () => {
    it("returns 401 and never calls the service when req.userId is missing", async () => {
      const res = makeRes();
      const req = makeReq({ userId: undefined });

      await controller.getDueCount(req, res);

      expect(mockService.getDueCount).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: "Authentication required",
        code: "AUTH_ERROR",
      });
    });

    it("delegates to the service with req.userId when present", async () => {
      const res = makeRes();
      const req = makeReq();
      mockService.getDueCount.mockResolvedValue(3);

      await controller.getDueCount(req, res);

      expect(mockService.getDueCount).toHaveBeenCalledWith("user123", "");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ count: 3 });
    });
  });
});
