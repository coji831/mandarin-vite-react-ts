/**
 * @file apps/backend/tests/integration/nest/auth-parity.test.ts
 * @description Auth-module regression harness (Story 24-6 — Auth Module Port;
 * Story 24-15 — converted to Nest-only at the cutover).
 *
 * Pre-cutover this proved the ported Nest auth surface (`AuthModule` +
 * `AuthNestController` + the 24-5 `AuthGuard` + the brute-force rate limit
 * mounted in `configure-app.ts`) was contract-identical to the production
 * Express auth routes for all 5 endpoints; that parity was verified through
 * 24-14. At 24-15 the Express surface was deleted, so this harness now asserts
 * the Nest auth contract DIRECTLY as regression guards:
 *
 *   - `POST /api/v1/auth/register` (public; brute-force limited)
 *   - `POST /api/v1/auth/login`    (public; brute-force limited)
 *   - `POST /api/v1/auth/refresh`  (public; refresh-token rotation + httpOnly cookie)
 *   - `POST /api/v1/auth/logout`   (public; clears the httpOnly cookie)
 *   - `GET  /api/v1/auth/me`       (required auth via the calibrated `AuthGuard`)
 *
 * One in-process NestJS 11 shell (`NestFactory.create(AppModule)` + the real
 * `configureNestShellApp` + `mountExpressErrorBridge` boot shape).
 *
 * Assertions (regression guards):
 *   - 2xx: status + the documented success contract (success flag, data key
 *     sets, user identity fields, token types, httpOnly `refreshToken` cookie).
 *   - 4xx: exact status + the 24-3 `{ code, message, requestId }` envelope
 *     with the calibrated `code`/`message`.
 *   - Refresh-token ROTATION: `refresh(R1)` → 200 + new cookie R2; reusing R1
 *     → 401 INVALID_TOKEN.
 *   - Brute-force rate limit: 5 login attempts pass (401), the 6th → 429 with
 *     `RATE_LIMIT_EXCEEDED`.
 *   - Calibrated cookie transport: `GET /me` authenticates via the httpOnly
 *     `accessToken` cookie (the 24-5 addition; Express was header-only).
 *
 * Rate-limit isolation: register/login are limited to 5/min per IP, so every
 * register/login request in this suite sends a UNIQUE `X-Forwarded-For` (the
 * shell sets `trust proxy 1`, so `req.ip` honors it) — each request gets its
 * own bucket and never trips the limiter mid-suite. The 429 test uses a
 * dedicated fixed IP and fires exactly 6 requests at it.
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
process.env.PORT = "0";
process.env.JWT_SECRET = process.env.JWT_SECRET ?? "auth-parity-test-secret";
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET ?? "auth-parity-test-refresh-secret";

// Dynamic imports AFTER the env stubs (ESM evaluates static imports first).
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
const USER_EMAIL = `auth-parity-${RUN_ID}@example.com`;
const PASSWORD = "ValidPass123";
const createdEmails = [USER_EMAIL];

/** TEST-NET-3 range (203.0.113.0/24) — documented, never routable. */
let ipCounter = 0;
function nextIp(): string {
  ipCounter += 1;
  return `203.0.113.${(ipCounter % 200) + 1}`;
}

/** Dedicated fixed IP for the brute-force 429 test (own bucket). */
const BRUTE_FORCE_IP = "203.0.113.250";

/** Extract the `refreshToken=<value>` cookie from a Set-Cookie header. */
function extractRefreshCookie(res: request.Response): string {
  const setCookie = res.headers["set-cookie"];
  const cookie = Array.isArray(setCookie) ? setCookie[0] : setCookie;
  return (cookie ?? "").split(";")[0]; // "refreshToken=eyJ..."
}

/**
 * 4xx regression guard: exact status + the 24-3 `{ code, message, requestId }`
 * envelope with the calibrated `code`/`message`.
 */
function expectParity4xx(
  res: request.Response,
  expectedStatus: number,
  expectedCode: string,
  expectedMessage: string,
) {
  expect(res.status).toBe(expectedStatus);
  expect(res.body).toEqual({
    code: expectedCode,
    message: expectedMessage,
    requestId: expect.any(String),
  });
  expect(res.body.requestId).toBe(res.headers["x-request-id"]);
}

// ── Regression suite ───────────────────────────────────────────────────────

describe.skipIf(!db.available)("Nest auth module (integration, DB)", () => {
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

  /** POST the same body to /api/v1/auth/:path on the Nest app, unique IP. */
  function postAuth(path: string, body: Record<string, unknown>): request.Test {
    return request(nestServer)
      .post(`/api/v1/auth/${path}`)
      .set("X-Forwarded-For", nextIp())
      .send(body);
  }

  // ── register ─────────────────────────────────────────────────────────
  describe("register", () => {
    it("201 — success contract (status + shape + user fields + cookie)", async () => {
      const res = await postAuth("register", {
        email: USER_EMAIL,
        password: PASSWORD,
        displayName: "Nest User",
      });

      expect(res.status).toBe(201);
      // Contract: success flag + expected key sets at every level.
      expect(res.body.success).toBe(true);
      expect(Object.keys(res.body).sort()).toEqual(["data", "success"]);
      expect(Object.keys(res.body.data).sort()).toEqual(["accessToken", "user"]);
      expect(Object.keys(res.body.data.user).sort()).toEqual([
        "createdAt",
        "displayName",
        "email",
        "id",
        "updatedAt",
      ]);
      // User identity fields match what was registered.
      expect(res.body.data.user.email).toBe(USER_EMAIL);
      expect(res.body.data.user.displayName).toBe("Nest User");
      // Sensitive fields are sanitized.
      expect(res.body.data.user.passwordHash).toBeUndefined();
      expect(res.body.data.user.deletedAt).toBeUndefined();
      // Returns an access token + sets the httpOnly refreshToken cookie.
      expect(typeof res.body.data.accessToken).toBe("string");
      expect(res.headers["set-cookie"]?.[0]).toContain("refreshToken=");
    });

    it("400 MISSING_FIELDS (missing password)", async () => {
      const res = await postAuth("register", { email: `missing-${RUN_ID}@example.com` });
      expectParity4xx(res, 400, "MISSING_FIELDS", "Email and password are required");
    });

    it("400 INVALID_PASSWORD (weak password)", async () => {
      const res = await postAuth("register", {
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

    it("409 USER_EXISTS (email already registered)", async () => {
      const res = await postAuth("register", { email: USER_EMAIL, password: PASSWORD });
      expectParity4xx(res, 409, "USER_EXISTS", "A user with this email already exists");
    });
  });

  // ── login ────────────────────────────────────────────────────────────
  describe("login", () => {
    it("200 — success contract (user + access token + cookie)", async () => {
      const res = await postAuth("login", { email: USER_EMAIL, password: PASSWORD });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Object.keys(res.body).sort()).toEqual(["data", "success"]);
      expect(Object.keys(res.body.data).sort()).toEqual(["accessToken", "user"]);
      expect(res.body.data.user.email).toBe(USER_EMAIL);
      expect(res.body.data.user.passwordHash).toBeUndefined();
      expect(typeof res.body.data.accessToken).toBe("string");
      // Sets the httpOnly refreshToken cookie.
      expect(res.headers["set-cookie"]?.[0]).toContain("refreshToken=");
    });

    it("401 INVALID_CREDENTIALS (wrong password)", async () => {
      const res = await postAuth("login", { email: USER_EMAIL, password: "WrongPass999" });
      expectParity4xx(res, 401, "INVALID_CREDENTIALS", "Invalid email or password");
    });

    it("400 MISSING_FIELDS (missing email)", async () => {
      const res = await postAuth("login", { password: "Whatever1" });
      expectParity4xx(res, 400, "MISSING_FIELDS", "Email and password are required");
    });
  });

  // ── refresh (rotation + httpOnly cookie semantics) ───────────────────
  describe("refresh", () => {
    it("200 — refresh rotates the refresh token; old token is rejected after rotation", async () => {
      // Fresh refresh cookie from a login.
      const login = await postAuth("login", { email: USER_EMAIL, password: PASSWORD });
      const r1 = extractRefreshCookie(login);
      expect(r1).toContain("refreshToken=");

      // refresh(R1) → 200 + NEW cookie R2; R1 is then rotated out.
      const refresh = await request(nestServer).post("/api/v1/auth/refresh").set("Cookie", r1);
      expect(refresh.status).toBe(200);
      expect(refresh.body.success).toBe(true);
      expect(typeof refresh.body.data.accessToken).toBe("string");
      expect(Object.keys(refresh.body).sort()).toEqual(["data", "success"]);
      expect(Object.keys(refresh.body.data).sort()).toEqual(["accessToken"]);
      const r2 = extractRefreshCookie(refresh);
      expect(r2).not.toBe(r1); // rotated — new token issued

      const reuse = await request(nestServer).post("/api/v1/auth/refresh").set("Cookie", r1);
      expect(reuse.status).toBe(401);
      expect(reuse.body.code).toBe("INVALID_TOKEN");
    });

    it("400 MISSING_TOKEN (no cookie)", async () => {
      const res = await request(nestServer).post("/api/v1/auth/refresh");
      expectParity4xx(res, 400, "MISSING_TOKEN", "Refresh token is required");
    });

    it("401 INVALID_TOKEN (garbage cookie)", async () => {
      const res = await request(nestServer)
        .post("/api/v1/auth/refresh")
        .set("Cookie", "refreshToken=garbage");
      expectParity4xx(res, 401, "INVALID_TOKEN", "Invalid or expired refresh token");
    });
  });

  // ── logout ───────────────────────────────────────────────────────────
  describe("logout", () => {
    it("200 — success body + clears the cookie", async () => {
      const login = await postAuth("login", { email: USER_EMAIL, password: PASSWORD });
      const res = await request(nestServer)
        .post("/api/v1/auth/logout")
        .set("Cookie", extractRefreshCookie(login));
      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        success: true,
        message: "Logged out successfully",
      });
      // Clears the httpOnly cookie.
      expect(res.headers["set-cookie"]?.[0]).toContain("refreshToken=;");
    });

    it("400 MISSING_REFRESH_TOKEN (no cookie) + clears the cookie", async () => {
      const res = await request(nestServer).post("/api/v1/auth/logout");
      expectParity4xx(res, 400, "MISSING_REFRESH_TOKEN", "Refresh token is required");
      expect(res.headers["set-cookie"]?.[0]).toContain("refreshToken=;");
    });
  });

  // ── me ───────────────────────────────────────────────────────────────
  describe("me", () => {
    it("200 — returns the authenticated user", async () => {
      const login = await postAuth("login", { email: USER_EMAIL, password: PASSWORD });
      const accessToken = login.body.data.accessToken as string;

      const res = await request(nestServer)
        .get("/api/v1/auth/me")
        .set("Authorization", `Bearer ${accessToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Object.keys(res.body).sort()).toEqual(["data", "success"]);
      expect(res.body.data.user.email).toBe(USER_EMAIL);
    });

    it("401 MISSING_TOKEN (no token)", async () => {
      const res = await request(nestServer).get("/api/v1/auth/me");
      expectParity4xx(res, 401, "MISSING_TOKEN", "Access token is required");
    });

    it("404 USER_NOT_FOUND (valid token, unknown user)", async () => {
      // Story 24-17 env-claim hardening: JwtService rejects tokens without a
      // matching `env` claim, so directly-signed fixtures must carry it.
      const ghostToken = jwt.sign(
        { userId: "auth-parity-ghost-user", env: process.env.APP_ENV ?? "production" },
        config.jwtSecret!,
        { expiresIn: "15m" },
      );
      const res = await request(nestServer)
        .get("/api/v1/auth/me")
        .set("Authorization", `Bearer ${ghostToken}`);
      expectParity4xx(res, 404, "USER_NOT_FOUND", "User not found");
    });

    it("calibrated addition — /me authenticates via the accessToken cookie", async () => {
      const login = await postAuth("login", { email: USER_EMAIL, password: PASSWORD });
      const accessToken = login.body.data.accessToken as string;

      // Nest (calibrated spec, 24-5): the httpOnly accessToken cookie is a
      // secondary transport → authenticates the user (Express was header-only).
      const res = await request(nestServer)
        .get("/api/v1/auth/me")
        .set("Cookie", `accessToken=${accessToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe(USER_EMAIL);
    });
  });

  // ── brute-force rate limit ───────────────────────────────────────────
  describe("brute-force rate limit", () => {
    it("429 — 6th login attempt is rate-limited with the RATE_LIMIT_EXCEEDED body", async () => {
      for (let i = 0; i < 6; i += 1) {
        const res = await request(nestServer)
          .post("/api/v1/auth/login")
          .set("X-Forwarded-For", BRUTE_FORCE_IP)
          .send({ email: USER_EMAIL, password: "WrongPass999" });

        if (i < 5) {
          // First 5 attempts pass the limiter (401 — wrong credentials).
          expect(res.status).toBe(401);
        } else {
          // 6th attempt → 429. express-rate-limit's default handler sends the
          // `message` object directly (no envelope).
          expect(res.status).toBe(429);
          expect(res.body.code).toBe("RATE_LIMIT_EXCEEDED");
          expect(res.body.message).toBe(
            "Too many authentication attempts. Please try again later.",
          );
        }
      }
    });
  });
});
