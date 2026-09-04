/**
 * @file apps/backend/src/nest/guards/__tests__/auth-guards.test.ts
 * @description Unit tests for Story 24-5 — the calibrated Nest auth guards
 * (`AuthGuard`, `OptionalAuthGuard`, `RequireAuthGuard`).
 *
 * Each guard is constructed with a MOCKED `JwtService` (only `verifyAccessToken`
 * is exercised — no real JWT, no env, no DB), so the tests are pure and fast.
 * They pin the calibrated semantics ported from `authMiddleware.ts` +
 * `wip/guest-access-calibration.md` (F6 guest handling):
 *   - `AuthGuard` / `RequireAuthGuard`: reject guests — 401 missing / 401
 *     expired / 403 invalid; allow + attach `req.userId`/`req.user` on valid.
 *   - `OptionalAuthGuard`: never 401/403 — guest identity stays undefined for
 *     no/invalid/expired tokens; attaches the user on valid.
 *   - Transport: `Authorization: Bearer` header (primary) + httpOnly
 *     `accessToken` cookie fallback (secondary; header wins).
 *
 * The HTTP-level envelope (`{code, message, requestId}`) is covered by the
 * integration parity test (`tests/integration/nest/auth-guards-parity.test.ts`).
 */

import { describe, it, expect, vi } from "vitest";
import type { ExecutionContext } from "@nestjs/common";
import { ForbiddenException, UnauthorizedException } from "@nestjs/common";
import type { Request } from "express";
import { AuthGuard } from "../auth-guard.js";
import { OptionalAuthGuard } from "../optional-auth.guard.js";
import { RequireAuthGuard } from "../require-auth.guard.js";
import { ACCESS_TOKEN_COOKIE } from "../auth-guard.shared.js";
import type {
  JwtService,
  TokenPayload,
} from "../../../shared/infrastructure/security/JwtService.js";

// ── Helpers ────────────────────────────────────────────────────────────────

/** Minimal `ExecutionContext` exposing an Express-shaped request. */
function createContext(req: Request): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => req,
      getResponse: () => ({}) as Response,
    }),
  } as unknown as ExecutionContext;
}

/** Build an Express-request-shaped object with header/cookie overrides. */
function mockRequest(
  overrides: {
    headers?: Record<string, string | undefined>;
    cookies?: Record<string, string>;
  } = {},
): Request {
  return {
    headers: { ...overrides.headers },
    cookies: { ...overrides.cookies },
  } as Request;
}

/** Capture the rejection a guard throws (guards throw synchronously or reject). */
async function captureError(fn: () => boolean | Promise<boolean>): Promise<unknown> {
  try {
    const result = fn();
    if (result instanceof Promise) {
      await result;
    }
    return undefined;
  } catch (error) {
    return error;
  }
}

const VALID_PAYLOAD: TokenPayload = { userId: "user-123" };

function mockJwtService(impl: (token: string) => TokenPayload) {
  const jwtService = { verifyAccessToken: vi.fn(impl) } as unknown as JwtService;
  return { jwtService, spy: jwtService.verifyAccessToken as ReturnType<typeof vi.fn> };
}

function expectAuthError(
  error: unknown,
  ctor: typeof UnauthorizedException,
  status: number,
  body: object,
) {
  expect(error).toBeInstanceOf(ctor);
  const e = error as UnauthorizedException;
  expect(e.getStatus()).toBe(status);
  expect(e.getResponse()).toEqual(body);
}

// ── AuthGuard (authenticateToken semantics) ────────────────────────────────

describe("AuthGuard (authenticateToken semantics)", () => {
  it("rejects a guest (no token) with 401 MISSING_TOKEN", async () => {
    const { jwtService } = mockJwtService(() => VALID_PAYLOAD);
    const guard = new AuthGuard(jwtService);
    const error = await captureError(() =>
      guard.canActivate(createContext(mockRequest({ headers: {} }))),
    );
    expectAuthError(error, UnauthorizedException, 401, {
      code: "MISSING_TOKEN",
      message: "Access token is required",
    });
  });

  it("rejects a malformed Authorization header (no bearer token) with 401 MISSING_TOKEN", async () => {
    const { jwtService } = mockJwtService(() => VALID_PAYLOAD);
    const guard = new AuthGuard(jwtService);
    // "Bearer" with nothing after it → `split(" ")[1]` is undefined → MISSING.
    const error = await captureError(() =>
      guard.canActivate(createContext(mockRequest({ headers: { authorization: "Bearer" } }))),
    );
    expectAuthError(error, UnauthorizedException, 401, {
      code: "MISSING_TOKEN",
      message: "Access token is required",
    });
  });

  it("rejects an expired token with 401 TOKEN_EXPIRED", async () => {
    const expired = new Error("jwt expired") as Error & { name: string };
    expired.name = "TokenExpiredError";
    const { jwtService } = mockJwtService(() => {
      throw expired;
    });
    const guard = new AuthGuard(jwtService);
    const error = await captureError(() =>
      guard.canActivate(
        createContext(mockRequest({ headers: { authorization: "Bearer expired-token" } })),
      ),
    );
    expectAuthError(error, UnauthorizedException, 401, {
      code: "TOKEN_EXPIRED",
      message: "Access token has expired",
    });
  });

  it("rejects an invalid token with 403 INVALID_TOKEN", async () => {
    const invalid = new Error("invalid signature") as Error & { name: string };
    invalid.name = "JsonWebTokenError";
    const { jwtService } = mockJwtService(() => {
      throw invalid;
    });
    const guard = new AuthGuard(jwtService);
    const error = await captureError(() =>
      guard.canActivate(
        createContext(mockRequest({ headers: { authorization: "Bearer not-a-jwt" } })),
      ),
    );
    expectAuthError(error, ForbiddenException, 403, {
      code: "INVALID_TOKEN",
      message: "Invalid access token",
    });
  });

  it("allows a valid Bearer token and attaches req.userId + req.user", async () => {
    const { jwtService } = mockJwtService(() => VALID_PAYLOAD);
    const guard = new AuthGuard(jwtService);
    const req = mockRequest({ headers: { authorization: "Bearer valid-token" } });

    expect(guard.canActivate(createContext(req))).toBe(true);
    expect(req.userId).toBe("user-123");
    expect(req.user).toEqual(VALID_PAYLOAD);
  });

  it("allows a valid token from the httpOnly accessToken cookie (calibrated fallback)", async () => {
    const { jwtService } = mockJwtService(() => VALID_PAYLOAD);
    const guard = new AuthGuard(jwtService);
    const req = mockRequest({ cookies: { [ACCESS_TOKEN_COOKIE]: "cookie-token" } });

    expect(guard.canActivate(createContext(req))).toBe(true);
    expect(req.userId).toBe("user-123");
  });

  it("prefers the Authorization header over the cookie (header wins)", async () => {
    const { jwtService, spy } = mockJwtService(() => VALID_PAYLOAD);
    const guard = new AuthGuard(jwtService);
    const req = mockRequest({
      headers: { authorization: "Bearer header-token" },
      cookies: { [ACCESS_TOKEN_COOKIE]: "cookie-token" },
    });

    expect(guard.canActivate(createContext(req))).toBe(true);
    expect(spy).toHaveBeenCalledWith("header-token");
    expect(spy).not.toHaveBeenCalledWith("cookie-token");
  });
});

// ── OptionalAuthGuard (optionalAuth semantics) ─────────────────────────────

describe("OptionalAuthGuard (optionalAuth semantics, calibrated F6)", () => {
  it("allows a guest with no token and leaves req.userId undefined (never 401)", async () => {
    const { jwtService } = mockJwtService(() => VALID_PAYLOAD);
    const guard = new OptionalAuthGuard(jwtService);
    const req = mockRequest({ headers: {} });

    expect(guard.canActivate(createContext(req))).toBe(true);
    expect(req.userId).toBeUndefined();
    expect(req.user).toBeUndefined();
  });

  it("allows a bad token as a guest (user undefined) — calibrated: never all-unlocked, never 401", async () => {
    const { jwtService } = mockJwtService(() => {
      throw new Error("invalid signature");
    });
    const guard = new OptionalAuthGuard(jwtService);
    const req = mockRequest({ headers: { authorization: "Bearer bad-token" } });

    expect(guard.canActivate(createContext(req))).toBe(true);
    expect(req.userId).toBeUndefined();
    expect(req.user).toBeUndefined();
  });

  it("allows an expired token as a guest (user undefined) — no 401", async () => {
    const expired = new Error("jwt expired") as Error & { name: string };
    expired.name = "TokenExpiredError";
    const { jwtService } = mockJwtService(() => {
      throw expired;
    });
    const guard = new OptionalAuthGuard(jwtService);
    const req = mockRequest({ headers: { authorization: "Bearer expired-token" } });

    expect(guard.canActivate(createContext(req))).toBe(true);
    expect(req.userId).toBeUndefined();
  });

  it("attaches req.userId for a valid token", async () => {
    const { jwtService } = mockJwtService(() => VALID_PAYLOAD);
    const guard = new OptionalAuthGuard(jwtService);
    const req = mockRequest({ headers: { authorization: "Bearer valid-token" } });

    expect(guard.canActivate(createContext(req))).toBe(true);
    expect(req.userId).toBe("user-123");
    expect(req.user).toEqual(VALID_PAYLOAD);
  });
});

// ── RequireAuthGuard (requireAuth / guest-rejecting semantics) ─────────────

describe("RequireAuthGuard (requireAuth semantics, guest-rejecting)", () => {
  it("rejects a guest (no token) with 401 AUTH_REQUIRED", async () => {
    const { jwtService } = mockJwtService(() => VALID_PAYLOAD);
    const guard = new RequireAuthGuard(jwtService);
    const error = await captureError(() =>
      guard.canActivate(createContext(mockRequest({ headers: {} }))),
    );
    expectAuthError(error, UnauthorizedException, 401, {
      code: "AUTH_REQUIRED",
      message: "Please sign in to access this feature",
    });
  });

  it("rejects an expired token with 401 TOKEN_EXPIRED (require message)", async () => {
    const expired = new Error("jwt expired") as Error & { name: string };
    expired.name = "TokenExpiredError";
    const { jwtService } = mockJwtService(() => {
      throw expired;
    });
    const guard = new RequireAuthGuard(jwtService);
    const error = await captureError(() =>
      guard.canActivate(
        createContext(mockRequest({ headers: { authorization: "Bearer expired-token" } })),
      ),
    );
    expectAuthError(error, UnauthorizedException, 401, {
      code: "TOKEN_EXPIRED",
      message: "Your session has expired. Please sign in again.",
    });
  });

  it("rejects an invalid token with 403 INVALID_TOKEN", async () => {
    const invalid = new Error("invalid signature") as Error & { name: string };
    invalid.name = "JsonWebTokenError";
    const { jwtService } = mockJwtService(() => {
      throw invalid;
    });
    const guard = new RequireAuthGuard(jwtService);
    const error = await captureError(() =>
      guard.canActivate(
        createContext(mockRequest({ headers: { authorization: "Bearer not-a-jwt" } })),
      ),
    );
    expectAuthError(error, ForbiddenException, 403, {
      code: "INVALID_TOKEN",
      message: "Invalid access token",
    });
  });

  it("allows a valid token and attaches req.userId + req.user", async () => {
    const { jwtService } = mockJwtService(() => VALID_PAYLOAD);
    const guard = new RequireAuthGuard(jwtService);
    const req = mockRequest({ headers: { authorization: "Bearer valid-token" } });

    expect(guard.canActivate(createContext(req))).toBe(true);
    expect(req.userId).toBe("user-123");
    expect(req.user).toEqual(VALID_PAYLOAD);
  });
});
