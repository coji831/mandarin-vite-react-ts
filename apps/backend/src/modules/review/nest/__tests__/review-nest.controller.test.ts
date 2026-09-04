/**
 * @file apps/backend/src/modules/review/nest/__tests__/review-nest.controller.test.ts
 * @description P0-1 regression tests re-authored in Nest land (Story 24-11 —
 * Review Port + SRS Schema). Adapts the 24-1 Express `ReviewController` tests
 * to the Nest controller shape: a missing authenticated user yields an explicit
 * 401 (`UnauthorizedException` — the global `AppExceptionFilter` serializes it
 * to `{ code: "AUTH_ERROR", message: "Authentication required", requestId }`),
 * never a 500, never a service call, never a full-row read; a present userId
 * delegates to the service.
 *
 * Structural P0-1 (24-11): in production the calibrated `RequireAuthGuard`
 * (24-5) rejects guests at the HTTP boundary BEFORE the controller runs (guest
 * → 401 AUTH_REQUIRED — proven by `auth-guards-parity.test.ts` and the review
 * parity harness), so `req.userId` is typed `string` here. The `if (!userId)`
 * 401 below is defense-in-depth mirroring the Express controller structure
 * (unreachable under the guard; unit-tested directly by constructing the
 * controller with a user-less request, exactly like the 24-1 Express test).
 *
 * Story 24-1: P0-1 Security Stopgap.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { UnauthorizedException } from "@nestjs/common";
import type { Request } from "express";
import { ReviewNestController } from "../review-nest.controller.js";

vi.mock("../../../../shared/utils/logger.js", () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}));

function makeReq(overrides: Record<string, unknown> = {}) {
  return {
    userId: "user123",
    query: {},
    body: {},
    params: {},
    ...overrides,
  } as unknown as Request;
}

/**
 * Assert a handler rejects with the P0-1 401 contract — the same
 * `UnauthorizedException` the global 24-3 `AppExceptionFilter` serializes to
 * `{ code: "AUTH_ERROR", message: "Authentication required", requestId }`.
 */
async function expectAuthError(promise: Promise<unknown>): Promise<void> {
  const err = await promise.then(
    () => {
      throw new Error("expected UnauthorizedException");
    },
    (e: unknown) => e,
  );
  expect(err).toBeInstanceOf(UnauthorizedException);
  expect((err as UnauthorizedException).getStatus()).toBe(401);
  expect((err as UnauthorizedException).getResponse()).toEqual({
    code: "AUTH_ERROR",
    message: "Authentication required",
  });
}

describe("ReviewNestController — P0-1 structural stopgap re-authored in Nest land (Story 24-11)", () => {
  let controller: ReviewNestController;
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
    controller = new ReviewNestController(mockService as never);
  });

  describe("getReviewItems", () => {
    it("throws 401 and never calls the service when req.userId is missing", async () => {
      const req = makeReq({ userId: undefined });

      await expectAuthError(controller.getReviewItems(undefined, undefined, undefined, req));

      expect(mockService.getReviewItems).not.toHaveBeenCalled();
    });

    it("delegates to the service with req.userId when present (defaults source/type/limit)", async () => {
      const req = makeReq();
      mockService.getReviewItems.mockResolvedValue([]);

      const result = await controller.getReviewItems(undefined, undefined, undefined, req);

      expect(mockService.getReviewItems).toHaveBeenCalledWith("user123", {
        source: "due",
        type: "",
        limit: 20,
      });
      expect(result).toEqual([]);
    });

    it("passes string query params through (source/type/limit) and coerces non-strings to undefined", async () => {
      const req = makeReq();
      mockService.getReviewItems.mockResolvedValue([]);

      await controller.getReviewItems("recent", "radical", "5", req);

      expect(mockService.getReviewItems).toHaveBeenCalledWith("user123", {
        source: "recent",
        type: "radical",
        limit: 5,
      });
    });
  });

  describe("recordRating", () => {
    it("throws 401 and never calls the service when req.userId is missing", async () => {
      const req = makeReq({
        userId: undefined,
        body: { itemType: "radical", itemId: "rad_0001", rating: "good" },
      });

      await expectAuthError(controller.recordRating({} as never, req));

      expect(mockService.recordRating).not.toHaveBeenCalled();
    });

    it("delegates to the service with req.userId when present", async () => {
      const req = makeReq({ body: { itemType: "radical", itemId: "rad_0001", rating: "good" } });
      mockService.recordRating.mockResolvedValue({
        nextReview: new Date(),
        intervalDays: 1,
        studyCount: 1,
      });

      const result = await controller.recordRating(
        { itemType: "radical", itemId: "rad_0001", rating: "good" } as never,
        req,
      );

      expect(mockService.recordRating).toHaveBeenCalledWith("user123", {
        itemType: "radical",
        itemId: "rad_0001",
        rating: "good",
      });
      expect(result).toEqual({
        nextReview: expect.any(Date),
        intervalDays: 1,
        studyCount: 1,
      });
    });
  });

  describe("getDueCount", () => {
    it("throws 401 and never calls the service when req.userId is missing", async () => {
      const req = makeReq({ userId: undefined });

      await expectAuthError(controller.getDueCount(undefined, req));

      expect(mockService.getDueCount).not.toHaveBeenCalled();
    });

    it("delegates to the service with req.userId when present", async () => {
      const req = makeReq();
      mockService.getDueCount.mockResolvedValue(3);

      const result = await controller.getDueCount(undefined, req);

      expect(mockService.getDueCount).toHaveBeenCalledWith("user123", "");
      expect(result).toEqual({ count: 3 });
    });
  });
});
