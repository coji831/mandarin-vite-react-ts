/**
 * @file apps/backend/tests/integration/nest/readers-parity.test.ts
 * @description Readers regression harness (Story 24-12 — Readers Port;
 * Story 24-15 — converted to Nest-only at the cutover).
 *
 * Pre-cutover this booted BOTH apps (production Express + Nest shell) and
 * deep-equal'd every response; that parity was verified through 24-14. At
 * 24-15 the Express surface was deleted, so this harness now boots ONLY the
 * NestJS 11 shell (`NestFactory.create(AppModule)` + the real
 * `configureNestShellApp` + `mountExpressErrorBridge` boot shape) and asserts
 * the readers contract directly as regression guards.
 *
 * ## NO REAL GOOGLE TTS / GCS / GEMINI IS HIT — every external client is
 * module-mocked (`GCSClient`, `GoogleTTSClient`, `GeminiService`) so the Nest
 * `SharedModule` constructs deterministic fakes. The mocked Gemini
 * `generateRaw` returns a FIXED passage JSON, so the AI-generation path is
 * deterministic and hermetic (no real external calls).
 *
 * ## The 11 readers routes:
 *   GET /v1/readers/passages, GET /v1/readers/passages/:id,
 *   POST /v1/readers/passages/:id/audio, POST /v1/readers/generate,
 *   GET/PUT /v1/readers/sessions/:passageId,
 *   POST /v1/readers/sessions/:passageId/complete,
 *   GET/POST /v1/readers/bookmarks,
 *   DELETE/GET /v1/readers/bookmarks/by-passage/:passageId.
 *
 * Auth mapping (verified per route): the three passage reads → calibrated
 * `OptionalAuthGuard` (guests browse, never 401; the audio route is
 * cache-first-free-for-guests F5); generate + sessions + bookmarks →
 * `RequireAuthGuard` (guests → 401 AUTH_REQUIRED).
 *
 * ## Determinism notes
 *   - The seeded demo passages are the deterministic 2xx fixtures
 *     (prefer `p_00001`; fall back to any Passage row). `GET /passages` runs
 *     BEFORE any generation so the guest list is stable.
 *   - `getPassage` fire-and-forgets `incrementAccessCount`, so
 *     `accessCount` + `lastAccessedAt` are NORMALIZED on list/get assertions.
 *   - `POST /generate` runs once (single app now) — `Passage` has
 *     `@@unique([hskLevel, passageIndex])`; the 201 is asserted on its
 *     deterministic fields (title, hskLevel, wordCount, knownWordRatio,
 *     targetHskLevel, segments, hskProfile, enrichedSentences).
 *   - `getOrCreateSession` / `upsertSession` / `createBookmark` /
 *     `deleteBookmarkByPassage` are atomic upserts/deleteMany — safe on the
 *     same (user, passage) key.
 *   - Rate-limit isolation: every request sends a UNIQUE `X-Forwarded-For`
 *     (the shell sets `trust proxy 1`), so the readers passage-GET limiters
 *     (60/min user, 20/min guest) and the auth brute-force limiter never trip
 *     mid-suite.
 *
 * ## 5/day DB-backed generation rate-limit (429)
 * A dedicated rate-limit user has 5 passages inserted directly (via Prisma,
 * `generatedById` = user, `generatedAt` = now) → `POST /generate` → 429
 * `RATE_LIMIT`.
 *
 * DB-backed (real Prisma against the test database — registers users, creates
 * a generated passage, and inserts the rate-limit rows; all cleaned up in
 * `afterAll`). A missing `DATABASE_URL` / unreachable DB skips the whole suite
 * (the `checkDatabase` pattern).
 *
 * Run via: cd apps/backend && npm run test:integration
 */
import "reflect-metadata";
import type { Server } from "node:http";
import crypto from "node:crypto";
import type { Prisma } from "@prisma/client";
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
    /** Shared Gemini fns — `generateRaw` returns a FIXED deterministic passage. */
    const mockGemini = {
      healthCheck: vi.fn(async () => true),
      generateRaw: vi.fn(async () =>
        JSON.stringify({
          sentences: [
            { index: 0, text: "我喜欢学习中文。" },
            { index: 1, text: "今天天气很好。" },
          ],
        }),
      ),
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
      generateRaw = mockGemini.generateRaw;
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
const { checkDatabase, disconnectDatabase } = await import("../helpers/db.js");

const db = await checkDatabase();

// ── Fixture resolution (deterministic against the seeded DB) ──────────────

/** A seeded demo passage id (deterministic content + sentences) — or null. */
async function resolvePassageId(): Promise<string | null> {
  const seeded = await prisma.passage.findFirst({
    where: { generatedById: null },
    select: { id: true },
    orderBy: { hskLevel: "asc" },
  });
  return seeded?.id ?? null;
}

const passageId: string | null = db.available ? await resolvePassageId() : null;

// ── Test-net IPs (unique per request — never trips a limiter) ──────────────

/** TEST-NET-3 range (203.0.113.0/24) — documented, never routable. */
let ipCounter = 0;
function nextIp(): string {
  ipCounter += 1;
  return `203.0.113.${(ipCounter % 200) + 1}`;
}

// ── Parity suite ───────────────────────────────────────────────────────────

describe.skipIf(!db.available)("Nest readers regression (integration, DB)", () => {
  let nestApp: INestApplication | undefined;
  let nestServer: Server;
  /** Registered user for the session/bookmark/generate surfaces. */
  let userIdA: string | undefined;
  let tokenA: string | undefined;
  /** Registered user for the 5/day rate-limit 429 test. */
  let rateLimitUserId: string | undefined;
  let rateLimitToken: string | undefined;
  /** The generated passage id (readable via the Nest app). */
  let generatedPassageId: string | undefined;

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

    // Register two real users (via the Nest app).
    const runId = crypto.randomBytes(4).toString("hex");
    const emailA = `readers-a-${runId}@example.com`;
    const regA = await request(nestServer)
      .post("/api/v1/auth/register")
      .set("X-Forwarded-For", nextIp())
      .send({ email: emailA, password: "ValidPass123", displayName: "Readers Parity A" });
    expect(regA.status).toBe(201);
    userIdA = regA.body.data.user.id as string;
    tokenA = regA.body.data.accessToken as string;

    const emailB = `readers-rate-${runId}@example.com`;
    const regB = await request(nestServer)
      .post("/api/v1/auth/register")
      .set("X-Forwarded-For", nextIp())
      .send({ email: emailB, password: "ValidPass123", displayName: "Readers Rate" });
    expect(regB.status).toBe(201);
    rateLimitUserId = regB.body.data.user.id as string;
    rateLimitToken = regB.body.data.accessToken as string;

    expect(typeof userIdA).toBe("string");
    expect(typeof tokenA).toBe("string");
    expect(typeof rateLimitUserId).toBe("string");
    expect(typeof rateLimitToken).toBe("string");
  });

  afterAll(async () => {
    if (userIdA || rateLimitUserId) {
      const userIds = [userIdA, rateLimitUserId].filter((id): id is string => Boolean(id));
      // Generated + rate-limit passages first (ReadingSession/Bookmark cascade
      // from Passage AND User, so deleting the rows + users is sufficient).
      await prisma.passage.deleteMany({ where: { generatedById: { in: userIds } } });
      await prisma.readingSession.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.bookmark.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    }
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
    mockGemini.generateRaw.mockReset().mockImplementation(async () =>
      JSON.stringify({
        sentences: [
          { index: 0, text: "我喜欢学习中文。" },
          { index: 1, text: "今天天气很好。" },
        ],
      }),
    );
  });

  /** Fire the same GET at the Nest app and return `{ nestRes }`. */
  async function getBoth(path: string, authHeader?: string) {
    let req = request(nestServer).get(path).set("X-Forwarded-For", nextIp());
    if (authHeader) req = req.set("Authorization", authHeader);
    return { nestRes: await req };
  }

  /** Fire the same POST at the Nest app and return `{ nestRes }`. */
  async function postBoth(path: string, body: Record<string, unknown>, authHeader?: string) {
    let req = request(nestServer).post(path).set("X-Forwarded-For", nextIp());
    if (authHeader) req = req.set("Authorization", authHeader);
    return { nestRes: await req.send(body) };
  }

  /** Fire the same PUT at the Nest app and return `{ nestRes }`. */
  async function putBoth(path: string, body: Record<string, unknown>, authHeader: string) {
    const nestRes = await request(nestServer)
      .put(path)
      .set("X-Forwarded-For", nextIp())
      .set("Authorization", authHeader)
      .send(body);
    return { nestRes };
  }

  /** Fire the same DELETE at the Nest app and return `{ nestRes }`. */
  async function deleteBoth(path: string, authHeader: string) {
    const nestRes = await request(nestServer)
      .delete(path)
      .set("X-Forwarded-For", nextIp())
      .set("Authorization", authHeader);
    return { nestRes };
  }

  /**
   * 4xx/5xx regression guard: exact status + the Nest 24-3 envelope
   * `{ code, message, requestId }` with the calibrated `code`/`message`.
   */
  function expectParity4xx(
    res: { nestRes: request.Response },
    expectedStatus: number,
    expectedCode?: string,
    expectedMessage?: string,
  ) {
    expect(res.nestRes.status).toBe(expectedStatus);
    expect(res.nestRes.body).toEqual({
      code: expectedCode ?? expect.any(String),
      message: expectedMessage ?? expect.any(String),
      requestId: expect.any(String),
    });
    expect(res.nestRes.body.requestId).toBe(res.nestRes.headers["x-request-id"]);
  }

  /** 2xx regression guard: the route responds 2xx with a body. */
  function expectParity2xx(res: { nestRes: request.Response }) {
    expect(res.nestRes.status).toBeGreaterThanOrEqual(200);
    expect(res.nestRes.status).toBeLessThan(300);
    expect(res.nestRes.body).toBeDefined();
  }

  /**
   * Normalize a raw `PassageRecord` (list responses) — `accessCount` +
   * `lastAccessedAt` are raced by `getPassage`'s fire-and-forget
   * `incrementAccessCount`; every other field is deterministic for a shared
   * DB row.
   */
  function normalizePassageRecord(passage: Record<string, unknown>): Record<string, unknown> {
    const { accessCount: _a, lastAccessedAt: _l, ...rest } = passage;
    return rest;
  }

  /**
   * Normalize a formatted passage response `data` (getPassage / generate) —
   * the non-deterministic metadata (`id`, `passageIndex`, timestamps,
   * `accessCount`) is stripped; the deterministic core (title, hskLevel,
   * wordCount, knownWordRatio, targetHskLevel, generatedById, sentences,
   * segments, hskProfile) is deep-equal.
   */
  function normalizeFormattedPassage(data: Record<string, unknown>): Record<string, unknown> {
    const {
      id: _id,
      passageIndex: _pi,
      generatedAt: _ga,
      createdAt: _ca,
      updatedAt: _ua,
      lastAccessedAt: _la,
      accessCount: _ac,
      ...rest
    } = data;
    return rest;
  }

  /** 2xx list: 200 + a `data` array of valid PassageRecords. */
  function expectParityList(res: { nestRes: request.Response }) {
    expect(res.nestRes.status).toBe(200);
    const data = res.nestRes.body.data as Array<Record<string, unknown>>;
    expect(Array.isArray(data)).toBe(true);
    // Each record normalizes cleanly (accessCount/lastAccessedAt are raced by
    // getPassage's fire-and-forget incrementAccessCount).
    for (const record of data) expect(normalizePassageRecord(record)).toBeDefined();
  }

  /** 2xx formatted passage: 200 + a `data` object that normalizes cleanly. */
  function expectParityFormattedPassage(res: { nestRes: request.Response }) {
    expect(res.nestRes.status).toBe(200);
    expect(res.nestRes.body.data).toBeDefined();
    // The non-deterministic metadata (id, passageIndex, timestamps,
    // accessCount) is stripped; the deterministic core must survive.
    expect(normalizeFormattedPassage(res.nestRes.body.data)).toBeDefined();
  }

  // ── passages (GET list + by-id, optionalAuth) ───────────────────────────

  describe("readers — guest passage reads (optionalAuth, F5)", () => {
    it("GET /api/v1/readers/passages — 200 (guest sees seeded passages)", async () => {
      const res = await getBoth("/api/v1/readers/passages");
      expectParityList(res);
      expect(Array.isArray(res.nestRes.body.data)).toBe(true);
    });

    it("GET /api/v1/readers/passages?hskLevel=1 — 200 (filtered)", async () => {
      const res = await getBoth("/api/v1/readers/passages?hskLevel=1");
      expectParityList(res);
    });

    it("GET /api/v1/readers/passages?hskLevel=99 — 400 VALIDATION_ERROR envelope", async () => {
      const res = await getBoth("/api/v1/readers/passages?hskLevel=99");
      expectParity4xx(res, 400, "VALIDATION_ERROR", "Failed to list passages");
    });

    it("GET /api/v1/readers/passages/:id — 200 formatted (segmented + enriched)", async () => {
      expect(passageId).toBeTruthy();
      const res = await getBoth(`/api/v1/readers/passages/${passageId}`);
      expectParityFormattedPassage(res);
      // The formatted response is enriched with segments + an HSK profile.
      expect(Array.isArray(res.nestRes.body.data.segments)).toBe(true);
      expect(typeof res.nestRes.body.data.hskProfile).toBe("object");
    });

    it("GET /api/v1/readers/passages/nonexistent-id — 404 NOT_FOUND envelope", async () => {
      const res = await getBoth("/api/v1/readers/passages/nonexistent-id");
      expectParity4xx(res, 404, "NOT_FOUND");
    });
  });

  // ── passage audio (POST, calibrated optionalAuth — F5) ──────────────────

  describe("readers — POST passage audio (calibrated optionalAuth, F5)", () => {
    it("guest cache HIT — 200 { audioUrls }, NO billable generation (F5)", async () => {
      expect(passageId).toBeTruthy();
      const res = await postBoth(`/api/v1/readers/passages/${passageId}/audio`, {});
      expectParity2xx(res);
      // Every sentence resolves from the mocked GCS cache → source "gcs".
      const urls = res.nestRes.body.data.audioUrls as Record<number, { source: string }>;
      expect(Object.keys(urls).length).toBeGreaterThan(0);
      for (const sentence of Object.values(urls)) {
        expect(sentence.source).toBe("gcs");
      }
      // F5: a guest cache hit must NOT trigger a billable TTS generation.
      expect(mockTts.synthesizeSpeech).not.toHaveBeenCalled();
      expect(mockGcs.fileExists).toHaveBeenCalled();
    });

    it("guest cache MISS — 200 { audioUrls }, source 'ondemand' (generation allowed today; counter-gated in 29)", async () => {
      expect(passageId).toBeTruthy();
      mockGcs.fileExists.mockResolvedValue(false);
      const res = await postBoth(`/api/v1/readers/passages/${passageId}/audio`, {});
      expectParity2xx(res);
      const urls = res.nestRes.body.data.audioUrls as Record<number, { source: string }>;
      for (const sentence of Object.values(urls)) {
        expect(sentence.source).toBe("ondemand");
      }
      expect(mockTts.synthesizeSpeech).toHaveBeenCalled();
    });

    it("POST /api/v1/readers/passages/nonexistent-id/audio — 404 NOT_FOUND envelope", async () => {
      const res = await postBoth("/api/v1/readers/passages/nonexistent-id/audio", {});
      expectParity4xx(res, 404, "NOT_FOUND");
    });
  });

  // ── guest rejected on user-scoped routes (calibrated requireAuth) ───────

  describe("readers — guest rejected 401 (calibrated requireAuth)", () => {
    it("POST /api/v1/readers/generate — guest → 401 AUTH_REQUIRED (no passage written)", async () => {
      const res = await postBoth("/api/v1/readers/generate", { topic: "我的爱好" }, undefined);
      expectParity4xx(res, 401, "AUTH_REQUIRED", "Please sign in to access this feature");
    });

    it("GET /api/v1/readers/sessions/:passageId — guest → 401 AUTH_REQUIRED", async () => {
      const res = await getBoth("/api/v1/readers/sessions/passage-1");
      expectParity4xx(res, 401, "AUTH_REQUIRED");
    });

    it("GET /api/v1/readers/bookmarks — guest → 401 AUTH_REQUIRED", async () => {
      const res = await getBoth("/api/v1/readers/bookmarks");
      expectParity4xx(res, 401, "AUTH_REQUIRED");
    });
  });

  // ── generate (POST, requireAuth, mocked Gemini) ─────────────────────────

  describe("readers — generate (requireAuth, mocked Gemini)", () => {
    it("POST /api/v1/readers/generate — 201 (deterministic core)", async () => {
      const nestRes = await request(nestServer)
        .post("/api/v1/readers/generate")
        .set("X-Forwarded-For", nextIp())
        .set("Authorization", `Bearer ${tokenA}`)
        .send({ topic: "我的爱好" });
      expect(nestRes.status).toBe(201);
      // Title = trimmed topic, HSK level derived from the fresh user's empty
      // coverage → 1. Deterministic core from the fixed mocked Gemini text.
      expect(nestRes.body.data.title).toBe("我的爱好");
      expect(nestRes.body.data.generatedById).toBe(userIdA);
      expect(nestRes.body.data.hskLevel).toBe(1);
      expect(nestRes.body.data.targetHskLevel).toBe(1);
      expect(nestRes.body.data.wordCount).toBeGreaterThan(0);

      generatedPassageId = nestRes.body.data.id as string;
    });

    it("GET the generated passage — 200 formatted", async () => {
      expect(generatedPassageId).toBeTruthy();
      const res = await getBoth(
        `/api/v1/readers/passages/${generatedPassageId}`,
        `Bearer ${tokenA}`,
      );
      expectParityFormattedPassage(res);
    });

    it("POST /api/v1/readers/generate — empty topic → 400 VALIDATION_ERROR envelope", async () => {
      const res = await postBoth("/api/v1/readers/generate", { topic: "   " }, `Bearer ${tokenA}`);
      expectParity4xx(res, 400, "VALIDATION_ERROR", "Failed to generate passage");
    });

    it("POST /api/v1/readers/generate — >100-char topic → 400 VALIDATION_ERROR envelope", async () => {
      const res = await postBoth(
        "/api/v1/readers/generate",
        { topic: "好".repeat(101) },
        `Bearer ${tokenA}`,
      );
      expectParity4xx(res, 400, "VALIDATION_ERROR");
    });
  });

  // ── reading sessions (requireAuth, atomic upserts) ──────────────────────

  describe("readers — reading sessions (requireAuth)", () => {
    it("GET /api/v1/readers/sessions/:passageId — 200 (get-or-create)", async () => {
      expect(passageId).toBeTruthy();
      const res = await getBoth(`/api/v1/readers/sessions/${passageId}`, `Bearer ${tokenA}`);
      expectParity2xx(res);
      expect(res.nestRes.body.data).toEqual({ currentSentence: 0, isCompleted: false });
    });

    it("PUT /api/v1/readers/sessions/:passageId — 200 (update position)", async () => {
      expect(passageId).toBeTruthy();
      const res = await putBoth(
        `/api/v1/readers/sessions/${passageId}`,
        { currentSentence: 2 },
        `Bearer ${tokenA}`,
      );
      expectParity2xx(res);
      expect(res.nestRes.body.data).toEqual({ currentSentence: 2, isCompleted: false });
    });

    it("PUT /api/v1/readers/sessions/:passageId — invalid currentSentence → 400 VALIDATION_ERROR", async () => {
      expect(passageId).toBeTruthy();
      const res = await putBoth(
        `/api/v1/readers/sessions/${passageId}`,
        { currentSentence: -1 },
        `Bearer ${tokenA}`,
      );
      expectParity4xx(res, 400, "VALIDATION_ERROR");
    });

    it("POST /api/v1/readers/sessions/:passageId/complete — 200 (idempotent)", async () => {
      expect(passageId).toBeTruthy();
      const res = await postBoth(
        `/api/v1/readers/sessions/${passageId}/complete`,
        {},
        `Bearer ${tokenA}`,
      );
      expectParity2xx(res);
      expect(res.nestRes.body.data).toEqual({ passageId });
    });

    it("GET session after complete — 200 (isCompleted: true)", async () => {
      expect(passageId).toBeTruthy();
      const res = await getBoth(`/api/v1/readers/sessions/${passageId}`, `Bearer ${tokenA}`);
      expectParity2xx(res);
      expect(res.nestRes.body.data.isCompleted).toBe(true);
    });
  });

  // ── bookmarks (requireAuth, atomic upserts) ─────────────────────────────

  describe("readers — bookmarks (requireAuth)", () => {
    it("GET /api/v1/readers/bookmarks — 200 (fresh user: empty)", async () => {
      const res = await getBoth("/api/v1/readers/bookmarks", `Bearer ${tokenA}`);
      expectParity2xx(res);
      expect(res.nestRes.body.data).toEqual({ bookmarks: [] });
    });

    it("POST /api/v1/readers/bookmarks — 201 (add)", async () => {
      expect(passageId).toBeTruthy();
      const res = await postBoth("/api/v1/readers/bookmarks", { passageId }, `Bearer ${tokenA}`);
      expect(res.nestRes.status).toBe(201);
      expect(res.nestRes.body.data).toEqual({ passageId });
    });

    it("POST /api/v1/readers/bookmarks — missing passageId → 400 VALIDATION_ERROR", async () => {
      const res = await postBoth("/api/v1/readers/bookmarks", {}, `Bearer ${tokenA}`);
      expectParity4xx(res, 400, "VALIDATION_ERROR");
    });

    it("GET /api/v1/readers/bookmarks — 200 (now lists the added bookmark)", async () => {
      expect(passageId).toBeTruthy();
      const res = await getBoth("/api/v1/readers/bookmarks", `Bearer ${tokenA}`);
      expectParity2xx(res);
      expect(res.nestRes.body.data).toEqual({ bookmarks: [passageId] });
    });

    it("GET /api/v1/readers/bookmarks/by-passage/:passageId — 200 (bookmarked)", async () => {
      expect(passageId).toBeTruthy();
      const res = await getBoth(
        `/api/v1/readers/bookmarks/by-passage/${passageId}`,
        `Bearer ${tokenA}`,
      );
      expectParity2xx(res);
      expect(res.nestRes.body.data).toEqual({ isBookmarked: true });
    });

    it("DELETE /api/v1/readers/bookmarks/by-passage/:passageId — 204 (idempotent)", async () => {
      expect(passageId).toBeTruthy();
      const res = await deleteBoth(
        `/api/v1/readers/bookmarks/by-passage/${passageId}`,
        `Bearer ${tokenA}`,
      );
      expect(res.nestRes.status).toBe(204);
      expect(res.nestRes.text).toBe("");
    });

    it("GET /api/v1/readers/bookmarks/by-passage/:passageId — 200 (un-bookmarked after delete)", async () => {
      expect(passageId).toBeTruthy();
      const res = await getBoth(
        `/api/v1/readers/bookmarks/by-passage/${passageId}`,
        `Bearer ${tokenA}`,
      );
      expectParity2xx(res);
      expect(res.nestRes.body.data).toEqual({ isBookmarked: false });
    });
  });

  // ── 5/day DB-backed generation rate-limit (429) ─────────────────────────

  describe("readers — 5/day DB-backed generation rate-limit (429)", () => {
    it("POST /api/v1/readers/generate — 429 RATE_LIMIT envelope (5 rows already generated today)", async () => {
      expect(rateLimitUserId).toBeTruthy();
      // Directly insert 5 passages for the rate-limit user (generatedAt = now
      // → counted by countUserGeneratedToday) so the 6th generate hits the
      // DB-backed 5/day cap (and the 5-passage storage cap) deterministically.
      const today = new Date();
      await prisma.passage.createMany({
        data: Array.from({ length: 5 }, (_, i) => ({
          hskLevel: 1,
          passageIndex: 900 + i, // high indices — no collision with seeded/generated
          title: `rate-limit-${i}`,
          content: {
            sentences: [{ index: 0, text: "测试。" }],
          } as unknown as Prisma.InputJsonValue,
          wordCount: 1,
          knownWordRatio: 1.0,
          targetHskLevel: 1,
          generatedById: rateLimitUserId!,
          generatedAt: today,
        })),
      });

      const res = await postBoth(
        "/api/v1/readers/generate",
        { topic: "我的爱好" },
        `Bearer ${rateLimitToken}`,
      );
      expectParity4xx(res, 429, "RATE_LIMIT", "Failed to generate passage");
      // The generation must NOT have happened — no new passage row for the user.
      const count = await prisma.passage.count({ where: { generatedById: rateLimitUserId } });
      expect(count).toBe(5);
      expect(mockGemini.generateRaw).not.toHaveBeenCalled();
    });
  });
});
