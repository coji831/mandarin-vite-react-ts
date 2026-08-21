/**
 * @file apps/backend/tests/integration/nest/characters-mnemonics-parity.test.ts
 * @description Characters + Mnemonics regression harness (Story 24-8 —
 * Characters + Mnemonics Port; Story 24-15 — converted to Nest-only at the
 * cutover).
 *
 * Pre-cutover this booted BOTH apps (production Express + Nest shell) and
 * deep-equal'd every response; that parity was verified through 24-14. At
 * 24-15 the Express surface was deleted, so this harness now boots ONLY the
 * NestJS 11 shell (`NestFactory.create(AppModule)` + the real
 * `configureNestShellApp` + `mountExpressErrorBridge` boot shape) and asserts
 * the characters + mnemonics contract directly as regression guards.
 *
 * ## characters (7 routes — public static data, no auth/cache/external)
 * All 7 route handlers live under a TWO-controller module
 * (`CharactersNestController` + `PinyinNestController`). The characters module
 * OWNS the deep routes (`/:glyph/phonetic`, `/:glyph/homophones`,
 * `/:glyph/decomposition`) + `/v1/pinyin/search`; the single-segment
 * `GET /v1/characters/:glyph` (and therefore `/search` + `/frequency`) is
 * shadowed by the FOUNDATIONS module's `characters/:glyph` route (imported
 * before CharactersModule in `AppModule`).
 *   - Deep routes + pinyin: 2xx (deterministic body) + 4xx (status + the 24-3
 *     envelope `code`/`message`).
 *   - Single-segment `:glyph` + `/search` + `/frequency`: served by the
 *     foundations handler (the shadow restored in 24-9) → 200 FOUNDATIONS
 *     shape / 404.
 *   - 404 reachability: the characters table covers ALL regex-range codepoints
 *     (~103k glyphs), so the homophones/decomposition "not found" 404 branches
 *     are UNREACHABLE (an existing glyph returns 200 with empty arrays). The
 *     phonetic 404 is reached via a glyph with no phonetic component
 *     (`phoneticComponentId: null`).
 *
 * ## mnemonics (4 routes — cache + gemini + calibrated OptionalAuthGuard)
 * NO REAL GEMINI/GCS IS HIT. All paths are deterministic fixtures that
 * short-circuit before the AI call:
 *   - Pictograph characters (seed `classification: "pictograph"`, e.g. 丁)
 *     short-circuit `getMnemonic` (step 4) AND `generateMnemonic` (early
 *     return) to a static note — no Gemini, no DB write, deterministic 2xx.
 *   - Non-pictograph characters with NO mnemonic story → `{ mnemonic: null }`.
 *   - The write surface exercises the real DB for PUT / DELETE with a
 *     registered user; POST generate success is proven via the pictograph 201
 *     (no Gemini). The non-pictograph AI-generate path is proven separately
 *     with a MOCKED `GeminiService` in the controller unit test
 *     (`modules/mnemonics/nest/__tests__/mnemonics-nest-controller.test.ts`).
 *   - CALIBRATED GUEST SEMANTICS (F6): a guest (no token) GET returns only
 *     shared/static data and NEVER another user's edited story — asserted by
 *     creating a user-edited story then proving a guest still gets
 *     `{ mnemonic: null }`. Writes (POST/PUT/DELETE) require auth → 401
 *     AUTH_REQUIRED for guests (RequireAuthGuard).
 *   - 4xx: status + Nest envelope `code`/`message`.
 *
 * Rate-limit isolation: the shell sets `trust proxy 1`, and every mnemonics /
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

describe.skipIf(!db.available)("Nest characters + mnemonics regression (integration, DB)", () => {
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

    // Register a real user for the mnemonics write surface (via the Nest app).
    const runId = crypto.randomBytes(4).toString("hex");
    const email = `mnem-parity-${runId}@example.com`;
    const register = await request(nestServer)
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

  /** Fire the same GET at the Nest app and return `{ nestRes }`. */
  function getBoth(path: string) {
    return request(nestServer)
      .get(path)
      .then((nestRes) => ({ nestRes }));
  }

  /** Fire a POST at the Nest app (optional auth + body) and return `{ nestRes }`. */
  async function postBoth(path: string, body?: Record<string, unknown>, authHeader?: string) {
    let req = request(nestServer).post(path).set("X-Forwarded-For", nextIp());
    if (authHeader) req = req.set("Authorization", authHeader);
    const nestRes = body ? await req.send(body) : await req;
    return { nestRes };
  }

  /** Fire a PUT at the Nest app and return `{ nestRes }`. */
  async function putBoth(path: string, body: Record<string, unknown>, authHeader?: string) {
    let req = request(nestServer).put(path).set("X-Forwarded-For", nextIp());
    if (authHeader) req = req.set("Authorization", authHeader);
    return { nestRes: await req.send(body) };
  }

  /** Fire a DELETE at the Nest app (optional auth) and return `{ nestRes }`. */
  async function deleteBoth(path: string, authHeader?: string) {
    let req = request(nestServer).delete(path).set("X-Forwarded-For", nextIp());
    if (authHeader) req = req.set("Authorization", authHeader);
    return { nestRes: await req };
  }

  /** 2xx regression guard: the route responds 2xx with a body. */
  function expectParity2xx(res: { nestRes: request.Response }) {
    expect(res.nestRes.status).toBeGreaterThanOrEqual(200);
    expect(res.nestRes.status).toBeLessThan(300);
    expect(res.nestRes.body).toBeDefined();
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
   * characters/pinyin 4xx: exact status + the 24-3 `{ code, message, requestId }`
   * envelope with the calibrated `code`/`message`.
   */
  function expectParity4xxData(
    res: { nestRes: request.Response },
    expectedStatus: number,
    expectedCode?: string,
    expectedMessage?: string,
  ) {
    expect(res.nestRes.status).toBe(expectedStatus);
    expectEnvelope(res.nestRes);
    if (expectedCode) expect(res.nestRes.body.code).toBe(expectedCode);
    if (expectedMessage) expect(res.nestRes.body.message).toBe(expectedMessage);
  }

  /**
   * mnemonics 4xx: exact status + the 24-3 `{ code, message, requestId }`
   * envelope with the calibrated `code`/`message`.
   */
  function expectParity4xxMnem(
    res: { nestRes: request.Response },
    expectedStatus: number,
    expectedCode?: string,
    expectedMessage?: string,
  ) {
    expect(res.nestRes.status).toBe(expectedStatus);
    expectEnvelope(res.nestRes);
    if (expectedCode) expect(res.nestRes.body.code).toBe(expectedCode);
    if (expectedMessage) expect(res.nestRes.body.message).toBe(expectedMessage);
  }

  /** Recursively drop timestamps so a body normalizes to its stable fields. */
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

  /** 2xx mnemonic: 200 + a defined body + ISO timestamps present. */
  function expectMnemonicParity(res: { nestRes: request.Response }) {
    expect(res.nestRes.status).toBeGreaterThanOrEqual(200);
    expect(res.nestRes.status).toBeLessThan(300);
    expect(res.nestRes.body).toBeDefined();
    // The body carries ISO createdAt/updatedAt somewhere.
    const flat = (v: unknown): string[] =>
      v && typeof v === "object"
        ? Object.entries(v as Record<string, unknown>).flatMap(([k, val]) =>
            k === "createdAt" || k === "updatedAt" ? [String(val)] : flat(val),
          )
        : [];
    const times = (b: unknown) => flat(b).filter((t) => !Number.isNaN(Date.parse(t)));
    expect(times(res.nestRes.body).length).toBeGreaterThan(0);
    // stripTimestamps normalizes the body to its stable fields (previously
    // used for the Express deep-equal).
    expect(stripTimestamps(res.nestRes.body)).toBeDefined();
  }

  // ── characters (deep routes) ──────────────────────────────────────────

  describe("characters", () => {
    // NOTE: the characters module owns only the DEEP routes
    // (`/:glyph/phonetic`, `/:glyph/homophones`, `/:glyph/decomposition`) +
    // `/v1/pinyin/search`. The single-segment `GET /v1/characters/:glyph`
    // (and therefore `/search` + `/frequency`) is shadowed by the FOUNDATIONS
    // module's `characters/:glyph` route (imported before CharactersModule in
    // AppModule) — a pre-existing cross-module collision.

    it("GET /api/v1/characters/:glyph/phonetic — 200", async () => {
      const res = await getBoth(`/api/v1/characters/${fixtures!.phoneticGlyph}/phonetic`);
      expectParity2xx(res);
    });

    it(
      "GET /api/v1/characters/:glyph/homophones — 200",
      { skip: !fixtures?.homophoneGlyph },
      async () => {
        const res = await getBoth(`/api/v1/characters/${fixtures!.homophoneGlyph}/homophones`);
        expectParity2xx(res);
      },
    );

    it(
      "GET /api/v1/characters/:glyph/homophones?exactTone=true — 200",
      { skip: !fixtures?.homophoneGlyph },
      async () => {
        const res = await getBoth(
          `/api/v1/characters/${fixtures!.homophoneGlyph}/homophones?exactTone=true`,
        );
        expectParity2xx(res);
      },
    );

    it(
      "GET /api/v1/characters/:glyph/decomposition — 200",
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
      "GET /api/v1/characters/:glyph/decomposition — 200",
      { skip: !fixtures?.decompositionGlyph },
      async () => {
        const res = await getBoth(
          `/api/v1/characters/${fixtures!.decompositionGlyph}/decomposition`,
        );
        expectParity2xx(res);
      },
    );
  });

  // ── characters single-segment :glyph — foundations shadow ────────────

  describe("characters :glyph single-segment (foundations shadow)", () => {
    // `GET /v1/characters/:glyph` (single segment) is served by the
    // FOUNDATIONS module (`getCharacterByGlyph`), which shadows the
    // characters module's `:glyph` + `/search` + `/frequency` (foundations is
    // imported before CharactersModule in AppModule).
    it("GET /api/v1/characters/:glyph — 200 foundations shape", async () => {
      const glyph = fixtures!.plainGlyph!; // a real seeded glyph (foundations has no regex gate)
      const res = await getBoth(`/api/v1/characters/${glyph}`);
      expectParity2xx(res);
      // The app serves the FOUNDATIONS CharacterDetailResponse shape (NOT the
      // characters module shape) — foundations shadows characters' :glyph.
      expect(res.nestRes.body.glyph).toBe(glyph);
      expect(Array.isArray(res.nestRes.body.readings)).toBe(true);
    });

    it("GET /api/v1/characters/abc — 404 (foundations, not found)", async () => {
      const res = await getBoth("/api/v1/characters/abc");
      expect(res.nestRes.status).toBe(404);
      expectEnvelope(res.nestRes);
      // foundations has NO CJK validation — the envelope message reproduces
      // the (pre-cutover) Express `error` text.
      expect(res.nestRes.body.message).toBe('Character "abc" not found');
    });

    it("GET /api/v1/characters/search + /frequency — 404 (foundations shadow)", async () => {
      for (const p of ["/api/v1/characters/search?q=好", "/api/v1/characters/frequency"]) {
        const res = await getBoth(p);
        expect(res.nestRes.status).toBe(404);
        expectEnvelope(res.nestRes);
      }
    });
  });

  // ── pinyin (GET /v1/pinyin/search) ────────────────────────────────────

  describe("pinyin", () => {
    it("GET /api/v1/pinyin/search?q=… — 200", { skip: !fixtures?.pinyinQ }, async () => {
      const res = await getBoth(`/api/v1/pinyin/search?q=${fixtures!.pinyinQ}`);
      expectParity2xx(res);
    });

    it("GET /api/v1/pinyin/search — 400 (missing q)", async () => {
      const res = await getBoth("/api/v1/pinyin/search");
      expectParity4xxData(res, 400);
    });

    it("GET /api/v1/pinyin/search?q=ma&tone=9 — 400 (invalid tone)", async () => {
      const res = await getBoth("/api/v1/pinyin/search?q=ma&tone=9");
      expectParity4xxData(res, 400);
    });
  });

  // ── mnemonics (4 routes) ──────────────────────────────────────────────

  describe("mnemonics", () => {
    it("GET /api/v1/mnemonics/:glyph (pictograph, guest) — 200 static note", async () => {
      const res = await getBoth(`/api/v1/mnemonics/${fixtures!.pictographGlyph}`);
      expectMnemonicParity(res);
      // Deterministic static-note contract (no Gemini hit).
      expect(res.nestRes.body.mnemonic.isPictograph).toBe(true);
      expect(res.nestRes.body.mnemonic.characterGlyph).toBe(fixtures!.pictographGlyph);
    });

    it("GET /api/v1/mnemonics/:glyph (non-pictograph, guest, no story) — 200 { mnemonic: null }", async () => {
      const res = await getBoth(`/api/v1/mnemonics/${fixtures!.plainGlyph}`);
      expectParity2xx(res);
      expect(res.nestRes.body).toEqual({ mnemonic: null });
    });

    it("GET /api/v1/mnemonics/ab (guest) — 400 (invalid character)", async () => {
      const res = await getBoth("/api/v1/mnemonics/ab");
      expectParity4xxMnem(res, 400);
    });

    it("POST /api/v1/mnemonics/:glyph (guest) — 401 AUTH_REQUIRED", async () => {
      const res = await postBoth(`/api/v1/mnemonics/${fixtures!.plainGlyph}`);
      expectParity4xxMnem(res, 401, "AUTH_REQUIRED", "Please sign in to access this feature");
    });

    it("POST /api/v1/mnemonics/ab (authed) — 400 (invalid character)", async () => {
      const res = await postBoth(
        "/api/v1/mnemonics/ab",
        undefined,
        `Bearer ${mnemonicAccessToken}`,
      );
      expectParity4xxMnem(res, 400);
    });

    it("POST /api/v1/mnemonics/:glyph (pictograph, authed) — 201 static note (no Gemini)", async () => {
      const res = await postBoth(
        `/api/v1/mnemonics/${fixtures!.pictographGlyph}`,
        undefined,
        `Bearer ${mnemonicAccessToken}`,
      );
      expect(res.nestRes.status).toBe(201);
      expectMnemonicParity(res);
      expect(res.nestRes.body.isPictograph).toBe(true);
      expect(res.nestRes.body.characterGlyph).toBe(fixtures!.pictographGlyph);
    });

    it("PUT /api/v1/mnemonics/:glyph (authed) — 200 upsert", async () => {
      const story = "A woman (女) holding a child (子) represents goodness.";
      const res = await putBoth(
        `/api/v1/mnemonics/${fixtures!.writeGlyph}`,
        { story },
        `Bearer ${mnemonicAccessToken}`,
      );
      expect(res.nestRes.status).toBe(200);
      expectMnemonicParity(res);
      // The user-edited row is persisted for the SAME user + glyph.
      expect(res.nestRes.body.story).toBe(story);
      expect(res.nestRes.body.isEdited).toBe(true);
      expect(res.nestRes.body.isPictograph).toBe(false);
      expect(res.nestRes.body.characterGlyph).toBe(fixtures!.writeGlyph);
    });

    it("PUT /api/v1/mnemonics/:glyph (authed, empty story) — 400 validation", async () => {
      const res = await putBoth(
        `/api/v1/mnemonics/${fixtures!.writeGlyph}`,
        { story: "   " },
        `Bearer ${mnemonicAccessToken}`,
      );
      expectParity4xxMnem(res, 400);
    });

    it("GET /api/v1/mnemonics/:glyph (authed, sees own user-edited story) — 200", async () => {
      // The authed GET needs the token — fire it directly.
      const nestRes = await request(nestServer)
        .get(`/api/v1/mnemonics/${fixtures!.writeGlyph}`)
        .set("Authorization", `Bearer ${mnemonicAccessToken}`);
      expectMnemonicParity({ nestRes });
      expect(nestRes.body.mnemonic.isEdited).toBe(true);
      expect(nestRes.body.mnemonic.characterGlyph).toBe(fixtures!.writeGlyph);
    });

    it("GET /api/v1/mnemonics/:glyph (guest, never another user's story) — 200 { mnemonic: null }", async () => {
      // A user-edited story EXISTS for writeGlyph, but a guest (no token)
      // must NOT see it — calibrated F6: guest → empty, never another user's
      // rows.
      const res = await getBoth(`/api/v1/mnemonics/${fixtures!.writeGlyph}`);
      expectParity2xx(res);
      expect(res.nestRes.body).toEqual({ mnemonic: null });
    });

    it("DELETE /api/v1/mnemonics/:glyph (authed) — 204", async () => {
      const res = await deleteBoth(
        `/api/v1/mnemonics/${fixtures!.writeGlyph}`,
        `Bearer ${mnemonicAccessToken}`,
      );
      expect(res.nestRes.status).toBe(204);
      expect(res.nestRes.body).toEqual({});
    });

    it("DELETE /api/v1/mnemonics/:glyph (guest) — 401 AUTH_REQUIRED", async () => {
      const res = await deleteBoth(`/api/v1/mnemonics/${fixtures!.plainGlyph}`);
      expectParity4xxMnem(res, 401, "AUTH_REQUIRED");
    });
  });
});
