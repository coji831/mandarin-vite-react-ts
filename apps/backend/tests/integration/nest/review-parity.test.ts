/**
 * @file apps/backend/tests/integration/nest/review-parity.test.ts
 * @description Review regression harness (Story 24-11 — Review Port + SRS
 * Schema; Story 24-15 — converted to Nest-only at the cutover).
 *
 * Pre-cutover this booted BOTH apps (production Express + Nest shell) and
 * deep-equal'd every response; that parity was verified through 24-14. At
 * 24-15 the Express surface was deleted, so this harness now boots ONLY the
 * NestJS 11 shell (`NestFactory.create(AppModule)` + the real
 * `configureNestShellApp` + `mountExpressErrorBridge` boot shape) and asserts
 * the review contract directly as regression guards.
 *
 * ## review (3 routes — `GET /v1/review/items`, `GET /v1/review/due-count`,
 * `POST /v1/review/result`)
 * All three routes mount the calibrated guest-rejecting `RequireAuthGuard`
 * (24-5) over the SAME framework-agnostic `ReviewService`/`ReviewRepository`
 * (re-pointed to the absorbed additive `SrsCardState` table, 24-11).
 *
 * The content case uses `type=tone` (5 seeded tone rows, deterministic
 * content, NO random `options` array — radical items carry shuffle-derived
 * distractors so they are intentionally not asserted here; the raw radical
 * data routes are covered by `radicals-foundations-parity.test.ts`).
 *
 * ## guest → 401 (requireAuth)
 * No token → 401 with `code` `AUTH_REQUIRED` / message "Please sign in to
 * access this feature" wrapped in the 24-3 `{ code, message, requestId }`
 * envelope.
 *
 * ## 4xx (400 validation)
 * `POST /v1/review/result` with a missing field / invalid rating → 400
 * `MISSING_FIELDS`.
 *
 * ## P0-1 no-leak (a user only sees their own rows)
 * User A rates a tone item; User B (fresh) reads the same route — B's item for
 * the rated `itemId` shows `studyCount: 0` / `intervalDays: 1` (new to B),
 * never A's `studyCount: 1`. If the repository leaked rows across users (the
 * Prisma ignore-`undefined` class of bug from 24-1), B would see A's state.
 *
 * DB-backed (real Prisma against the test database — registers two real users
 * and rates a tone item; rows are cleaned up in `afterAll`). A missing
 * `DATABASE_URL` / unreachable DB skips the whole suite (the `checkDatabase`
 * pattern).
 *
 * Run via: cd apps/backend && npm run test:integration
 */
import "reflect-metadata";
import type { Server } from "node:http";
import crypto from "node:crypto";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import type { INestApplication } from "@nestjs/common";

// ── Hermetic env — MUST run before any module under test is evaluated ──────
// Pin PORT to an ephemeral port before importing anything that transitively
// boots a listener (dotenv does not override already-set vars).
process.env.PORT = "0";

// Dynamic imports AFTER the env stub (ESM evaluates static imports first).
const { NestFactory } = await import("@nestjs/core");
const { AppModule } = await import("../../../src/nest/app.module.js");
const { configureNestShellApp } = await import("../../../src/nest/configure-app.js");
const { mountExpressErrorBridge } = await import("../../../src/nest/exception.filter.js");
const { prisma } = await import("../../../src/shared/infrastructure/database/client.js");
const { checkDatabase, disconnectDatabase } = await import("../helpers/db.js");

const db = await checkDatabase();

// ── Test-net IPs (unique per request — never trips the auth limiter) ───────

/** TEST-NET-3 range (203.0.113.0/24) — documented, never routable. */
let ipCounter = 0;
function nextIp(): string {
  ipCounter += 1;
  return `203.0.113.${(ipCounter % 200) + 1}`;
}

// ── Parity suite ───────────────────────────────────────────────────────────

describe.skipIf(!db.available)("Nest review regression (integration, DB)", () => {
  let nestApp: INestApplication | undefined;
  let nestServer: Server;
  /** Registered user A — rates a tone item (has SRS state). */
  let userIdA: string | undefined;
  let tokenA: string | undefined;
  /** Registered user B — fresh (no SRS state); the P0-1 no-leak check side. */
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
    const emailA = `review-a-${runId}@example.com`;
    const emailB = `review-b-${runId}@example.com`;
    const regA = await request(nestServer)
      .post("/api/v1/auth/register")
      .set("X-Forwarded-For", nextIp())
      .send({ email: emailA, password: "ValidPass123", displayName: "Review Parity A" });
    expect(regA.status).toBe(201);
    userIdA = regA.body.data.user.id as string;
    tokenA = regA.body.data.accessToken as string;
    const regB = await request(nestServer)
      .post("/api/v1/auth/register")
      .set("X-Forwarded-For", nextIp())
      .send({ email: emailB, password: "ValidPass123", displayName: "Review Parity B" });
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
      // SrsCardState has no FK to User (matches ReviewItem's pattern) — clean
      // up the SRS rows explicitly before deleting the users.
      await prisma.srsCardState.deleteMany({ where: { userId: { in: userIds } } });
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

  /**
   * 4xx regression guard: exact status + the Nest 24-3 envelope
   * `{ code, message, requestId }` with the calibrated `code`/`message`.
   */
  function expectParity4xx(
    res: { nestRes: request.Response },
    expectedStatus: number,
    expectedCode: string,
    expectedMessage: string,
  ) {
    expect(res.nestRes.status).toBe(expectedStatus);
    expect(res.nestRes.body).toEqual({
      code: expectedCode,
      message: expectedMessage,
      requestId: expect.any(String),
    });
    expect(res.nestRes.body.requestId).toBe(res.nestRes.headers["x-request-id"]);
  }

  /**
   * Review items body — normalize the two non-deterministic dimensions before
   * deep-equal: per-request `now` (`nextReview`) and the `Math.random` shuffle
   * ORDER (sort by `itemType:itemId`). Everything else (id, itemType, itemId,
   * front, back, category, character, meaning, pinyinPlain, correctTone,
   * studyCount, correctCount, intervalDays) is byte-compared.
   */
  function normalizeItems(body: unknown): unknown {
    if (!Array.isArray(body)) return body;
    return body
      .map((item) => ({ ...item, nextReview: "NEXT" }))
      .sort((a, b) => `${a.itemType}:${a.itemId}`.localeCompare(`${b.itemType}:${b.itemId}`));
  }

  /** 2xx items: 200 + a normalized item array (sorted, nextReview sentinel). */
  function expectParityItems(res: { nestRes: request.Response }) {
    expect(res.nestRes.status).toBe(200);
    expect(Array.isArray(res.nestRes.body)).toBe(true);
    expect(normalizeItems(res.nestRes.body)).toEqual(
      normalizeItems(res.nestRes.body)
        .slice()
        .sort((a: { itemType: string; itemId: string }, b: { itemType: string; itemId: string }) =>
          `${a.itemType}:${a.itemId}`.localeCompare(`${b.itemType}:${b.itemId}`),
        ),
    );
  }

  // ── review (3 routes) ────────────────────────────────────────────────────

  describe("review — guest rejected 401 (calibrated requireAuth)", () => {
    it("GET /api/v1/review/items — guest → 401 AUTH_REQUIRED", async () => {
      const res = await getBoth("/api/v1/review/items?source=due&type=radical&limit=5");
      expectParity4xx(res, 401, "AUTH_REQUIRED", "Please sign in to access this feature");
    });

    it("GET /api/v1/review/due-count — guest → 401 AUTH_REQUIRED", async () => {
      const res = await getBoth("/api/v1/review/due-count?type=radical");
      expectParity4xx(res, 401, "AUTH_REQUIRED", "Please sign in to access this feature");
    });

    it("POST /api/v1/review/result — guest → 401 AUTH_REQUIRED (no SRS row written)", async () => {
      const res = await postBoth(
        "/api/v1/review/result",
        { itemType: "tone-syllable", itemId: "1", rating: "good" },
        undefined,
      );
      expectParity4xx(res, 401, "AUTH_REQUIRED", "Please sign in to access this feature");
    });
  });

  describe("review — authed 2xx (deterministic)", () => {
    it("GET items source=recent — 200 [] (fresh user has no recent SRS state)", async () => {
      const res = await getBoth(
        "/api/v1/review/items?source=recent&type=radical&limit=10",
        `Bearer ${tokenA}`,
      );
      expect(res.nestRes.status).toBe(200);
      expect(res.nestRes.body).toEqual([]);
    });

    it("GET items source=all&type=tone — 200 (5 tone items, no options)", async () => {
      const res = await getBoth(
        "/api/v1/review/items?source=all&type=tone&limit=50",
        `Bearer ${tokenA}`,
      );
      expectParityItems(res);
      expect(res.nestRes.body).toHaveLength(5);
    });

    it("GET due-count — 200 { count: 0 } (fresh user, no due rows)", async () => {
      const res = await getBoth("/api/v1/review/due-count?type=tone", `Bearer ${tokenA}`);
      expect(res.nestRes.status).toBe(200);
      expect(res.nestRes.body).toEqual({ count: 0 });
    });
  });

  describe("review — POST result (recordRating, interval-doubling preserved)", () => {
    it("rating 'good' — 200 { intervalDays: 2, studyCount: 1 } (1×2 doubling)", async () => {
      const res = await postBoth(
        "/api/v1/review/result",
        { itemType: "tone-syllable", itemId: "1", rating: "good" },
        `Bearer ${tokenA}`,
      );
      expect(res.nestRes.status).toBe(200);
      // Normalize the `now + interval` timestamp; intervalDays/studyCount are
      // the deterministic interval-doubling assertions.
      expect({ ...res.nestRes.body, nextReview: "NEXT" }).toEqual({
        nextReview: "NEXT",
        intervalDays: 2,
        studyCount: 1,
      });
    });

    it("due-count after the rating — 200 { count: 0 } (next review is in the future)", async () => {
      const res = await getBoth("/api/v1/review/due-count?type=tone", `Bearer ${tokenA}`);
      expect(res.nestRes.status).toBe(200);
      expect(res.nestRes.body).toEqual({ count: 0 });
    });

    it("rating 'again' — 200 { intervalDays: 1, studyCount: 2 } (reset to 1d)", async () => {
      const res = await postBoth(
        "/api/v1/review/result",
        { itemType: "tone-syllable", itemId: "1", rating: "again" },
        `Bearer ${tokenA}`,
      );
      expect(res.nestRes.status).toBe(200);
      expect({ ...res.nestRes.body, nextReview: "NEXT" }).toEqual({
        nextReview: "NEXT",
        intervalDays: 1,
        studyCount: 2,
      });
    });
  });

  describe("review — 400 validation envelope (MISSING_FIELDS)", () => {
    it("missing itemType/itemId/rating — 400 MISSING_FIELDS", async () => {
      const res = await postBoth("/api/v1/review/result", {}, `Bearer ${tokenA}`);
      expectParity4xx(res, 400, "MISSING_FIELDS", "itemType, itemId, and rating are required");
    });

    it("invalid rating — 400 MISSING_FIELDS", async () => {
      const res = await postBoth(
        "/api/v1/review/result",
        { itemType: "tone-syllable", itemId: "1", rating: "hard" },
        `Bearer ${tokenA}`,
      );
      expectParity4xx(res, 400, "MISSING_FIELDS", "rating must be 'again', 'good', or 'easy'");
    });
  });

  describe("review — P0-1 no-leak (a user only sees their own rows)", () => {
    it("user B (fresh) never sees user A's rated tone-item SRS state", async () => {
      // A has rated tone-syllable/1 (studyCount 2 after the two ratings above).
      const aItems = await getBoth(
        "/api/v1/review/items?source=all&type=tone&limit=50",
        `Bearer ${tokenA}`,
      );
      const aTone1 = Array.isArray(aItems.nestRes.body)
        ? (aItems.nestRes.body as Array<Record<string, unknown>>).find(
            (i) => i.itemType === "tone-syllable" && i.itemId === "1",
          )
        : undefined;
      expect(aTone1).toBeDefined();
      // A sees their OWN SRS state (2 ratings recorded above).
      expect(aTone1!.studyCount).toBe(2);

      // B (fresh) reads the same route — the SAME itemId must show as NEW to B
      // (studyCount 0 / intervalDays 1), NEVER A's studyCount 2. A cross-user
      // leak would surface A's state here.
      const bItems = await getBoth(
        "/api/v1/review/items?source=all&type=tone&limit=50",
        `Bearer ${tokenB}`,
      );
      const bTone1 = Array.isArray(bItems.nestRes.body)
        ? (bItems.nestRes.body as Array<Record<string, unknown>>).find(
            (i) => i.itemType === "tone-syllable" && i.itemId === "1",
          )
        : undefined;
      expect(bTone1).toBeDefined();
      expect(bTone1!.studyCount).toBe(0);
      expect(bTone1!.correctCount).toBe(0);
      expect(bTone1!.intervalDays).toBe(1);
    });
  });
});
