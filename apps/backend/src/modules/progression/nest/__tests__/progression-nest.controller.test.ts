/**
 * @file apps/backend/src/modules/progression/nest/__tests__/progression-nest-controller.test.ts
 * @description Unit tests for `ProgressionNestController` (Story 24-13 — Quiz +
 * Progression Port). Adapts the Express `ProgressionController` test surface to
 * the Nest controller shape — same guest session-local/empty shapes, same
 * service delegation + ReviewService side-effect, same 4xx/5xx codes. The
 * CALIBRATED `/gates` guest branch (24-13) is asserted explicitly: Phase-1-only
 * gates, NEVER the all-passed GUEST shape.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { BadRequestException, InternalServerErrorException } from "@nestjs/common";
import type { Request } from "express";
import { ProgressionNestController } from "../progression-nest.controller.js";

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

describe("ProgressionNestController (Story 24-13)", () => {
  let controller: ProgressionNestController;
  let mockProgressionService: {
    getOrCreateFoundationProgress: ReturnType<typeof vi.fn>;
    upsertFoundationProgress: ReturnType<typeof vi.fn>;
    getOrCreatePhaseGate: ReturnType<typeof vi.fn>;
    getGateStatus: ReturnType<typeof vi.fn>;
    updatePhaseGate: ReturnType<typeof vi.fn>;
    getRadicalProgress: ReturnType<typeof vi.fn>;
    upsertRadicalProgress: ReturnType<typeof vi.fn>;
  };
  let mockReviewService: { recordRating: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockProgressionService = {
      getOrCreateFoundationProgress: vi.fn(),
      upsertFoundationProgress: vi.fn(),
      getOrCreatePhaseGate: vi.fn(),
      getGateStatus: vi.fn(),
      updatePhaseGate: vi.fn(),
      getRadicalProgress: vi.fn(),
      upsertRadicalProgress: vi.fn(),
    };
    mockReviewService = { recordRating: vi.fn() };
    controller = new ProgressionNestController(
      mockProgressionService as never,
      mockReviewService as never,
    );
  });

  describe("getFoundationProgress (GET, optionalAuth)", () => {
    it("guest → 200 [] (no tracking data, no service call)", async () => {
      const req = makeReq({ userId: undefined });

      const result = await controller.getFoundationProgress(req);

      expect(mockProgressionService.getOrCreateFoundationProgress).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it("registered user → delegates to the service", async () => {
      const req = makeReq();
      mockProgressionService.getOrCreateFoundationProgress.mockResolvedValue([
        { sectionId: "pinyin" },
      ]);

      const result = await controller.getFoundationProgress(req);

      expect(mockProgressionService.getOrCreateFoundationProgress).toHaveBeenCalledWith("user123");
      expect(result).toEqual([{ sectionId: "pinyin" }]);
    });
  });

  describe("markSectionCompleted (PUT /foundation-progress/:sectionId, requireAuth)", () => {
    it("guest → 200 no-op { sectionId, completed: false }", async () => {
      const req = makeReq({ userId: undefined, params: { sectionId: "tones" } });

      const result = await controller.markSectionCompleted("tones", req);

      expect(mockProgressionService.upsertFoundationProgress).not.toHaveBeenCalled();
      expect(result).toEqual({ sectionId: "tones", completed: false });
    });

    it("registered user → delegates with completed=true", async () => {
      const req = makeReq({ params: { sectionId: "tones" } });
      mockProgressionService.upsertFoundationProgress.mockResolvedValue({
        sectionId: "tones",
        completed: true,
      });

      const result = await controller.markSectionCompleted("tones", req);

      expect(mockProgressionService.upsertFoundationProgress).toHaveBeenCalledWith(
        "user123",
        "tones",
        true,
      );
      expect(result).toEqual({ sectionId: "tones", completed: true });
    });

    it("invalid sectionId → 400 VALIDATION_ERROR envelope", async () => {
      const req = makeReq({ params: { sectionId: "bogus" } });
      mockProgressionService.upsertFoundationProgress.mockRejectedValue(
        new Error("Invalid sectionId: bogus"),
      );

      const err = await controller.markSectionCompleted("bogus", req).then(
        () => {
          throw new Error("expected rejection");
        },
        (e: unknown) => e,
      );

      expect(err).toBeInstanceOf(BadRequestException);
      expect((err as BadRequestException).getResponse()).toEqual({
        code: "VALIDATION_ERROR",
        message: "Invalid sectionId: bogus",
      });
    });
  });

  describe("getPhaseGate (GET /phase-gate, optionalAuth)", () => {
    it("guest → 200 calibrated createGuestPhaseGate (Phase-1, isGuest)", async () => {
      const req = makeReq({ userId: undefined });

      const result = (await controller.getPhaseGate(req)) as Record<string, unknown>;

      // `createGuestPhaseGate()` stamps `now`, so compare the deterministic
      // calibrated fields rather than deep-equal against a re-invoked call.
      expect(result.id).toBe("guest-unlocked");
      expect(result.currentPhase).toBe(1);
      expect(result.isGuest).toBe(true);
      expect(result.phase1Passed).toBe(false);
      expect(result.phase2Passed).toBe(false);
      expect(result.phase3Passed).toBe(false);
      expect(result.phase4Unlocked).toBe(false);
    });

    it("registered user → delegates to the service", async () => {
      const req = makeReq();
      mockProgressionService.getOrCreatePhaseGate.mockResolvedValue({ currentPhase: 3 });

      const result = await controller.getPhaseGate(req);

      expect(mockProgressionService.getOrCreatePhaseGate).toHaveBeenCalledWith("user123");
      expect(result).toEqual({ currentPhase: 3 });
    });
  });

  describe("getGates (GET /gates, optionalAuth) — CALIBRATED guest branch (24-13)", () => {
    it("guest → 200 Phase-1-only gates (NOT all-passed; agrees with createGuestPhaseGate)", async () => {
      const req = makeReq({ userId: undefined });

      const result = (await controller.getGates(req)) as Record<string, unknown>;

      expect(mockProgressionService.getGateStatus).not.toHaveBeenCalled();
      for (const gate of ["phase2Gate", "characterCountGate", "phase3To4Gate"]) {
        expect(result[gate]).toEqual({
          passed: false,
          reason: "GUEST",
          details: "Guest — Phase 1 only",
        });
      }
    });

    it("registered user → delegates to the service", async () => {
      const req = makeReq();
      mockProgressionService.getGateStatus.mockResolvedValue({
        phase2Gate: { passed: true, reason: "GRANDFATHERED" },
      });

      const result = await controller.getGates(req);

      expect(mockProgressionService.getGateStatus).toHaveBeenCalledWith("user123");
      expect(result).toEqual({ phase2Gate: { passed: true, reason: "GRANDFATHERED" } });
    });
  });

  describe("updatePhaseGate (PUT /phase-gate, requireAuth)", () => {
    it("registered user → delegates with phase/passed/gateCriteria", async () => {
      const req = makeReq();
      mockProgressionService.updatePhaseGate.mockResolvedValue({ currentPhase: 2 });

      const result = await controller.updatePhaseGate(
        { phase: 1, passed: true, gateCriteria: "quiz" },
        req,
      );

      expect(mockProgressionService.updatePhaseGate).toHaveBeenCalledWith("user123", {
        phase: 1,
        passed: true,
        gateCriteria: "quiz",
      });
      expect(result).toEqual({ currentPhase: 2 });
    });

    it("service error → 500 UPDATE_FAILED envelope", async () => {
      const req = makeReq();
      mockProgressionService.updatePhaseGate.mockRejectedValue(new Error("boom"));

      const err = await controller
        .updatePhaseGate({ phase: 1, passed: true, gateCriteria: "quiz" }, req)
        .then(
          () => {
            throw new Error("expected rejection");
          },
          (e: unknown) => e,
        );

      expect(err).toBeInstanceOf(InternalServerErrorException);
      expect((err as InternalServerErrorException).getResponse()).toEqual({
        code: "UPDATE_FAILED",
        message: "Failed to update phase gate",
      });
    });
  });

  describe("getRadicalProgress (GET /radical-progress, optionalAuth)", () => {
    it("guest → 200 []", async () => {
      const req = makeReq({ userId: undefined });

      const result = await controller.getRadicalProgress(req);

      expect(mockProgressionService.getRadicalProgress).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it("registered user → delegates to the service", async () => {
      const req = makeReq();
      mockProgressionService.getRadicalProgress.mockResolvedValue([{ radicalId: "rad_0001" }]);

      const result = await controller.getRadicalProgress(req);

      expect(mockProgressionService.getRadicalProgress).toHaveBeenCalledWith("user123");
      expect(result).toEqual([{ radicalId: "rad_0001" }]);
    });
  });

  describe("upsertRadicalProgress (PUT /radical-progress/:radicalId, requireAuth)", () => {
    it("guest → 200 no-op { radicalId, memorized, recognitionLevel }", async () => {
      const req = makeReq({
        userId: undefined,
        params: { radicalId: "rad_0001" },
        body: { memorized: true },
      });

      const result = await controller.upsertRadicalProgress("rad_0001", { memorized: true }, req);

      expect(mockProgressionService.upsertRadicalProgress).not.toHaveBeenCalled();
      expect(mockReviewService.recordRating).not.toHaveBeenCalled();
      expect(result).toEqual({ radicalId: "rad_0001", memorized: true, recognitionLevel: 0 });
    });

    it("registered user → delegates + ReviewItem side-effect when memorized", async () => {
      const req = makeReq({ params: { radicalId: "rad_0001" }, body: { memorized: true } });
      mockProgressionService.upsertRadicalProgress.mockResolvedValue({
        radicalId: "rad_0001",
        memorized: true,
      });
      mockReviewService.recordRating.mockResolvedValue({ intervalDays: 1 });

      const result = await controller.upsertRadicalProgress("rad_0001", { memorized: true }, req);

      expect(mockProgressionService.upsertRadicalProgress).toHaveBeenCalledWith(
        "user123",
        "rad_0001",
        {
          memorized: true,
          recognitionLevel: 0,
        },
      );
      expect(mockReviewService.recordRating).toHaveBeenCalledWith("user123", {
        itemType: "radical",
        itemId: "rad_0001",
        rating: "good",
      });
      expect(result).toEqual({ radicalId: "rad_0001", memorized: true });
    });

    it("registered user → NO ReviewItem side-effect when memorized=false", async () => {
      const req = makeReq({ params: { radicalId: "rad_0001" }, body: { memorized: false } });
      mockProgressionService.upsertRadicalProgress.mockResolvedValue({ radicalId: "rad_0001" });

      await controller.upsertRadicalProgress("rad_0001", { memorized: false }, req);

      expect(mockReviewService.recordRating).not.toHaveBeenCalled();
    });

    it("invalid radicalId → 400 VALIDATION_ERROR envelope", async () => {
      const req = makeReq({ params: { radicalId: "bogus" }, body: { memorized: true } });
      mockProgressionService.upsertRadicalProgress.mockRejectedValue(
        new Error("Invalid radicalId: bogus"),
      );

      const err = await controller.upsertRadicalProgress("bogus", { memorized: true }, req).then(
        () => {
          throw new Error("expected rejection");
        },
        (e: unknown) => e,
      );

      expect(err).toBeInstanceOf(BadRequestException);
      expect((err as BadRequestException).getResponse()).toEqual({
        code: "VALIDATION_ERROR",
        message: "Failed to update radical progress",
      });
    });
  });
});
