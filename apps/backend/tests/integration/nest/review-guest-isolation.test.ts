/**
 * @file apps/backend/tests/integration/nest/review-guest-isolation.test.ts
 * @description Story 25-1 (P0-1 Guest Isolation) — the two-user SEEDED leak
 * regression. Story 24-1's stopgap and Story 24-11's structural port were
 * proven against a MOCKED Prisma client (`ReviewRepository.test.ts` — no rows
 * in the database, `findMany` asserted `not.toHaveBeenCalled`). This harness is
 * the missing proof: real Prisma, real `SrsCardState` rows for two users, the
 * real review routes and the real `RequireAuthGuard`.
 *
 * ## One test, three steps (a green result cannot be vacuous)
 *  1. **Seed** SRS rows for user A (`tone-syllable:1`, studyCount 7) and user B
 *     (`tone-syllable:2`, studyCount 9) with an already-past `nextReview`.
 *  2. **Positive control** — `GET /api/v1/review/items?source=all&type=tone`
 *     as A returns A's `studyCount: 7` on tone 1 and `0` on tone 2; as B it
 *     returns B's `studyCount: 9` on tone 2 and `0` on tone 1; the per-user
 *     due-count is 1 for each. This proves the seed is live AND that real
 *     scoping works, so step 3 cannot pass merely because nothing was seeded.
 *  3. **Guest gets nothing** — the anonymous request is rejected 401
 *     `AUTH_REQUIRED` at the HTTP boundary (`RequireAuthGuard`), and a DIRECT
 *     repository call with `undefined` returns `[]` / `0` — never A's or B's
 *     rows. The direct call is the data-boundary half of the defence in depth;
 *     a repository-level positive control (`findByUserAndTypes(userIdA, …)`)
 *     sits beside it so an empty result cannot be an empty table.
 *
 * Review items are CONTENT + SRS state joined (`ReviewService.getReviewItems`):
 * every seeded tone is always present, so the leak signal is `studyCount`
 * (0 = no row for this user, non-zero = this user's own row), never presence.
 *
 * DB-backed (real Prisma against the test database — registers two real users,
 * seeds their SRS rows, cleans everything up in `afterAll`). A missing
 * `DATABASE_URL` / unreachable DB skips the whole suite (`checkDatabase`).
 *
 * Run via: cd apps/backend && npm run test:integration -- review-guest-isolation
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
const { ReviewRepository } =
  await import("../../../src/modules/review/repositories/ReviewRepository.js");
const { checkDatabase, disconnectDatabase } = await import("../helpers/db.js");

const db = await checkDatabase();

/** The SRS item types the review read joins (mirrors ReviewService.getReviewItems). */
const REVIEW_ITEM_TYPES = ["pinyin-syllable", "tone-syllable", "radical", "character-radical"];

// ── Test-net IPs (unique per request — never trips the auth limiter) ───────

/** TEST-NET-3 range (203.0.113.0/24) — documented, never routable. */
let ipCounter = 0;
function nextIp(): string {
  ipCounter += 1;
  return `203.0.113.${(ipCounter % 200) + 1}`;
}

// ── Suite ──────────────────────────────────────────────────────────────────

describe.skipIf(!db.available)(
  "Review guest isolation — P0-1 seeded regression (integration, DB)",
  () => {
    let nestApp: INestApplication | undefined;
    let nestServer: Server;
    /** Registered user A — owns the `tone-syllable:1` SRS row. */
    let userIdA: string | undefined;
    let tokenA: string | undefined;
    /** Registered user B — owns the `tone-syllable:2` SRS row. */
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
      const regA = await request(nestServer)
        .post("/api/v1/auth/register")
        .set("X-Forwarded-For", nextIp())
        .send({
          email: `review-guest-a-${runId}@example.com`,
          password: "ValidPass123",
          displayName: "Review Guest Isolation A",
        });
      expect(regA.status).toBe(201);
      userIdA = regA.body.data.user.id as string;
      tokenA = regA.body.data.accessToken as string;

      const regB = await request(nestServer)
        .post("/api/v1/auth/register")
        .set("X-Forwarded-For", nextIp())
        .send({
          email: `review-guest-b-${runId}@example.com`,
          password: "ValidPass123",
          displayName: "Review Guest Isolation B",
        });
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
        // SrsCardState has no FK to User — clean the SRS rows explicitly.
        await prisma.srsCardState.deleteMany({ where: { userId: { in: userIds } } });
        await prisma.session.deleteMany({ where: { userId: { in: userIds } } });
        await prisma.user.deleteMany({ where: { id: { in: userIds } } });
      }
      await nestApp?.close();
      await disconnectDatabase();
    });

    /** GET the route at the Nest app with an optional access token. */
    function get(path: string, accessToken?: string) {
      let req = request(nestServer).get(path).set("X-Forwarded-For", nextIp());
      if (accessToken) req = req.set("Authorization", `Bearer ${accessToken}`);
      return req;
    }

    /** The SRS state a review read reports for one tone (`itemId` is the tone number). */
    function toneStudyCount(items: unknown[], toneNumber: string): number | undefined {
      const item = (items as Array<{ itemId: string; studyCount: number }>).find(
        (row) => row.itemId === toneNumber,
      );
      return item?.studyCount;
    }

    it("scopes SRS reads to the authenticated user and gives a guest nothing", async () => {
      expect(userIdA).toBeDefined();
      expect(userIdB).toBeDefined();

      // ── Step 1: seed one SRS row per user, with DISTINCT itemIds ────────────
      const tenDaysAgo = new Date(Date.now() - 10 * 86400000);
      await prisma.srsCardState.create({
        data: {
          userId: userIdA!,
          itemType: "tone-syllable",
          itemId: "1",
          studyCount: 7,
          correctCount: 5,
          lastReviewed: tenDaysAgo,
          nextReview: tenDaysAgo,
          intervalDays: 3,
        },
      });
      await prisma.srsCardState.create({
        data: {
          userId: userIdB!,
          itemType: "tone-syllable",
          itemId: "2",
          studyCount: 9,
          correctCount: 4,
          lastReviewed: tenDaysAgo,
          nextReview: tenDaysAgo,
          intervalDays: 5,
        },
      });

      const seededA = await prisma.srsCardState.findMany({
        where: { userId: userIdA! },
        select: { itemId: true, studyCount: true },
      });
      const seededB = await prisma.srsCardState.findMany({
        where: { userId: userIdB! },
        select: { itemId: true, studyCount: true },
      });
      expect(seededA).toEqual([{ itemId: "1", studyCount: 7 }]);
      expect(seededB).toEqual([{ itemId: "2", studyCount: 9 }]);

      // ── Step 2: positive control — each user's read is live and scoped ─────
      const readA = await get("/api/v1/review/items?source=all&type=tone&limit=50", tokenA);
      expect(readA.status).toBe(200);
      const itemsA = readA.body as unknown[];
      expect(itemsA.length).toBeGreaterThan(0);
      // A sees A's row (7) and NOT B's row on tone 2 (would be 9 on a leak).
      expect(toneStudyCount(itemsA, "1")).toBe(7);
      expect(toneStudyCount(itemsA, "2")).toBe(0);
      // Only one SRS row contributes to A's read.
      const totalA = (itemsA as Array<{ studyCount: number }>).reduce(
        (sum, item) => sum + item.studyCount,
        0,
      );
      expect(totalA).toBe(7);

      const readB = await get("/api/v1/review/items?source=all&type=tone&limit=50", tokenB);
      expect(readB.status).toBe(200);
      const itemsB = readB.body as unknown[];
      expect(itemsB.length).toBeGreaterThan(0);
      // B sees B's row (9) and NOT A's row on tone 1 (would be 7 on a leak).
      expect(toneStudyCount(itemsB, "2")).toBe(9);
      expect(toneStudyCount(itemsB, "1")).toBe(0);

      const dueCountA = await get("/api/v1/review/due-count?type=tone", tokenA);
      expect(dueCountA.status).toBe(200);
      expect(dueCountA.body).toEqual({ count: 1 });
      const dueCountB = await get("/api/v1/review/due-count?type=tone", tokenB);
      expect(dueCountB.status).toBe(200);
      expect(dueCountB.body).toEqual({ count: 1 });

      // ── Step 3: the guest gets NOTHING — 401 at the boundary, [] at the repo ─
      const guestItems = await get("/api/v1/review/items?source=all&type=tone&limit=50");
      expect(guestItems.status).toBe(401);
      expect(guestItems.body).toEqual({
        code: "AUTH_REQUIRED",
        message: "Please sign in to access this feature",
        requestId: expect.any(String),
      });

      const guestDueCount = await get("/api/v1/review/due-count?type=tone");
      expect(guestDueCount.status).toBe(401);
      expect(guestDueCount.body.code).toBe("AUTH_REQUIRED");

      // Data boundary (defence in depth): `undefined` is rejected BEFORE Prisma,
      // so even a future route that forgets the controller check reads nothing.
      const repository = new ReviewRepository();
      expect(await repository.findByUserAndTypes(undefined, REVIEW_ITEM_TYPES)).toEqual([]);
      expect(await repository.countDue(undefined, "")).toBe(0);

      // Repository-level positive control — the same rows ARE visible when the
      // identity is present, so the empty guest result is a rejection, not an
      // empty table.
      const repositoryRowsForA = await repository.findByUserAndTypes(userIdA, REVIEW_ITEM_TYPES);
      expect(repositoryRowsForA.map((row) => ({ userId: row.userId, itemId: row.itemId }))).toEqual(
        [{ userId: userIdA, itemId: "1" }],
      );
      expect(await repository.countDue(userIdA, "tone")).toBe(1);
    });
  },
);
