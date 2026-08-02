/**
 * @file apps/backend/tests/modules/progression/ProgressionRoutes.test.ts
 * @description Route-level integration tests for progressionRoutes auth behavior.
 *
 * Regression coverage for B2: GET /v1/progression/gates must be registered with
 * optionalAuth so guests reach the controller's guest branch and receive the
 * all-passed (GUEST) gate status instead of a 401 AUTH_REQUIRED.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import jwt from "jsonwebtoken";
import progressionRouter from "../../../src/modules/progression/api/progressionRoutes.js";
import { ProgressionController } from "../../../src/modules/progression/api/ProgressionController.js";
import { config } from "../../../src/shared/config/index.js";

/**
 * Build a test app that mounts the REAL progression router (including its
 * real optionalAuth/requireAuth middleware) with the controller injected via
 * req.progressionController — mirroring how routes.ts wires it in production.
 */
function createTestApp(controller: ProgressionController) {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.progressionController = controller;
    next();
  });
  app.use(progressionRouter);
  return app;
}

const mockGates = {
  phase2Gate: { passed: true, reason: "GRANDFATHERED", details: "Already passed Phase 2" },
  characterCountGate: { passed: true, details: "Characters learned: 500" },
  phase3To4Gate: { passed: false, reason: "COMPREHENSION_SCORE_TOO_LOW", details: "Score: 40%" },
};

describe("ProgressionRoutes — GET /v1/progression/gates auth behavior (B2)", () => {
  let mockProgressionService: any;
  let controller: ProgressionController;
  let app: express.Application;

  beforeEach(() => {
    mockProgressionService = {
      getGateStatus: vi.fn(),
    };
    const mockReviewService = {
      recordRating: vi.fn(),
    };
    controller = new ProgressionController(mockProgressionService, mockReviewService);
    app = createTestApp(controller);
  });

  it("returns 200 with computed gate status for an authenticated request", async () => {
    mockProgressionService.getGateStatus.mockResolvedValue(mockGates);
    const token = jwt.sign({ userId: "user123" }, config.jwtSecret!, { expiresIn: "5m" });

    const res = await request(app)
      .get("/v1/progression/gates")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockGates);
    expect(mockProgressionService.getGateStatus).toHaveBeenCalledWith("user123");
  });

  it("returns all-passed (GUEST) for a guest request — no 401", async () => {
    const res = await request(app).get("/v1/progression/gates");

    // Regression: with requireAuth this was 401 AUTH_REQUIRED; with optionalAuth
    // the controller's guest branch must be reachable and return all-passed.
    expect(res.status).toBe(200);
    expect(res.body).not.toHaveProperty("code", "AUTH_REQUIRED");
    expect(mockProgressionService.getGateStatus).not.toHaveBeenCalled();

    expect(res.body.phase2Gate).toMatchObject({ passed: true, reason: "GUEST" });
    expect(res.body.characterCountGate).toMatchObject({ passed: true, reason: "GUEST" });
    expect(res.body.phase3To4Gate).toMatchObject({ passed: true, reason: "GUEST" });
  });
});
