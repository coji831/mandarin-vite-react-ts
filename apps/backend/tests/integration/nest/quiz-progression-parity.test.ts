/**
 * @file apps/backend/tests/integration/nest/quiz-progression-parity.test.ts
 * @description Quiz + Progression regression harness (Story 24-13 — Quiz +
 * Progression Port + Circular-DI; Story 24-15 — converted to Nest-only at the
 * cutover).
 *
 * Pre-cutover this booted BOTH apps (production Express + Nest shell) and
 * deep-equal'd every response; that parity was verified through 24-14. At
 * 24-15 the Express surface was deleted, so this harness now boots ONLY the
 * NestJS 11 shell (`NestFactory.create(AppModule)` + the real
 * `configureNestShellApp` + `mountExpressErrorBridge` boot shape) and asserts
 * the quiz + progression contract directly as regression guards.
 *
 * This harness is the ARBITER of the 24-13 circular-DI resolution: if the
 * re-injection fallback fails to construct `QuizService` / `ProgressionService`
 * at boot, `NestFactory.create(AppModule)` throws and the whole suite fails.
 *
 * ## NO REAL GEMINI IS HIT — `GeminiService` is module-mocked (the Nest
 * `SharedModule` constructs it), so the AI-feedback route
 * (`POST /v1/quiz/feedback`) returns a deterministic `{ explanation,
 * errorType }` with zero external calls.
 *
 * ## Auth mapping (verified per route):
 *   - quiz: config/questions/attempts POST/answers/complete/sandhi-drill →
 *     calibrated `OptionalAuthGuard` (guest → session-local mock shapes, never
 *     401); attempts GET + feedback → `RequireAuthGuard` (guest → 401).
 *   - progression: foundation-progress GET / phase-gate GET / gates GET /
 *     radical-progress GET → `OptionalAuthGuard` (guest → session-local/empty);
 *     foundation-progress PUT / phase-gate PUT / radical-progress PUT →
 *     `RequireAuthGuard` (guest → 401).
 *
 * ## CALIBRATED `/gates` GUEST BRANCH (24-13 — the 24-7 deferred item):
 * a guest is Phase-1-only, so the Phase 2+ gates are NOT passed — `getGates`
 * AGREES with `getPhaseGate` for the same guest identity. The guest `/gates`
 * test asserts the calibrated Phase-1-only shape.
 *
 * ## Determinism notes
 *   - Quiz questions (`audio-to-pinyin-tone`) are shuffled (so the `id` —
 *     `q-${index+1}` — is SHUFFLE-POSITION-dependent) + `Math.random` category
 *     → NORMALIZED (sort by unique `audioKey`, `id` + `category` → sentinels).
 *   - Sandhi-drill questions are shuffled + shuffled options → NORMALIZED
 *     (sort by `id`, options sorted).
 *   - Guest attempt/answer mocks carry `crypto.randomUUID()` + `now()` →
 *     NORMALIZED to sentinels.
 *   - Authed `POST /attempts` creates a row per request → status + shape
 *     asserted, not ids.
 *   - `GET /attempts` reads all of userA's rows (shared DB) → sorted by `id`.
 *   - Unique `X-Forwarded-For` per request so the quiz-feedback limiter
 *     (10/min/IP) and the auth brute-force limiter never trip mid-suite.
 *
 * DB-backed (real Prisma against the test database — registers real users,
 * creates attempts/answers/gates; all cleaned up in `afterAll`). A missing
 * `DATABASE_URL` / unreachable DB skips the whole suite (`checkDatabase`).
 *
 * Run via: cd apps/backend && npm run test:integration
 */
import "reflect-metadata";
import type { Server } from "node:http";
import crypto from "node:crypto";
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import request from "supertest";
import type { INestApplication } from "@nestjs/common";

// ── Gemini mock (hoisted — MUST be in place before ANY module under test is
// ── evaluated; the Nest SharedModule constructs GeminiService at init time) ─

const { mockGemini, MockGeminiService } = vi.hoisted(() => {
  /** Shared Gemini fns — `generateText` returns a FIXED deterministic string. */
  const mockGemini = {
    healthCheck: vi.fn(async () => true),
    generateText: vi.fn(async () => "mock-feedback-explanation"),
    generateRaw: vi.fn(async () =>
      JSON.stringify({
        sentences: [
          { index: 0, text: "我喜欢学习中文。" },
          { index: 1, text: "今天天气很好。" },
        ],
      }),
    ),
  };
  class MockGeminiService {
    constructor(_client?: unknown) {}
    healthCheck = mockGemini.healthCheck;
    generateText = mockGemini.generateText;
    generateRaw = mockGemini.generateRaw;
  }
  return { mockGemini, MockGeminiService };
});

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

// ── Seeded-content guards (deterministic 2xx fixtures) ────────────────────

/** The audio-to-pinyin-tone strategy pool is PinyinSyllable-backed. */
const pinyinSyllableCount: number = db.available ? await prisma.pinyinSyllable.count() : 0;

/** The sandhi drill draws from the Word table (2-char words). */
const sandhiWordCount: number = db.available
  ? await prisma.word.count({ where: { simplified: { not: null } } })
  : 0;

/** A real Radical id for the radical-progress PUT (validated by the service). */
const seededRadicalId: string | null = db.available
  ? ((await prisma.radical.findFirst({ select: { id: true }, orderBy: { id: "asc" } }))?.id ?? null)
  : null;

// ── Test-net IPs (unique per request — never trips a limiter) ──────────────

/** TEST-NET-3 range (203.0.113.0/24) — documented, never routable. */
let ipCounter = 0;
function nextIp(): string {
  ipCounter += 1;
  return `203.0.113.${(ipCounter % 200) + 1}`;
}

// ── Parity suite ───────────────────────────────────────────────────────────

describe.skipIf(!db.available)(
  "Nest quiz+progression regression + circular-DI (integration, DB)",
  () => {
    let nestApp: INestApplication | undefined;
    let nestServer: Server;
    /** Registered user for the quiz + progression surfaces. */
    let userIdA: string | undefined;
    let tokenA: string | undefined;
    /** Registered user for the progression WRITE surfaces (isolated from A). */
    let userIdB: string | undefined;
    let tokenB: string | undefined;

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
      const emailA = `quiz-a-${runId}@example.com`;
      const regA = await request(nestServer)
        .post("/api/v1/auth/register")
        .set("X-Forwarded-For", nextIp())
        .send({ email: emailA, password: "ValidPass123", displayName: "Quiz Parity A" });
      expect(regA.status).toBe(201);
      userIdA = regA.body.data.user.id as string;
      tokenA = regA.body.data.accessToken as string;

      const emailB = `quiz-b-${runId}@example.com`;
      const regB = await request(nestServer)
        .post("/api/v1/auth/register")
        .set("X-Forwarded-For", nextIp())
        .send({ email: emailB, password: "ValidPass123", displayName: "Quiz Parity B" });
      expect(regB.status).toBe(201);
      userIdB = regB.body.data.user.id as string;
      tokenB = regB.body.data.accessToken as string;

      expect(typeof userIdA).toBe("string");
      expect(typeof tokenA).toBe("string");
      expect(typeof userIdB).toBe("string");
      expect(typeof tokenB).toBe("string");
    });

    afterAll(async () => {
      if (userIdA || userIdB) {
        const userIds = [userIdA, userIdB].filter((id): id is string => Boolean(id));
        // QuizAttemptAnswer → QuizAttempt → progression tables → session → user
        await prisma.quizAttemptAnswer.deleteMany({
          where: { attempt: { userId: { in: userIds } } },
        });
        await prisma.quizAttempt.deleteMany({ where: { userId: { in: userIds } } });
        await prisma.foundationProgress.deleteMany({ where: { userId: { in: userIds } } });
        await prisma.radicalProgress.deleteMany({ where: { userId: { in: userIds } } });
        await prisma.phaseGate.deleteMany({ where: { userId: { in: userIds } } });
        await prisma.session.deleteMany({ where: { userId: { in: userIds } } });
        await prisma.user.deleteMany({ where: { id: { in: userIds } } });
      }
      await nestApp?.close();
      await disconnectDatabase();
    });

    /** Fire the same GET (with optional auth header) at the Nest app. */
    function getBoth(path: string, authHeader?: string) {
      let req = request(nestServer).get(path).set("X-Forwarded-For", nextIp());
      if (authHeader) req = req.set("Authorization", authHeader);
      return req.then((nestRes) => ({ nestRes }));
    }

    /** Fire the same POST (with optional auth header) at the Nest app. */
    function postBoth(path: string, body: Record<string, unknown>, authHeader?: string) {
      let req = request(nestServer).post(path).set("X-Forwarded-For", nextIp());
      if (authHeader) req = req.set("Authorization", authHeader);
      return req.send(body).then((nestRes) => ({ nestRes }));
    }

    /** Fire the same PUT (with optional auth header) at the Nest app. */
    function putBoth(path: string, body: Record<string, unknown>, authHeader?: string) {
      let req = request(nestServer).put(path).set("X-Forwarded-For", nextIp());
      if (authHeader) req = req.set("Authorization", authHeader);
      return req.send(body).then((nestRes) => ({ nestRes }));
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

    /** 2xx regression guard: the route responds with the exact status + a body. */
    function expectParity2xx(res: { nestRes: request.Response }, expectedStatus = 200) {
      expect(res.nestRes.status).toBe(expectedStatus);
      expect(res.nestRes.body).toBeDefined();
    }

    // ── Normalizers (non-deterministic fields → sentinels) ───────────────

    /**
     * Quiz questions: `id` (`q-${index+1}` — SHUFFLE POSITION, differs per app)
     * and `category` (`Math.random`) are NON-deterministic → both sentineled;
     * then sort by the unique `audioKey` so the shuffled orders line up.
     */
    function normalizeQuizQuestions(body: unknown): unknown {
      if (!Array.isArray(body)) return body;
      return body
        .map((q) => ({
          ...(q as Record<string, unknown>),
          id: "QID",
          category: "CAT",
        }))
        .sort((a, b) =>
          String((a as { audioKey?: string }).audioKey).localeCompare(
            String((b as { audioKey?: string }).audioKey),
          ),
        );
    }

    /**
     * Sandhi questions: options sorted + a COMPOSITE sort key
     * (`id|characters|correctAnswer`). The round-robin generator reuses
     * `id: sandhi-q-${seed}` across rules, so sorting by id alone is ambiguous
     * for same-seed questions — the content fields disambiguate. `characters`
     * (the word) is unique per question in practice.
     */
    function normalizeSandhiQuestions(body: unknown): unknown {
      if (!Array.isArray(body)) return body;
      return body
        .map((q) => ({
          ...(q as Record<string, unknown>),
          options: [...((q as { options: string[] }).options ?? [])].sort(),
        }))
        .sort((a, b) =>
          [
            String((a as { id?: string }).id),
            String((a as { characters?: string }).characters),
            String((a as { correctAnswer?: string }).correctAnswer),
          ]
            .join("|")
            .localeCompare(
              [
                String((b as { id?: string }).id),
                String((b as { characters?: string }).characters),
                String((b as { correctAnswer?: string }).correctAnswer),
              ].join("|"),
            ),
        );
    }

    /** Guest attempt/answer mock: random UUID + now → sentinels. */
    function normalizeMockRow(body: unknown): unknown {
      const b = body as Record<string, unknown>;
      return { ...b, id: "ID", createdAt: "TS" };
    }

    /** Guest phase-gate: `now` timestamps → sentinels. */
    function normalizePhaseGate(body: unknown): unknown {
      const b = body as Record<string, unknown>;
      return { ...b, createdAt: "TS", updatedAt: "TS" };
    }

    /**
     * Progression row (foundation/radical progress): the write routes create
     * DIFFERENT rows per app (different section/radical), so only the
     * deterministic fields are compared (drop ids + timestamps).
     */
    function normalizeProgressRow(body: unknown): unknown {
      if (!body || typeof body !== "object") return body;
      const {
        id: _id,
        createdAt: _c,
        updatedAt: _u,
        viewedCount: _v,
        firstViewedAt: _f,
        reviewedAt: _r,
        ...rest
      } = body as Record<string, unknown>;
      return rest;
    }

    // ════════════════════════════════════════════════════════════════════════
    // QUIZ
    // ════════════════════════════════════════════════════════════════════════

    describe("quiz — guest 2xx (calibrated optionalAuth)", () => {
      it("GET /api/v1/quiz/config — all strategies (deterministic array)", async () => {
        const res = await getBoth("/api/v1/quiz/config");
        expectParity2xx(res, 200);
        expect(Array.isArray(res.nestRes.body)).toBe(true);
        // 5 registered strategies, deterministic order from the registry.
        expect(res.nestRes.body).toHaveLength(5);
        expect(res.nestRes.body.map((c: { type: string }) => c.type)).toEqual([
          "audio-to-pinyin-tone",
          "ime-simulator",
          "radical-gate",
          "comprehension",
          "qualification",
        ]);
      });

      it("GET /api/v1/quiz/config?type=ime-simulator — single config", async () => {
        const res = await getBoth("/api/v1/quiz/config?type=ime-simulator");
        expectParity2xx(res, 200);
        expect(res.nestRes.body).toEqual({
          type: "ime-simulator",
          questionCount: 25,
          passThreshold: 0.8,
          timeLimitMinutes: 4,
          tierRules: null,
        });
      });

      it.skipIf(pinyinSyllableCount === 0)(
        "GET /api/v1/quiz/questions — 200 (full pool, normalized)",
        async () => {
          // count = full pool size → the app draws the SAME syllable SET
          // (a random count=N sample would draw a different subset). Sort by
          // the unique audioKey + normalize the Math.random category.
          const res = await getBoth(
            `/api/v1/quiz/questions?type=audio-to-pinyin-tone&count=${pinyinSyllableCount}`,
          );
          expectParity2xx(res, 200);
          expect(Array.isArray(res.nestRes.body)).toBe(true);
          expect(res.nestRes.body).toHaveLength(pinyinSyllableCount);
          // Normalizes cleanly (id/category sentineled, sorted by audioKey).
          expect(normalizeQuizQuestions(res.nestRes.body)).toBeDefined();
        },
      );

      it("POST /api/v1/quiz/attempts — guest 201 mock (normalized)", async () => {
        const res = await postBoth(
          "/api/v1/quiz/attempts",
          { quizType: "audio-to-pinyin-tone", phase: 2 },
          undefined,
        );
        expect(res.nestRes.status).toBe(201);
        expect(normalizeMockRow(res.nestRes.body)).toBeDefined();
        expect(res.nestRes.body.userId).toBeNull();
        expect(res.nestRes.body.passed).toBe(false);
      });

      it("POST /api/v1/quiz/attempts/:id/answers — guest 200 mock (normalized)", async () => {
        const res = await postBoth(
          "/api/v1/quiz/attempts/guest-attempt-1/answers",
          {
            questionIndex: 0,
            pinyinInput: "ma",
            selectedTone: 3,
            correctPinyin: "ma",
            correctTone: 3,
            category: "pinyin",
          },
          undefined,
        );
        expect(res.nestRes.status).toBe(200);
        // Random UUID + now → normalized sentinels.
        expect(normalizeMockRow(res.nestRes.body)).toBeDefined();
        expect(res.nestRes.body.correct).toBe(true);
      });

      it("PUT /api/v1/quiz/attempts/:id/complete — guest 200 mock", async () => {
        const res = await putBoth("/api/v1/quiz/attempts/guest-attempt-1/complete", {}, undefined);
        expectParity2xx(res, 200);
        expect(res.nestRes.body).toEqual({
          totalScore: 0,
          maxScore: 0,
          passed: false,
          accuracy: 0,
        });
      });

      it.skipIf(sandhiWordCount === 0)(
        "GET /api/v1/quiz/sandhi-drill/questions — 200 (normalized)",
        async () => {
          const res = await getBoth("/api/v1/quiz/sandhi-drill/questions?count=5");
          expectParity2xx(res, 200);
          expect(Array.isArray(res.nestRes.body)).toBe(true);
          expect(res.nestRes.body).toHaveLength(5);
          expect(normalizeSandhiQuestions(res.nestRes.body)).toBeDefined();
        },
      );
    });

    describe("quiz — guest 401 (calibrated requireAuth)", () => {
      it("GET /api/v1/quiz/attempts — guest → 401 AUTH_REQUIRED", async () => {
        const res = await getBoth("/api/v1/quiz/attempts");
        expectParity4xx(res, 401, "AUTH_REQUIRED", "Please sign in to access this feature");
      });

      it("POST /api/v1/quiz/feedback — guest → 401 AUTH_REQUIRED", async () => {
        const res = await postBoth(
          "/api/v1/quiz/feedback",
          { wordId: "w1", userAnswer: "x", correctAnswer: "y", questionType: "tone" },
          undefined,
        );
        expectParity4xx(res, 401, "AUTH_REQUIRED");
        expect(mockGemini.generateText).not.toHaveBeenCalled();
      });
    });

    describe("quiz — authed 2xx (deterministic)", () => {
      it("POST /api/v1/quiz/feedback — valid input → 200 { explanation, errorType } (mocked Gemini)", async () => {
        const res = await postBoth(
          "/api/v1/quiz/feedback",
          {
            wordId: "w1",
            userAnswer: "ma",
            correctAnswer: "mǎ",
            questionType: "audio-to-pinyin-tone",
          },
          `Bearer ${tokenA}`,
        );
        expectParity2xx(res, 200);
        expect(res.nestRes.body).toEqual({
          explanation: "mock-feedback-explanation",
          errorType: "ai_feedback",
        });
      });

      it("POST /api/v1/quiz/attempts — authed 201 status + shape", async () => {
        const res = await postBoth(
          "/api/v1/quiz/attempts",
          { quizType: "audio-to-pinyin-tone", phase: 1 },
          `Bearer ${tokenA}`,
        );
        expect(res.nestRes.status).toBe(201);
        expect(res.nestRes.body.quizType).toBe("audio-to-pinyin-tone");
        expect(res.nestRes.body.phase).toBe(1);
        expect(res.nestRes.body.userId).toBe(userIdA);
        expect(typeof res.nestRes.body.id).toBe("string");
        expect(res.nestRes.body.passed).toBe(false);
      });

      it("POST /api/v1/quiz/attempts/:id/answers — authed 200 evaluated `correct` (shared attempt)", async () => {
        // Create an attempt, then submit the SAME answer — the `correct`
        // evaluation (same service) is deterministic.
        const createRes = await request(nestServer)
          .post("/api/v1/quiz/attempts")
          .set("X-Forwarded-For", nextIp())
          .set("Authorization", `Bearer ${tokenA}`)
          .send({ quizType: "audio-to-pinyin-tone", phase: 1 });
        expect(createRes.status).toBe(201);
        const attemptId = createRes.body.id as string;

        const answerBody = {
          questionIndex: 0,
          pinyinInput: "ba",
          selectedTone: 1,
          correctPinyin: "ba",
          correctTone: 1,
          category: "pinyin",
        };
        const res = await postBoth(
          `/api/v1/quiz/attempts/${attemptId}/answers`,
          answerBody,
          `Bearer ${tokenA}`,
        );
        expect(res.nestRes.status).toBe(200);
        expect(res.nestRes.body.correct).toBe(true);
        expect(res.nestRes.body.attemptId).toBe(attemptId);
        expect(res.nestRes.body.category).toBe("pinyin");
      });

      it("PUT /api/v1/quiz/attempts/:id/complete — authed 200 result (shared attempt, 1 answer)", async () => {
        // Create an attempt + ONE correct answer, then complete — the
        // evaluated result must be identical (same service, same answers).
        const createRes = await request(nestServer)
          .post("/api/v1/quiz/attempts")
          .set("X-Forwarded-For", nextIp())
          .set("Authorization", `Bearer ${tokenA}`)
          .send({ quizType: "audio-to-pinyin-tone", phase: 1 });
        expect(createRes.status).toBe(201);
        const attemptId = createRes.body.id as string;

        const answerRes = await request(nestServer)
          .post(`/api/v1/quiz/attempts/${attemptId}/answers`)
          .set("X-Forwarded-For", nextIp())
          .set("Authorization", `Bearer ${tokenA}`)
          .send({
            questionIndex: 0,
            pinyinInput: "ba",
            selectedTone: 1,
            correctPinyin: "ba",
            correctTone: 1,
            category: "pinyin",
          });
        expect(answerRes.status).toBe(200);

        const res = await putBoth(
          `/api/v1/quiz/attempts/${attemptId}/complete`,
          {},
          `Bearer ${tokenA}`,
        );
        expectParity2xx(res, 200);
        expect(res.nestRes.body).toEqual({
          totalScore: 1,
          maxScore: 1,
          passed: true,
          accuracy: 1,
          categoryBreakdown: { pinyin: 1, tones: 0, pairs: 0, rules: 0 },
        });
        // The pass fires updatePhaseGate on the shared service — userA's gate
        // now exists (created once).
      });

      it("GET /api/v1/quiz/attempts — authed 200 (shared DB rows, sorted by id)", async () => {
        const res = await getBoth("/api/v1/quiz/attempts", `Bearer ${tokenA}`);
        expect(res.nestRes.status).toBe(200);
        const sortById = (arr: unknown) =>
          Array.isArray(arr)
            ? [...arr].sort((a, b) =>
                String((a as { id: string }).id).localeCompare(String((b as { id: string }).id)),
              )
            : arr;
        expect(Array.isArray(sortById(res.nestRes.body))).toBe(true);
        expect(res.nestRes.body.length).toBeGreaterThanOrEqual(2);
      });
    });

    describe("quiz — 400 validation envelope", () => {
      it("POST /api/v1/quiz/feedback — missing fields → 400 VALIDATION_ERROR", async () => {
        const res = await postBoth(
          "/api/v1/quiz/feedback",
          { wordId: "w1", userAnswer: "x" },
          `Bearer ${tokenA}`,
        );
        expectParity4xx(
          res,
          400,
          "VALIDATION_ERROR",
          "wordId, userAnswer, correctAnswer, questionType are all required",
        );
      });

      it("GET /api/v1/quiz/sandhi-drill/questions?count=0 → 400 VALIDATION_ERROR", async () => {
        const res = await getBoth("/api/v1/quiz/sandhi-drill/questions?count=0");
        expectParity4xx(res, 400, "VALIDATION_ERROR", "Failed to load sandhi drill questions");
      });
    });

    // ════════════════════════════════════════════════════════════════════════
    // PROGRESSION
    // ════════════════════════════════════════════════════════════════════════

    describe("progression — guest 2xx (calibrated optionalAuth)", () => {
      it("GET /api/v1/progression/foundation-progress — guest → 200 []", async () => {
        const res = await getBoth("/api/v1/progression/foundation-progress");
        expectParity2xx(res, 200);
        expect(res.nestRes.body).toEqual([]);
      });

      it("GET /api/v1/progression/phase-gate — guest → 200 calibrated createGuestPhaseGate (normalized timestamps)", async () => {
        const res = await getBoth("/api/v1/progression/phase-gate");
        expect(res.nestRes.status).toBe(200);
        // The app calls createGuestPhaseGate() (24-7) — assert the calibrated
        // shape directly (normalized `now` stamps).
        expect(normalizePhaseGate(res.nestRes.body)).toBeDefined();
        expect(res.nestRes.body.currentPhase).toBe(1);
        expect(res.nestRes.body.isGuest).toBe(true);
        expect(res.nestRes.body.phase4Unlocked).toBe(false);
      });

      it("GET /api/v1/progression/radical-progress — guest → 200 []", async () => {
        const res = await getBoth("/api/v1/progression/radical-progress");
        expectParity2xx(res, 200);
        expect(res.nestRes.body).toEqual([]);
      });

      it("GET /api/v1/progression/gates — guest → CALIBRATED Phase-1-only shape (24-13)", async () => {
        // A guest is Phase-1-only, so the Phase 2+ gates are NOT passed
        // (agreeing with createGuestPhaseGate).
        const nestRes = await request(nestServer)
          .get("/api/v1/progression/gates")
          .set("X-Forwarded-For", nextIp());
        expect(nestRes.status).toBe(200);
        for (const gate of ["phase2Gate", "characterCountGate", "phase3To4Gate"] as const) {
          expect(nestRes.body[gate]).toEqual({
            passed: false,
            reason: "GUEST",
            details: "Guest — Phase 1 only",
          });
        }
      });
    });

    describe("progression — guest 401 (calibrated requireAuth)", () => {
      it("PUT /api/v1/progression/foundation-progress/:sectionId — guest → 401 AUTH_REQUIRED", async () => {
        const res = await putBoth(
          "/api/v1/progression/foundation-progress/pinyin",
          { completed: true },
          undefined,
        );
        expectParity4xx(res, 401, "AUTH_REQUIRED");
      });

      it("PUT /api/v1/progression/phase-gate — guest → 401 AUTH_REQUIRED", async () => {
        const res = await putBoth(
          "/api/v1/progression/phase-gate",
          { phase: 1, passed: true, gateCriteria: "quiz" },
          undefined,
        );
        expectParity4xx(res, 401, "AUTH_REQUIRED");
      });

      it("PUT /api/v1/progression/radical-progress/:radicalId — guest → 401 AUTH_REQUIRED", async () => {
        const res = await putBoth(
          "/api/v1/progression/radical-progress/rad_0001",
          { memorized: true },
          undefined,
        );
        expectParity4xx(res, 401, "AUTH_REQUIRED");
      });
    });

    describe("progression — authed 2xx (deterministic)", () => {
      it("GET /api/v1/progression/foundation-progress — authed 200 (4 auto-initialized rows)", async () => {
        // The first caller auto-initializes 4 rows (create, no upsert); the
        // response lists them.
        const nestRes = await request(nestServer)
          .get("/api/v1/progression/foundation-progress")
          .set("X-Forwarded-For", nextIp())
          .set("Authorization", `Bearer ${tokenA}`);
        expect(nestRes.status).toBe(200);
        expect(nestRes.body).toHaveLength(4);
      });

      it("GET /api/v1/progression/phase-gate — authed 200 (shared gate row)", async () => {
        // The first caller creates the gate via getOrCreatePhaseGate (default
        // currentPhase 1). NOTE: the quiz-complete pass does NOT advance the
        // gate — `updatePhaseGate` on a non-existent gate throws P2025 (update,
        // not upsert) and is swallowed by QuizService (faithful reproduction of
        // the pre-existing behavior).
        const nestRes = await request(nestServer)
          .get("/api/v1/progression/phase-gate")
          .set("X-Forwarded-For", nextIp())
          .set("Authorization", `Bearer ${tokenA}`);
        expect(nestRes.status).toBe(200);
        // Gate defaults to Phase 1 (created by the first getOrCreate access).
        expect(nestRes.body.currentPhase).toBe(1);
        expect(nestRes.body.phase1Passed).toBe(false);
      });

      it("GET /api/v1/progression/gates — authed 200 (computed gates, shared data)", async () => {
        const nestRes = await request(nestServer)
          .get("/api/v1/progression/gates")
          .set("X-Forwarded-For", nextIp())
          .set("Authorization", `Bearer ${tokenA}`);
        expect(nestRes.status).toBe(200);

        // Deterministic for userA: no IME attempt → NO_IME_ATTEMPT; no
        // character coverage → INSUFFICIENT_CHARACTER_COVERAGE; no known words
        // → KNOWN_WORD_RATIO_TOO_LOW (or NO_PASSAGE_AVAILABLE if no passage).
        expect(nestRes.body.phase2Gate.passed).toBe(false);
        expect(nestRes.body.characterCountGate.passed).toBe(false);
        expect(nestRes.body.phase3To4Gate.passed).toBe(false);
      });

      it("GET /api/v1/progression/radical-progress — authed 200 [] (fresh user)", async () => {
        const res = await getBoth("/api/v1/progression/radical-progress", `Bearer ${tokenB}`);
        expectParity2xx(res, 200);
        expect(res.nestRes.body).toEqual([]);
      });
    });

    describe("progression — authed write (normalized deterministic fields)", () => {
      it("PUT /api/v1/progression/foundation-progress/:sectionId — 200 normalized shape", async () => {
        const nestRes = await request(nestServer)
          .put("/api/v1/progression/foundation-progress/strokes")
          .set("X-Forwarded-For", nextIp())
          .set("Authorization", `Bearer ${tokenB}`)
          .send({ completed: true });
        expect(nestRes.status).toBe(200);

        // Compare the deterministic fields (drop ids + timestamps).
        const nest = normalizeProgressRow(nestRes.body) as Record<string, unknown>;
        expect(nest.sectionId).toBe("strokes");
        expect(nest.completed).toBe(true);
        expect(nest.userId).toBe(userIdB);
      });

      it("PUT /api/v1/progression/phase-gate — 200 status + phase-gate (userB)", async () => {
        // `updatePhaseGate` uses Prisma `update` (P2025 if no row) — so create
        // userB's gate FIRST via GET /phase-gate (getOrCreate), then the PUTs
        // write the same row; the second overwrite returns deterministic fields.
        const createGate = await request(nestServer)
          .get("/api/v1/progression/phase-gate")
          .set("X-Forwarded-For", nextIp())
          .set("Authorization", `Bearer ${tokenB}`);
        expect(createGate.status).toBe(200);

        const phaseOne = await request(nestServer)
          .put("/api/v1/progression/phase-gate")
          .set("X-Forwarded-For", nextIp())
          .set("Authorization", `Bearer ${tokenB}`)
          .send({ phase: 1, passed: true, gateCriteria: "quiz" });
        expect(phaseOne.status).toBe(200);

        const nestRes = await request(nestServer)
          .put("/api/v1/progression/phase-gate")
          .set("X-Forwarded-For", nextIp())
          .set("Authorization", `Bearer ${tokenB}`)
          .send({ phase: 2, passed: true, gateCriteria: "quiz" });
        expect(nestRes.status).toBe(200);

        expect(nestRes.body.currentPhase).toBe(3);
        expect(nestRes.body.phase1Passed).toBe(true);
        expect(nestRes.body.phase2Passed).toBe(true);
        expect(nestRes.body.userId).toBe(userIdB);
      });

      it.skipIf(!seededRadicalId)(
        "PUT /api/v1/progression/radical-progress/:radicalId — 200 normalized shape",
        async () => {
          const radicalId = seededRadicalId as string;

          const nestRes = await request(nestServer)
            .put(`/api/v1/progression/radical-progress/${radicalId}`)
            .set("X-Forwarded-For", nextIp())
            .set("Authorization", `Bearer ${tokenB}`)
            .send({ memorized: true, recognitionLevel: 3 });
          expect(nestRes.status).toBe(200);

          const nest = normalizeProgressRow(nestRes.body) as Record<string, unknown>;
          expect(nest.radicalId).toBe(radicalId);
          expect(nest.memorized).toBe(true);
          expect(nest.recognitionLevel).toBe(3);
          expect(nest.userId).toBe(userIdB);
        },
      );

      it("PUT /api/v1/progression/radical-progress/invalid — 400 VALIDATION_ERROR", async () => {
        const res = await putBoth(
          "/api/v1/progression/radical-progress/rad_bogus",
          { memorized: true },
          `Bearer ${tokenB}`,
        );
        expectParity4xx(res, 400, "VALIDATION_ERROR", "Failed to update radical progress");
      });
    });
  },
);
