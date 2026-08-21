/**
 * @file apps/backend/tests/integration/nest/route-parity.test.ts
 * @description Route-response parity harness for the NestJS 11 shell
 * (Story 24-2 — NestJS 11 Shell Scaffold + Reference-Module Proof-of-Pattern;
 * Story 24-3 — HTTP-Layer Parity).
 *
 * Boots BOTH apps in-process via supertest:
 *   - the production Express app (`src/app/index.ts` default export), and
 *   - the NestJS 11 shell (`NestFactory.create(AppModule).getHttpServer()`).
 *
 * For every ported route (words / phonetic-clusters / grammar / chengyu, from
 * `ROUTE_PATTERNS` + the route files) it asserts:
 *   - 2xx: identical status AND identical body (deep-equal) — reference data
 *     is deterministic; `X-Request-Id`/`requestId` is ignored (varies).
 *   - 4xx: identical status AND (24-3) the Nest response carries the exact
 *     `{ code, message, requestId }` envelope — the Express 4xx bodies on the
 *     ported routes are the legacy controller shape `{ error, code }` (they do
 *     NOT pass through the Express errorHandler), so cross-app deep-equal of
 *     the envelope is asserted on the paths where Express ALSO reaches the
 *     errorHandler (oversized-body 413 below).
 *
 * 24-3 HTTP-layer contract additions:
 *   - `X-Request-Id` present on every response + unique per request + echoes a
 *     client-supplied header (both apps).
 *   - Seeded low-limit test route → 429 with the envelope (Nest) + status
 *     parity vs an equivalent Express mount.
 *   - Oversized body → identical 413 status + `{code, message, requestId}`
 *     envelope on both apps (body-parser parity) + log-parity (both apps log
 *     `API Error { requestId, code, message, stack }`).
 *   - Seeded 5xx test route → 500 envelope (via the shared mapper).
 *
 * Representative fixtures are resolved from the seeded DB at runtime (glyph /
 * word id / grammar content_id / chengyu content_id), so the harness is robust
 * to the actual seeded data rather than hardcoding IDs.
 *
 * Placed under `tests/integration/` so it runs under
 * `vitest.integration.config.ts` (real DB, `fileParallelism: false`, 30s
 * timeout) and is EXCLUDED from the default `test:full` / Tier-1 `npm test`
 * (the base vitest config excludes `tests/integration/**`). A missing
 * `DATABASE_URL` / unreachable DB skips the whole suite with a message.
 *
 * Run via: cd apps/backend && npm run test:integration
 */
import "reflect-metadata";
import type { Server } from "node:http";
import type { Express } from "express";
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import request from "supertest";
import type { INestApplication } from "@nestjs/common";

// ── Constants (mirror the Express controllers) ─────────────────────────────

/** Regex for validating a Chinese glyph (one or more CJK Unified Ideographs). */
const CHINESE_GLYPH_REGEX = /^[\u4e00-\u9fff\u3400-\u4dbf]+$/;

/** Regular expression matching a PhoneticCluster ID format (pc_NNNN). */
const PC_ID_REGEX = /^pc_\d+$/;

// ── Boot both apps ─────────────────────────────────────────────────────────

// `src/app/index.ts` calls `app.listen(config.port)` at import time. Pin PORT
// to an ephemeral port BEFORE importing it (and anything that transitively
// loads `shared/config` — e.g. the Prisma client) so the production Express
// app can never collide with a dev server on 3001. `dotenv.config` in
// `shared/config` does not override an already-set env var, so PORT stays "0".
process.env.PORT = "0";

const { default: expressApp } = await import("../../../src/app/index.js");
const { NestFactory } = await import("@nestjs/core");
const { AppModule } = await import("../../../src/nest/app.module.js");
const { configureNestShellApp } = await import("../../../src/nest/configure-app.js");
const { mountExpressErrorBridge } = await import("../../../src/nest/exception.filter.js");
const { TEST_EXPRESS_LIMITER_CONFIG, TEST_LIMITER_CONFIG } =
  await import("../../../src/nest/rate-limit.config.js");
const { default: express } = await import("express");
const { rateLimit } = await import("express-rate-limit");
const { prisma } = await import("../../../src/shared/infrastructure/database/client.js");
const { checkDatabase, disconnectDatabase } = await import("../helpers/db.js");

const db = await checkDatabase();

// ── Fixture resolution (deterministic against the seeded DB) ──────────────

interface Fixtures {
  /** A seeded word glyph that passes CHINESE_GLYPH_REGEX. */
  wordGlyph: string;
  /** A seeded word id (w_XXXX) that has measure words. */
  measureWordId: string;
  /** A phonetic-cluster id matching pc_XXXX if the DB has one, else null. */
  phoneticClusterId: string | null;
  /** A seeded grammar content_id (gr_XXXX). */
  grammarContentId: string;
  /** A seeded chengyu content_id (cy_XXXX). */
  chengyuContentId: string;
}

async function resolveFixtures(): Promise<Fixtures> {
  const word = await prisma.word.findFirst({
    where: { simplified: { not: null } },
    select: { simplified: true },
    orderBy: { id: "asc" },
  });
  const measure = await prisma.measureWordWord.findFirst({
    select: { wordId: true },
    orderBy: { id: "asc" },
  });
  const clusters = await prisma.phoneticCluster.findMany({
    select: { id: true },
    orderBy: { displayOrder: "asc" },
  });
  const grammar = await prisma.grammarPattern.findFirst({
    select: { content_id: true },
    orderBy: { content_id: "asc" },
  });
  const chengyu = await prisma.chengyu.findFirst({
    select: { content_id: true },
    orderBy: { content_id: "asc" },
  });

  if (!word?.simplified || !measure || !grammar || !chengyu) {
    throw new Error(
      "Parity fixtures incomplete — seeded DB is missing a word glyph, a " +
        "measure-word word, a grammar content_id, or a chengyu content_id",
    );
  }

  return {
    wordGlyph: word.simplified,
    measureWordId: measure.wordId,
    phoneticClusterId: clusters.find((c) => PC_ID_REGEX.test(c.id))?.id ?? null,
    grammarContentId: grammar.content_id,
    chengyuContentId: chengyu.content_id,
  };
}

const fixtures: Fixtures | null = db.available ? await resolveFixtures() : null;

// ── Parity suite ───────────────────────────────────────────────────────────

describe.skipIf(!db.available)("NestJS 11 shell ↔ Express route parity (integration, DB)", () => {
  let nestApp: INestApplication | undefined;
  let nestServer: Server;

  beforeAll(async () => {
    // bodyParser: false — configure-app.ts mounts express.json() +
    // express.urlencoded() explicitly with the same limits as app/index.ts,
    // so the oversized-body parity test exercises the real body-parser path.
    nestApp = await NestFactory.create(AppModule, {
      logger: false,
      bufferLogs: false,
      bodyParser: false,
    });
    // Apply the SAME shell configuration the dev entry uses (main.ts →
    // configureNestShellApp): /api global prefix, trust proxy, CORS allowlist,
    // body parsers, cookie parsing, requestId middleware, words rate-limit —
    // so the harness tests the real boot shape.
    configureNestShellApp(nestApp);

    // Seed test-only routes for the 429 / 5xx parity cases (BEFORE the error
    // bridge so their errors flow through the envelope bridge; they are never
    // mounted in the production shell — this harness is the only consumer).
    const expressAppInstance = nestApp.getHttpAdapter().getInstance() as Express;
    expressAppInstance.use(
      "/api/v1/_test/rate-limit",
      rateLimit(TEST_LIMITER_CONFIG),
      (_req, res) => {
        res.status(200).json({ ok: true });
      },
    );
    expressAppInstance.use("/api/v1/_test/error-500", (_req, _res, next) => {
      const error = new Error("Seeded test boom") as Error & { status?: number };
      error.status = 500;
      next(error);
    });

    // Express error bridge LAST — catches pre-router middleware errors
    // (body-parser 413, seeded route errors) into the shared envelope.
    mountExpressErrorBridge(nestApp);
    await nestApp.init();
    nestServer = nestApp.getHttpServer() as Server;
  });

  afterAll(async () => {
    await nestApp?.close();
    await disconnectDatabase();
  });

  /** Fire the same GET at both apps and return both responses. */
  async function getBoth(path: string) {
    const [expressRes, nestRes] = await Promise.all([
      request(expressApp).get(path),
      request(nestServer).get(path),
    ]);
    return { expressRes, nestRes };
  }

  /** 2xx: identical status AND identical body (deep-equal). */
  function expectParity2xx(res: { expressRes: request.Response; nestRes: request.Response }) {
    expect(res.expressRes.status).toBeGreaterThanOrEqual(200);
    expect(res.expressRes.status).toBeLessThan(300);
    expect(res.nestRes.status).toBe(res.expressRes.status);
    expect(res.nestRes.body).toEqual(res.expressRes.body);
  }

  /**
   * 4xx: identical status to Express AND Nest emits the exact
   * `{ code, message, requestId }` envelope (24-3 HTTP-layer contract).
   */
  function expectParity4xx(
    res: { expressRes: request.Response; nestRes: request.Response },
    expectedStatus: number,
  ) {
    expect(res.expressRes.status).toBe(expectedStatus);
    expect(res.nestRes.status).toBe(expectedStatus);
    expectEnvelope(res.nestRes);
  }

  /**
   * 24-3 envelope contract: exactly `{ code, message, requestId }` (no extra /
   * missing keys) and `requestId` echoes the `X-Request-Id` response header.
   */
  function expectEnvelope(nestRes: request.Response) {
    expect(nestRes.body).toEqual({
      code: expect.any(String),
      message: expect.any(String),
      requestId: expect.any(String),
    });
    expect(nestRes.body.requestId).toBe(nestRes.headers["x-request-id"]);
  }

  // ── words (Express route file: api/WordsRoutes.ts — uppercase) ─────────

  describe("words", () => {
    it("GET /api/v1/words/:glyph — 200 with identical body", async () => {
      const res = await getBoth(`/api/v1/words/${fixtures!.wordGlyph}`);
      expectParity2xx(res);
    });

    it("GET /api/v1/words/:id/measure-words — 200 with identical body", async () => {
      const res = await getBoth(`/api/v1/words/${fixtures!.measureWordId}/measure-words`);
      expectParity2xx(res);
    });

    it("GET /api/v1/words/abc — 400 (invalid glyph)", async () => {
      const res = await getBoth("/api/v1/words/abc");
      expectParity4xx(res, 400);
    });

    it("GET /api/v1/words/龘 — 404 (valid glyph, missing)", async () => {
      // 龘 (U+9F98) is a rare CJK char that passes the glyph regex and is
      // not part of the seed — a deterministic 404.
      expect(CHINESE_GLYPH_REGEX.test("龘")).toBe(true);
      const res = await getBoth("/api/v1/words/龘");
      expectParity4xx(res, 404);
    });

    it("GET /api/v1/words/not-an-id/measure-words — 400 (invalid id)", async () => {
      const res = await getBoth("/api/v1/words/not-an-id/measure-words");
      expectParity4xx(res, 400);
    });

    it("GET /api/v1/words/w_99999/measure-words — 404 (valid id, missing)", async () => {
      const res = await getBoth("/api/v1/words/w_99999/measure-words");
      expectParity4xx(res, 404);
    });
  });

  // ── phonetic-clusters ──────────────────────────────────────────────────

  describe("phonetic-clusters", () => {
    it("GET /api/v1/phonetic-clusters — 200 with identical body", async () => {
      const res = await getBoth("/api/v1/phonetic-clusters");
      expectParity2xx(res);
    });

    it("GET /api/v1/phonetic-clusters?hskLevel=1 — 200 with identical body", async () => {
      const res = await getBoth("/api/v1/phonetic-clusters?hskLevel=1");
      expectParity2xx(res);
    });

    it(
      "GET /api/v1/phonetic-clusters/:id — 200 with identical body",
      { skip: !fixtures?.phoneticClusterId },
      async () => {
        // The controller only accepts pc_XXXX ids while the seeded ids are
        // cuids — a 2xx detail case only runs when a pc_XXXX row exists.
        const res = await getBoth(`/api/v1/phonetic-clusters/${fixtures!.phoneticClusterId}`);
        expectParity2xx(res);
      },
    );

    it("GET /api/v1/phonetic-clusters/abc — 400 (invalid id)", async () => {
      const res = await getBoth("/api/v1/phonetic-clusters/abc");
      expectParity4xx(res, 400);
    });

    it("GET /api/v1/phonetic-clusters/pc_9999 — 404 (valid id, missing)", async () => {
      const res = await getBoth("/api/v1/phonetic-clusters/pc_9999");
      expectParity4xx(res, 404);
    });

    it("GET /api/v1/phonetic-clusters?hskLevel=abc — 400 (invalid filter)", async () => {
      const res = await getBoth("/api/v1/phonetic-clusters?hskLevel=abc");
      expectParity4xx(res, 400);
    });
  });

  // ── grammar ────────────────────────────────────────────────────────────

  describe("grammar", () => {
    it("GET /api/v1/grammar/patterns — 200 with identical body", async () => {
      const res = await getBoth("/api/v1/grammar/patterns");
      expectParity2xx(res);
    });

    it("GET /api/v1/grammar/patterns?page=1&pageSize=5 — 200 with identical body", async () => {
      const res = await getBoth("/api/v1/grammar/patterns?page=1&pageSize=5");
      expectParity2xx(res);
    });

    it("GET /api/v1/grammar/patterns/:id — 200 with identical body", async () => {
      const res = await getBoth(`/api/v1/grammar/patterns/${fixtures!.grammarContentId}`);
      expectParity2xx(res);
    });

    it("GET /api/v1/grammar/patterns/gr_9999 — 404 (valid id, missing)", async () => {
      const res = await getBoth("/api/v1/grammar/patterns/gr_9999");
      expectParity4xx(res, 404);
    });

    it("GET /api/v1/grammar/patterns/abc — 400 (invalid id)", async () => {
      const res = await getBoth("/api/v1/grammar/patterns/abc");
      expectParity4xx(res, 400);
    });

    it("GET /api/v1/grammar/patterns?page=0 — 400 (invalid filter)", async () => {
      const res = await getBoth("/api/v1/grammar/patterns?page=0");
      expectParity4xx(res, 400);
    });
  });

  // ── chengyu ────────────────────────────────────────────────────────────

  describe("chengyu", () => {
    it("GET /api/v1/chengyu/idioms — 200 with identical body", async () => {
      const res = await getBoth("/api/v1/chengyu/idioms");
      expectParity2xx(res);
    });

    it("GET /api/v1/chengyu/idioms/:id — 200 with identical body", async () => {
      const res = await getBoth(`/api/v1/chengyu/idioms/${fixtures!.chengyuContentId}`);
      expectParity2xx(res);
    });

    it("GET /api/v1/chengyu/idioms/cy_9999 — 404 (valid id, missing)", async () => {
      const res = await getBoth("/api/v1/chengyu/idioms/cy_9999");
      expectParity4xx(res, 404);
    });

    it("GET /api/v1/chengyu/idioms/abc — 400 (invalid id)", async () => {
      const res = await getBoth("/api/v1/chengyu/idioms/abc");
      expectParity4xx(res, 400);
    });

    it("GET /api/v1/chengyu/idioms?theme= — 400 (empty theme filter)", async () => {
      const res = await getBoth("/api/v1/chengyu/idioms?theme=");
      expectParity4xx(res, 400);
    });
  });

  // ── X-Request-Id parity (24-3) ─────────────────────────────────────────

  describe("X-Request-Id parity", () => {
    it("sets X-Request-Id on 2xx and 4xx responses on both apps", async () => {
      // Use the un-limited phonetic-clusters route to avoid the words limiter.
      const [expr2xx, nest2xx] = await Promise.all([
        request(expressApp).get("/api/v1/phonetic-clusters"),
        request(nestServer).get("/api/v1/phonetic-clusters"),
      ]);
      const [expr4xx, nest4xx] = await Promise.all([
        request(expressApp).get("/api/v1/phonetic-clusters/abc"),
        request(nestServer).get("/api/v1/phonetic-clusters/abc"),
      ]);
      // 2xx responses carry the header.
      expect(expr2xx.status).toBe(200);
      expect(nest2xx.status).toBe(200);
      expect(expr2xx.headers["x-request-id"]).toBeDefined();
      expect(nest2xx.headers["x-request-id"]).toBeDefined();
      // 4xx responses carry the header too.
      for (const res of [expr4xx, nest4xx]) {
        expect(res.status).toBeGreaterThanOrEqual(400);
        expect(res.headers["x-request-id"]).toBeDefined();
      }
    });

    it("echoes a client-supplied x-request-id on both apps", async () => {
      const rid = "client-request-id-abc-123";
      const [exprRes, nestRes] = await Promise.all([
        request(expressApp).get("/api/v1/phonetic-clusters").set("X-Request-Id", rid),
        request(nestServer).get("/api/v1/phonetic-clusters").set("X-Request-Id", rid),
      ]);
      expect(exprRes.headers["x-request-id"]).toBe(rid);
      expect(nestRes.headers["x-request-id"]).toBe(rid);
    });

    it("generates a unique requestId per request on Nest", async () => {
      const r1 = await request(nestServer).get("/api/v1/phonetic-clusters");
      const r2 = await request(nestServer).get("/api/v1/phonetic-clusters");
      expect(r1.headers["x-request-id"]).toBeDefined();
      expect(r2.headers["x-request-id"]).toBeDefined();
      expect(r1.headers["x-request-id"]).not.toBe(r2.headers["x-request-id"]);
    });
  });

  // ── 5xx envelope (24-3, seeded route) ───────────────────────────────────

  describe("5xx envelope (seeded route)", () => {
    it("GET /api/v1/_test/error-500 — 500 with the envelope + requestId", async () => {
      const res = await request(nestServer).get("/api/v1/_test/error-500");
      expect(res.status).toBe(500);
      expect(res.body).toEqual({
        code: "INTERNAL_ERROR",
        message: "Seeded test boom",
        requestId: expect.any(String),
      });
      expect(res.body.requestId).toBe(res.headers["x-request-id"]);
    });
  });

  // ── Rate-limit 429 parity (24-3, seeded low-limit route) ────────────────

  describe("rate-limit 429 parity (seeded low-limit route)", () => {
    it("429s after the low limit with the envelope + requestId (Nest)", async () => {
      const r1 = await request(nestServer).get("/api/v1/_test/rate-limit");
      const r2 = await request(nestServer).get("/api/v1/_test/rate-limit");
      const r3 = await request(nestServer).get("/api/v1/_test/rate-limit");

      expect(r1.status).toBe(200);
      expect(r2.status).toBe(200);
      expect(r3.status).toBe(429);
      expect(r3.body).toEqual({
        code: "RATE_LIMIT",
        message: "Too many requests. Please wait a moment.",
        requestId: expect.any(String),
      });
      expect(r3.body.requestId).toBe(r3.headers["x-request-id"]);
    });

    it("yields the same 429 status on an equivalent Express mount (config parity)", async () => {
      // A throwaway Express app mounting the same low-limit express-rate-limit
      // config with the DEFAULT handler — proves the retained library + config
      // render the identical 429 status (auth-specific limits deferred later).
      const mini = express();
      mini.get("/limit", rateLimit(TEST_EXPRESS_LIMITER_CONFIG), (_req, res) => {
        res.json({ ok: true });
      });

      const e1 = await request(mini).get("/limit");
      const e2 = await request(mini).get("/limit");
      const e3 = await request(mini).get("/limit");

      expect(e1.status).toBe(200);
      expect(e2.status).toBe(200);
      expect(e3.status).toBe(429);
      // Express's default handler sends the configured message directly (no
      // envelope) — identical to the real per-route limiters.
      expect(e3.body).toEqual({
        error: "Too many requests. Please wait a moment.",
        code: "RATE_LIMIT",
      });
    });
  });

  // ── Body-parser parity + log-parity (24-3) ──────────────────────────────

  describe("body-parser parity (oversized body) + error-log parity", () => {
    it("rejects an oversized JSON body with an identical 413 envelope on both apps", async () => {
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
      try {
        const bigBody = { data: "x".repeat(200_000) }; // > 100kb express.json limit
        const [exprRes, nestRes] = await Promise.all([
          request(expressApp)
            .post("/api/v1/chengyu/idioms")
            .set("Content-Type", "application/json")
            .send(bigBody),
          request(nestServer)
            .post("/api/v1/chengyu/idioms")
            .set("Content-Type", "application/json")
            .send(bigBody),
        ]);

        // Express's body-parser error flows through ITS errorHandler → the
        // exact envelope, so here the two apps are genuinely deep-equal.
        expect(exprRes.status).toBe(413);
        expect(nestRes.status).toBe(413);
        const expectedEnvelope = {
          code: "INTERNAL_ERROR",
          message: "request entity too large",
          requestId: expect.any(String),
        };
        expect(exprRes.body).toEqual(expectedEnvelope);
        expect(nestRes.body).toEqual(expectedEnvelope);

        // Log-parity (O1): both apps logged `API Error` with the same
        // {requestId, code, message, stack} fields as errorHandler.ts.
        const apiErrorCalls = consoleError.mock.calls.filter(
          ([msg]) => typeof msg === "string" && msg.includes("API Error"),
        );
        expect(apiErrorCalls.length).toBeGreaterThanOrEqual(2);
        for (const [, details] of apiErrorCalls) {
          expect(details).toMatchObject({
            requestId: expect.any(String),
            code: "INTERNAL_ERROR",
            message: "request entity too large",
            stack: expect.any(String),
          });
        }
      } finally {
        consoleError.mockRestore();
      }
    });
  });
});
