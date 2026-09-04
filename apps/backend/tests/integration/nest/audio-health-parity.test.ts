/**
 * @file apps/backend/tests/integration/nest/audio-health-parity.test.ts
 * @description Audio (TTS) + Health regression harness (Story 24-10 — Audio +
 * Health Port; Story 24-15 — converted to Nest-only at the cutover).
 *
 * Pre-cutover this booted BOTH apps (production Express + Nest shell) and
 * deep-equal'd every response; that parity was verified through 24-14. At
 * 24-15 the Express surface was deleted, so this harness now boots ONLY the
 * NestJS 11 shell (`NestFactory.create(AppModule)` + the real
 * `configureNestShellApp` + `mountExpressErrorBridge` boot shape) and asserts
 * the audio + health contract directly as regression guards.
 *
 * ## NO REAL GOOGLE TTS / GCS / GEMINI IS HIT — every external client is
 * module-mocked (`GCSClient`, `GoogleTTSClient`, `GeminiService`) so the Nest
 * `SharedModule` constructs deterministic fakes. The raw Redis ping used by
 * the health endpoint is spied to resolve "PONG" (deterministic + no real
 * network). This keeps the suite hermetic and byte-deterministic.
 *
 * ## audio (POST /v1/tts — calibrated optionalAuth, F5 TTS surface)
 * The ported `AudioNestController` mirrors the (now deleted) `AudioController`
 * VERBATIM (same body read, same `AudioService` facade reuse, same
 * `{ audioUrl, cached }` 2xx) with the calibrated `OptionalAuthGuard` (24-5):
 *   - Guest (no token) cache HIT → 200 `{ audioUrl, cached: true }` and the
 *     mocked TTS `synthesizeSpeech` is NOT called — the F5 "cache-first free-
 *     for-guests" contract (no billable generation).
 *   - Guest cache MISS → 200 `{ cached: false }` (generation allowed for a
 *     guest today; the generated-audio path is counter-gated, mechanics
 *     deferred to epic-29 — no counter ships here).
 *   - Registered user (valid token) → 200, same shape (authenticated).
 *   - Invalid/garbage token → STILL 200 as a guest (optionalAuth never 401s —
 *     calibrated F6: a bad token is treated as guest, never rejected).
 *   - 4xx/5xx: status + the `{ code, message, requestId }` envelope (the
 *     requestId echoes the sent `X-Request-Id`): empty text / pinyin /
 *     too-many words → 400 `VALIDATION_ERROR`; upstream TTS failure → 500
 *     `TTS_ERROR`.
 *
 * ## health (GET /v1/health)
 * `HealthNestController` mirrors the (now deleted) `HealthController`
 * byte-for-byte and resolves the cross-module audio dependency via Nest DI
 * (HealthModule imports AudioModule). Returns the 200 shape `{ status,
 * timestamp, uptime, services: { gemini, tts }, cache: { redis: { connected } } }`
 * — asserted directly (deterministic fields deep-equal).
 *
 * DB-backed (real Prisma against the test database — used only to register a
 * real user for the authed-TTS surface; TTS/health themselves write no DB
 * rows). A missing `DATABASE_URL` / unreachable DB skips the whole suite (the
 * `checkDatabase` pattern).
 *
 * Run via: cd apps/backend && npm run test:integration
 */
import "reflect-metadata";
import type { Server } from "node:http";
import crypto from "node:crypto";
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import request from "supertest";
import type { INestApplication } from "@nestjs/common";

// ── External-client mocks (hoisted — MUST be in place before ANY module under
// ── test is evaluated; the Nest SharedModule constructs these classes at
// ── init time) ─────────────────────────────────────────────────────────────

const { mockGcs, mockTts, mockGemini, MockGCSClient, MockGoogleTTSClient, MockGeminiService } =
  vi.hoisted(() => {
    const SIGNED_URL =
      "https://storage.googleapis.com/pinyin-pal-data/tts/test.mp3?X-Goog-Signature=mock&X-Goog-Expires=3600";

    /** Shared GCS fns — every MockGCSClient instance delegates to these. */
    const mockGcs = {
      fileExists: vi.fn(async () => true),
      uploadFile: vi.fn(async () => {}),
      getSignedUrl: vi.fn(async () => SIGNED_URL),
      getPublicUrl: vi.fn((path: string) => `https://storage.googleapis.com/${path}`),
    };
    /** Shared GoogleTTS fns — every MockGoogleTTSClient instance delegates. */
    const mockTts = {
      synthesizeSpeech: vi.fn(async () => Buffer.from("fake-mp3-audio")),
      healthCheck: vi.fn(async () => true),
    };
    /** Shared Gemini healthCheck — the health endpoint reads services.gemini. */
    const mockGemini = {
      healthCheck: vi.fn(async () => true),
    };

    class MockGCSClient {
      fileExists = mockGcs.fileExists;
      uploadFile = mockGcs.uploadFile;
      getSignedUrl = mockGcs.getSignedUrl;
      getPublicUrl = mockGcs.getPublicUrl;
    }
    class MockGoogleTTSClient {
      synthesizeSpeech = mockTts.synthesizeSpeech;
      healthCheck = mockTts.healthCheck;
    }
    class MockGeminiService {
      constructor(_client?: unknown) {}
      healthCheck = mockGemini.healthCheck;
      generateText = vi.fn(async () => "mock");
      generateRaw = vi.fn(async () => "mock");
    }

    return { mockGcs, mockTts, mockGemini, MockGCSClient, MockGoogleTTSClient, MockGeminiService };
  });

vi.mock("../../../src/shared/infrastructure/external/GCSClient.js", () => ({
  GCSClient: MockGCSClient,
}));
vi.mock("../../../src/shared/infrastructure/external/GoogleTTSClient.js", () => ({
  GoogleTTSClient: MockGoogleTTSClient,
}));
vi.mock("../../../src/shared/infrastructure/external/GeminiService.js", () => ({
  GeminiService: MockGeminiService,
}));

// ── Hermetic env — MUST run before any module under test is evaluated ──────
// Pin PORT to an ephemeral port before importing anything that transitively
// boots a listener (dotenv does not override already-set vars).
process.env.PORT = "0";

// Dynamic imports AFTER the env stub + mocks (ESM evaluates static imports
// first; the module mocks are hoisted above so they apply here).
const { NestFactory } = await import("@nestjs/core");
const { AppModule } = await import("../../../src/nest/app.module.js");
const { configureNestShellApp } = await import("../../../src/nest/configure-app.js");
const { mountExpressErrorBridge } = await import("../../../src/nest/exception.filter.js");
const { prisma } = await import("../../../src/shared/infrastructure/database/client.js");
const { redisClient } = await import("../../../src/shared/infrastructure/redis/RedisClient.js");
const { checkDatabase, disconnectDatabase } = await import("../helpers/db.js");

const db = await checkDatabase();

// ── Deterministic Redis health ping (spy the raw ioredis client so the health
// ── endpoint's `ping(5000)` resolves "PONG" without a real network call). ──
const rawRedis: { ping(...args: unknown[]): Promise<string> } | null =
  redisClient.getClient() as never;
let redisPingSpy: { mockClear(): void; mockResolvedValue(v: string): unknown } | undefined;
if (rawRedis) {
  redisPingSpy = vi
    .spyOn(rawRedis as unknown as { ping: (...args: unknown[]) => Promise<string> }, "ping")
    .mockResolvedValue("PONG");
}

// ── Test-net IPs (unique per request — never trips a limiter) ──────────────

/** TEST-NET-3 range (203.0.113.0/24) — documented, never routable. */
let ipCounter = 0;
function nextIp(): string {
  ipCounter += 1;
  return `203.0.113.${(ipCounter % 200) + 1}`;
}

// ── Parity suite ───────────────────────────────────────────────────────────

describe.skipIf(!db.available)("Nest audio + health regression (integration, DB)", () => {
  let nestApp: INestApplication | undefined;
  let nestServer: Server;
  /** Registered user for the authed-TTS surface. */
  let userId: string | undefined;
  let accessToken: string | undefined;

  beforeAll(async () => {
    // bodyParser: false — configure-app.ts mounts express.json() +
    // express.urlencoded() explicitly (same limits as app/index.ts).
    nestApp = await NestFactory.create(AppModule, {
      logger: false,
      bufferLogs: false,
      bodyParser: false,
    });
    configureNestShellApp(nestApp);
    mountExpressErrorBridge(nestApp);
    await nestApp.init();
    nestServer = nestApp.getHttpServer() as Server;

    // Register a real user (via the Nest app) for the authed-TTS surface.
    const runId = crypto.randomBytes(4).toString("hex");
    const email = `audio-parity-${runId}@example.com`;
    const register = await request(nestServer)
      .post("/api/v1/auth/register")
      .set("X-Forwarded-For", nextIp())
      .send({ email, password: "ValidPass123", displayName: "Audio Health Parity" });
    expect(register.status).toBe(201);
    userId = register.body.data.user.id as string;
    accessToken = register.body.data.accessToken as string;
    expect(typeof userId).toBe("string");
    expect(typeof accessToken).toBe("string");
  });

  afterAll(async () => {
    if (userId) {
      await prisma.session.deleteMany({ where: { userId } });
      await prisma.user.deleteMany({ where: { id: userId } });
    }
    redisPingSpy?.mockClear();
    await nestApp?.close();
    await disconnectDatabase();
  });

  // Reset the shared external-client fns to deterministic defaults per test.
  beforeEach(() => {
    mockGcs.fileExists.mockReset().mockResolvedValue(true);
    mockGcs.uploadFile.mockReset().mockResolvedValue(undefined);
    mockGcs.getSignedUrl
      .mockReset()
      .mockResolvedValue(
        "https://storage.googleapis.com/pinyin-pal-data/tts/test.mp3?X-Goog-Signature=mock&X-Goog-Expires=3600",
      );
    mockGcs.getPublicUrl
      .mockReset()
      .mockImplementation((path: string) => `https://storage.googleapis.com/${path}`);
    mockTts.synthesizeSpeech.mockReset().mockResolvedValue(Buffer.from("fake-mp3-audio"));
    mockTts.healthCheck.mockReset().mockResolvedValue(true);
    mockGemini.healthCheck.mockReset().mockResolvedValue(true);
  });

  /** Fire the same POST at the Nest app and return `{ nestRes }`. */
  function postBoth(
    path: string,
    body: Record<string, unknown>,
    headers: Record<string, string> = {},
  ) {
    let req = request(nestServer).post(path).set("X-Forwarded-For", nextIp());
    for (const [k, v] of Object.entries(headers)) req = req.set(k, v);
    return req.send(body).then((nestRes) => ({ nestRes }));
  }

  /** Fire the same GET at the Nest app and return `{ nestRes }`. */
  function getBoth(path: string) {
    return request(nestServer)
      .get(path)
      .then((nestRes) => ({ nestRes }));
  }

  /** 2xx regression guard: the route responds 2xx with a body. */
  function expectParity2xx(res: { nestRes: request.Response }) {
    expect(res.nestRes.status).toBeGreaterThanOrEqual(200);
    expect(res.nestRes.status).toBeLessThan(300);
    expect(res.nestRes.body).toBeDefined();
  }

  /**
   * 4xx/5xx regression guard: the route responds with the exact status AND the
   * Nest `{ code, message, requestId }` envelope (24-3 HTTP-layer contract).
   */
  function expectErrorParity(res: { nestRes: request.Response }, expectedStatus: number) {
    expect(res.nestRes.status).toBe(expectedStatus);
    expect(res.nestRes.body).toEqual({
      code: expect.any(String),
      message: expect.any(String),
      requestId: expect.any(String),
    });
    expect(res.nestRes.body.requestId).toBe(res.nestRes.headers["x-request-id"]);
  }

  // ── audio (POST /v1/tts) ─────────────────────────────────────────────────

  describe("audio — POST /v1/tts (calibrated optionalAuth, F5)", () => {
    it("guest cache HIT — 200 { audioUrl, cached:true }, NO billable generation (F5 cache-first free-for-guests)", async () => {
      // Defaults: GCS fileExists → true (cache hit). No token → guest.
      const res = await postBoth("/api/v1/tts", { text: "你好" });
      expectParity2xx(res);
      expect(res.nestRes.body).toEqual({ audioUrl: expect.any(String), cached: true });
      // F5: a guest cache hit must NOT trigger a billable TTS generation.
      expect(mockTts.synthesizeSpeech).not.toHaveBeenCalled();
      expect(mockGcs.fileExists).toHaveBeenCalled();
    });

    it("guest cache MISS — 200 { audioUrl, cached:false } (generation allowed today; counter-gated in epic-29)", async () => {
      mockGcs.fileExists.mockResolvedValue(false);
      const res = await postBoth("/api/v1/tts", { text: "你好" });
      expectParity2xx(res);
      expect(res.nestRes.body).toEqual({ audioUrl: expect.any(String), cached: false });
      // Single-flight generation for the one (Nest) app.
      expect(mockTts.synthesizeSpeech).toHaveBeenCalledTimes(1);
      expect(mockGcs.uploadFile).toHaveBeenCalledTimes(1);
    });

    it("registered user cache HIT — 200, same shape (authenticated via calibrated OptionalAuthGuard)", async () => {
      const res = await postBoth(
        "/api/v1/tts",
        { text: "你好" },
        { Authorization: `Bearer ${accessToken}` },
      );
      expectParity2xx(res);
      expect(res.nestRes.body).toEqual({ audioUrl: expect.any(String), cached: true });
      expect(mockTts.synthesizeSpeech).not.toHaveBeenCalled();
    });

    it("invalid token — STILL 200 as guest (optionalAuth never 401s; F6 bad token → guest)", async () => {
      const res = await postBoth(
        "/api/v1/tts",
        { text: "你好" },
        { Authorization: "Bearer not-a-real-token" },
      );
      expectParity2xx(res);
      expect(res.nestRes.body).toEqual({ audioUrl: expect.any(String), cached: true });
    });

    it("empty text — 400 VALIDATION_ERROR envelope", async () => {
      const res = await postBoth("/api/v1/tts", { text: "" }, { "X-Request-Id": "tts-empty-1" });
      expectErrorParity(res, 400);
      expect(res.nestRes.body.code).toBe("VALIDATION_ERROR");
      expect(res.nestRes.body.message).toBe("Text is required.");
    });

    it("pinyin text ('bā') — 400 VALIDATION_ERROR envelope (Hanzi guard)", async () => {
      const res = await postBoth("/api/v1/tts", { text: "bā" }, { "X-Request-Id": "tts-pinyin-1" });
      expectErrorParity(res, 400);
      expect(res.nestRes.body.code).toBe("VALIDATION_ERROR");
      expect(res.nestRes.body.message).toBe(
        "Failed to generate TTS audio — text must contain Chinese characters (Hanzi)",
      );
    });

    it("too many words — 400 VALIDATION_ERROR envelope", async () => {
      const longText = Array.from({ length: 16 }, () => "word").join(" ");
      const res = await postBoth(
        "/api/v1/tts",
        { text: longText },
        { "X-Request-Id": "tts-long-1" },
      );
      expectErrorParity(res, 400);
      expect(res.nestRes.body.code).toBe("VALIDATION_ERROR");
      expect(res.nestRes.body.message).toBe("Please enter between 1 and 15 words.");
    });

    it("upstream TTS failure — 500 TTS_ERROR envelope (mocked client rejects)", async () => {
      mockGcs.fileExists.mockResolvedValue(false);
      mockTts.synthesizeSpeech.mockRejectedValue(new Error("TTS API down"));
      const res = await postBoth("/api/v1/tts", { text: "你好" }, { "X-Request-Id": "tts-500-1" });
      expectErrorParity(res, 500);
      expect(res.nestRes.body.code).toBe("TTS_ERROR");
      expect(res.nestRes.body.message).toBe("TTS API down");
    });

    it("GCS signing failure on a cache hit — 500 TTS_ERROR envelope", async () => {
      mockGcs.getSignedUrl.mockRejectedValue(new Error("signing failed"));
      const res = await postBoth("/api/v1/tts", { text: "你好" }, { "X-Request-Id": "tts-sign-1" });
      expectErrorParity(res, 500);
      expect(res.nestRes.body.code).toBe("TTS_ERROR");
    });
  });

  // ── health (GET /v1/health) ──────────────────────────────────────────────

  describe("health — GET /v1/health", () => {
    it("200 — same shape as Express (timestamp/uptime normalized, services+cache deep-equal)", async () => {
      const res = await getBoth("/api/v1/health");
      expect(res.nestRes.status).toBe(200);

      // Deterministic expected shape (mocked gemini/tts healthy + Redis "PONG").
      expect(res.nestRes.body).toEqual({
        status: "ok",
        timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
        uptime: expect.any(Number),
        services: { gemini: true, tts: true },
        cache: { redis: { connected: true } },
      });
    });

    it("200 — exact key set (no extra/missing keys)", async () => {
      const res = await getBoth("/api/v1/health");
      expect(res.nestRes.status).toBe(200);
      expect(Object.keys(res.nestRes.body).sort()).toEqual([
        "cache",
        "services",
        "status",
        "timestamp",
        "uptime",
      ]);
    });
  });
});
