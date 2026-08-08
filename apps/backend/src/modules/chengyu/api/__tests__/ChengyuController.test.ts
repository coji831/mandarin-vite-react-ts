/**
 * @file apps/backend/src/modules/chengyu/api/__tests__/ChengyuController.test.ts
 * @description Unit tests for ChengyuController — route wiring + error mapping.
 *
 * Story 23.2 — Chengyu Backend API. Verifies:
 *   - the chengyu routes bind `ROUTE_PATTERNS.chengyuIdioms` /
 *     `chengyuIdiomById(":id")` to the controller handlers,
 *   - the controller coerces raw query strings and delegates to the service,
 *   - error mapping: ChengyuValidationError → 400, ChengyuNotFoundError → 404,
 *     unexpected → 500, malformed `:id` → 400 (uuid never accepted),
 *   - `ROUTE_PATTERNS` constants are verbatim and the module is wired into the
 *     app container (source-level assertion — importing the full app container
 *     in a unit test would initialize Redis/GCS/TTS/Gemini infrastructure).
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response } from "express";
import { ChengyuController } from "../ChengyuController.js";
import { ChengyuNotFoundError, ChengyuValidationError } from "../../types/chengyu.js";
import { ROUTE_PATTERNS } from "@mandarin/shared-constants";
import chengyuRoutes from "../chengyuRoutes.js";
import { createChengyuModule } from "../../container.js";
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Mock the logger
vi.mock("../../../../shared/utils/logger", () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}));

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

describe("ChengyuController", () => {
  let controller: ChengyuController;
  let mockService: {
    listIdioms: ReturnType<typeof vi.fn>;
    getIdiom: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockService = {
      listIdioms: vi.fn(),
      getIdiom: vi.fn(),
    };
    controller = new ChengyuController(mockService as never);
  });

  describe("list (GET /v1/chengyu/idioms)", () => {
    it("coerces raw query strings to numbers and returns the list with 200", async () => {
      const res = makeRes();
      mockService.listIdioms.mockResolvedValue({
        items: [],
        total: 55,
        page: 1,
        pageSize: 20,
      });

      await controller.list(
        makeReq({
          search: "破釜沉舟",
          theme: "determination",
          era: "Qin–Han transition",
          page: "1",
          pageSize: "20",
        }),
        res,
      );

      expect(mockService.listIdioms).toHaveBeenCalledWith({
        search: "破釜沉舟",
        theme: "determination",
        era: "Qin–Han transition",
        page: 1,
        pageSize: 20,
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ items: [], total: 55, page: 1, pageSize: 20 });
    });

    it("omits absent filters entirely (unfiltered browse)", async () => {
      const res = makeRes();
      mockService.listIdioms.mockResolvedValue({ items: [], total: 55, page: 1, pageSize: 20 });

      await controller.list(makeReq({}), res);

      expect(mockService.listIdioms).toHaveBeenCalledWith({
        search: undefined,
        theme: undefined,
        era: undefined,
        page: undefined,
        pageSize: undefined,
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("maps ChengyuValidationError → 400 VALIDATION_ERROR", async () => {
      const res = makeRes();
      mockService.listIdioms.mockRejectedValue(new ChengyuValidationError());

      await controller.list(makeReq({ theme: "" }), res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Failed to load chengyu idioms",
        code: "VALIDATION_ERROR",
      });
    });

    it("maps unexpected errors → 500 INTERNAL_ERROR", async () => {
      const res = makeRes();
      mockService.listIdioms.mockRejectedValue(new Error("db exploded"));

      await controller.list(makeReq({}), res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Failed to load chengyu idioms",
        code: "INTERNAL_ERROR",
      });
    });
  });

  describe("getById (GET /v1/chengyu/idioms/:id)", () => {
    it("returns the idiom detail with 200 for a valid cy_XXXX id", async () => {
      const res = makeRes();
      mockService.getIdiom.mockResolvedValue({
        id: "cy_0001",
        examples: [],
        relatedIdioms: [],
      });

      await controller.getById(makeReq({}, { id: "cy_0001" }), res);

      expect(mockService.getIdiom).toHaveBeenCalledWith("cy_0001");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ id: "cy_0001", examples: [], relatedIdioms: [] });
    });

    it("rejects a non-cy_XXXX id (e.g. an internal uuid) with 400 and never calls the service", async () => {
      const res = makeRes();

      await controller.getById(makeReq({}, { id: "550e8400-e29b-41d4-a716-446655440000" }), res);

      expect(mockService.getIdiom).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Failed to load chengyu idiom",
        code: "VALIDATION_ERROR",
      });
    });

    it("maps ChengyuNotFoundError → 404 NOT_FOUND", async () => {
      const res = makeRes();
      mockService.getIdiom.mockRejectedValue(new ChengyuNotFoundError("cy_9999"));

      await controller.getById(makeReq({}, { id: "cy_9999" }), res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: "Failed to load chengyu idiom",
        code: "NOT_FOUND",
      });
    });

    it("maps unexpected errors → 500 INTERNAL_ERROR", async () => {
      const res = makeRes();
      mockService.getIdiom.mockRejectedValue(new Error("boom"));

      await controller.getById(makeReq({}, { id: "cy_0001" }), res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Failed to load chengyu idiom",
        code: "INTERNAL_ERROR",
      });
    });
  });
});

describe("chengyuRoutes — route wiring + ROUTE_PATTERNS constants", () => {
  it("registers exactly the two GET routes on the chengyu router", () => {
    const layers = chengyuRoutes.stack.filter((layer) => layer.route !== undefined);

    expect(layers).toHaveLength(2);
    for (const layer of layers) {
      // Each bound route must have at least one registered handler.
      expect(layer.route!.stack.length).toBeGreaterThan(0);
    }
  });

  it('binds ROUTE_PATTERNS.chengyuIdioms and chengyuIdiomById(":id") verbatim', () => {
    const paths = chengyuRoutes.stack
      .map((layer) => layer.route?.path)
      .filter((p): p is string => typeof p === "string");

    expect(ROUTE_PATTERNS.chengyuIdioms).toBe("/v1/chengyu/idioms");
    expect(ROUTE_PATTERNS.chengyuIdiomById("cy_0001")).toBe("/v1/chengyu/idioms/cy_0001");
    expect(paths).toContain(ROUTE_PATTERNS.chengyuIdioms);
    expect(paths).toContain(ROUTE_PATTERNS.chengyuIdiomById(":id"));
  });
});

describe("chengyu module — container registration", () => {
  it("createChengyuModule wires a repository → service → controller", () => {
    const module = createChengyuModule();
    expect(module.controller).toBeInstanceOf(ChengyuController);
  });

  it("is registered in the app container and routes wiring (source-level assertion)", () => {
    const containerPath = path.resolve(__dirname, "../../../../app/container.ts");
    const routesPath = path.resolve(__dirname, "../../../../app/routes.ts");
    const expressTypesPath = path.resolve(__dirname, "../../../../shared/types/express.d.ts");

    const containerSource = readFileSync(containerPath, "utf-8");
    const routesSource = readFileSync(routesPath, "utf-8");
    const expressTypesSource = readFileSync(expressTypesPath, "utf-8");

    expect(containerSource).toContain(
      'import { createChengyuModule } from "../modules/chengyu/container.js";',
    );
    expect(containerSource).toContain("const chengyuModule = createChengyuModule();");
    expect(containerSource).toContain("export const chengyuController = chengyuModule.controller;");

    expect(routesSource).toContain('chengyuRoutes from "../modules/chengyu/api/chengyuRoutes.js"');
    expect(routesSource).toContain("req.chengyuController = chengyuController;");
    expect(routesSource).toContain("router.use(chengyuRoutes);");

    expect(expressTypesSource).toContain(
      'import type { ChengyuController } from "../../modules/chengyu/api/ChengyuController.js";',
    );
    expect(expressTypesSource).toContain("chengyuController?: ChengyuController;");
  });
});
