/**
 * @file apps/backend/tests/integration/nest/auth-guards-parity.test.ts
 * @description Auth-guard ↔ Express auth-middleware parity (Story 24-5 —
 * Auth-Surface Guards (Calibrated)).
 *
 * Proves the calibrated Nest guards reproduce the Express `authMiddleware`
 * semantics on IDENTICAL test-protected routes:
 *   - `AuthGuard`          ↔ `authenticateToken` (required auth)
 *   - `OptionalAuthGuard`  ↔ `optionalAuth`        (best-effort, never 401)
 *   - `RequireAuthGuard`   ↔ `requireAuth`         (guest-rejecting)
 *
 * Two in-process HTTP servers, both exposing `/api/v1/_guards/{required,
 * optional, require}` returning `{ userId: req.userId ?? null }`:
 *   - an Express app mounting the REAL `authMiddleware` functions, and
 *   - a NestJS 11 testing app (`SharedModule` + `GuardsModule` + a test
 *     controller applying the guards, plus the real 24-3 `AppExceptionFilter`
 *     so 4xx carry the `{ code, message, requestId }` envelope).
 *
 * Assertions per scenario:
 *   - 2xx (guest reads / valid-token): IDENTICAL status + body (deep-equal).
 *   - 4xx (required/require without a valid token): IDENTICAL status, and the
 *     Nest envelope's `code`/`message` EQUAL the Express `code`/`message`
 *     (Express emits the legacy `{ error, code, message }` controller shape;
 *     Nest emits the 24-3 `{ code, message, requestId }` envelope — the
 *     `error` key is the legacy shape, superseded by the envelope).
 *
 * Calibrated-guest (F6) + transport coverage (source `wip/guest-access-
 * calibration.md`):
 *   - no token  → guest (401 on required/require; `{ userId: null }` on
 *     optional) — never "all-unlocked".
 *   - invalid / expired token → treated as guest by `optional` (user undefined,
 *     no 401); rejected by required/require (401 expired / 403 invalid).
 *   - valid token via `Authorization: Bearer` → user attached (parity).
 *   - valid token via httpOnly `accessToken` cookie → user attached (CALIBRATED
 *     ADDITION — the Express middleware is header-only, so this is asserted on
 *     the Nest side only; the Express 401 is the documented delta).
 *
 * HERMETIC: no database — `PrismaClient` is overridden with a stub and
 * `REDIS_URL` is emptied (no-op cache), so this file runs even without a
 * DATABASE_URL (unlike the DB-gated `route-parity.test.ts`).
 *
 * Placed under `tests/integration/` → runs via `npm run test:integration`.
 */

// ── Hermetic env — MUST run before any module under test is evaluated ──────
process.env.REDIS_URL = process.env.REDIS_URL ?? ""; // no-op cache (async CacheService is instant)
process.env.JWT_SECRET = process.env.JWT_SECRET ?? "auth-guards-parity-test-secret";
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET ?? "auth-guards-parity-test-refresh-secret";

import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import type { Server } from "node:http";
import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import type { Express, Request } from "express";
import express from "express";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";

// Dynamic imports AFTER the env stubs (ESM evaluates static imports first).
const { config } = await import("../../../src/shared/config/index.js");
const { authenticateToken, optionalAuth, requireAuth } =
  await import("../../../src/shared/middleware/authMiddleware.js");
const { requestIdMiddleware } = await import("../../../src/nest/request-id.middleware.js");
const { SharedModule } = await import("../../../src/nest/shared/shared.module.js");
const { PrismaClient } = await import("../../../src/nest/shared/database.module.js");
const { GuardsModule } = await import("../../../src/nest/guards/guards.module.js");
const { AuthGuard } = await import("../../../src/nest/guards/auth-guard.js");
const { OptionalAuthGuard } = await import("../../../src/nest/guards/optional-auth.guard.js");
const { RequireAuthGuard } = await import("../../../src/nest/guards/require-auth.guard.js");
const { AppExceptionFilter } = await import("../../../src/nest/exception.filter.js");
const { configureNestShellApp } = await import("../../../src/nest/configure-app.js");
const { mountExpressErrorBridge } = await import("../../../src/nest/exception.filter.js");

// ── Shared fixtures ─────────────────────────────────────────────────────────

/** Express request shape with the auth fields the guards/middleware set. */
type AuthTestRequest = Request & { userId?: string; user?: unknown };

const TEST_USER_ID = "parity-user-1";
const validToken = jwt.sign({ userId: TEST_USER_ID }, config.jwtSecret!, { expiresIn: "15m" });
const expiredToken = jwt.sign({ userId: TEST_USER_ID }, config.jwtSecret!, { expiresIn: "-1s" });
const invalidToken = "not.a.jwt";

const PATHS = {
  required: "/api/v1/_guards/required",
  optional: "/api/v1/_guards/optional",
  require: "/api/v1/_guards/require",
} as const;

/** Echo `req.userId ?? null` — the calibrated guest-vs-user identity shape. */
function echoIdentity(req: AuthTestRequest) {
  return { userId: req.userId ?? null };
}

// ── Express side: real authMiddleware on a fresh app ───────────────────────
const expressApp: Express = express();
expressApp.use(cookieParser());
expressApp.use(requestIdMiddleware);
expressApp.get(PATHS.required, authenticateToken, (req, res) => res.json(echoIdentity(req)));
expressApp.get(PATHS.optional, optionalAuth, (req, res) => res.json(echoIdentity(req)));
expressApp.get(PATHS.require, requireAuth, (req, res) => res.json(echoIdentity(req)));

// ── Nest side: test controller applying the real guards ────────────────────
@Controller("v1/_guards")
class GuardsParityController {
  @Get("required")
  @UseGuards(AuthGuard)
  required(@Req() req: AuthTestRequest) {
    return echoIdentity(req);
  }

  @Get("optional")
  @UseGuards(OptionalAuthGuard)
  optional(@Req() req: AuthTestRequest) {
    return echoIdentity(req);
  }

  @Get("require")
  @UseGuards(RequireAuthGuard)
  require(@Req() req: AuthTestRequest) {
    return echoIdentity(req);
  }
}

describe("Nest auth guards ↔ Express auth middleware parity (hermetic)", () => {
  let nestApp: INestApplication;
  let nestServer: Server;
  let expressServer: Server;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [GuardsModule],
      controllers: [GuardsParityController],
    })
      .overrideProvider(PrismaClient)
      .useValue({ $disconnect: vi.fn().mockResolvedValue(undefined) })
      .compile();

    nestApp = moduleRef.createNestApplication();
    // Register the 24-3 AppExceptionFilter globally so 4xx carry the
    // `{ code, message, requestId }` envelope. (Used via `useGlobalFilters`
    // rather than an `APP_FILTER` provider — the TestingModule provider loader
    // has a metatype quirk with APP_FILTER + `useClass`; the route-parity
    // harness's `NestFactory.create(AppModule)` path is unaffected.)
    nestApp.useGlobalFilters(new AppExceptionFilter());
    // Same shell shape the dev entry uses (global `/api` prefix, cookie-parser,
    // requestId, body parsers) so the harness tests the real boot path.
    configureNestShellApp(nestApp);
    mountExpressErrorBridge(nestApp);
    await nestApp.init();
    nestServer = nestApp.getHttpServer() as Server;

    expressServer = expressApp.listen(0);
  });

  afterAll(async () => {
    await nestApp?.close();
    if (expressServer) {
      await new Promise<void>((resolve) => expressServer.close(() => resolve()));
    }
  });

  /** Fire the same GET (with optional auth header/cookie) at both apps. */
  async function getBoth(
    path: string,
    auth?: { header?: string; cookie?: string },
  ): Promise<{ expressRes: request.Response; nestRes: request.Response }> {
    const expressReq = request(expressServer).get(path);
    const nestReq = request(nestServer).get(path);
    if (auth?.header) {
      expressReq.set("Authorization", auth.header);
      nestReq.set("Authorization", auth.header);
    }
    if (auth?.cookie) {
      expressReq.set("Cookie", auth.cookie);
      nestReq.set("Cookie", auth.cookie);
    }
    const [expressRes, nestRes] = await Promise.all([expressReq, nestReq]);
    return { expressRes, nestRes };
  }

  /** 2xx: identical status + body (deep-equal). */
  function expectParity2xx(res: { expressRes: request.Response; nestRes: request.Response }) {
    expect(res.expressRes.status).toBeGreaterThanOrEqual(200);
    expect(res.expressRes.status).toBeLessThan(300);
    expect(res.nestRes.status).toBe(res.expressRes.status);
    expect(res.nestRes.body).toEqual(res.expressRes.body);
  }

  /** 4xx: identical status + Nest envelope code/message equal Express's. */
  function expectParity4xx(
    res: { expressRes: request.Response; nestRes: request.Response },
    expectedStatus: number,
  ) {
    expect(res.expressRes.status).toBe(expectedStatus);
    expect(res.nestRes.status).toBe(expectedStatus);
    // Nest 4xx = the 24-3 envelope `{code, message, requestId}`; Express 4xx =
    // legacy `{error, code, message}` controller shape — the code+message must
    // match, and requestId echoes X-Request-Id.
    expect(res.nestRes.body).toEqual({
      code: res.expressRes.body.code,
      message: res.expressRes.body.message,
      requestId: expect.any(String),
    });
    expect(res.nestRes.body.requestId).toBe(res.nestRes.headers["x-request-id"]);
  }

  // ── Guest (no token) — calibrated F6: rejected or empty, never all-unlocked ─
  describe("guest (no token)", () => {
    it("required: 401 MISSING_TOKEN parity", async () => {
      const res = await getBoth(PATHS.required);
      expectParity4xx(res, 401);
      expect(res.expressRes.body.code).toBe("MISSING_TOKEN");
      expect(res.expressRes.body.message).toBe("Access token is required");
    });

    it("require: 401 AUTH_REQUIRED parity", async () => {
      const res = await getBoth(PATHS.require);
      expectParity4xx(res, 401);
      expect(res.expressRes.body.code).toBe("AUTH_REQUIRED");
      expect(res.expressRes.body.message).toBe("Please sign in to access this feature");
    });

    it("optional: guest passes with userId null (empty, not all-unlocked)", async () => {
      const res = await getBoth(PATHS.optional);
      expectParity2xx(res);
      expect(res.nestRes.body).toEqual({ userId: null });
    });
  });

  // ── Invalid token ──────────────────────────────────────────────────────────
  describe("invalid token", () => {
    it("required: 403 INVALID_TOKEN parity", async () => {
      const res = await getBoth(PATHS.required, { header: `Bearer ${invalidToken}` });
      expectParity4xx(res, 403);
      expect(res.expressRes.body.code).toBe("INVALID_TOKEN");
      expect(res.expressRes.body.message).toBe("Invalid access token");
    });

    it("require: 403 INVALID_TOKEN parity", async () => {
      const res = await getBoth(PATHS.require, { header: `Bearer ${invalidToken}` });
      expectParity4xx(res, 403);
      expect(res.expressRes.body.code).toBe("INVALID_TOKEN");
    });

    it("optional: invalid token treated as guest (user undefined, no 401)", async () => {
      const res = await getBoth(PATHS.optional, { header: `Bearer ${invalidToken}` });
      expectParity2xx(res);
      expect(res.nestRes.body).toEqual({ userId: null });
    });
  });

  // ── Expired token ──────────────────────────────────────────────────────────
  describe("expired token", () => {
    it("required: 401 TOKEN_EXPIRED parity", async () => {
      const res = await getBoth(PATHS.required, { header: `Bearer ${expiredToken}` });
      expectParity4xx(res, 401);
      expect(res.expressRes.body.code).toBe("TOKEN_EXPIRED");
      expect(res.expressRes.body.message).toBe("Access token has expired");
    });

    it("require: 401 TOKEN_EXPIRED parity (require message)", async () => {
      const res = await getBoth(PATHS.require, { header: `Bearer ${expiredToken}` });
      expectParity4xx(res, 401);
      expect(res.expressRes.body.code).toBe("TOKEN_EXPIRED");
      expect(res.expressRes.body.message).toBe("Your session has expired. Please sign in again.");
    });

    it("optional: expired token treated as guest (user undefined, no 401)", async () => {
      const res = await getBoth(PATHS.optional, { header: `Bearer ${expiredToken}` });
      expectParity2xx(res);
      expect(res.nestRes.body).toEqual({ userId: null });
    });
  });

  // ── Valid token (Authorization header) — parity ───────────────────────────
  describe("valid token via Authorization header", () => {
    it("required: 200 with the user attached", async () => {
      const res = await getBoth(PATHS.required, { header: `Bearer ${validToken}` });
      expectParity2xx(res);
      expect(res.nestRes.body).toEqual({ userId: TEST_USER_ID });
    });

    it("require: 200 with the user attached", async () => {
      const res = await getBoth(PATHS.require, { header: `Bearer ${validToken}` });
      expectParity2xx(res);
      expect(res.nestRes.body).toEqual({ userId: TEST_USER_ID });
    });

    it("optional: 200 with the user attached", async () => {
      const res = await getBoth(PATHS.optional, { header: `Bearer ${validToken}` });
      expectParity2xx(res);
      expect(res.nestRes.body).toEqual({ userId: TEST_USER_ID });
    });
  });

  // ── httpOnly cookie transport — CALIBRATED ADDITION (Nest-only) ───────────
  describe("valid token via httpOnly accessToken cookie (calibrated addition)", () => {
    it("nest authenticates via the cookie; express does not read cookies (documented delta)", async () => {
      const res = await getBoth(PATHS.required, { cookie: `accessToken=${validToken}` });
      // Nest (calibrated spec): the cookie fallback authenticates the user.
      expect(res.nestRes.status).toBe(200);
      expect(res.nestRes.body).toEqual({ userId: TEST_USER_ID });
      // Express (current middleware): header-only → guest → 401 MISSING_TOKEN.
      // This is the documented delta — the calibrated guards ADD cookie auth.
      expect(res.expressRes.status).toBe(401);
      expect(res.expressRes.body.code).toBe("MISSING_TOKEN");
    });
  });
});
