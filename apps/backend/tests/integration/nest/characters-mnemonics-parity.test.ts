/**
 * @file apps/backend/tests/integration/nest/characters-mnemonics-parity.test.ts
 * @description Characters + Mnemonics ↔ Express parity harness (Story 24-8 —
 * Characters + Mnemonics Port).
 *
 * Boots BOTH apps in-process via supertest:
 *   - the production Express app (`src/app/index.ts` default export — mounts
 *     the real characters + pinyin + mnemonics route files), and
 *   - the NestJS 11 shell (`NestFactory.create(AppModule)` + the real
 *     `configureNestShellApp` + `mountExpressErrorBridge` boot shape).
 *
 * ## characters (7 routes — public static data, no auth/cache/external)
 * All 7 route handlers ported under a TWO-controller module
 * (`CharactersNestController` + `PinyinNestController`). NOTE: on the LIVE
 * Express app the characters module only OWNS the deep routes
 * (`/:glyph/phonetic`, `/:glyph/homophones`, `/:glyph/decomposition`) and
 * `/v1/pinyin/search`; the single-segment `GET /v1/characters/:glyph` (and
 * therefore `/search` + `/frequency`) is shadowed by the FOUNDATIONS module's
 * `characters/:glyph` route (mounted BEFORE characters in `app/routes.ts`) — a
 * pre-existing cross-module collision. So:
 *   - Deep routes + pinyin: 2xx identical body (deep-equal) + 4xx (status +
 *     envelope `code`/`message` equal to the Express legacy body).
 *   - Single-segment `:glyph` + `/search` + `/frequency`: asserted as Nest-only
 *     smokes (the ported handlers work on the shell) and flagged for 24-9, when
 *     foundations is ported and the Nest shadow will match Express.
 *   - 404 reachability: the characters table covers ALL regex-range codepoints
 *     (~103k glyphs), so the homophones/decomposition "not found" 404 branches
 *     are UNREACHABLE on both apps (an existing glyph returns 200 with empty
 *     arrays). The phonetic 404 is reached via a glyph with no phonetic
 *     component (`phoneticComponentId: null`).
 *
 * ## mnemonics (4 routes — cache + gemini + calibrated OptionalAuthGuard)
 * NO REAL GEMINI/GCS IS HIT. All paths are deterministic fixtures that
 * short-circuit before the AI call:
 *   - Pictograph characters (seed `classification: "pictograph"`, e.g. 丁)
 *     short-circuit `getMnemonic` (step 4) AND `generateMnemonic` (early
 *     return) to a static note — no Gemini, no DB write, deterministic 2xx.
 *   - Non-pictograph characters with NO mnemonic story → `{ mnemonic: null }`
 *     (deterministic 200, deep-equal).
 *   - The write surface exercises the real DB for PUT / DELETE with a
 *     registered user; POST generate success is proven via the pictograph 201
 *     (no Gemini). The non-pictograph AI-generate path is proven separately
 *     with a MOCKED `GeminiService` in the controller unit test
 *     (`modules/mnemonics/nest/__tests__/mnemonics-nest-controller.test.ts`).
 *     PUT runs SEQUENTIALLY across the two apps (both upsert the SAME
 *     `(characterGlyph, userId)` row — a parallel create would race the
 *     `@@unique` constraint and 500 one side).
 *   - CALIBRATED GUEST SEMANTICS (F6): a guest (no token) GET returns only
 *     shared/static data and NEVER another user's edited story — asserted by
 *     creating a user-edited story then proving a guest still gets
 *     `{ mnemonic: null }`. Writes (POST/PUT/DELETE) require auth → 401
 *     AUTH_REQUIRED for guests (RequireAuthGuard parity with Express requireAuth).
 *   - 4xx: status + Nest envelope `code`/`message` byte-for-byte equal to
 *     Express `{ error, code, message }`.
 *
 * Rate-limit isolation: both apps set `trust proxy 1`, and every mnemonics /
 * register request sends a UNIQUE `X-Forwarded-For` (per-route limiters:
 * GET 60/min, POST 10/min, PUT 30/min, DELETE 30/min, auth 5/min) so each
 * request gets its own bucket and never trips a limiter mid-suite.
 *
 * DB-backed (real Prisma against the test database). A missing `DATABASE_URL` /
 * unreachable DB skips the whole suite (the `checkDatabase` pattern).
 *
 * Run via: cd apps/backend && npm run test:integration
 */
import "reflect-metadata";
import type { Server } from "node:http";
import type { Express } from "express";
import crypto from "node:crypto";
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
  /** A seeded character glyph that has a phonetic component. */
  phoneticGlyph: string | null;
  /** A seeded character glyph with NO phonetic component (deterministic 404 for /phonetic). */
  noPhoneticGlyph: string | null;
  /** A seeded character glyph that has at least one homophone. */
  homophoneGlyph: string | null;
  /** A seeded character glyph that has decomposition components. */
  decompositionGlyph: string | null;
  /** A pinyin syllable present in pinyinCharacterMapping (for /pinyin/search). */
  pinyinQ: string | null;
  /** A seeded character with classification === "pictograph" (mnemonics static note). */
  pictographGlyph: string | null;
  /** A seeded NON-pictograph glyph (mnemonics GET → { mnemonic: null }). */
  plainGlyph: string | null;
  /** A distinct NON-pictograph glyph for the mnemonics write (PUT/DELETE) tests. */
  writeGlyph: string | null;
}

/** Regex for validating a single Chinese character glyph (mirrors the controllers). */
const CHINESE_CHAR_REGEX = /^[\u4e00-\u9fff\u3400-\u4dbf]$/;

async function resolveFixtures(): Promise<Fixtures> {
  // Some seed glyphs (esp. low-id rows) are NOT single CJK chars per the
  // controllers' regex — pick fixtures that pass it so the handlers exercise
  // the intended branch (service lookup / 404), not the regex 400.
  const phoneticCandidates = await prisma.character.findMany({
    where: { phoneticComponentId: { not: null } },
    select: { glyph: true },
    orderBy: { id: "asc" },
    take: 500,
  });
  const phonetic = phoneticCandidates.find((c) => CHINESE_CHAR_REGEX.test(c.glyph)) ?? null;
  const noPhoneticCandidates = await prisma.character.findMany({
    where: { phoneticComponentId: null },
    select: { glyph: true },
    orderBy: { id: "asc" },
    take: 500,
  });
  const noPhonetic = noPhoneticCandidates.find((c) => CHINESE_CHAR_REGEX.test(c.glyph)) ?? null;
  // A pinyin shared by >=2 readings ⇒ the owning glyph has a homophone.
  // (pinyin is a required String — no null filter needed in groupBy.)
  const homophoneGroup = await prisma.characterReading.groupBy({
    by: ["pinyin"],
    _count: { _all: true },
    having: { pinyin: { _count: { gte: 2 } } },
    orderBy: { pinyin: "asc" },
    take: 1,
  });
  const homophone = homophoneGroup[0]
    ? await prisma.characterReading.findFirst({
        where: { pinyin: homophoneGroup[0].pinyin },
        select: { character: { select: { glyph: true } } },
        orderBy: { characterId: "asc" },
      })
    : null;
  const decomposition = await prisma.characterComponent.findFirst({
    select: { character: { select: { glyph: true } } },
    orderBy: { id: "asc" },
  });
  const pinyinMapping = await prisma.pinyinCharacterMapping.findFirst({
    select: { pinyinSyllable: { select: { syllable: true } } },
    orderBy: { pinyinSyllableId: "asc" },
  });
  const pictograph = await prisma.character.findFirst({
    where: { classification: "pictograph" },
    select: { glyph: true },
    orderBy: { id: "asc" },
  });
  const plain = await prisma.character.findFirst({
    where: { classification: { not: "pictograph" } },
    select: { glyph: true },
    orderBy: { id: "asc" },
  });
  const write = await prisma.character.findFirst({
    where: { classification: { not: "pictograph" }, glyph: { not: plain?.glyph ?? "" } },
    select: { glyph: true },
    orderBy: { id: "asc" },
  });

  // NOTE: no "missing glyph" fixture exists — the characters table covers all
  // ~27,584 regex-range codepoints (103k total glyphs), so the homophones /
  // decomposition 404 branches (glyph not found) are UNREACHABLE on both apps
  // (an existing glyph always returns 200 with empty arrays). The phonetic 404
  // is reachable via a glyph with no phonetic component (below).
  return {
    phoneticGlyph: phonetic?.glyph ?? null,
    noPhoneticGlyph: noPhonetic?.glyph ?? null,
    homophoneGlyph: homophone?.character.glyph ?? null,
    decompositionGlyph: decomposition?.character.glyph ?? null,
    pinyinQ: pinyinMapping?.pinyinSyllable.syllable ?? null,
    pictographGlyph: pictograph?.glyph ?? null,
    plainGlyph: plain?.glyph ?? null,
    writeGlyph: write?.glyph ?? null,
  };
}

const fixtures: Fixtures | null = db.available ? await resolveFixtures() : null;

// ── Test-net IPs (unique per request — never trips a limiter) ──────────────

/** TEST-NET-3 range (203.0.113.0/24) — documented, never routable. */
let ipCounter = 0;
function nextIp(): string {
  ipCounter += 1;
  return `203.0.113.${(ipCounter % 200) + 1}`;
}

// ── Parity suite ───────────────────────────────────────────────────────────

describe.skipIf(!db.available)(
  "Nest characters + mnemonics ↔ Express parity (integration, DB)",
  () => {
    let nestApp: INestApplication | undefined;
    let nestServer: Server;
    /** Registered user for the mnemonics write-surface parity tests. */
    let mnemonicUserId: string | undefined;
    let mnemonicAccessToken: string | undefined;

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

      // Clean slate for the deterministic mnemonic fixtures: guarantee no
      // pre-existing story for the "no story → { mnemonic: null }" glyphs.
      if (fixtures?.plainGlyph) {
        await prisma.mnemonicStory.deleteMany({
          where: { characterGlyph: fixtures.plainGlyph },
        });
      }
      if (fixtures?.writeGlyph) {
        await prisma.mnemonicStory.deleteMany({
          where: { characterGlyph: fixtures.writeGlyph },
        });
      }

      // Register a real user for the mnemonics write surface (via the Express
      // app; both apps share the DB + JWT secret, so the token works on both).
      const runId = crypto.randomBytes(4).toString("hex");
      const email = `mnem-parity-${runId}@example.com`;
      const register = await request(expressApp)
        .post("/api/v1/auth/register")
        .set("X-Forwarded-For", nextIp())
        .send({ email, password: "ValidPass123", displayName: "Mnemonic Parity" });
      expect(register.status).toBe(201);
      mnemonicUserId = register.body.data.user.id as string;
      mnemonicAccessToken = register.body.data.accessToken as string;
      expect(typeof mnemonicUserId).toBe("string");
      expect(typeof mnemonicAccessToken).toBe("string");
    });

    afterAll(async () => {
      if (mnemonicUserId) {
        await prisma.mnemonicStory.deleteMany({ where: { userId: mnemonicUserId } });
        await prisma.session.deleteMany({ where: { userId: mnemonicUserId } });
        await prisma.user.deleteMany({ where: { id: mnemonicUserId } });
      }
      // Remove any fixture rows created by the harness (idempotent).
      if (fixtures?.writeGlyph) {
        await prisma.mnemonicStory.deleteMany({ where: { characterGlyph: fixtures.writeGlyph } });
      }
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
     * characters/pinyin 4xx: identical status; Express legacy `{ error, code }`;
     * Nest envelope `{ code, message, requestId }` with `code` equal to Express
     * `code` and `message` equal to Express `error` (the legacy key's human
     * text is reproduced as the envelope message).
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
     * mnemonics 4xx: identical status; Express `{ error, code, message }`; Nest
     * envelope `code`/`message` byte-for-byte equal to Express.
     */
    function expectParity4xxMnem(
      res: { expressRes: request.Response; nestRes: request.Response },
      expectedStatus: number,
    ) {
      expect(res.expressRes.status).toBe(expectedStatus);
      expect(res.nestRes.status).toBe(expectedStatus);
      expectEnvelope(res.nestRes);
      expect(res.nestRes.body.code).toBe(res.expressRes.body.code);
      expect(res.nestRes.body.message).toBe(res.expressRes.body.message);
    }

    /** Recursively drop timestamps so two app responses deep-equal on stable fields. */
    function stripTimestamps(value: unknown): unknown {
      if (Array.isArray(value)) return value.map(stripTimestamps);
      if (value && typeof value === "object") {
        const out: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
          if (k === "createdAt" || k === "updatedAt") continue;
          out[k] = stripTimestamps(v);
        }
        return out;
      }
      return value;
    }

    /** 2xx mnemonic parity: status equal + stable fields deep-equal + ISO timestamps on both. */
    function expectMnemonicParity(res: {
      expressRes: request.Response;
      nestRes: request.Response;
    }) {
      expect(res.expressRes.status).toBeGreaterThanOrEqual(200);
      expect(res.expressRes.status).toBeLessThan(300);
      expect(res.nestRes.status).toBe(res.expressRes.status);
      expect(stripTimestamps(res.nestRes.body)).toEqual(stripTimestamps(res.expressRes.body));
      // Both carry ISO createdAt/updatedAt somewhere in the body.
      const flat = (v: unknown): string[] =>
        v && typeof v === "object"
          ? Object.entries(v as Record<string, unknown>).flatMap(([k, val]) =>
              k === "createdAt" || k === "updatedAt" ? [String(val)] : flat(val),
            )
          : [];
      const times = (b: unknown) => flat(b).filter((t) => !Number.isNaN(Date.parse(t)));
      expect(times(res.expressRes.body).length).toBeGreaterThan(0);
      expect(times(res.nestRes.body).length).toBeGreaterThan(0);
    }

    // ── characters (Express route file: api/charactersRoutes.ts) ──────────

    describe("characters", () => {
      // NOTE: the characters module owns only the DEEP routes
      // (`/:glyph/phonetic`, `/:glyph/homophones`, `/:glyph/decomposition`) +
      // `/v1/pinyin/search` on the LIVE Express app. The single-segment
      // `GET /v1/characters/:glyph` (and therefore `/search` + `/frequency`) is
      // shadowed by the FOUNDATIONS module's `characters/:glyph` route
      // (mounted BEFORE characters in app/routes.ts) — a pre-existing cross-
      // module collision. Parity for those three is only possible once 24-9
      // ports foundations to Nest (which will shadow them identically); until
      // then they are asserted as Nest-only smokes below.

      it("GET /api/v1/characters/:glyph/phonetic — 200 with identical body", async () => {
        const res = await getBoth(`/api/v1/characters/${fixtures!.phoneticGlyph}/phonetic`);
        expectParity2xx(res);
      });

      it(
        "GET /api/v1/characters/:glyph/homophones — 200 with identical body",
        { skip: !fixtures?.homophoneGlyph },
        async () => {
          const res = await getBoth(`/api/v1/characters/${fixtures!.homophoneGlyph}/homophones`);
          expectParity2xx(res);
        },
      );

      it(
        "GET /api/v1/characters/:glyph/homophones?exactTone=true — 200 with identical body",
        { skip: !fixtures?.homophoneGlyph },
        async () => {
          const res = await getBoth(
            `/api/v1/characters/${fixtures!.homophoneGlyph}/homophones?exactTone=true`,
          );
          expectParity2xx(res);
        },
      );

      it(
        "GET /api/v1/characters/:glyph/decomposition — 200 with identical body",
        { skip: !fixtures?.decompositionGlyph },
        async () => {
          const res = await getBoth(
            `/api/v1/characters/${fixtures!.decompositionGlyph}/decomposition`,
          );
          expectParity2xx(res);
        },
      );

      it(
        "GET /api/v1/characters/:glyph/phonetic — 404 (no phonetic component)",
        { skip: !fixtures?.noPhoneticGlyph },
        async () => {
          const res = await getBoth(`/api/v1/characters/${fixtures!.noPhoneticGlyph}/phonetic`);
          expectParity4xxData(res, 404);
        },
      );

      it(
        "GET /api/v1/characters/:glyph/decomposition — 200 with identical body",
        { skip: !fixtures?.decompositionGlyph },
        async () => {
          const res = await getBoth(
            `/api/v1/characters/${fixtures!.decompositionGlyph}/decomposition`,
          );
          expectParity2xx(res);
        },
      );
    });

    // ── characters single-segment :glyph — foundations shadow (restored in 24-9) ──

    describe("characters :glyph single-segment (foundations shadow — restored by 24-9)", () => {
      // The live Express app serves `GET /v1/characters/:glyph` (single segment)
      // from the FOUNDATIONS module (`getCharacterByGlyph`), which shadows the
      // characters module's `:glyph` + `/search` + `/frequency` (foundations is
      // mounted before characters in app/routes.ts). 24-9 ports foundations to
      // Nest (imported before CharactersModule in AppModule), restoring the
      // shadow — so these are now FULL parity assertions (both apps serve the
      // foundations handler), not Nest-only smokes. The dedicated 24-9 harness
      // (`radicals-foundations-parity.test.ts`) covers the same shadow deeper.
      it("GET /api/v1/characters/:glyph — 200 foundations shape, full parity", async () => {
        const glyph = fixtures!.plainGlyph!; // a real seeded glyph (foundations has no regex gate)
        const res = await getBoth(`/api/v1/characters/${glyph}`);
        expectParity2xx(res);
        // Both apps serve the FOUNDATIONS CharacterDetailResponse shape (NOT the
        // characters module shape) — foundations shadows characters' :glyph.
        expect(res.expressRes.body.glyph).toBe(glyph);
        expect(Array.isArray(res.expressRes.body.readings)).toBe(true);
      });

      it("GET /api/v1/characters/abc — 404 (foundations, not found) full parity", async () => {
        const res = await getBoth("/api/v1/characters/abc");
        expect(res.expressRes.status).toBe(404);
        expect(res.nestRes.status).toBe(404);
        expectEnvelope(res.nestRes);
        // foundations has NO CJK validation and no `code` in its Express body —
        // the envelope message reproduces the Express `error` text.
        expect(res.nestRes.body.message).toBe(res.expressRes.body.error);
        expect(res.nestRes.body.message).toBe('Character "abc" not found');
      });

      it("GET /api/v1/characters/search + /frequency — 404 (foundations shadow) full parity", async () => {
        for (const p of ["/api/v1/characters/search?q=好", "/api/v1/characters/frequency"]) {
          const res = await getBoth(p);
          expect(res.expressRes.status).toBe(404);
          expect(res.nestRes.status).toBe(404);
          expectEnvelope(res.nestRes);
          expect(res.nestRes.body.message).toBe(res.expressRes.body.error);
        }
      });
    });

    // ── pinyin (Express route file: api/pinyinRoutes.ts) ──────────────────

    describe("pinyin", () => {
      it(
        "GET /api/v1/pinyin/search?q=… — 200 with identical body",
        { skip: !fixtures?.pinyinQ },
        async () => {
          const res = await getBoth(`/api/v1/pinyin/search?q=${fixtures!.pinyinQ}`);
          expectParity2xx(res);
        },
      );

      it("GET /api/v1/pinyin/search — 400 (missing q)", async () => {
        const res = await getBoth("/api/v1/pinyin/search");
        expectParity4xxData(res, 400);
      });

      it("GET /api/v1/pinyin/search?q=ma&tone=9 — 400 (invalid tone)", async () => {
        const res = await getBoth("/api/v1/pinyin/search?q=ma&tone=9");
        expectParity4xxData(res, 400);
      });
    });

    // ── mnemonics (Express route file: api/mnemonicsRoutes.ts) ────────────

    describe("mnemonics", () => {
      it("GET /api/v1/mnemonics/:glyph (pictograph, guest) — 200 static note, stable-field parity", async () => {
        const res = await getBoth(`/api/v1/mnemonics/${fixtures!.pictographGlyph}`);
        expectMnemonicParity(res);
        // Deterministic static-note contract on BOTH apps (no Gemini hit).
        expect(res.expressRes.body.mnemonic.isPictograph).toBe(true);
        expect(res.nestRes.body.mnemonic.isPictograph).toBe(true);
        expect(res.nestRes.body.mnemonic.characterGlyph).toBe(fixtures!.pictographGlyph);
      });

      it("GET /api/v1/mnemonics/:glyph (non-pictograph, guest, no story) — 200 { mnemonic: null } deep-equal", async () => {
        const res = await getBoth(`/api/v1/mnemonics/${fixtures!.plainGlyph}`);
        expectParity2xx(res);
        expect(res.expressRes.body).toEqual({ mnemonic: null });
        expect(res.nestRes.body).toEqual({ mnemonic: null });
      });

      it("GET /api/v1/mnemonics/ab (guest) — 400 (invalid character)", async () => {
        const res = await getBoth("/api/v1/mnemonics/ab");
        expectParity4xxMnem(res, 400);
      });

      it("POST /api/v1/mnemonics/:glyph (guest) — 401 AUTH_REQUIRED parity", async () => {
        const [expressRes, nestRes] = await Promise.all([
          request(expressApp)
            .post(`/api/v1/mnemonics/${fixtures!.plainGlyph}`)
            .set("X-Forwarded-For", nextIp()),
          request(nestServer)
            .post(`/api/v1/mnemonics/${fixtures!.plainGlyph}`)
            .set("X-Forwarded-For", nextIp()),
        ]);
        expectParity4xxMnem({ expressRes, nestRes }, 401);
        expect(expressRes.body.code).toBe("AUTH_REQUIRED");
        expect(expressRes.body.message).toBe("Please sign in to access this feature");
      });

      it("POST /api/v1/mnemonics/ab (authed) — 400 (invalid character)", async () => {
        const [expressRes, nestRes] = await Promise.all([
          request(expressApp)
            .post("/api/v1/mnemonics/ab")
            .set("Authorization", `Bearer ${mnemonicAccessToken}`)
            .set("X-Forwarded-For", nextIp()),
          request(nestServer)
            .post("/api/v1/mnemonics/ab")
            .set("Authorization", `Bearer ${mnemonicAccessToken}`)
            .set("X-Forwarded-For", nextIp()),
        ]);
        expectParity4xxMnem({ expressRes, nestRes }, 400);
      });

      it("POST /api/v1/mnemonics/:glyph (pictograph, authed) — 201 static note (no Gemini), stable-field parity", async () => {
        const [expressRes, nestRes] = await Promise.all([
          request(expressApp)
            .post(`/api/v1/mnemonics/${fixtures!.pictographGlyph}`)
            .set("Authorization", `Bearer ${mnemonicAccessToken}`)
            .set("X-Forwarded-For", nextIp()),
          request(nestServer)
            .post(`/api/v1/mnemonics/${fixtures!.pictographGlyph}`)
            .set("Authorization", `Bearer ${mnemonicAccessToken}`)
            .set("X-Forwarded-For", nextIp()),
        ]);
        expect(expressRes.status).toBe(201);
        expect(nestRes.status).toBe(201);
        expectMnemonicParity({ expressRes, nestRes });
        expect(nestRes.body.isPictograph).toBe(true);
        expect(nestRes.body.characterGlyph).toBe(fixtures!.pictographGlyph);
      });

      it("PUT /api/v1/mnemonics/:glyph (authed) — 200 upsert, stable-field parity", async () => {
        const story = "A woman (女) holding a child (子) represents goodness.";
        // Run SEQUENTIALLY (not Promise.all): both apps upsert the SAME
        // (characterGlyph, userId) row — a parallel create would race the
        // @@unique([characterGlyph, userId]) constraint and 500 one side.
        const expressRes = await request(expressApp)
          .put(`/api/v1/mnemonics/${fixtures!.writeGlyph}`)
          .set("Authorization", `Bearer ${mnemonicAccessToken}`)
          .set("X-Forwarded-For", nextIp())
          .send({ story });
        const nestRes = await request(nestServer)
          .put(`/api/v1/mnemonics/${fixtures!.writeGlyph}`)
          .set("Authorization", `Bearer ${mnemonicAccessToken}`)
          .set("X-Forwarded-For", nextIp())
          .send({ story });
        expect(expressRes.status).toBe(200);
        expect(nestRes.status).toBe(200);
        expectMnemonicParity({ expressRes, nestRes });
        // Both persisted the SAME user-edited row for the SAME user + glyph.
        expect(nestRes.body.story).toBe(story);
        expect(nestRes.body.isEdited).toBe(true);
        expect(nestRes.body.isPictograph).toBe(false);
        expect(nestRes.body.characterGlyph).toBe(fixtures!.writeGlyph);
      });

      it("PUT /api/v1/mnemonics/:glyph (authed, empty story) — 400 validation parity", async () => {
        const [expressRes, nestRes] = await Promise.all([
          request(expressApp)
            .put(`/api/v1/mnemonics/${fixtures!.writeGlyph}`)
            .set("Authorization", `Bearer ${mnemonicAccessToken}`)
            .set("X-Forwarded-For", nextIp())
            .send({ story: "   " }),
          request(nestServer)
            .put(`/api/v1/mnemonics/${fixtures!.writeGlyph}`)
            .set("Authorization", `Bearer ${mnemonicAccessToken}`)
            .set("X-Forwarded-For", nextIp())
            .send({ story: "   " }),
        ]);
        expectParity4xxMnem({ expressRes, nestRes }, 400);
      });

      it("GET /api/v1/mnemonics/:glyph (authed, sees own user-edited story) — 200 stable-field parity", async () => {
        const [expressRes, nestRes] = await Promise.all([
          request(expressApp)
            .get(`/api/v1/mnemonics/${fixtures!.writeGlyph}`)
            .set("Authorization", `Bearer ${mnemonicAccessToken}`),
          request(nestServer)
            .get(`/api/v1/mnemonics/${fixtures!.writeGlyph}`)
            .set("Authorization", `Bearer ${mnemonicAccessToken}`),
        ]);
        expectMnemonicParity({ expressRes, nestRes });
        expect(nestRes.body.mnemonic.isEdited).toBe(true);
        expect(nestRes.body.mnemonic.characterGlyph).toBe(fixtures!.writeGlyph);
      });

      it("GET /api/v1/mnemonics/:glyph (guest, never another user's story) — 200 { mnemonic: null } deep-equal", async () => {
        // A user-edited story EXISTS for writeGlyph, but a guest (no token)
        // must NOT see it — calibrated F6: guest → empty, never another user's
        // rows. Both apps return { mnemonic: null }.
        const res = await getBoth(`/api/v1/mnemonics/${fixtures!.writeGlyph}`);
        expectParity2xx(res);
        expect(res.expressRes.body).toEqual({ mnemonic: null });
        expect(res.nestRes.body).toEqual({ mnemonic: null });
      });

      it("DELETE /api/v1/mnemonics/:glyph (authed) — 204 parity", async () => {
        const [expressRes, nestRes] = await Promise.all([
          request(expressApp)
            .delete(`/api/v1/mnemonics/${fixtures!.writeGlyph}`)
            .set("Authorization", `Bearer ${mnemonicAccessToken}`)
            .set("X-Forwarded-For", nextIp()),
          request(nestServer)
            .delete(`/api/v1/mnemonics/${fixtures!.writeGlyph}`)
            .set("Authorization", `Bearer ${mnemonicAccessToken}`)
            .set("X-Forwarded-For", nextIp()),
        ]);
        expect(expressRes.status).toBe(204);
        expect(nestRes.status).toBe(204);
        expect(nestRes.body).toEqual({});
        expect(expressRes.body).toEqual({});
      });

      it("DELETE /api/v1/mnemonics/:glyph (guest) — 401 AUTH_REQUIRED parity", async () => {
        const [expressRes, nestRes] = await Promise.all([
          request(expressApp)
            .delete(`/api/v1/mnemonics/${fixtures!.plainGlyph}`)
            .set("X-Forwarded-For", nextIp()),
          request(nestServer)
            .delete(`/api/v1/mnemonics/${fixtures!.plainGlyph}`)
            .set("X-Forwarded-For", nextIp()),
        ]);
        expectParity4xxMnem({ expressRes, nestRes }, 401);
      });
    });
  },
);
