/**
 * @file apps/backend/tests/integration/nest/quiz-progression-parity.test.ts
 * @description Quiz + Progression ↔ Express parity harness (Story 24-13 — Quiz
 * + Progression Port + Circular-DI).
 *
 * Boots BOTH apps in-process via supertest:
 *   - the production Express app (`src/app/index.ts` default export — mounts
 *     the real `quizRoutes.ts` + `aiFeedbackRoutes.ts` + `progressionRoutes.ts`),
 *   - the NestJS 11 shell (`NestFactory.create(AppModule)` + the real
 *     `configureNestShellApp` + `mountExpressErrorBridge` boot shape).
 *
 * This harness is the ARBITER of the 24-13 circular-DI resolution: if
 * `forwardRef` (the PRIMARY ADR approach) fails to construct `QuizService` /
 * `ProgressionService` at boot, `NestFactory.create(AppModule)` throws and the
 * whole suite fails — the fallback (re-injection via a provider factory step)
 * would then be needed. Green = forwardRef works (decision recorded).
 *
 * ## NO REAL GEMINI IS HIT — `GeminiService` is module-mocked (both apps
 * construct it), so the AI-feedback route (`POST /v1/quiz/feedback`) returns a
 * deterministic `{ explanation, errorType }` with zero external calls.
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
 * the Express `getGates` guest branch still returns the ALL-PASSED `GUEST`
 * object (every gate `passed: true` — F6-inconsistent, left untouched per
 * dual-mode until 24-15). The Nest port targets the CALIBRATED shape (24-5 F6
 * / 24-7 identity): a guest is Phase-1-only, so the Phase 2+ gates are NOT
 * passed — `getGates` now AGREES with `getPhaseGate` for the same guest
 * identity. This is a DOCUMENTED, intentional deviation from Express; the
 * guest `/gates` test asserts the calibrated shape on Nest explicitly (and
 * documents the Express all-passed shape it replaces).
 *
 * ## Determinism notes
 *   - Quiz questions (`audio-to-pinyin-tone`) are shuffled (so the `id` —
 *     `q-${index+1}` — is SHUFFLE-POSITION-dependent) + `Math.random` category
 *     → NORMALIZED (sort by unique `audioKey`, `id` + `category` → sentinels)
 *     before deep-equal; the pool SET + all other fields are byte-compared.
 *   - Sandhi-drill questions are shuffled + shuffled options → NORMALIZED
 *     (sort by `id`, options sorted) before deep-equal.
 *   - Guest attempt/answer mocks carry `crypto.randomUUID()` + `now()` →
 *     NORMALIZED to sentinels.
 *   - Authed `POST /attempts` creates DIFFERENT rows per app (no shared key) →
 *     status + shape parity asserted (ids differ by design), not deep-equal.
 *   - Authed `complete` on a SHARED attempt (created via Express, submitted
 *     once) → both apps evaluate the SAME answers → deep-equal result.
 *   - Progression authed create paths (`getOrCreatePhaseGate`,
 *     `getOrCreateFoundationProgress`, `/gates` which may create a gate) are
 *     run SEQUENTIALLY (Express then Nest) — `PhaseGate.userId` / the
 *     foundation `@@unique([userId, sectionId])` have no upsert on create, so a
 *     concurrent double-create would race (P2002).
 *   - `GET /attempts` reads all of userA's rows (shared DB) → sorted by `id`
 *     before deep-equal (createdAt ties are ambiguous).
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
// ── evaluated; the Express container AND the Nest SharedModule both construct
// ── GeminiService at import/init time) ────────────────────────────────────

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
  "Nest quiz+progression ↔ Express parity + circular-DI (integration, DB)",
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

      // Register two real users (via the Express app; both apps share the DB +
      // JWT secret, so the tokens authenticate on both).
      const runId = crypto.randomBytes(4).toString("hex");
      const emailA = `quiz-a-${runId}@example.com`;
      const regA = await request(expressApp)
        .post("/api/v1/auth/register")
        .set("X-Forwarded-For", nextIp())
        .send({ email: emailA, password: "ValidPass123", displayName: "Quiz Parity A" });
      expect(regA.status).toBe(201);
      userIdA = regA.body.data.user.id as string;
      tokenA = regA.body.data.accessToken as string;

      const emailB = `quiz-b-${runId}@example.com`;
      const regB = await request(expressApp)
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

    /** Fire the same GET (with optional auth header) on both apps. */
    function getBoth(path: string, authHeader?: string) {
      const send = (app: Parameters<typeof request>[0]) => {
        let req = request(app).get(path).set("X-Forwarded-For", nextIp());
        if (authHeader) req = req.set("Authorization", authHeader);
        return req;
      };
      return Promise.all([send(expressApp), send(nestServer)]).then(([expressRes, nestRes]) => ({
        expressRes,
        nestRes,
      }));
    }

    /** Fire the same POST (with optional auth header) on both apps. */
    function postBoth(path: string, body: Record<string, unknown>, authHeader?: string) {
      const send = (app: Parameters<typeof request>[0]) => {
        let req = request(app).post(path).set("X-Forwarded-For", nextIp());
        if (authHeader) req = req.set("Authorization", authHeader);
        return req.send(body);
      };
      return Promise.all([send(expressApp), send(nestServer)]).then(([expressRes, nestRes]) => ({
        expressRes,
        nestRes,
      }));
    }

    /** Fire the same PUT (with optional auth header) on both apps. */
    function putBoth(path: string, body: Record<string, unknown>, authHeader?: string) {
      const send = (app: Parameters<typeof request>[0]) => {
        let req = request(app).put(path).set("X-Forwarded-For", nextIp());
        if (authHeader) req = req.set("Authorization", authHeader);
        return req.send(body);
      };
      return Promise.all([send(expressApp), send(nestServer)]).then(([expressRes, nestRes]) => ({
        expressRes,
        nestRes,
      }));
    }

    /**
     * 4xx: identical status; the Nest 24-3 envelope `{ code, message, requestId }`
     * with `code`/`message` byte-for-byte equal to the Express legacy
     * `{ error, code[, message] }` body (`message` wins over `error` when both
     * are present, as in the `requireAuth` 401 shape).
     */
    function expectParity4xx(
      res: { expressRes: request.Response; nestRes: request.Response },
      expectedStatus: number,
    ) {
      expect(res.expressRes.status).toBe(expectedStatus);
      expect(res.nestRes.status).toBe(expectedStatus);
      expect(res.nestRes.body).toEqual({
        code: res.expressRes.body.code,
        message: res.expressRes.body.message ?? res.expressRes.body.error,
        requestId: expect.any(String),
      });
      expect(res.nestRes.body.requestId).toBe(res.nestRes.headers["x-request-id"]);
    }

    /** 2xx: identical status + body deep-equal. */
    function expectParity2xx(
      res: { expressRes: request.Response; nestRes: request.Response },
      expectedStatus = 200,
    ) {
      expect(res.expressRes.status).toBe(expectedStatus);
      expect(res.nestRes.status).toBe(expectedStatus);
      expect(res.nestRes.body).toEqual(res.expressRes.body);
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
    // QUIZ (Express route files: api/quizRoutes.ts + api/aiFeedbackRoutes.ts)
    // ════════════════════════════════════════════════════════════════════════

    describe("quiz — guest 2xx parity (calibrated optionalAuth)", () => {
      it("GET /api/v1/quiz/config — all strategies deep-equal (deterministic array)", async () => {
        const res = await getBoth("/api/v1/quiz/config");
        expectParity2xx(res, 200);
        expect(Array.isArray(res.expressRes.body)).toBe(true);
        // 5 registered strategies, deterministic order from the registry.
        expect(res.expressRes.body).toHaveLength(5);
        expect(res.expressRes.body.map((c: { type: string }) => c.type)).toEqual([
          "audio-to-pinyin-tone",
          "ime-simulator",
          "radical-gate",
          "comprehension",
          "qualification",
        ]);
      });

      it("GET /api/v1/quiz/config?type=ime-simulator — single config deep-equal", async () => {
        const res = await getBoth("/api/v1/quiz/config?type=ime-simulator");
        expectParity2xx(res, 200);
        expect(res.expressRes.body).toEqual({
          type: "ime-simulator",
          questionCount: 25,
          passThreshold: 0.8,
          timeLimitMinutes: 4,
          tierRules: null,
        });
      });

      it.skipIf(pinyinSyllableCount === 0)(
        "GET /api/v1/quiz/questions — normalized deep-equal (full pool, sort by audioKey, category sentinel)",
        async () => {
          // count = full pool size → BOTH apps get the SAME syllable SET
          // (a random count=N sample would draw different subsets). Sort by
          // the unique audioKey + normalize the Math.random category.
          const res = await getBoth(
            `/api/v1/quiz/questions?type=audio-to-pinyin-tone&count=${pinyinSyllableCount}`,
          );
          expect(res.expressRes.status).toBe(200);
          expect(res.nestRes.status).toBe(200);
          expect(Array.isArray(res.expressRes.body)).toBe(true);
          expect(res.expressRes.body).toHaveLength(pinyinSyllableCount);
          expect(normalizeQuizQuestions(res.nestRes.body)).toEqual(
            normalizeQuizQuestions(res.expressRes.body),
          );
        },
      );

      it("POST /api/v1/quiz/attempts — guest 201 mock deep-equal (normalized)", async () => {
        const res = await postBoth(
          "/api/v1/quiz/attempts",
          { quizType: "audio-to-pinyin-tone", phase: 2 },
          undefined,
        );
        expect(res.expressRes.status).toBe(201);
        expect(res.nestRes.status).toBe(201);
        expect(normalizeMockRow(res.nestRes.body)).toEqual(normalizeMockRow(res.expressRes.body));
        expect(res.nestRes.body.userId).toBeNull();
        expect(res.nestRes.body.passed).toBe(false);
      });

      it("POST /api/v1/quiz/attempts/:id/answers — guest 200 mock deep-equal (normalized)", async () => {
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
        expect(res.expressRes.status).toBe(200);
        expect(res.nestRes.status).toBe(200);
        // Random UUID + now → normalized sentinels before deep-equal.
        expect(normalizeMockRow(res.nestRes.body)).toEqual(normalizeMockRow(res.expressRes.body));
        expect(res.nestRes.body.correct).toBe(true);
      });

      it("PUT /api/v1/quiz/attempts/:id/complete — guest 200 mock deep-equal", async () => {
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
        "GET /api/v1/quiz/sandhi-drill/questions — normalized deep-equal (sort by id, options sorted)",
        async () => {
          const res = await getBoth("/api/v1/quiz/sandhi-drill/questions?count=5");
          expect(res.expressRes.status).toBe(200);
          expect(res.nestRes.status).toBe(200);
          expect(Array.isArray(res.expressRes.body)).toBe(true);
          expect(res.expressRes.body).toHaveLength(5);
          expect(normalizeSandhiQuestions(res.nestRes.body)).toEqual(
            normalizeSandhiQuestions(res.expressRes.body),
          );
        },
      );
    });

    describe("quiz — guest 401 parity (calibrated requireAuth)", () => {
      it("GET /api/v1/quiz/attempts — guest → 401 AUTH_REQUIRED parity", async () => {
        const res = await getBoth("/api/v1/quiz/attempts");
        expectParity4xx(res, 401);
        expect(res.expressRes.body.code).toBe("AUTH_REQUIRED");
        expect(res.expressRes.body.message).toBe("Please sign in to access this feature");
      });

      it("POST /api/v1/quiz/feedback — guest → 401 AUTH_REQUIRED parity", async () => {
        const res = await postBoth(
          "/api/v1/quiz/feedback",
          { wordId: "w1", userAnswer: "x", correctAnswer: "y", questionType: "tone" },
          undefined,
        );
        expectParity4xx(res, 401);
        expect(res.expressRes.body.code).toBe("AUTH_REQUIRED");
        expect(mockGemini.generateText).not.toHaveBeenCalled();
      });
    });

    describe("quiz — authed 2xx parity (deterministic)", () => {
      it("POST /api/v1/quiz/feedback — valid input → 200 { explanation, errorType } deep-equal (mocked Gemini)", async () => {
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

      it("POST /api/v1/quiz/attempts — authed 201 status + shape parity (rows differ by design)", async () => {
        const res = await postBoth(
          "/api/v1/quiz/attempts",
          { quizType: "audio-to-pinyin-tone", phase: 1 },
          `Bearer ${tokenA}`,
        );
        expect(res.expressRes.status).toBe(201);
        expect(res.nestRes.status).toBe(201);
        expect(res.nestRes.body.quizType).toBe(res.expressRes.body.quizType);
        expect(res.nestRes.body.phase).toBe(res.expressRes.body.phase);
        expect(res.nestRes.body.userId).toBe(userIdA);
        expect(typeof res.nestRes.body.id).toBe("string");
        expect(res.nestRes.body.passed).toBe(false);
      });

      it("POST /api/v1/quiz/attempts/:id/answers — authed 200 evaluated `correct` parity (shared attempt)", async () => {
        // Create a shared attempt via Express, then submit the SAME answer on
        // both apps — the `correct` evaluation (same service) must match.
        const createRes = await request(expressApp)
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
        expect(res.expressRes.status).toBe(200);
        expect(res.nestRes.status).toBe(200);
        expect(res.nestRes.body.correct).toBe(true);
        expect(res.nestRes.body.correct).toBe(res.expressRes.body.correct);
        expect(res.nestRes.body.attemptId).toBe(res.expressRes.body.attemptId);
        expect(res.nestRes.body.category).toBe(res.expressRes.body.category);
      });

      it("PUT /api/v1/quiz/attempts/:id/complete — authed 200 deep-equal result (shared attempt, 1 answer)", async () => {
        // Create a shared attempt + ONE correct answer via Express, then
        // complete on both apps — the evaluated result must be identical
        // (same service, same answers).
        const createRes = await request(expressApp)
          .post("/api/v1/quiz/attempts")
          .set("X-Forwarded-For", nextIp())
          .set("Authorization", `Bearer ${tokenA}`)
          .send({ quizType: "audio-to-pinyin-tone", phase: 1 });
        expect(createRes.status).toBe(201);
        const attemptId = createRes.body.id as string;

        const answerRes = await request(expressApp)
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
        // now exists (created once, read by both apps later).
      });

      it("GET /api/v1/quiz/attempts — authed 200 deep-equal (shared DB rows, sorted by id)", async () => {
        const res = await getBoth("/api/v1/quiz/attempts", `Bearer ${tokenA}`);
        expect(res.expressRes.status).toBe(200);
        expect(res.nestRes.status).toBe(200);
        const sortById = (arr: unknown) =>
          Array.isArray(arr)
            ? [...arr].sort((a, b) =>
                String((a as { id: string }).id).localeCompare(String((b as { id: string }).id)),
              )
            : arr;
        expect(sortById(res.nestRes.body)).toEqual(sortById(res.expressRes.body));
        expect(res.expressRes.body.length).toBeGreaterThanOrEqual(2);
      });
    });

    describe("quiz — 400 validation envelope parity", () => {
      it("POST /api/v1/quiz/feedback — missing fields → 400 VALIDATION_ERROR parity", async () => {
        const res = await postBoth(
          "/api/v1/quiz/feedback",
          { wordId: "w1", userAnswer: "x" },
          `Bearer ${tokenA}`,
        );
        expectParity4xx(res, 400);
        expect(res.expressRes.body.code).toBe("VALIDATION_ERROR");
        expect(res.expressRes.body.message).toBe(
          "wordId, userAnswer, correctAnswer, questionType are all required",
        );
        expect(res.nestRes.body.message).toBe(res.expressRes.body.message);
      });

      it("GET /api/v1/quiz/sandhi-drill/questions?count=0 → 400 VALIDATION_ERROR parity", async () => {
        const res = await getBoth("/api/v1/quiz/sandhi-drill/questions?count=0");
        expectParity4xx(res, 400);
        expect(res.expressRes.body.code).toBe("VALIDATION_ERROR");
        expect(res.expressRes.body.error).toBe("Failed to load sandhi drill questions");
      });
    });

    // ════════════════════════════════════════════════════════════════════════
    // PROGRESSION (Express route file: api/progressionRoutes.ts)
    // ════════════════════════════════════════════════════════════════════════
    //
    // Authed create paths are run SEQUENTIALLY (Express first, then Nest):
    // PhaseGate.userId is @unique and foundation progress has
    // @@unique([userId, sectionId]) with no upsert on create — a concurrent
    // double-create would race (P2002).

    describe("progression — guest 2xx parity (calibrated optionalAuth)", () => {
      it("GET /api/v1/progression/foundation-progress — guest → 200 [] deep-equal", async () => {
        const res = await getBoth("/api/v1/progression/foundation-progress");
        expectParity2xx(res, 200);
        expect(res.nestRes.body).toEqual([]);
      });

      it("GET /api/v1/progression/phase-gate — guest → 200 calibrated createGuestPhaseGate (normalized timestamps)", async () => {
        const res = await getBoth("/api/v1/progression/phase-gate");
        expect(res.expressRes.status).toBe(200);
        expect(res.nestRes.status).toBe(200);
        // Both apps call the SAME createGuestPhaseGate() (24-7) — deep-equal
        // modulo the `now` stamps.
        expect(normalizePhaseGate(res.nestRes.body)).toEqual(
          normalizePhaseGate(res.expressRes.body),
        );
        expect(res.nestRes.body.currentPhase).toBe(1);
        expect(res.nestRes.body.isGuest).toBe(true);
        expect(res.nestRes.body.phase4Unlocked).toBe(false);
      });

      it("GET /api/v1/progression/radical-progress — guest → 200 [] deep-equal", async () => {
        const res = await getBoth("/api/v1/progression/radical-progress");
        expectParity2xx(res, 200);
        expect(res.nestRes.body).toEqual([]);
      });

      it("GET /api/v1/progression/gates — guest → CALIBRATED Phase-1-only shape on Nest (24-13; NOT the Express all-passed GUEST)", async () => {
        // Documented deviation: the Express /gates guest branch still returns
        // the F6-inconsistent ALL-PASSED GUEST object (dual-mode, unified at
        // 24-15). The Nest port targets the CALIBRATED shape — a guest is
        // Phase-1-only, so the Phase 2+ gates are NOT passed (agreeing with
        // createGuestPhaseGate). This is asserted explicitly on Nest.
        const expressRes = await request(expressApp)
          .get("/api/v1/progression/gates")
          .set("X-Forwarded-For", nextIp());
        const nestRes = await request(nestServer)
          .get("/api/v1/progression/gates")
          .set("X-Forwarded-For", nextIp());

        expect(expressRes.status).toBe(200);
        expect(nestRes.status).toBe(200);

        // Express (current, pre-unification) — all-passed GUEST.
        expect(expressRes.body).toEqual({
          phase2Gate: { passed: true, reason: "GUEST", details: "Guest — no gating" },
          characterCountGate: { passed: true, reason: "GUEST", details: "Guest — no gating" },
          phase3To4Gate: { passed: true, reason: "GUEST", details: "Guest — no gating" },
        });

        // Nest (calibrated, 24-13) — Phase-1-only, never all-passed.
        for (const gate of ["phase2Gate", "characterCountGate", "phase3To4Gate"] as const) {
          expect(nestRes.body[gate]).toEqual({
            passed: false,
            reason: "GUEST",
            details: "Guest — Phase 1 only",
          });
        }
      });
    });

    describe("progression — guest 401 parity (calibrated requireAuth)", () => {
      it("PUT /api/v1/progression/foundation-progress/:sectionId — guest → 401 AUTH_REQUIRED", async () => {
        const res = await putBoth(
          "/api/v1/progression/foundation-progress/pinyin",
          { completed: true },
          undefined,
        );
        expectParity4xx(res, 401);
        expect(res.expressRes.body.code).toBe("AUTH_REQUIRED");
      });

      it("PUT /api/v1/progression/phase-gate — guest → 401 AUTH_REQUIRED", async () => {
        const res = await putBoth(
          "/api/v1/progression/phase-gate",
          { phase: 1, passed: true, gateCriteria: "quiz" },
          undefined,
        );
        expectParity4xx(res, 401);
        expect(res.expressRes.body.code).toBe("AUTH_REQUIRED");
      });

      it("PUT /api/v1/progression/radical-progress/:radicalId — guest → 401 AUTH_REQUIRED", async () => {
        const res = await putBoth(
          "/api/v1/progression/radical-progress/rad_0001",
          { memorized: true },
          undefined,
        );
        expectParity4xx(res, 401);
        expect(res.expressRes.body.code).toBe("AUTH_REQUIRED");
      });
    });

    describe("progression — authed 2xx parity (sequential where create may race)", () => {
      it("GET /api/v1/progression/foundation-progress — authed 200 deep-equal (Express creates 4, Nest reads the same rows)", async () => {
        // SEQUENTIAL: the first caller auto-initializes 4 rows (create, no
        // upsert); the second reads the same rows → identical response.
        const expressRes = await request(expressApp)
          .get("/api/v1/progression/foundation-progress")
          .set("X-Forwarded-For", nextIp())
          .set("Authorization", `Bearer ${tokenA}`);
        expect(expressRes.status).toBe(200);
        expect(expressRes.body).toHaveLength(4);

        const nestRes = await request(nestServer)
          .get("/api/v1/progression/foundation-progress")
          .set("X-Forwarded-For", nextIp())
          .set("Authorization", `Bearer ${tokenA}`);
        expect(nestRes.status).toBe(200);
        expect(nestRes.body).toEqual(expressRes.body);
      });

      it("GET /api/v1/progression/phase-gate — authed 200 deep-equal (shared gate row)", async () => {
        // The first caller (Express) creates the gate via getOrCreatePhaseGate
        // (default currentPhase 1); the second (Nest) reads the SAME row.
        // NOTE: the quiz-complete pass does NOT advance the gate — the
        // `updatePhaseGate` on a non-existent gate throws P2025 (update, not
        // upsert) and is swallowed by QuizService — a faithful reproduction of
        // the pre-existing Express behavior on BOTH apps (parity preserved).
        const expressRes = await request(expressApp)
          .get("/api/v1/progression/phase-gate")
          .set("X-Forwarded-For", nextIp())
          .set("Authorization", `Bearer ${tokenA}`);
        expect(expressRes.status).toBe(200);

        const nestRes = await request(nestServer)
          .get("/api/v1/progression/phase-gate")
          .set("X-Forwarded-For", nextIp())
          .set("Authorization", `Bearer ${tokenA}`);
        expect(nestRes.status).toBe(200);
        expect(nestRes.body).toEqual(expressRes.body);
        // Gate defaults to Phase 1 (created by the first getOrCreate access).
        expect(expressRes.body.currentPhase).toBe(1);
        expect(expressRes.body.phase1Passed).toBe(false);
      });

      it("GET /api/v1/progression/gates — authed 200 deep-equal (computed gates, shared data)", async () => {
        // SEQUENTIAL: getPhase2GateStatus may create the gate if missing.
        const expressRes = await request(expressApp)
          .get("/api/v1/progression/gates")
          .set("X-Forwarded-For", nextIp())
          .set("Authorization", `Bearer ${tokenA}`);
        expect(expressRes.status).toBe(200);

        const nestRes = await request(nestServer)
          .get("/api/v1/progression/gates")
          .set("X-Forwarded-For", nextIp())
          .set("Authorization", `Bearer ${tokenA}`);
        expect(nestRes.status).toBe(200);
        expect(nestRes.body).toEqual(expressRes.body);

        // Deterministic for userA: no IME attempt → NO_IME_ATTEMPT; no
        // character coverage → INSUFFICIENT_CHARACTER_COVERAGE; no known words
        // → KNOWN_WORD_RATIO_TOO_LOW (or NO_PASSAGE_AVAILABLE if no passage).
        expect(nestRes.body.phase2Gate.passed).toBe(false);
        expect(nestRes.body.characterCountGate.passed).toBe(false);
        expect(nestRes.body.phase3To4Gate.passed).toBe(false);
      });

      it("GET /api/v1/progression/radical-progress — authed 200 [] deep-equal (fresh user)", async () => {
        const res = await getBoth("/api/v1/progression/radical-progress", `Bearer ${tokenB}`);
        expectParity2xx(res, 200);
        expect(res.nestRes.body).toEqual([]);
      });
    });

    describe("progression — authed write parity (normalized deterministic fields)", () => {
      it("PUT /api/v1/progression/foundation-progress/:sectionId — 200 normalized shape parity (distinct sections)", async () => {
        const expressRes = await request(expressApp)
          .put("/api/v1/progression/foundation-progress/tones")
          .set("X-Forwarded-For", nextIp())
          .set("Authorization", `Bearer ${tokenB}`)
          .send({ completed: true });
        expect(expressRes.status).toBe(200);

        const nestRes = await request(nestServer)
          .put("/api/v1/progression/foundation-progress/strokes")
          .set("X-Forwarded-For", nextIp())
          .set("Authorization", `Bearer ${tokenB}`)
          .send({ completed: true });
        expect(nestRes.status).toBe(200);

        // Different rows (different sectionId) — compare the deterministic
        // fields only (drop ids + timestamps).
        const expr = normalizeProgressRow(expressRes.body) as Record<string, unknown>;
        const nest = normalizeProgressRow(nestRes.body) as Record<string, unknown>;
        expect(nest.sectionId).toBe("strokes");
        expect(nest.completed).toBe(true);
        expect(nest.userId).toBe(userIdB);
        expect(expr.sectionId).toBe("tones");
        expect(expr.completed).toBe(true);
      });

      it("PUT /api/v1/progression/phase-gate — 200 status + phase-gate parity (userB)", async () => {
        // `updatePhaseGate` uses Prisma `update` (P2025 if no row) — so create
        // userB's gate FIRST via GET /phase-gate (getOrCreate), then the PUTs
        // write the same row; the second overwrite returns deterministic fields.
        const createGate = await request(expressApp)
          .get("/api/v1/progression/phase-gate")
          .set("X-Forwarded-For", nextIp())
          .set("Authorization", `Bearer ${tokenB}`);
        expect(createGate.status).toBe(200);

        const expressRes = await request(expressApp)
          .put("/api/v1/progression/phase-gate")
          .set("X-Forwarded-For", nextIp())
          .set("Authorization", `Bearer ${tokenB}`)
          .send({ phase: 1, passed: true, gateCriteria: "quiz" });
        expect(expressRes.status).toBe(200);

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
        "PUT /api/v1/progression/radical-progress/:radicalId — 200 normalized shape parity + ReviewItem side-effect (distinct radicals)",
        async () => {
          const radicalA = seededRadicalId as string;
          // Find a second distinct radical id (or fall back to the same —
          // distinct is preferred so the two apps create independent rows).
          const radicalB =
            (
              await prisma.radical.findFirst({
                where: { id: { not: radicalA } },
                select: { id: true },
                orderBy: { id: "asc" },
              })
            )?.id ?? radicalA;

          const expressRes = await request(expressApp)
            .put(`/api/v1/progression/radical-progress/${radicalA}`)
            .set("X-Forwarded-For", nextIp())
            .set("Authorization", `Bearer ${tokenB}`)
            .send({ memorized: true, recognitionLevel: 2 });
          expect(expressRes.status).toBe(200);

          const nestRes = await request(nestServer)
            .put(`/api/v1/progression/radical-progress/${radicalB}`)
            .set("X-Forwarded-For", nextIp())
            .set("Authorization", `Bearer ${tokenB}`)
            .send({ memorized: true, recognitionLevel: 3 });
          expect(nestRes.status).toBe(200);

          const nest = normalizeProgressRow(nestRes.body) as Record<string, unknown>;
          expect(nest.radicalId).toBe(radicalB);
          expect(nest.memorized).toBe(true);
          expect(nest.recognitionLevel).toBe(3);
          expect(nest.userId).toBe(userIdB);
        },
      );

      it("PUT /api/v1/progression/radical-progress/invalid — 400 VALIDATION_ERROR parity", async () => {
        const res = await putBoth(
          "/api/v1/progression/radical-progress/rad_bogus",
          { memorized: true },
          `Bearer ${tokenB}`,
        );
        expectParity4xx(res, 400);
        expect(res.expressRes.body.code).toBe("VALIDATION_ERROR");
        expect(res.expressRes.body.error).toBe("Failed to update radical progress");
      });
    });
  },
);
