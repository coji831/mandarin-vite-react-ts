/**
 * @file modules/mnemonics/__tests__/MnemonicsController.test.ts
 * @description Unit tests for MnemonicsController HTTP handlers.
 *
 * Visual wave fix: GET /v1/mnemonics/:character returns a well-formed
 * 200 { mnemonic: null } when no story exists (instead of a 404), so
 * "no mnemonic yet" is not treated as a client error by consumers.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { MnemonicsController } from "../api/MnemonicsController.js";
import { MnemonicNotFoundError } from "../types/mnemonics.js";

// Mock the logger so importing the controller never touches real transports.
vi.mock("../../../shared/utils/logger", () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    cacheHit: vi.fn(),
  })),
}));

describe("MnemonicsController", () => {
  let controller: MnemonicsController;
  let mockService: any;
  let mockReq: any;
  let mockRes: any;

  beforeEach(() => {
    mockService = {
      getMnemonic: vi.fn(),
      generateMnemonic: vi.fn(),
      updateMnemonic: vi.fn(),
      resetMnemonic: vi.fn(),
    };

    controller = new MnemonicsController(mockService);

    mockReq = { userId: "user-1", params: {}, body: {} };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
  });

  describe("getMnemonic", () => {
    it("returns 200 with { mnemonic: result } when a story is found", async () => {
      const story = {
        id: "m1",
        characterGlyph: "好",
        story: "A woman (女) holding a child (子) represents goodness.",
        radicalIds: ["ch_1001"],
        isEdited: false,
        isPictograph: false,
        classification: null,
        createdAt: "2026-07-01T00:00:00.000Z",
        updatedAt: "2026-07-01T00:00:00.000Z",
      };
      mockReq.params = { character: "好" };
      mockService.getMnemonic.mockResolvedValue(story);

      await controller.getMnemonic(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({ mnemonic: story });
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it("handles a guest request (undefined userId) without crashing — passes undefined to service", async () => {
      const story = {
        id: "m1",
        characterGlyph: "好",
        story: "A woman (女) holding a child (子) represents goodness.",
        radicalIds: ["ch_1001"],
        isEdited: false,
        isPictograph: false,
        classification: null,
        createdAt: "2026-07-01T00:00:00.000Z",
        updatedAt: "2026-07-01T00:00:00.000Z",
      };
      mockReq.userId = undefined; // optionalAuth leaves userId unset for guests
      mockReq.params = { character: "好" };
      mockService.getMnemonic.mockResolvedValue(story);

      await controller.getMnemonic(mockReq, mockRes);

      expect(mockService.getMnemonic).toHaveBeenCalledWith("好", undefined);
      expect(mockRes.json).toHaveBeenCalledWith({ mnemonic: story });
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it("returns 200 with { mnemonic: null } when no story exists (no 404)", async () => {
      mockReq.params = { character: "卟" };
      mockService.getMnemonic.mockRejectedValue(new MnemonicNotFoundError("卟"));

      await controller.getMnemonic(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ mnemonic: null });
    });

    it("returns 400 for an invalid character parameter", async () => {
      mockReq.params = { character: "ab" }; // not a single Han character

      await controller.getMnemonic(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Failed to fetch mnemonic story",
        code: "VALIDATION_ERROR",
        message: expect.any(String),
      });
      expect(mockService.getMnemonic).not.toHaveBeenCalled();
    });

    it("returns 500 with convention error shape on unexpected errors", async () => {
      mockReq.params = { character: "好" };
      mockService.getMnemonic.mockRejectedValue(new Error("boom"));

      await controller.getMnemonic(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Failed to fetch mnemonic story",
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      });
    });
  });
});
