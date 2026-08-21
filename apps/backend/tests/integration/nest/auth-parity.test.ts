/**
 * @file apps/backend/tests/integration/nest/auth-parity.test.ts
 * @description Auth module ↔ Express auth parity harness (Story 24-6 — Auth
 * Module Port).
 *
 * Proves the ported Nest auth surface (`AuthModule` + `AuthNestController` +
 * the 24-5 `AuthGuard` + the brute-force rate limit mounted in
 * `configure-app.ts`) is contract-identical to the production Express auth
 * routes (`modules/auth/api/authRoutes.ts` + `AuthController.ts`) for all 5
 * endpoints:
 *
 *   - `POST /api/v1/auth/register` (public; brute-force limited)
 *   - `POST /api/v1/auth/login`    (public; brute-force limited)
 *   - `POST /api/v1/auth/refresh`  (public; refresh-token rotation + httpOnly cookie)
 *   - `POST /api/v1/auth/logout`   (public; clears the httpOnly cookie)
 *   - `GET  /api/v1/auth/me`       (required auth via the calibrated `AuthGuard`)
 *
 * Two in-process HTTP servers:
 *   - the production Express app (`src/app/index.ts` default export), and
 *   - the NestJS 11 shell (`NestFactory.create(AppModule)` + the real
 *     `configureNestShellApp` + `mountExpressErrorBridge` boot shape).
 *
 * Assertions:
 *   - 2xx where the body is deterministic → deep-equal (logout 200, me 200 —
 *     the SAME DB user is returned by both apps when given the same access
 *     token; brute-force 429 — express-rate-limit's default handler sends the
 *     `message` object directly on both, so the 429 body is deep-equal).
 *   - 2xx where tokens make the body non-deterministic (register/login/
 *     refresh) → identical contract: status, top-level/data key sets, user
 *     identity fields, token types, and the httpOnly `refreshToken` Set-Cookie.
 *   - 4xx → identical status + the Nest envelope's `code`/`message` EQUAL the
 *     Express `code`/`message` byte-for-byte (Express emits the legacy
 *     `{ error, code, message }` controller shape; Nest emits the 24-3
 *     `{ code, message, requestId }` envelope — `error` is the legacy key,
 *     superseded by the envelope).
 *   - Refresh-token ROTATION: `refresh(R1)` → 200 + new cookie R2; reusing R1
 *     → 401 INVALID_TOKEN (rotation proof, both apps).
 *   - Brute-force rate limit: 5 login attempts pass (401), the 6th → 429 with
 *     `RATE_LIMIT_EXCEEDED` on BOTH apps.
 *
 * Rate-limit isolation: register/login are limited to 5/min per IP on both
 * apps, so every register/login request in this suite sends a UNIQUE
 * `X-Forwarded-For` (both apps set `trust proxy 1`, so `req.ip` honors it) —
 * each request gets its own bucket and never trips the limiter mid-suite. The
 * 429 test uses a dedicated fixed IP and fires exactly 6 requests at it.
 *
 * DB-backed (real Prisma against the test database — never real external
 * services): registers real users, then deletes them (+ cascade sessions) in
 * `afterAll`. A missing `DATABASE_URL` / unreachable DB skips the whole suite
 * (the `checkDatabase` pattern).
 *
 * Placed under `tests/integration/` → runs via `npm run test:integration`.
 */
import "reflect-metadata";
import type { Server } from "node:http";
import crypto from "node:crypto";
import type { INestApplication } from "@nestjs/common";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";

// ── Hermetic env — MUST run before any module under test is evaluated ──────
// `src/app/index.ts` calls `app.listen(config.port)` at import time — pin PORT
// to an ephemeral port first (dotenv does not override already-set vars).
process.env.PORT = "0";
process.env.JWT_SECRET = process.env.JWT_SECRET ?? "auth-parity-test-secret";
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET ?? "auth-parity-test-refresh-secret";

// Dynamic imports AFTER the env stubs (ESM evaluates static imports first).
const { default: expressApp } = await import("../../../src/app/index.js");
const { NestFactory } = await import("@nestjs/core");
const { AppModule } = await import("../../../src/nest/app.module.js");
const { configureNestShellApp } = await import("../../../src/nest/configure-app.js");
const { mountExpressErrorBridge } = await import("../../../src/nest/exception.filter.js");
const { config } = await import("../../../src/shared/config/index.js");
const { prisma } = await import("../../../src/shared/infrastructure/database/client.js");
const { checkDatabase, disconnectDatabase } = await import("../helpers/db.js");

const db = await checkDatabase();

// ── Fixtures ───────────────────────────────────────────────────────────────

/** Unique suffix per run so repeated runs never collide with leftover rows. */
const RUN_ID = crypto.randomBytes(4).toString("hex");
const EXPRESS_USER_EMAIL = `auth-parity-express-${RUN_ID}@example.com`;
const NEST_USER_EMAIL = `auth-parity-nest-${RUN_ID}@example.com`;
const PASSWORD = "ValidPass123";
const createdEmails = [EXPRESS_USER_EMAIL, NEST_USER_EMAIL];

/** TEST-NET-3 range (203.0.113.0/24) — documented, never routable. */
let ipCounter = 0;
function nextIp(): string {
  ipCounter += 1;
  return `203.0.113.${(ipCounter % 200) + 1}`;
}

/** Dedicated fixed IP for the brute-force 429 test (own bucket per app). */
const BRUTE_FORCE_IP = "203.0.113.250";

/** Extract the `refreshToken=<value>` cookie from a Set-Cookie header. */
function extractRefreshCookie(res: request.Response): string {
  const setCookie = res.headers["set-cookie"];
  const cookie = Array.isArray(setCookie) ? setCookie[0] : setCookie;
  return (cookie ?? "").split(";")[0]; // "refreshToken=eyJ..."
}

/**
 * 4xx parity: identical status; Express `{error, code, message}` legacy body;
 * Nest `{code, message, requestId}` envelope with code/message byte-for-byte
 * equal to Express, and requestId echoing X-Request-Id.
 */
function expectParity4xx(
  res: { expressRes: request.Response; nestRes: request.Response },
  expectedStatus: number,
  expectedCode: string,
  expectedMessage: string,
) {
  expect(res.expressRes.status).toBe(expectedStatus);
  expect(res.nestRes.status).toBe(expectedStatus);
  expect(res.expressRes.body.code).toBe(expectedCode);
  expect(res.expressRes.body.message).toBe(expectedMessage);
  expect(res.nestRes.body).toEqual({
    code: expectedCode,
    message: expectedMessage,
    requestId: expect.any(String),
  });
  expect(res.nestRes.body.requestId).toBe(res.nestRes.headers["x-request-id"]);
}

// ── Parity suite ───────────────────────────────────────────────────────────

describe.skipIf(!db.available)("Nest auth module ↔ Express auth parity (integration, DB)", () => {
  let nestApp: INestApplication;
  let nestServer: Server;

  beforeAll(async () => {
    nestApp = await NestFactory.create(AppModule, {
      logger: false,
      bufferLogs: false,
      bodyParser: false,
    });
    // Same shell shape the dev entry uses (global `/api` prefix, trust proxy,
    // CORS, body parsers, cookie-parser, requestId, words + auth rate-limit)
    // so the harness tests the real boot path.
    configureNestShellApp(nestApp);
    mountExpressErrorBridge(nestApp);
    await nestApp.init();
    nestServer = nestApp.getHttpServer() as Server;
  });

  afterAll(async () => {
    await nestApp?.close();
    // Sessions cascade on user delete; delete explicitly too for safety
    // (covers any Restrict-relation edge), then remove the created users.
    await prisma.session.deleteMany({
      where: { user: { email: { in: createdEmails } } },
    });
    await prisma.user.deleteMany({ where: { email: { in: createdEmails } } });
    await disconnectDatabase();
  });

  /** POST the same body to /api/v1/auth/:path on both apps, unique IP each. */
  function postAuthBoth(
    path: string,
    body: Record<string, unknown>,
  ): Promise<{ expressRes: request.Response; nestRes: request.Response }> {
    return Promise.all([
      request(expressApp).post(`/api/v1/auth/${path}`).set("X-Forwarded-For", nextIp()).send(body),
      request(nestServer).post(`/api/v1/auth/${path}`).set("X-Forwarded-For", nextIp()).send(body),
    ]).then(([expressRes, nestRes]) => ({ expressRes, nestRes }));
  }

  // ── register ─────────────────────────────────────────────────────────
  describe("register", () => {
    it("201 — identical success contract on both apps (status + shape + user fields + cookie)", async () => {
      const [expressRes, nestRegisterRes] = await Promise.all([
        request(expressApp)
          .post("/api/v1/auth/register")
          .set("X-Forwarded-For", nextIp())
          .send({ email: EXPRESS_USER_EMAIL, password: PASSWORD, displayName: "Express User" }),
        request(nestServer)
          .post("/api/v1/auth/register")
          .set("X-Forwarded-For", nextIp())
          .send({ email: NEST_USER_EMAIL, password: PASSWORD, displayName: "Nest User" }),
      ]);

      expect(expressRes.status).toBe(201);
      expect(nestRegisterRes.status).toBe(201);
      // Contract: identical key sets at every level + success flag.
      expect(Object.keys(nestRegisterRes.body).sort()).toEqual(Object.keys(expressRes.body).sort());
      expect(nestRegisterRes.body.success).toBe(true);
      expect(expressRes.body.success).toBe(true);
      expect(Object.keys(nestRegisterRes.body.data).sort()).toEqual(
        Object.keys(expressRes.body.data).sort(),
      );
      expect(Object.keys(nestRegisterRes.body.data.user).sort()).toEqual(
        Object.keys(expressRes.body.data.user).sort(),
      );
      // User identity fields match what each app received.
      expect(expressRes.body.data.user.email).toBe(EXPRESS_USER_EMAIL);
      expect(expressRes.body.data.user.displayName).toBe("Express User");
      expect(nestRegisterRes.body.data.user.email).toBe(NEST_USER_EMAIL);
      expect(nestRegisterRes.body.data.user.displayName).toBe("Nest User");
      // Both sanitize sensitive fields.
      expect(expressRes.body.data.user.passwordHash).toBeUndefined();
      expect(nestRegisterRes.body.data.user.passwordHash).toBeUndefined();
      expect(expressRes.body.data.user.deletedAt).toBeUndefined();
      expect(nestRegisterRes.body.data.user.deletedAt).toBeUndefined();
      // Both return an access token + set the httpOnly refreshToken cookie.
      expect(typeof expressRes.body.data.accessToken).toBe("string");
      expect(typeof nestRegisterRes.body.data.accessToken).toBe("string");
      expect(expressRes.headers["set-cookie"]?.[0]).toContain("refreshToken=");
      expect(nestRegisterRes.headers["set-cookie"]?.[0]).toContain("refreshToken=");
    });

    it("400 MISSING_FIELDS parity (missing password)", async () => {
      const res = await postAuthBoth("register", { email: `missing-${RUN_ID}@example.com` });
      expectParity4xx(res, 400, "MISSING_FIELDS", "Email and password are required");
    });

    it("400 INVALID_PASSWORD parity (weak password)", async () => {
      const res = await postAuthBoth("register", {
        email: `weak-${RUN_ID}@example.com`,
        password: "weak",
      });
      expectParity4xx(
        res,
        400,
        "INVALID_PASSWORD",
        "Password must be at least 8 characters with 1 uppercase, 1 lowercase, 1 number",
      );
    });

    it("409 USER_EXISTS parity (email already registered)", async () => {
      const res = await postAuthBoth("register", {
        email: EXPRESS_USER_EMAIL,
        password: PASSWORD,
      });
      expectParity4xx(res, 409, "USER_EXISTS", "A user with this email already exists");
    });
  });

  // ── login ────────────────────────────────────────────────────────────
  describe("login", () => {
    it("200 — identical success contract (same user deep-equals across apps)", async () => {
      const res = await postAuthBoth("login", { email: EXPRESS_USER_EMAIL, password: PASSWORD });
      expect(res.expressRes.status).toBe(200);
      expect(res.nestRes.status).toBe(200);
      // Same DB user → data.user deep-equals across apps (id, email,
      // displayName, createdAt, updatedAt serialize identically).
      expect(res.nestRes.body.data.user).toEqual(res.expressRes.body.data.user);
      expect(res.nestRes.body.success).toBe(true);
      expect(Object.keys(res.nestRes.body.data).sort()).toEqual(
        Object.keys(res.expressRes.body.data).sort(),
      );
      expect(typeof res.nestRes.body.data.accessToken).toBe("string");
      // Both set the httpOnly refreshToken cookie.
      expect(res.expressRes.headers["set-cookie"]?.[0]).toContain("refreshToken=");
      expect(res.nestRes.headers["set-cookie"]?.[0]).toContain("refreshToken=");
    });

    it("401 INVALID_CREDENTIALS parity (wrong password)", async () => {
      const res = await postAuthBoth("login", {
        email: EXPRESS_USER_EMAIL,
        password: "WrongPass999",
      });
      expectParity4xx(res, 401, "INVALID_CREDENTIALS", "Invalid email or password");
    });

    it("400 MISSING_FIELDS parity (missing email)", async () => {
      const res = await postAuthBoth("login", { password: "Whatever1" });
      expectParity4xx(res, 400, "MISSING_FIELDS", "Email and password are required");
    });
  });

  // ── refresh (rotation + httpOnly cookie semantics) ───────────────────
  describe("refresh", () => {
    it("200 — refresh rotates the refresh token on both apps; old token is rejected after rotation", async () => {
      // Fresh refresh cookies from a login on each app.
      const login = await postAuthBoth("login", {
        email: EXPRESS_USER_EMAIL,
        password: PASSWORD,
      });
      const expressR1 = extractRefreshCookie(login.expressRes);
      const nestR1 = extractRefreshCookie(login.nestRes);
      expect(expressR1).toContain("refreshToken=");
      expect(nestR1).toContain("refreshToken=");

      // Express: refresh(R1) → 200 + NEW cookie R2; R1 is then rotated out.
      const expressRefresh = await request(expressApp)
        .post("/api/v1/auth/refresh")
        .set("Cookie", expressR1);
      expect(expressRefresh.status).toBe(200);
      expect(expressRefresh.body.success).toBe(true);
      expect(typeof expressRefresh.body.data.accessToken).toBe("string");
      expect(Object.keys(expressRefresh.body.data).sort()).toEqual(["accessToken"]);
      const expressR2 = extractRefreshCookie(expressRefresh);
      expect(expressR2).not.toBe(expressR1); // rotated — new token issued
      const expressReuse = await request(expressApp)
        .post("/api/v1/auth/refresh")
        .set("Cookie", expressR1);
      expect(expressReuse.status).toBe(401);
      expect(expressReuse.body.code).toBe("INVALID_TOKEN");

      // Nest: identical flow.
      const nestRefresh = await request(nestServer)
        .post("/api/v1/auth/refresh")
        .set("Cookie", nestR1);
      expect(nestRefresh.status).toBe(200);
      expect(nestRefresh.body.success).toBe(true);
      expect(typeof nestRefresh.body.data.accessToken).toBe("string");
      expect(Object.keys(nestRefresh.body.data).sort()).toEqual(["accessToken"]);
      const nestR2 = extractRefreshCookie(nestRefresh);
      expect(nestR2).not.toBe(nestR1); // rotated
      const nestReuse = await request(nestServer)
        .post("/api/v1/auth/refresh")
        .set("Cookie", nestR1);
      expect(nestReuse.status).toBe(401);
      expect(nestReuse.body.code).toBe("INVALID_TOKEN");

      // 2xx contract parity.
      expect(Object.keys(nestRefresh.body).sort()).toEqual(Object.keys(expressRefresh.body).sort());
      expect(Object.keys(nestRefresh.body.data).sort()).toEqual(
        Object.keys(expressRefresh.body.data).sort(),
      );
    });

    it("400 MISSING_TOKEN parity (no cookie)", async () => {
      const [expressRes, nestRes] = await Promise.all([
        request(expressApp).post("/api/v1/auth/refresh"),
        request(nestServer).post("/api/v1/auth/refresh"),
      ]);
      expectParity4xx({ expressRes, nestRes }, 400, "MISSING_TOKEN", "Refresh token is required");
    });

    it("401 INVALID_TOKEN parity (garbage cookie)", async () => {
      const [expressRes, nestRes] = await Promise.all([
        request(expressApp).post("/api/v1/auth/refresh").set("Cookie", "refreshToken=garbage"),
        request(nestServer).post("/api/v1/auth/refresh").set("Cookie", "refreshToken=garbage"),
      ]);
      expectParity4xx(
        { expressRes, nestRes },
        401,
        "INVALID_TOKEN",
        "Invalid or expired refresh token",
      );
    });
  });

  // ── logout ───────────────────────────────────────────────────────────
  describe("logout", () => {
    it("200 — identical body (deep-equal) + clears the cookie on both apps", async () => {
      const login = await postAuthBoth("login", {
        email: EXPRESS_USER_EMAIL,
        password: PASSWORD,
      });
      const [expressRes, nestRes] = await Promise.all([
        request(expressApp)
          .post("/api/v1/auth/logout")
          .set("Cookie", extractRefreshCookie(login.expressRes)),
        request(nestServer)
          .post("/api/v1/auth/logout")
          .set("Cookie", extractRefreshCookie(login.nestRes)),
      ]);
      expect(expressRes.status).toBe(200);
      expect(nestRes.status).toBe(200);
      // Deterministic body → deep-equal.
      expect(nestRes.body).toEqual(expressRes.body); // { success: true, message: "Logged out successfully" }
      // Both clear the httpOnly cookie.
      expect(expressRes.headers["set-cookie"]?.[0]).toContain("refreshToken=;");
      expect(nestRes.headers["set-cookie"]?.[0]).toContain("refreshToken=;");
    });

    it("400 MISSING_REFRESH_TOKEN parity (no cookie) + clears the cookie", async () => {
      const [expressRes, nestRes] = await Promise.all([
        request(expressApp).post("/api/v1/auth/logout"),
        request(nestServer).post("/api/v1/auth/logout"),
      ]);
      expectParity4xx(
        { expressRes, nestRes },
        400,
        "MISSING_REFRESH_TOKEN",
        "Refresh token is required",
      );
      expect(expressRes.headers["set-cookie"]?.[0]).toContain("refreshToken=;");
      expect(nestRes.headers["set-cookie"]?.[0]).toContain("refreshToken=;");
    });
  });

  // ── me ───────────────────────────────────────────────────────────────
  describe("me", () => {
    it("200 — identical body (deep-equal) with the same access token on both apps", async () => {
      const login = await request(expressApp)
        .post("/api/v1/auth/login")
        .set("X-Forwarded-For", nextIp())
        .send({ email: EXPRESS_USER_EMAIL, password: PASSWORD });
      const accessToken = login.body.data.accessToken as string;

      const [expressRes, nestRes] = await Promise.all([
        request(expressApp).get("/api/v1/auth/me").set("Authorization", `Bearer ${accessToken}`),
        request(nestServer).get("/api/v1/auth/me").set("Authorization", `Bearer ${accessToken}`),
      ]);
      expect(expressRes.status).toBe(200);
      expect(nestRes.status).toBe(200);
      // Same user + same token → deep-equal `{ success, data: { user } }`.
      expect(nestRes.body).toEqual(expressRes.body);
    });

    it("401 MISSING_TOKEN parity (no token)", async () => {
      const [expressRes, nestRes] = await Promise.all([
        request(expressApp).get("/api/v1/auth/me"),
        request(nestServer).get("/api/v1/auth/me"),
      ]);
      expectParity4xx({ expressRes, nestRes }, 401, "MISSING_TOKEN", "Access token is required");
    });

    it("404 USER_NOT_FOUND parity (valid token, unknown user)", async () => {
      const ghostToken = jwt.sign({ userId: "auth-parity-ghost-user" }, config.jwtSecret!, {
        expiresIn: "15m",
      });
      const [expressRes, nestRes] = await Promise.all([
        request(expressApp).get("/api/v1/auth/me").set("Authorization", `Bearer ${ghostToken}`),
        request(nestServer).get("/api/v1/auth/me").set("Authorization", `Bearer ${ghostToken}`),
      ]);
      expectParity4xx({ expressRes, nestRes }, 404, "USER_NOT_FOUND", "User not found");
    });

    it("calibrated delta — Nest /me authenticates via accessToken cookie; Express is header-only (401)", async () => {
      const login = await request(expressApp)
        .post("/api/v1/auth/login")
        .set("X-Forwarded-For", nextIp())
        .send({ email: EXPRESS_USER_EMAIL, password: PASSWORD });
      const accessToken = login.body.data.accessToken as string;

      // Nest (calibrated spec, 24-5): the httpOnly accessToken cookie is a
      // secondary transport → authenticates the user.
      const nestRes = await request(nestServer)
        .get("/api/v1/auth/me")
        .set("Cookie", `accessToken=${accessToken}`);
      expect(nestRes.status).toBe(200);
      expect(nestRes.body.data.user.email).toBe(EXPRESS_USER_EMAIL);

      // Express (current middleware): header-only → guest → 401 MISSING_TOKEN.
      // Documented delta — the calibrated guards ADD cookie auth.
      const expressRes = await request(expressApp)
        .get("/api/v1/auth/me")
        .set("Cookie", `accessToken=${accessToken}`);
      expect(expressRes.status).toBe(401);
      expect(expressRes.body.code).toBe("MISSING_TOKEN");
    });
  });

  // ── brute-force rate limit ───────────────────────────────────────────
  describe("brute-force rate limit", () => {
    it("429 — 6th login attempt is rate-limited with an IDENTICAL body on both apps", async () => {
      for (let i = 0; i < 6; i += 1) {
        const [expressRes, nestRes] = await Promise.all([
          request(expressApp)
            .post("/api/v1/auth/login")
            .set("X-Forwarded-For", BRUTE_FORCE_IP)
            .send({ email: EXPRESS_USER_EMAIL, password: "WrongPass999" }),
          request(nestServer)
            .post("/api/v1/auth/login")
            .set("X-Forwarded-For", BRUTE_FORCE_IP)
            .send({ email: EXPRESS_USER_EMAIL, password: "WrongPass999" }),
        ]);

        if (i < 5) {
          // First 5 attempts pass the limiter (401 — wrong credentials).
          expect(expressRes.status).toBe(401);
          expect(nestRes.status).toBe(401);
        } else {
          // 6th attempt → 429 on both. express-rate-limit's default handler
          // sends the `message` object directly (no envelope) on BOTH apps →
          // deep-equal.
          expect(expressRes.status).toBe(429);
          expect(nestRes.status).toBe(429);
          expect(nestRes.body).toEqual(expressRes.body);
          expect(nestRes.body.code).toBe("RATE_LIMIT_EXCEEDED");
          expect(nestRes.body.message).toBe(
            "Too many authentication attempts. Please try again later.",
          );
        }
      }
    });
  });
});
