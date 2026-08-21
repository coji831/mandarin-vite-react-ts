/**
 * @file apps/backend/src/modules/quiz/nest/__tests__/sandhi-drill-nest-controller.test.ts
 * @description Unit tests for `SandhiDrillNestController` (Story 24-13 — Quiz +
 * Progression Port). 1:1 with the Express `SandhiDrillController` test surface —
 * `?count` parsing/validation, service delegation, 400/500 envelope codes.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { BadRequestException, InternalServerErrorException } from "@nestjs/common";
import { SandhiDrillNestController } from "../sandhi-drill-nest.controller.js";

vi.mock("../../../../shared/utils/logger.js", () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}));

describe("SandhiDrillNestController (Story 21.17 / 24-13)", () => {
  let controller: SandhiDrillNestController;
  let mockSandhiService: { generateQuestions: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockSandhiService = { generateQuestions: vi.fn() };
    controller = new SandhiDrillNestController(mockSandhiService as never);
  });

  it("GET sandhi-drill/questions — delegates with the parsed count", async () => {
    mockSandhiService.generateQuestions.mockResolvedValue([{ id: "drill-1" }]);

    const result = await controller.getQuestions("10");

    expect(mockSandhiService.generateQuestions).toHaveBeenCalledWith(10);
    expect(result).toEqual([{ id: "drill-1" }]);
  });

  it("defaults count to 10 when absent", async () => {
    mockSandhiService.generateQuestions.mockResolvedValue([]);

    await controller.getQuestions(undefined);

    expect(mockSandhiService.generateQuestions).toHaveBeenCalledWith(10);
  });

  it("count < 1 → 400 VALIDATION_ERROR envelope (no service call)", async () => {
    const err = await controller.getQuestions("0").then(
      () => {
        throw new Error("expected rejection");
      },
      (e: unknown) => e,
    );

    expect(err).toBeInstanceOf(BadRequestException);
    expect((err as BadRequestException).getResponse()).toEqual({
      code: "VALIDATION_ERROR",
      message: "Failed to load sandhi drill questions",
    });
    expect(mockSandhiService.generateQuestions).not.toHaveBeenCalled();
  });

  it("non-numeric count → 400 VALIDATION_ERROR envelope", async () => {
    const err = await controller.getQuestions("abc").then(
      () => {
        throw new Error("expected rejection");
      },
      (e: unknown) => e,
    );

    expect(err).toBeInstanceOf(BadRequestException);
  });

  it("service error → 500 LOAD_ERROR envelope", async () => {
    mockSandhiService.generateQuestions.mockRejectedValue(new Error("no candidates"));

    const err = await controller.getQuestions("10").then(
      () => {
        throw new Error("expected rejection");
      },
      (e: unknown) => e,
    );

    expect(err).toBeInstanceOf(InternalServerErrorException);
    expect((err as InternalServerErrorException).getResponse()).toEqual({
      code: "LOAD_ERROR",
      message: "Failed to load sandhi drill questions",
    });
  });
});
