/**
 * @file apps/backend/src/modules/readers/nest/__tests__/readers-nest-controller.test.ts
 * @description Unit tests for `ReadersNestController` (Story 24-12 — Readers
 * Port).
 *
 * Same mock/fixture approach as the Express `ReadersController` unit tests and
 * the mnemonics Nest controller test: the service is MOCKED (no real DB /
 * Gemini / GCS / audio), and the controller's handlers are exercised directly
 * with `@Param/@Body/@Req` values passed positionally (decorators are inert on
 * direct calls). The guards are NOT in play here — their 401 AUTH_REQUIRED
 * guest behavior is proven in the integration parity harness. The controller's
 * own defense-in-depth `!userId → 401 AUTH_ERROR` branches (mirroring the
 * Express controller, which double-checks `req.userId` after `requireAuth`)
 * are asserted directly.
 *
 * Covers every route's 2xx shape + 4xx/5xx mapping that the DB-gated parity
 * harness cannot reach deterministically — the 429 RATE_LIMIT (DB-backed 5/day
 * limit) and 502 GENERATION_ERROR (mocked Gemini failure) branches, the
 * generate 400 VALIDATION_ERROR (empty + >100-char topic), the audio LOAD_ERROR
 * 500, and each validation 400.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  BadGatewayException,
  BadRequestException,
  HttpException,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { ReadersNestController } from "../readers-nest.controller.js";
import {
  PassageNotFoundError,
  RateLimitExceededError,
  PassageGenerationError,
} from "../../types/readers-errors.js";
import type { PassageRecord } from "../../types/readers.js";

// Mock the logger so importing the controller never touches real transports.
vi.mock("../../../../shared/utils/logger", () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}));

describe("ReadersNestController", () => {
  let controller: ReadersNestController;
  let mockService: any;

  const mockPassage: PassageRecord = {
    id: "passage-1",
    hskLevel: 2,
    passageIndex: 0,
    title: "Test Topic",
    content: { sentences: [{ index: 0, text: "你好。" }] },
    wordCount: 1,
    knownWordRatio: 1.0,
    targetHskLevel: 2,
    generatedById: null,
    generatedAt: new Date("2026-07-01T00:00:00.000Z"),
    accessCount: 0,
    lastAccessedAt: null,
    createdAt: new Date("2026-07-01T00:00:00.000Z"),
    updatedAt: new Date("2026-07-01T00:00:00.000Z"),
  };

  const mockPassageResult = {
    passage: mockPassage,
    segments: [{ text: "你好", wordId: "w1", start: 0, end: 2 }],
    hskProfile: { distribution: { 2: 1 }, unknownRatio: 0, knownWordRatio: 1, totalWords: 1 },
    enrichedSentences: [
      { index: 0, text: "你好。", pinyin: "nǐ hǎo", words: [{ glyph: "你好", wordId: "w1", hskLevel: 2, pinyin: "nǐhǎo", isKnown: false }] },
    ],
  };

  beforeEach(() => {
    mockService = {
      listPassages: vi.fn(),
      getPassage: vi.fn(),
      getPassageAudio: vi.fn(),
      generatePassage: vi.fn(),
      getOrCreateSession: vi.fn(),
      updatePosition: vi.fn(),
      markCompleted: vi.fn(),
      listBookmarks: vi.fn(),
      addBookmark: vi.fn(),
      removeBookmarkByPassage: vi.fn(),
      checkBookmarkByPassage: vi.fn(),
    };
    controller = new ReadersNestController(mockService);
  });

  // ── GET /v1/readers/passages ────────────────────────────────────────────

  describe("listPassages", () => {
    it("returns { data: passages } for a guest (no hskLevel, no userId)", async () => {
      const passages = [mockPassage];
      mockService.listPassages.mockResolvedValue(passages);

      const result = await controller.listPassages(undefined, {} as any);

      expect(result).toEqual({ data: passages });
      expect(mockService.listPassages).toHaveBeenCalledWith(undefined, undefined);
    });

    it("passes hskLevel + userId through (authed user)", async () => {
      mockService.listPassages.mockResolvedValue([]);

      await controller.listPassages("3", { userId: "user-1" } as any);

      expect(mockService.listPassages).toHaveBeenCalledWith(3, "user-1");
    });

    it("throws 400 VALIDATION_ERROR for an out-of-range hskLevel", async () => {
      await expect(controller.listPassages("99", {} as any)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(mockService.listPassages).not.toHaveBeenCalled();
    });

    it("throws 400 VALIDATION_ERROR for a non-numeric hskLevel", async () => {
      await expect(controller.listPassages("abc", {} as any)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it("throws 500 INTERNAL_ERROR on unexpected service errors", async () => {
      mockService.listPassages.mockRejectedValue(new Error("db down"));

      await expect(controller.listPassages(undefined, {} as any)).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });
  });

  // ── GET /v1/readers/passages/:id ────────────────────────────────────────

  describe("getPassage", () => {
    it("returns the formatted passage (dates serialized, content stripped)", async () => {
      mockService.getPassage.mockResolvedValue(mockPassageResult);

      const result = await controller.getPassage({ params: { id: "passage-1" }, userId: undefined } as any);

      expect(mockService.getPassage).toHaveBeenCalledWith("passage-1", undefined);
      expect(result.data.id).toBe("passage-1");
      expect(result.data.generatedAt).toBe("2026-07-01T00:00:00.000Z");
      expect(result.data.createdAt).toBe("2026-07-01T00:00:00.000Z");
      expect(result.data.lastAccessedAt).toBeNull();
      // raw `content` is stripped by formatPassageResponse
      expect((result.data as unknown as Record<string, unknown>).content).toBeUndefined();
      expect(result.data.sentences).toEqual(mockPassageResult.enrichedSentences);
      expect(result.data.segments).toEqual(mockPassageResult.segments);
      expect(result.data.hskProfile).toEqual(mockPassageResult.hskProfile);
    });

    it("passes userId for an authed reader", async () => {
      mockService.getPassage.mockResolvedValue(mockPassageResult);

      await controller.getPassage({ params: { id: "passage-1" }, userId: "user-1" } as any);

      expect(mockService.getPassage).toHaveBeenCalledWith("passage-1", "user-1");
    });

    it("throws 404 NOT_FOUND for a missing passage", async () => {
      mockService.getPassage.mockRejectedValue(new PassageNotFoundError("nope"));

      await expect(
        controller.getPassage({ params: { id: "nope" } } as any),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it("throws 500 INTERNAL_ERROR on unexpected service errors", async () => {
      mockService.getPassage.mockRejectedValue(new Error("boom"));

      await expect(
        controller.getPassage({ params: { id: "passage-1" } } as any),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  // ── POST /v1/readers/passages/:id/audio ─────────────────────────────────

  describe("getPassageAudio", () => {
    it("returns { data: audioUrls } for a valid passage", async () => {
      const audioResponse = {
        audioUrls: { 0: { url: "https://storage.example.com/tts/h/0.mp3", source: "gcs" } },
      };
      mockService.getPassageAudio.mockResolvedValue(audioResponse);

      const result = await controller.getPassageAudio({ params: { id: "passage-1" } } as any);

      expect(result).toEqual({ data: audioResponse });
      expect(mockService.getPassageAudio).toHaveBeenCalledWith("passage-1");
    });

    it("throws 404 NOT_FOUND for a missing passage", async () => {
      mockService.getPassageAudio.mockRejectedValue(new PassageNotFoundError("nope"));

      await expect(
        controller.getPassageAudio({ params: { id: "nope" } } as any),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it("throws 500 LOAD_ERROR on unexpected service errors", async () => {
      mockService.getPassageAudio.mockRejectedValue(new Error("db failed"));

      const error = await controller
        .getPassageAudio({ params: { id: "passage-1" } } as any)
        .catch((e: unknown) => e);
      expect(error).toBeInstanceOf(InternalServerErrorException);
      expect((error as InternalServerErrorException).getResponse()).toEqual({
        code: "LOAD_ERROR",
        message: "Failed to get passage audio",
      });
    });
  });

  // ── POST /v1/readers/generate ───────────────────────────────────────────

  describe("generatePassage", () => {
    it("returns the formatted generated passage (201 shape)", async () => {
      mockService.generatePassage.mockResolvedValue(mockPassageResult);

      const result = await controller.generatePassage(
        { topic: "  我的爱好  " },
        { userId: "user-1" } as any,
      );

      // topic is trimmed before delegation
      expect(mockService.generatePassage).toHaveBeenCalledWith("我的爱好", "user-1");
      expect(result.data.id).toBe("passage-1");
    });

    it("throws 401 AUTH_ERROR when userId is missing (defense-in-depth)", async () => {
      await expect(
        controller.generatePassage({ topic: "我的爱好" }, {} as any),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(mockService.generatePassage).not.toHaveBeenCalled();
    });

    it("throws 400 VALIDATION_ERROR for an empty topic", async () => {
      await expect(
        controller.generatePassage({ topic: "" }, { userId: "user-1" } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
      await expect(
        controller.generatePassage({ topic: "   " }, { userId: "user-1" } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
      await expect(
        controller.generatePassage({}, { userId: "user-1" } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(mockService.generatePassage).not.toHaveBeenCalled();
    });

    it("throws 400 VALIDATION_ERROR for a >100-char topic", async () => {
      await expect(
        controller.generatePassage({ topic: "好".repeat(101) }, { userId: "user-1" } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(mockService.generatePassage).not.toHaveBeenCalled();
    });

    it("throws 429 RATE_LIMIT when the DB-backed 5/day generation limit is hit", async () => {
      mockService.generatePassage.mockRejectedValue(
        new RateLimitExceededError("Daily generation limit reached (5/day)"),
      );

      const error = await controller
        .generatePassage({ topic: "我的爱好" }, { userId: "user-1" } as any)
        .catch((e: unknown) => e);
      expect(error).toBeInstanceOf(HttpException);
      expect((error as HttpException).getStatus()).toBe(429);
      expect((error as HttpException).getResponse()).toEqual({
        code: "RATE_LIMIT",
        message: "Failed to generate passage",
      });
    });

    it("throws 502 GENERATION_ERROR when Gemini generation fails", async () => {
      mockService.generatePassage.mockRejectedValue(
        new PassageGenerationError("Failed to generate passage: Gemini down"),
      );

      const error = await controller
        .generatePassage({ topic: "我的爱好" }, { userId: "user-1" } as any)
        .catch((e: unknown) => e);
      expect(error).toBeInstanceOf(BadGatewayException);
      expect((error as BadGatewayException).getStatus()).toBe(502);
      expect((error as BadGatewayException).getResponse()).toEqual({
        code: "GENERATION_ERROR",
        message: "Failed to generate passage",
      });
    });

    it("throws 500 INTERNAL_ERROR on unexpected service errors", async () => {
      mockService.generatePassage.mockRejectedValue(new Error("boom"));

      await expect(
        controller.generatePassage({ topic: "我的爱好" }, { userId: "user-1" } as any),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  // ── GET /v1/readers/sessions/:passageId ─────────────────────────────────

  describe("getSession", () => {
    it("returns { data: session } for an authed user", async () => {
      mockService.getOrCreateSession.mockResolvedValue({ currentSentence: 0, isCompleted: false });

      const result = await controller.getSession({
        params: { passageId: "passage-1" },
        userId: "user-1",
      } as any);

      expect(result).toEqual({ data: { currentSentence: 0, isCompleted: false } });
      expect(mockService.getOrCreateSession).toHaveBeenCalledWith("user-1", "passage-1");
    });

    it("throws 401 AUTH_ERROR when userId is missing", async () => {
      await expect(
        controller.getSession({ params: { passageId: "passage-1" } } as any),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it("throws 500 INTERNAL_ERROR on unexpected service errors", async () => {
      mockService.getOrCreateSession.mockRejectedValue(new Error("boom"));

      await expect(
        controller.getSession({ params: { passageId: "passage-1" }, userId: "user-1" } as any),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  // ── PUT /v1/readers/sessions/:passageId ─────────────────────────────────

  describe("updateSession", () => {
    it("returns { data: result } for a valid currentSentence", async () => {
      mockService.updatePosition.mockResolvedValue({ currentSentence: 2, isCompleted: false });

      const result = await controller.updateSession(
        { currentSentence: 2 },
        { params: { passageId: "passage-1" }, userId: "user-1" } as any,
      );

      expect(result).toEqual({ data: { currentSentence: 2, isCompleted: false } });
      expect(mockService.updatePosition).toHaveBeenCalledWith("user-1", "passage-1", 2);
    });

    it("throws 400 VALIDATION_ERROR for a negative currentSentence", async () => {
      await expect(
        controller.updateSession(
          { currentSentence: -1 },
          { params: { passageId: "passage-1" }, userId: "user-1" } as any,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("throws 400 VALIDATION_ERROR for a non-integer currentSentence", async () => {
      await expect(
        controller.updateSession(
          { currentSentence: 1.5 },
          { params: { passageId: "passage-1" }, userId: "user-1" } as any,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("throws 400 VALIDATION_ERROR for a non-number currentSentence", async () => {
      await expect(
        controller.updateSession(
          { currentSentence: "2" },
          { params: { passageId: "passage-1" }, userId: "user-1" } as any,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  // ── POST /v1/readers/sessions/:passageId/complete ───────────────────────

  describe("completePassage", () => {
    it("returns { data: { passageId } } for an authed user", async () => {
      mockService.markCompleted.mockResolvedValue({ passageId: "passage-1" });

      const result = await controller.completePassage({
        params: { passageId: "passage-1" },
        userId: "user-1",
      } as any);

      expect(result).toEqual({ data: { passageId: "passage-1" } });
      expect(mockService.markCompleted).toHaveBeenCalledWith("user-1", "passage-1");
    });

    it("throws 401 AUTH_ERROR when userId is missing", async () => {
      await expect(
        controller.completePassage({ params: { passageId: "passage-1" } } as any),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  // ── GET /v1/readers/bookmarks ───────────────────────────────────────────

  describe("listBookmarks", () => {
    it("returns { data: { bookmarks } } for an authed user", async () => {
      mockService.listBookmarks.mockResolvedValue(["p1", "p2"]);

      const result = await controller.listBookmarks({ userId: "user-1" } as any);

      expect(result).toEqual({ data: { bookmarks: ["p1", "p2"] } });
      expect(mockService.listBookmarks).toHaveBeenCalledWith("user-1");
    });

    it("throws 401 AUTH_ERROR when userId is missing", async () => {
      await expect(controller.listBookmarks({} as any)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });
  });

  // ── POST /v1/readers/bookmarks ──────────────────────────────────────────

  describe("addBookmark", () => {
    it("returns { data: { passageId } } for a valid passageId (201 shape)", async () => {
      mockService.addBookmark.mockResolvedValue({ passageId: "passage-1" });

      const result = await controller.addBookmark(
        { passageId: "passage-1" },
        { userId: "user-1" } as any,
      );

      expect(result).toEqual({ data: { passageId: "passage-1" } });
      expect(mockService.addBookmark).toHaveBeenCalledWith("user-1", "passage-1");
    });

    it("throws 400 VALIDATION_ERROR for a missing passageId", async () => {
      await expect(
        controller.addBookmark({}, { userId: "user-1" } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("throws 400 VALIDATION_ERROR for a non-string passageId", async () => {
      await expect(
        controller.addBookmark({ passageId: 123 }, { userId: "user-1" } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("throws 401 AUTH_ERROR when userId is missing", async () => {
      await expect(
        controller.addBookmark({ passageId: "passage-1" }, {} as any),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  // ── DELETE /v1/readers/bookmarks/by-passage/:passageId ──────────────────

  describe("deleteBookmarkByPassage", () => {
    it("resolves without throwing for an authed user (204)", async () => {
      mockService.removeBookmarkByPassage.mockResolvedValue(undefined);

      await expect(
        controller.deleteBookmarkByPassage({
          params: { passageId: "passage-1" },
          userId: "user-1",
        } as any),
      ).resolves.toBeUndefined();
      expect(mockService.removeBookmarkByPassage).toHaveBeenCalledWith("user-1", "passage-1");
    });

    it("throws 401 AUTH_ERROR when userId is missing", async () => {
      await expect(
        controller.deleteBookmarkByPassage({ params: { passageId: "passage-1" } } as any),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  // ── GET /v1/readers/bookmarks/by-passage/:passageId ─────────────────────

  describe("checkBookmarkByPassage", () => {
    it("returns { data: { isBookmarked } } for an authed user", async () => {
      mockService.checkBookmarkByPassage.mockResolvedValue(true);

      const result = await controller.checkBookmarkByPassage({
        params: { passageId: "passage-1" },
        userId: "user-1",
      } as any);

      expect(result).toEqual({ data: { isBookmarked: true } });
      expect(mockService.checkBookmarkByPassage).toHaveBeenCalledWith("user-1", "passage-1");
    });

    it("throws 401 AUTH_ERROR when userId is missing", async () => {
      await expect(
        controller.checkBookmarkByPassage({ params: { passageId: "passage-1" } } as any),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });
});
