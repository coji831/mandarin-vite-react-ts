/**
 * @file apps/backend/tests/integration/nest/radicals-foundations-parity.test.ts
 * @description Radicals + Foundations ↔ Express parity harness (Story 24-9 —
 * Radicals + Foundations Port).
 *
 * Boots BOTH apps in-process via supertest:
 *   - the production Express app (`src/app/index.ts` default export — mounts
 *     the real radicals + foundations route files), and
 *   - the NestJS 11 shell (`NestFactory.create(AppModule)` + the real
 *     `configureNestShellApp` + `mountExpressErrorBridge` boot shape).
 *
 * ## radicals (4 routes — public static reference data, no auth/cache/external)
 * `GET /v1/radicals`, `GET /v1/radicals/:radicalId`,
 * `GET /v1/radicals/character/:glyph`, `GET /v1/radicals/:radicalId/characters`.
 * All 2xx are deterministic reads of the seeded Radical / CharacterRadical
 * tables → deep-equal. Notable parity edge: `GET /:radicalId` for an UNKNOWN
 * ID returns `200 null` on Express (`res.json(null)`); the Nest controller
 * mirrors it with a full `@Res()` `res.json()` (Nest's default reply strips
 * null) so both apps send the literal `null` body. The `/:radicalId/characters`
 * unknown-ID 404 (`RadicalNotFoundError`) is a reachable 4xx → status + envelope
 * parity (`code`/`message` byte-for-byte equal to the Express `{ error, code }`).
 *
 * ## foundations (4 routes — public static reference data, all-in-DB)
 * `GET /v1/foundations/data/pinyin-tones`,
 * `GET /v1/foundations/data/pinyin-character-map`,
 * `GET /v1/foundations/data/strokes`,
 * `GET /v1/characters/:glyph` (the cross-module shadow route).
 * 2xx are deterministic full-table reads → deep-equal.
 *
 * ## the `/v1/characters/:glyph` ROUTE-SHADOW parity
 * On the live Express app this route is owned by FOUNDATIONS (mounted before
 * the characters router in `app/routes.ts`) and captures EVERY single-segment
 * `GET /v1/characters/<x>` — shadowing the characters module's own `:glyph`
 * (and its `/search` + `/frequency`). The shell reproduces this by importing
 * `FoundationsModule` before `CharactersModule` in `AppModule`. The harness
 * proves it end-to-end:
 *   - `GET /v1/characters/<existing-glyph>` → 200 FOUNDATIONS
 *     `CharacterDetailResponse` shape (not the characters module shape), deep-
 *     equal on both apps.
 *   - `GET /v1/characters/search?q=…` / `/frequency` / `abc` → 404 with
 *     `Character "<x>" not found` on BOTH apps (the characters table covers
 *     all CJK regex codepoints, so the 404 is only reachable via non-CJK
 *     single-segment paths). Express emits a plain `{ error }` body (no `code`);
 *     the Nest envelope's `message` is byte-for-byte equal to that `error`.
 *
 * 4xx contract: radicals Express bodies carry `{ error, code }`; foundations
 * Express bodies carry plain `{ error }`. The Nest envelope is always
 * `{ code, message, requestId }` with `message` === Express `error`; `code`
 * matches the Express `code` where present, else follows the backend
 * error-message convention (`VALIDATION_ERROR` / `NOT_FOUND` / `LOAD_ERROR`).
 *
 * DB-backed (real Prisma against the test database). A missing `DATABASE_URL` /
 * unreachable DB skips the whole suite (the `checkDatabase` pattern).
 *
 * Run via: cd apps/backend && npm run test:integration
 */
import "reflect-metadata";
import type { Server } from "node:http";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import type { INestApplication } from "@nestjs/common";

// ── Hermetic env — MUST run before any module under test is evaluated ──────
// `src/app/index.ts` calls `app.listen(config.port)` at import time — pin PORT
// to an ephemeral port first (dotenv does not override already-set vars).
process.env.PORT = "0";

// Dynamic imports AFTER the env stub (ESM evaluates static imports first).
const { default: expressApp } = await import("../../../src/app/index.js");
const { NestFactory } = await import("@nestjs/core");
const { AppModule } = await import("../../../src/nest/app.module.js");
const { configureNestShellApp } = await import("../../../src/nest/configure-app.js");
const { mountExpressErrorBridge } = await import("../../../src/nest/exception.filter.js");
const { prisma } = await import("../../../src/shared/infrastructure/database/client.js");
const { checkDatabase, disconnectDatabase } = await import("../helpers/db.js");

const db = await checkDatabase();

// ── Fixture resolution (deterministic against the seeded DB) ──────────────

interface Fixtures {
  /** A seeded radical business-key ID (e.g. "rad_0001") — deterministic 200. */
  radicalId: string | null;
  /** A radical that has at least one character via the CharacterRadical junction. */
  radicalWithCharacters: string | null;
  /** A character glyph that has at least one radical link (`/radicals/character/:glyph` 2xx). */
  glyphWithRadicals: string | null;
  /** A character glyph with NO radical links (`/radicals/character/:glyph` → 200 []). */
  glyphNoRadicals: string | null;
  /** A seeded character glyph for foundations `GET /v1/characters/:glyph` 200. */
  characterGlyph: string | null;
}

/** Any ID that is NOT a seeded radical business-key ID (seeds are `rad_XXXX`). */
const UNKNOWN_RADICAL_ID = "rad_nonexistent";

async function resolveFixtures(): Promise<Fixtures> {
  const radicalRow = await prisma.radical.findFirst({ orderBy: { id: "asc" } });
  const withChars = await prisma.characterRadical.findFirst({
    select: { radicalId: true },
    orderBy: { radicalId: "asc" },
  });
  const glyphWithRadicals = await prisma.characterRadical.findFirst({
    select: { characterGlyph: true },
    orderBy: { characterGlyph: "asc" },
  });
  // Character model relation for radicals is `radicals` (CharacterRadical[]).
  const glyphNoRadicals = await prisma.character.findFirst({
    where: { radicals: { none: {} } },
    select: { glyph: true },
    orderBy: { id: "asc" },
  });
  const characterGlyph = await prisma.character.findFirst({
    select: { glyph: true },
    orderBy: { id: "asc" },
  });
  return {
    radicalId: radicalRow?.id ?? null,
    radicalWithCharacters: withChars?.radicalId ?? null,
    glyphWithRadicals: glyphWithRadicals?.characterGlyph ?? null,
    glyphNoRadicals: glyphNoRadicals?.glyph ?? null,
    characterGlyph: characterGlyph?.glyph ?? null,
  };
}

const fixtures: Fixtures | null = db.available ? await resolveFixtures() : null;

// ── Parity suite ───────────────────────────────────────────────────────────

describe.skipIf(!db.available)(
  "Nest radicals + foundations ↔ Express parity (integration, DB)",
  () => {
    let nestApp: INestApplication | undefined;
    let nestServer: Server;

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
    });

    afterAll(async () => {
      await nestApp?.close();
      await disconnectDatabase();
    });

    /** Fire the same request on both apps and return both responses. */
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

    /**
     * radicals 4xx: identical status; Express `{ error, code }`; Nest envelope
     * `{ code, message, requestId }` with `code` equal to Express `code` and
     * `message` equal to Express `error`.
     */
    function expectParity4xxData(
      res: { expressRes: request.Response; nestRes: request.Response },
      expectedStatus: number,
    ) {
      expect(res.expressRes.status).toBe(expectedStatus);
      expect(res.nestRes.status).toBe(expectedStatus);
      expectEnvelope(res.nestRes);
      expect(res.nestRes.body.code).toBe(res.expressRes.body.code);
      expect(res.nestRes.body.message).toBe(res.expressRes.body.error);
    }

    /**
     * foundations 4xx: identical status; Express emits a plain `{ error }`
     * (NO `code`); Nest envelope `message` is byte-for-byte equal to Express
     * `error` (the Nest `code` follows the backend convention — not asserted
     * against Express, which has none).
     */
    function expectParity4xxNoCode(
      res: { expressRes: request.Response; nestRes: request.Response },
      expectedStatus: number,
    ) {
      expect(res.expressRes.status).toBe(expectedStatus);
      expect(res.nestRes.status).toBe(expectedStatus);
      expectEnvelope(res.nestRes);
      expect(res.nestRes.body.message).toBe(res.expressRes.body.error);
    }

    // ── radicals (Express route file: api/radicalsRoutes.ts) ─────────────

    describe("radicals", () => {
      it("GET /api/v1/radicals — 200 with identical body", async () => {
        const res = await getBoth("/api/v1/radicals");
        expectParity2xx(res);
        expect(Array.isArray(res.expressRes.body)).toBe(true);
      });

      it(
        "GET /api/v1/radicals/:radicalId (existing) — 200 with identical body",
        { skip: !fixtures?.radicalId },
        async () => {
          const res = await getBoth(`/api/v1/radicals/${fixtures!.radicalId}`);
          expectParity2xx(res);
          expect(res.expressRes.body.id).toBe(fixtures!.radicalId);
        },
      );

      it("GET /api/v1/radicals/:radicalId (unknown) — 200 literal null on BOTH apps", async () => {
        // Express `res.json(null)` → 200 with a literal `null` body; the Nest
        // controller's full-@Res `res.json()` mirror reproduces it (Nest's
        // default reply would otherwise strip the null → empty body).
        const res = await getBoth(`/api/v1/radicals/${UNKNOWN_RADICAL_ID}`);
        expect(res.expressRes.status).toBe(200);
        expect(res.nestRes.status).toBe(200);
        expect(res.expressRes.body).toBeNull();
        expect(res.nestRes.body).toBeNull();
      });

      it(
        "GET /api/v1/radicals/character/:glyph (has radicals) — 200 with identical body",
        { skip: !fixtures?.glyphWithRadicals },
        async () => {
          const res = await getBoth(`/api/v1/radicals/character/${fixtures!.glyphWithRadicals}`);
          expectParity2xx(res);
        },
      );

      it(
        "GET /api/v1/radicals/character/:glyph (no radicals) — 200 [] with identical body",
        { skip: !fixtures?.glyphNoRadicals },
        async () => {
          const res = await getBoth(`/api/v1/radicals/character/${fixtures!.glyphNoRadicals}`);
          expectParity2xx(res);
          expect(res.expressRes.body).toEqual([]);
          expect(res.nestRes.body).toEqual([]);
        },
      );

      it(
        "GET /api/v1/radicals/:radicalId/characters (existing) — 200 with identical body",
        { skip: !fixtures?.radicalWithCharacters },
        async () => {
          const res = await getBoth(
            `/api/v1/radicals/${fixtures!.radicalWithCharacters}/characters`,
          );
          expectParity2xx(res);
          expect(res.expressRes.body.radicalId).toBe(fixtures!.radicalWithCharacters);
          expect(Array.isArray(res.expressRes.body.characters)).toBe(true);
        },
      );

      it("GET /api/v1/radicals/:radicalId/characters (unknown) — 404 envelope parity", async () => {
        const res = await getBoth(`/api/v1/radicals/${UNKNOWN_RADICAL_ID}/characters`);
        expectParity4xxData(res, 404);
        expect(res.expressRes.body.code).toBe("NOT_FOUND");
        expect(res.nestRes.body.message).toBe("Failed to load radical characters");
      });
    });

    // ── foundations data routes (Express route file: api/foundationsRoutes.ts) ──

    describe("foundations data", () => {
      it("GET /api/v1/foundations/data/pinyin-tones — 200 with identical body", async () => {
        const res = await getBoth("/api/v1/foundations/data/pinyin-tones");
        expectParity2xx(res);
        expect(Array.isArray(res.expressRes.body.initials)).toBe(true);
        expect(Array.isArray(res.expressRes.body.combinations)).toBe(true);
      });

      it("GET /api/v1/foundations/data/pinyin-character-map — 200 with identical body", async () => {
        const res = await getBoth("/api/v1/foundations/data/pinyin-character-map");
        expectParity2xx(res);
        expect(typeof res.expressRes.body).toBe("object");
      });

      it("GET /api/v1/foundations/data/strokes — 200 with identical body", async () => {
        const res = await getBoth("/api/v1/foundations/data/strokes");
        expectParity2xx(res);
        expect(Array.isArray(res.expressRes.body.strokes)).toBe(true);
        expect(Array.isArray(res.expressRes.body.strokeOrderRules)).toBe(true);
      });
    });

    // ── the /v1/characters/:glyph route-shadow (foundations wins, like Express) ──

    describe("characters/:glyph route-shadowing (foundations wins — matches Express)", () => {
      it(
        "GET /api/v1/characters/:glyph (existing) — 200 FOUNDATIONS shape, deep-equal",
        { skip: !fixtures?.characterGlyph },
        async () => {
          const res = await getBoth(`/api/v1/characters/${fixtures!.characterGlyph}`);
          expectParity2xx(res);
          // Both apps serve the FOUNDATIONS CharacterDetailResponse (foundations
          // shadows the characters module's single-segment :glyph).
          expect(res.expressRes.body.glyph).toBe(fixtures!.characterGlyph);
          expect(Array.isArray(res.expressRes.body.readings)).toBe(true);
          expect(res.expressRes.body.readings).toEqual(res.nestRes.body.readings);
        },
      );

      it("GET /api/v1/characters/:glyph (non-CJK 'abc') — 404 foundations parity", async () => {
        // The characters table covers all CJK regex codepoints, so this 404 is
        // reachable only via a non-CJK single-segment path — foundations has no
        // CJK regex gate and 404s on the missing glyph.
        const res = await getBoth("/api/v1/characters/abc");
        expectParity4xxNoCode(res, 404);
        expect(res.expressRes.body.error).toBe('Character "abc" not found');
        expect(res.nestRes.body.message).toBe('Character "abc" not found');
      });

      it("GET /api/v1/characters/search?q=好 — 404 foundations shadow parity", async () => {
        // glyph = "search" is captured by foundations' :glyph (NOT the characters
        // module's /search handler — that is shadowed), exactly like Express.
        const res = await getBoth("/api/v1/characters/search?q=好");
        expectParity4xxNoCode(res, 404);
        expect(res.nestRes.body.message).toBe('Character "search" not found');
      });

      it("GET /api/v1/characters/frequency — 404 foundations shadow parity", async () => {
        const res = await getBoth("/api/v1/characters/frequency");
        expectParity4xxNoCode(res, 404);
        expect(res.nestRes.body.message).toBe('Character "frequency" not found');
      });
    });
  },
);
