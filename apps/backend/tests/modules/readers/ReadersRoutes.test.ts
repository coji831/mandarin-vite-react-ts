/**
 * @file apps/backend/tests/modules/readers/ReadersRoutes.test.ts
 * @description Route-level integration tests for readersRoutes auth behavior.
 *
 * Regression coverage: POST /v1/readers/passages/:id/audio must be registered
 * with optionalAuth so guests (no token) reach the controller and receive
 * passage audio (200 { audioUrls }) instead of a 401 AUTH_REQUIRED.
 * Users and guests share identical audio access — the GCS cold-cache is the
 * cost protector (no rate limit / voice whitelist on this route).
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import jwt from "jsonwebtoken";
import { createReadersRoutes } from "../../../src/modules/readers/api/readersRoutes.js";
import { ReadersController } from "../../../src/modules/readers/api/ReadersController.js";
import { config } from "../../../src/shared/config/index.js";

/**
 * Build a test app that mounts the REAL readers router (including its real
 * optionalAuth/requireAuth middleware) with the controller injected via
 * createReadersRoutes — mirroring how routes.ts wires it in production.
 */
function createTestApp(controller: ReadersController) {
  const app = express();
  app.use(express.json());
  app.use(createReadersRoutes(controller));
  return app;
}

const mockAudioResponse = {
  audioUrls: {
    0: { url: "https://storage.googleapis.com/bucket/tts/hash/0.mp3", source: "gcs" },
    1: { url: "https://storage.googleapis.com/bucket/tts/hash/1.mp3", source: "ondemand" },
  },
};

describe("ReadersRoutes — POST /v1/readers/passages/:id/audio auth behavior", () => {
  let mockReadersService: any;
  let controller: ReadersController;
  let app: express.Application;

  beforeEach(() => {
    mockReadersService = {
      getPassageAudio: vi.fn(),
    };
    controller = new ReadersController(mockReadersService);
    app = createTestApp(controller);
  });

  it("returns 200 with audioUrls for an authenticated user", async () => {
    mockReadersService.getPassageAudio.mockResolvedValue(mockAudioResponse);
    const token = jwt.sign({ userId: "user123" }, config.jwtSecret!, { expiresIn: "5m" });

    const res = await request(app)
      .post("/v1/readers/passages/passage-1/audio")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.audioUrls).toEqual(mockAudioResponse.audioUrls);
    expect(mockReadersService.getPassageAudio).toHaveBeenCalledWith("passage-1");
  });

  it("returns 200 with audioUrls for a guest — no 401", async () => {
    mockReadersService.getPassageAudio.mockResolvedValue(mockAudioResponse);

    const res = await request(app).post("/v1/readers/passages/passage-1/audio");

    // Regression: with requireAuth this was 401 AUTH_REQUIRED; with optionalAuth
    // guests must reach the controller and get passage audio.
    expect(res.status).toBe(200);
    expect(res.body).not.toHaveProperty("code", "AUTH_REQUIRED");
    expect(res.body.data.audioUrls).toEqual(mockAudioResponse.audioUrls);
    expect(mockReadersService.getPassageAudio).toHaveBeenCalledWith("passage-1");
  });
});
