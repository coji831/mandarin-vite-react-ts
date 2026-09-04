/**
 * @file apps/backend/src/modules/health/nest/__tests__/health-nest-controller.test.ts
 * @description Unit tests for `HealthNestController` (Story 24-10 — Audio +
 * Health Port).
 *
 * All external deps are MOCKED (Gemini / Audio healthCheck + the Redis ping) —
 * no real Gemini, TTS, or Redis — and the controller's `checkHealth` is
 * exercised with a stub `@Res()` response. Covers the full response shape
 * parity with the Express `HealthController.checkHealth`: healthy/unhealthy
 * external services (`services.gemini` / `services.tts`), Redis connectivity
 * (`cache.redis.connected`, incl. the raw-client fallback + ping failure), the
 * ISO `timestamp` + numeric `uptime`, and the 500 `HEALTH_CHECK_FAILED` branch.
 *
 * The controller is exercised WITHOUT HTTP (decorators are inert on direct
 * calls): `@Res` is passed as a stub object. The cross-module `AudioService`
 * injection (via Nest DI from `AudioModule`) is not exercised here — the
 * constructor param is a structural `{ healthCheck() }`, exactly like the
 * Express `HealthController`.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// Stub the RedisClient module — its singleton (`new RedisClient()` at module
// load) would otherwise open a real ioredis connection during import.
vi.mock("../../../shared/infrastructure/redis/RedisClient.js", () => ({
  RedisClient: class RedisClient {},
  redisClient: { getClient: () => null },
}));

// Stub the logger so importing the controller never touches real transports.
vi.mock("../../../shared/utils/logger", () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  })),
}));

import { HealthNestController } from "../health-nest.controller.js";

/** Minimal Express `Response` stub for the `@Res()` mirror (typed any so it
 * is assignable to the controller's `Response` param on direct calls). */
function resStub(): any {
  const res: Record<string, unknown> = { statusCode: 0, body: undefined };
  res.status = vi.fn(function (this: Record<string, unknown>, code: number) {
    this.statusCode = code;
    return this;
  });
  res.json = vi.fn(function (this: Record<string, unknown>, body: unknown) {
    this.body = body;
    return this;
  });
  return res;
}

describe("HealthNestController", () => {
  let controller: HealthNestController;
  let mockGemini: { healthCheck: ReturnType<typeof vi.fn> };
  let mockAudio: { healthCheck: ReturnType<typeof vi.fn> };
  let mockRedis: { getClient: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockGemini = { healthCheck: vi.fn(async () => true) };
    mockAudio = { healthCheck: vi.fn(async () => true) };
    mockRedis = { getClient: vi.fn(() => ({ ping: async () => "PONG" })) };
    controller = new HealthNestController(
      mockGemini as never,
      mockAudio as never,
      mockRedis as never,
    );
  });

  it("returns 200 with status ok, healthy services, and Redis connected", async () => {
    const res = resStub();
    await controller.checkHealth(res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({
      status: "ok",
      services: { gemini: true, tts: true },
      cache: { redis: { connected: true } },
    });
    expect(res.body).toHaveProperty("timestamp");
    expect(new Date((res.body as { timestamp: string }).timestamp).toISOString()).toBe(
      (res.body as { timestamp: string }).timestamp,
    );
    expect(typeof (res.body as { uptime: number }).uptime).toBe("number");
  });

  it("reports degraded external services when gemini/tts healthCheck fails", async () => {
    mockGemini.healthCheck.mockRejectedValue(new Error("gemini down"));
    mockAudio.healthCheck.mockRejectedValue(new Error("tts down"));

    const res = resStub();
    await controller.checkHealth(res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ services: { gemini: false, tts: false } });
  });

  it("reports Redis disconnected when the raw ping rejects", async () => {
    mockRedis.getClient.mockReturnValue({
      ping: async () => Promise.reject(new Error("no redis")),
    });

    const res = resStub();
    await controller.checkHealth(res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ cache: { redis: { connected: false } } });
  });

  it("treats a null Redis client as connected (mirrors the Express fallback ping)", async () => {
    mockRedis.getClient.mockReturnValue(null);

    const res = resStub();
    await controller.checkHealth(res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ cache: { redis: { connected: true } } });
  });

  it("returns 500 HEALTH_CHECK_FAILED { error, code, message } when assembly throws", async () => {
    // Make `createHealthResponse()` throw — e.g. a poisoned Date (simulates an
    // unexpected failure inside the try block).
    const realDate = Date;
    vi.spyOn(globalThis, "Date").mockImplementationOnce(
      class extends realDate {
        toISOString(): string {
          throw new Error("boom");
        }
      } as unknown as DateConstructor,
    );

    const res = resStub();
    await controller.checkHealth(res);

    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({
      error: "Internal Server Error",
      code: "HEALTH_CHECK_FAILED",
      message: "Failed to perform health check",
    });
  });
});
