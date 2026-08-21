/**
 * @file apps/backend/src/modules/mnemonics/nest/__tests__/mnemonics-nest-controller.test.ts
 * @description Unit tests for `MnemonicsNestController` (Story 24-8 —
 * Characters + Mnemonics Port).
 *
 * Same mock/fixture approach as the Express `MnemonicsController.test.ts`: the
 * service is MOCKED (no real Gemini / GCS / Redis), and the controller's
 * handlers are exercised directly. This covers the paths the DB-gated parity
 * harness cannot reach deterministically WITHOUT hitting real Gemini — the
 * non-pictograph AI-generate success (201 with the generated story), the AI
 * error → 503 mapping, and the PUT sanitization — so "mnemonics POST/PUT/DELETE
 * success + validation 4xx match Express" is proven end-to-end.
 *
 * The controller is exercised WITHOUT HTTP (decorators are inert on direct
 * calls): `@Param/@Body/@Req` values are passed positionally, and the guard
 * (`RequireAuthGuard`) is NOT in play here — its 401 AUTH_REQUIRED behavior is
 * proven in the integration parity harness. The controller's own defense-in-
 * depth `!userId → 401 AUTH_ERROR` branches (mirroring the Express controller,
 * which double-checks `req.userId` after `requireAuth`) are asserted directly.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  BadRequestException,
  InternalServerErrorException,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import { MnemonicsNestController } from "../mnemonics-nest.controller.js";
import { MnemonicNotFoundError } from "../../types/mnemonics.js";

// Mock the logger so importing the controller never touches real transports.
vi.mock("../../../shared/utils/logger", () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    cacheHit: vi.fn(),
  })),
}));

describe("MnemonicsNestController", () => {
  let controller: MnemonicsNestController;
  let mockService: any;

  /** A realistic AI-generated MnemonicStoryResponse (as the service returns). */
  const aiStory = {
    id: "m1",
    characterGlyph: "好",
    story: "A woman (女) holding a child (子) represents goodness.",
    radicalIds: ["ch_1001"],
    isEdited: false,
    isPictograph: false,
    classification: "compound_ideograph",
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
  };

  beforeEach(() => {
    mockService = {
      getMnemonic: vi.fn(),
      generateMnemonic: vi.fn(),
      updateMnemonic: vi.fn(),
      resetMnemonic: vi.fn(),
    };
    controller = new MnemonicsNestController(mockService);
  });

  describe("getMnemonic", () => {
    it("returns { mnemonic: result } when a story is found (authed user)", async () => {
      mockService.getMnemonic.mockResolvedValue(aiStory);

      const result = await controller.getMnemonic("好", { userId: "user-1" } as any);

      expect(result).toEqual({ mnemonic: aiStory });
      expect(mockService.getMnemonic).toHaveBeenCalledWith("好", "user-1");
    });

    it("passes undefined userId for a guest — F6: guest is empty, never all-unlocked", async () => {
      mockService.getMnemonic.mockResolvedValue(aiStory);

      await controller.getMnemonic("好", {} as any); // no token → OptionalAuthGuard leaves userId unset

      expect(mockService.getMnemonic).toHaveBeenCalledWith("好", undefined);
    });

    it("returns 200 { mnemonic: null } when no story exists (no 404)", async () => {
      mockService.getMnemonic.mockRejectedValue(new MnemonicNotFoundError("卟"));

      const result = await controller.getMnemonic("卟", {} as any);

      expect(result).toEqual({ mnemonic: null });
    });

    it("throws 400 VALIDATION_ERROR for an invalid character parameter", async () => {
      await expect(controller.getMnemonic("ab", {} as any)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(mockService.getMnemonic).not.toHaveBeenCalled();
    });

    it("throws 500 INTERNAL_ERROR on unexpected errors", async () => {
      mockService.getMnemonic.mockRejectedValue(new Error("boom"));

      await expect(controller.getMnemonic("好", {} as any)).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });
  });

  describe("generateMnemonic", () => {
    it("returns the generated AI story (201) for an authed user — no Gemini hit (service mocked)", async () => {
      mockService.generateMnemonic.mockResolvedValue(aiStory);

      const result = await controller.generateMnemonic("好", { userId: "user-1" } as any);

      expect(result).toBe(aiStory);
      expect(mockService.generateMnemonic).toHaveBeenCalledWith("好", "user-1");
    });

    it("throws 401 AUTH_ERROR when userId is undefined (defense-in-depth)", async () => {
      await expect(controller.generateMnemonic("好", {} as any)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      expect(mockService.generateMnemonic).not.toHaveBeenCalled();
    });

    it("throws 400 VALIDATION_ERROR for an invalid character parameter", async () => {
      await expect(
        controller.generateMnemonic("ab", { userId: "u" } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(mockService.generateMnemonic).not.toHaveBeenCalled();
    });

    it("throws 503 SERVICE_UNAVAILABLE for AI-generation errors", async () => {
      mockService.generateMnemonic.mockRejectedValue(new Error("Gemini API timeout"));

      await expect(
        controller.generateMnemonic("好", { userId: "u" } as any),
      ).rejects.toBeInstanceOf(ServiceUnavailableException);
    });

    it("throws 500 INTERNAL_ERROR for unexpected errors", async () => {
      mockService.generateMnemonic.mockRejectedValue(new Error("boom"));

      await expect(
        controller.generateMnemonic("好", { userId: "u" } as any),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe("updateMnemonic", () => {
    it("sanitizes HTML tags and returns the updated story", async () => {
      const updated = { ...aiStory, story: "A woman story", isEdited: true };
      mockService.updateMnemonic.mockResolvedValue(updated);

      const result = await controller.updateMnemonic(
        "好",
        { story: "A <b>woman</b> story", radicalIds: ["ch_1001"] },
        { userId: "user-1" } as any,
      );

      expect(result).toBe(updated);
      expect(mockService.updateMnemonic).toHaveBeenCalledWith("好", "user-1", "A woman story", [
        "ch_1001",
      ]);
    });

    it("throws 400 VALIDATION_ERROR when story is missing or empty", async () => {
      await expect(
        controller.updateMnemonic("好", {}, { userId: "u" } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
      await expect(
        controller.updateMnemonic("好", { story: "   " }, { userId: "u" } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(mockService.updateMnemonic).not.toHaveBeenCalled();
    });

    it("throws 400 VALIDATION_ERROR when story exceeds MAX_STORY_LENGTH", async () => {
      await expect(
        controller.updateMnemonic("好", { story: "x".repeat(1001) }, { userId: "u" } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(mockService.updateMnemonic).not.toHaveBeenCalled();
    });

    it("throws 400 VALIDATION_ERROR when radicalIds is not an array of strings", async () => {
      await expect(
        // Deliberately invalid — number array; the body type is widened for the
        // validation-under-test path (real HTTP bodies are untyped at runtime).
        controller.updateMnemonic(
          "好",
          { story: "ok", radicalIds: [1, 2] } as unknown as {
            story?: string;
            radicalIds?: string[];
          },
          { userId: "u" } as any,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(mockService.updateMnemonic).not.toHaveBeenCalled();
    });

    it("throws 401 AUTH_ERROR when userId is undefined (defense-in-depth)", async () => {
      await expect(
        controller.updateMnemonic("好", { story: "ok" }, {} as any),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(mockService.updateMnemonic).not.toHaveBeenCalled();
    });
  });

  describe("resetMnemonic", () => {
    it("resolves undefined (204) for an authed user", async () => {
      mockService.resetMnemonic.mockResolvedValue(undefined);

      await expect(
        controller.resetMnemonic("好", { userId: "user-1" } as any),
      ).resolves.toBeUndefined();
      expect(mockService.resetMnemonic).toHaveBeenCalledWith("好", "user-1");
    });

    it("throws 400 VALIDATION_ERROR for an invalid character", async () => {
      await expect(controller.resetMnemonic("ab", { userId: "u" } as any)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(mockService.resetMnemonic).not.toHaveBeenCalled();
    });

    it("throws 401 AUTH_ERROR when userId is undefined (defense-in-depth)", async () => {
      await expect(controller.resetMnemonic("好", {} as any)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      expect(mockService.resetMnemonic).not.toHaveBeenCalled();
    });
  });
});
