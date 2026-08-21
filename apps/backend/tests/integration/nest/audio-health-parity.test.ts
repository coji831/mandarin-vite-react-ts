/**
 * @file apps/backend/tests/integration/nest/audio-health-parity.test.ts
 * @description Audio (TTS) + Health ↔ Express parity harness (Story 24-10 —
 * Audio + Health Port).
 *
 * Boots BOTH apps in-process via supertest:
 *   - the production Express app (`src/app/index.ts` default export — mounts
 *     the real audio + health route files), and
 *   - the NestJS 11 shell (`NestFactory.create(AppModule)` + the real
 *     `configureNestShellApp` + `mountExpressErrorBridge` boot shape).
 *
 * ## NO REAL GOOGLE TTS / GCS / GEMINI IS HIT — every external client is
 * module-mocked (`GCSClient`, `GoogleTTSClient`, `GeminiService`) so the
 * Express `app/container.ts` and the Nest `SharedModule` both construct
 * deterministic fakes. The raw Redis ping used by the health endpoint is
 * spied to resolve "PONG" (deterministic + no real network). This keeps the
 * suite hermetic and byte-deterministic.
 *
 * ## audio (POST /v1/tts — calibrated optionalAuth, F5 TTS surface)
 * The ported `AudioNestController` mirrors `api/AudioController.ts` VERBATIM
 * (same body read, same `AudioService` facade reuse, same `{ audioUrl,
 * cached }` 2xx) with the calibrated `OptionalAuthGuard` (24-5):
 *   - Guest (no token) cache HIT → 200 `{ audioUrl, cached: true }` and the
 *     mocked TTS `synthesizeSpeech` is NOT called — the F5 "cache-first free-
 *     for-guests" contract verified in-port (no billable generation).
 *   - Guest cache MISS → 200 `{ cached: false }` (generation allowed for a
 *     guest today; the generated-audio path is counter-gated, mechanics
 *     deferred to epic-29 — no counter ships here).
 *   - Registered user (valid token) → 200, same shape (authenticated).
 *   - Invalid/garbage token → STILL 200 as a guest (optionalAuth never 401s —
 *     calibrated F6: a bad token is treated as guest, never rejected).
 *   - 4xx/5xx: status + full `{ code, message, requestId }` body deep-equal
 *     (both apps echo the sent `X-Request-Id`): empty text / pinyin / too-many
 *     words → 400 `VALIDATION_ERROR`; upstream TTS failure → 500 `TTS_ERROR`.
 *
 * ## health (GET /v1/health)
 * `HealthNestController` mirrors `api/HealthController.ts` byte-for-byte and
 * resolves the DIRECT cross-module import via Nest DI (HealthModule imports
 * AudioModule; no `modules/audio/index.js` import in Nest land). Both apps
 * return the same 200 shape `{ status, timestamp, uptime, services: { gemini,
 * tts }, cache: { redis: { connected } } }` — asserted with `timestamp` /
 * `uptime` normalized (they differ between the two requests) and the
 * deterministic fields (`status`, `services`, `cache`) deep-equal.
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
// ── test is evaluated; the Express container and Nest SharedModule both
// ── construct these classes at import/init time) ───────────────────────────

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
// `src/app/index.ts` calls `app.listen(config.port)` at import time — pin PORT
// to an ephemeral port first (dotenv does not override already-set vars).
process.env.PORT = "0";

// Dynamic imports AFTER the env stub + mocks (ESM evaluates static imports
// first; the module mocks are hoisted above so they apply here).
const { default: expressApp } = await import("../../../src/app/index.js");
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

describe.skipIf(!db.available)("Nest audio + health ↔ Express parity (integration, DB)", () => {
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

    // Register a real user (via the Express app; both apps share the DB + JWT
    // secret, so the token authenticates on both) for the authed-TTS surface.
    const runId = crypto.randomBytes(4).toString("hex");
    const email = `audio-parity-${runId}@example.com`;
    const register = await request(expressApp)
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

  /** Fire the same POST on both apps and return both responses. */
  function postBoth(
    path: string,
    body: Record<string, unknown>,
    headers: Record<string, string> = {},
  ) {
    const send = (app: Parameters<typeof request>[0]) => {
      let req = request(app).post(path).set("X-Forwarded-For", nextIp());
      for (const [k, v] of Object.entries(headers)) req = req.set(k, v);
      return req.send(body);
    };
    return Promise.all([send(expressApp), send(nestServer)]).then(([expressRes, nestRes]) => ({
      expressRes,
      nestRes,
    }));
  }

  /** Fire the same GET on both apps and return both responses. */
  function getBoth(path: string) {
    return Promise.all([request(expressApp).get(path), request(nestServer).get(path)]).then(
      ([expressRes, nestRes]) => ({ expressRes, nestRes }),
    );
  }

  /** 2xx: identical status AND identical body (deep-equal). */
  function expectParity2xx(res: { expressRes: request.Response; nestRes: request.Response }) {
    expect(res.expressRes.status).toBeGreaterThanOrEqual(200);
    expect(res.expressRes.status).toBeLessThan(300);
    expect(res.nestRes.status).toBe(res.expressRes.status);
    expect(res.nestRes.body).toEqual(res.expressRes.body);
  }

  /** 4xx/5xx: identical status AND identical `{ code, message, requestId }` body. */
  function expectErrorParity(res: { expressRes: request.Response; nestRes: request.Response }) {
    expect(res.nestRes.status).toBe(res.expressRes.status);
    // Both apps echo the sent X-Request-Id into the envelope → full deep-equal.
    expect(res.nestRes.body).toEqual(res.expressRes.body);
    expect(res.nestRes.body).toEqual({
      code: expect.any(String),
      message: expect.any(String),
      requestId: expect.any(String),
    });
  }

  // ── audio (Express route file: api/audioRoutes.ts) ───────────────────────

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
      // Both apps synthesized exactly once each (single-flight per app).
      expect(mockTts.synthesizeSpeech).toHaveBeenCalledTimes(2);
      expect(mockGcs.uploadFile).toHaveBeenCalledTimes(2);
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

    it("empty text — 400 VALIDATION_ERROR envelope parity", async () => {
      const res = await postBoth("/api/v1/tts", { text: "" }, { "X-Request-Id": "tts-empty-1" });
      expect(res.expressRes.status).toBe(400);
      expectErrorParity(res);
      expect(res.nestRes.body.code).toBe("VALIDATION_ERROR");
      expect(res.nestRes.body.message).toBe("Text is required.");
    });

    it("pinyin text ('bā') — 400 VALIDATION_ERROR envelope parity (Hanzi guard)", async () => {
      const res = await postBoth("/api/v1/tts", { text: "bā" }, { "X-Request-Id": "tts-pinyin-1" });
      expect(res.expressRes.status).toBe(400);
      expectErrorParity(res);
      expect(res.nestRes.body.code).toBe("VALIDATION_ERROR");
      expect(res.nestRes.body.message).toBe(
        "Failed to generate TTS audio — text must contain Chinese characters (Hanzi)",
      );
    });

    it("too many words — 400 VALIDATION_ERROR envelope parity", async () => {
      const longText = Array.from({ length: 16 }, () => "word").join(" ");
      const res = await postBoth(
        "/api/v1/tts",
        { text: longText },
        { "X-Request-Id": "tts-long-1" },
      );
      expect(res.expressRes.status).toBe(400);
      expectErrorParity(res);
      expect(res.nestRes.body.code).toBe("VALIDATION_ERROR");
      expect(res.nestRes.body.message).toBe("Please enter between 1 and 15 words.");
    });

    it("upstream TTS failure — 500 TTS_ERROR envelope parity (mocked client rejects)", async () => {
      mockGcs.fileExists.mockResolvedValue(false);
      mockTts.synthesizeSpeech.mockRejectedValue(new Error("TTS API down"));
      const res = await postBoth("/api/v1/tts", { text: "你好" }, { "X-Request-Id": "tts-500-1" });
      expect(res.expressRes.status).toBe(500);
      expectErrorParity(res);
      expect(res.nestRes.body.code).toBe("TTS_ERROR");
      expect(res.nestRes.body.message).toBe("TTS API down");
    });

    it("GCS signing failure on a cache hit — 500 TTS_ERROR envelope parity", async () => {
      mockGcs.getSignedUrl.mockRejectedValue(new Error("signing failed"));
      const res = await postBoth("/api/v1/tts", { text: "你好" }, { "X-Request-Id": "tts-sign-1" });
      expect(res.expressRes.status).toBe(500);
      expectErrorParity(res);
      expect(res.nestRes.body.code).toBe("TTS_ERROR");
    });
  });

  // ── health (Express route file: api/healthRoutes.ts) ─────────────────────

  describe("health — GET /v1/health", () => {
    it("200 — same shape as Express (timestamp/uptime normalized, services+cache deep-equal)", async () => {
      const res = await getBoth("/api/v1/health");
      expect(res.expressRes.status).toBe(200);
      expect(res.nestRes.status).toBe(200);

      // timestamp + uptime differ between the two requests — normalize them,
      // then the REST must deep-equal.
      const normalize = (b: Record<string, unknown>) => ({ ...b, timestamp: "T", uptime: 0 });
      expect(normalize(res.nestRes.body)).toEqual(normalize(res.expressRes.body));

      // Deterministic expected shape (mocked gemini/tts healthy + Redis "PONG").
      expect(res.nestRes.body).toEqual({
        status: "ok",
        timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
        uptime: expect.any(Number),
        services: { gemini: true, tts: true },
        cache: { redis: { connected: true } },
      });
    });

    it("200 — exact key set matches Express (no extra/missing keys)", async () => {
      const res = await getBoth("/api/v1/health");
      expect(res.expressRes.status).toBe(200);
      expect(res.nestRes.status).toBe(200);
      expect(Object.keys(res.nestRes.body).sort()).toEqual(Object.keys(res.expressRes.body).sort());
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
