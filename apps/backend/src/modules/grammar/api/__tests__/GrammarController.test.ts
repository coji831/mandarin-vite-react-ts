/**
 * @file apps/backend/src/modules/grammar/api/__tests__/GrammarController.test.ts
 * @description Unit tests for GrammarController — route wiring + error mapping.
 *
 * Story 22.2 — Grammar Backend API. Verifies:
 *   - the grammar routes bind `ROUTE_PATTERNS.grammarPatterns` /
 *     `grammarPatternById(":id")` to the controller handlers,
 *   - the controller coerces raw query strings and delegates to the service,
 *   - error mapping: GrammarValidationError → 400, GrammarNotFoundError → 404,
 *     unexpected → 500, malformed `:id` → 400 (uuid never accepted).
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response } from "express";
import { GrammarController } from "../GrammarController.js";
import { GrammarNotFoundError, GrammarValidationError } from "../../types/grammar.js";
import { ROUTE_PATTERNS } from "@mandarin/shared-constants";
import grammarRoutes from "../grammarRoutes.js";

// Mock the logger
vi.mock("../../../../shared/utils/logger", () => ({
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

function makeReq(query: Record<string, unknown> = {}, params: Record<string, unknown> = {}) {
  return { query, params } as unknown as Request;
}

describe("GrammarController", () => {
  let controller: GrammarController;
  let mockService: {
    listPatterns: ReturnType<typeof vi.fn>;
    getPattern: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockService = {
      listPatterns: vi.fn(),
      getPattern: vi.fn(),
    };
    controller = new GrammarController(mockService as never);
  });

  describe("list (GET /v1/grammar/patterns)", () => {
    it("coerces raw query strings to numbers and returns the list with 200", async () => {
      const res = makeRes();
      mockService.listPatterns.mockResolvedValue({ items: [], total: 9, page: 1, pageSize: 20 });

      await controller.list(
        makeReq({ search: "disposal", hskLevel: "4", phase: "4", page: "1", pageSize: "20" }),
        res,
      );

      expect(mockService.listPatterns).toHaveBeenCalledWith({
        search: "disposal",
        hskLevel: 4,
        phase: 4,
        page: 1,
        pageSize: 20,
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ items: [], total: 9, page: 1, pageSize: 20 });
    });

    it("omits absent filters entirely (unfiltered browse)", async () => {
      const res = makeRes();
      mockService.listPatterns.mockResolvedValue({ items: [], total: 21, page: 1, pageSize: 20 });

      await controller.list(makeReq({}), res);

      expect(mockService.listPatterns).toHaveBeenCalledWith({
        search: undefined,
        hskLevel: undefined,
        phase: undefined,
        page: undefined,
        pageSize: undefined,
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("maps GrammarValidationError → 400 VALIDATION_ERROR", async () => {
      const res = makeRes();
      mockService.listPatterns.mockRejectedValue(new GrammarValidationError());

      await controller.list(makeReq({ phase: "5" }), res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Failed to load grammar patterns",
        code: "VALIDATION_ERROR",
      });
    });

    it("maps unexpected errors → 500 INTERNAL_ERROR", async () => {
      const res = makeRes();
      mockService.listPatterns.mockRejectedValue(new Error("db exploded"));

      await controller.list(makeReq({}), res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Failed to load grammar patterns",
        code: "INTERNAL_ERROR",
      });
    });
  });

  describe("getById (GET /v1/grammar/patterns/:id)", () => {
    it("returns the pattern detail with 200 for a valid gr_XXXX id", async () => {
      const res = makeRes();
      mockService.getPattern.mockResolvedValue({ id: "gr_0018", examples: [], relatedPatterns: [] });

      await controller.getById(makeReq({}, { id: "gr_0018" }), res);

      expect(mockService.getPattern).toHaveBeenCalledWith("gr_0018");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ id: "gr_0018", examples: [], relatedPatterns: [] });
    });

    it("rejects a non-gr_XXXX id (e.g. an internal uuid) with 400 and never calls the service", async () => {
      const res = makeRes();

      await controller.getById(
        makeReq({}, { id: "550e8400-e29b-41d4-a716-446655440000" }),
        res,
      );

      expect(mockService.getPattern).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Failed to load grammar pattern",
        code: "VALIDATION_ERROR",
      });
    });

    it("maps GrammarNotFoundError → 404 NOT_FOUND", async () => {
      const res = makeRes();
      mockService.getPattern.mockRejectedValue(new GrammarNotFoundError("gr_9999"));

      await controller.getById(makeReq({}, { id: "gr_9999" }), res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: "Failed to load grammar pattern",
        code: "NOT_FOUND",
      });
    });

    it("maps unexpected errors → 500 INTERNAL_ERROR", async () => {
      const res = makeRes();
      mockService.getPattern.mockRejectedValue(new Error("boom"));

      await controller.getById(makeReq({}, { id: "gr_0018" }), res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Failed to load grammar pattern",
        code: "INTERNAL_ERROR",
      });
    });
  });
});

describe("grammarRoutes — route wiring + ROUTE_PATTERNS constants", () => {
  it("registers exactly the two GET routes on the grammar router", () => {
    const layers = grammarRoutes.stack.filter((layer) => layer.route !== undefined);

    expect(layers).toHaveLength(2);
    for (const layer of layers) {
      // Each bound route must have at least one registered handler.
      expect(layer.route!.stack.length).toBeGreaterThan(0);
    }
  });

  it("binds ROUTE_PATTERNS.grammarPatterns and grammarPatternById(\":id\") verbatim", () => {
    const paths = grammarRoutes.stack
      .map((layer) => layer.route?.path)
      .filter((p): p is string => typeof p === "string");

    expect(ROUTE_PATTERNS.grammarPatterns).toBe("/v1/grammar/patterns");
    expect(ROUTE_PATTERNS.grammarPatternById("gr_0018")).toBe(
      "/v1/grammar/patterns/gr_0018",
    );
    expect(paths).toContain(ROUTE_PATTERNS.grammarPatterns);
    expect(paths).toContain(ROUTE_PATTERNS.grammarPatternById(":id"));
  });
});
