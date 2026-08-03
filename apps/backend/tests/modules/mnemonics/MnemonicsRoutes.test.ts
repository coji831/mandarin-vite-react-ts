/**
 * @file apps/backend/tests/modules/mnemonics/MnemonicsRoutes.test.ts
 * @description Route-level integration tests for mnemonicsRoutes auth behavior.
 *
 * Regression coverage for Bug 2 (Option A — optionalAuth parity): GET
 * /v1/mnemonics/:character must be registered with optionalAuth so guests (no
 * token) reach the controller and receive the shared/cached mnemonic story
 * (200 { mnemonic }) instead of a 401 AUTH_REQUIRED. POST/PUT/DELETE stay
 * requireAuth — AI generation and user-edited persistence are registered-only.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import jwt from "jsonwebtoken";
import mnemonicsRouter from "../../../src/modules/mnemonics/api/mnemonicsRoutes.js";
import { MnemonicsController } from "../../../src/modules/mnemonics/api/MnemonicsController.js";
import { MnemonicNotFoundError } from "../../../src/modules/mnemonics/types/mnemonics.js";
import { config } from "../../../src/shared/config/index.js";

/**
 * Build a test app that mounts the REAL mnemonics router (including its real
 * optionalAuth/requireAuth middleware) with the controller injected via
 * req.mnemonicsController — mirroring how routes.ts wires it in production.
 */
function createTestApp(controller: MnemonicsController) {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.mnemonicsController = controller;
    next();
  });
  app.use(mnemonicsRouter);
  return app;
}

const sharedStory = {
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

describe("MnemonicsRoutes — GET /v1/mnemonics/:character auth behavior (Bug 2)", () => {
  let mockService: any;
  let controller: MnemonicsController;
  let app: express.Application;

  beforeEach(() => {
    mockService = {
      getMnemonic: vi.fn(),
      generateMnemonic: vi.fn(),
      updateMnemonic: vi.fn(),
      resetMnemonic: vi.fn(),
    };
    controller = new MnemonicsController(mockService);
    app = createTestApp(controller);
  });

  it("returns 200 with the shared/cached story for a guest — no 401", async () => {
    mockService.getMnemonic.mockResolvedValue(sharedStory);

    const res = await request(app).get("/v1/mnemonics/好");

    // Regression: with requireAuth this was 401 AUTH_REQUIRED; with optionalAuth
    // guests must reach the controller and receive the shared story.
    expect(res.status).toBe(200);
    expect(res.body).not.toHaveProperty("code", "AUTH_REQUIRED");
    expect(res.body).toEqual({ mnemonic: sharedStory });
    // Guest has no userId — service receives undefined and skips the user-edited branch.
    expect(mockService.getMnemonic).toHaveBeenCalledWith("好", undefined);
  });

  it("returns 200 with { mnemonic: null } for a guest when no story exists yet", async () => {
    mockService.getMnemonic.mockRejectedValue(new MnemonicNotFoundError("卟"));

    const res = await request(app).get("/v1/mnemonics/卟");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ mnemonic: null });
  });

  it("returns 200 and the user-edited story for an authenticated request (step 1 wins)", async () => {
    mockService.getMnemonic.mockResolvedValue(sharedStory);
    const token = jwt.sign({ userId: "user123" }, config.jwtSecret!, { expiresIn: "5m" });

    const res = await request(app).get("/v1/mnemonics/好").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ mnemonic: sharedStory });
    // Authenticated user's userId reaches the service so the user-edited branch runs.
    expect(mockService.getMnemonic).toHaveBeenCalledWith("好", "user123");
  });

  it("returns 400 for an invalid character parameter (validation unchanged)", async () => {
    const res = await request(app).get("/v1/mnemonics/ab");

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      error: "Failed to fetch mnemonic story",
      code: "VALIDATION_ERROR",
    });
    expect(mockService.getMnemonic).not.toHaveBeenCalled();
  });

  it("returns 500 with convention error shape on unexpected errors (no regression)", async () => {
    mockService.getMnemonic.mockRejectedValue(new Error("boom"));

    const res = await request(app).get("/v1/mnemonics/好");

    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      error: "Failed to fetch mnemonic story",
      code: "INTERNAL_ERROR",
      message: "An unexpected error occurred",
    });
  });
});

describe("MnemonicsRoutes — write routes stay requireAuth (Bug 2)", () => {
  let mockService: any;
  let controller: MnemonicsController;
  let app: express.Application;

  beforeEach(() => {
    mockService = {
      getMnemonic: vi.fn(),
      generateMnemonic: vi.fn(),
      updateMnemonic: vi.fn(),
      resetMnemonic: vi.fn(),
    };
    controller = new MnemonicsController(mockService);
    app = createTestApp(controller);
  });

  it("returns 401 for guest POST (generate)", async () => {
    const res = await request(app).post("/v1/mnemonics/好");

    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ code: "AUTH_REQUIRED" });
    expect(mockService.generateMnemonic).not.toHaveBeenCalled();
  });

  it("returns 401 for guest PUT (update)", async () => {
    const res = await request(app).put("/v1/mnemonics/好").send({ story: "Edited story." });

    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ code: "AUTH_REQUIRED" });
    expect(mockService.updateMnemonic).not.toHaveBeenCalled();
  });

  it("returns 401 for guest DELETE (reset)", async () => {
    const res = await request(app).delete("/v1/mnemonics/好");

    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ code: "AUTH_REQUIRED" });
    expect(mockService.resetMnemonic).not.toHaveBeenCalled();
  });
});
