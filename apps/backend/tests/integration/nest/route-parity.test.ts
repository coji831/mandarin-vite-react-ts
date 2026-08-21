/**
 * @file apps/backend/tests/integration/nest/route-parity.test.ts
 * @description Route-response parity harness for the NestJS 11 shell
 * (Story 24-2 — NestJS 11 Shell Scaffold + Reference-Module Proof-of-Pattern).
 *
 * Boots BOTH apps in-process via supertest:
 *   - the production Express app (`src/app/index.ts` default export), and
 *   - the NestJS 11 shell (`NestFactory.create(AppModule).getHttpServer()`).
 *
 * For every ported route (words / phonetic-clusters / grammar / chengyu, from
 * `ROUTE_PATTERNS` + the route files) it asserts:
 *   - 2xx: identical status AND identical body (deep-equal) — reference data
 *     is deterministic; `X-Request-Id`/`requestId` is ignored (varies).
 *   - 4xx: identical status only — body-envelope parity (`{ code, message,
 *     requestId }`) is deferred to 24-3.
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
import { describe, it, expect, beforeAll, afterAll } from "vitest";
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
    nestApp = await NestFactory.create(AppModule, { logger: false, bufferLogs: false });
    // Apply the SAME shell configuration the dev entry uses (main.ts →
    // configureNestShellApp): /api global prefix, trust proxy, cookie
    // parsing, CORS allowlist — so the harness tests the real boot shape.
    configureNestShellApp(nestApp);
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

  /** 4xx: identical status only (envelope parity deferred to 24-3). */
  function expectParity4xx(
    res: { expressRes: request.Response; nestRes: request.Response },
    expectedStatus: number,
  ) {
    expect(res.expressRes.status).toBe(expectedStatus);
    expect(res.nestRes.status).toBe(expectedStatus);
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
});
