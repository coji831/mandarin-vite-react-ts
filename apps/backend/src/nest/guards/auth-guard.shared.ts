/**
 * @file apps/backend/src/nest/guards/auth-guard.shared.ts
 * @description Shared token-resolution + request-attachment helpers for the
 * calibrated Nest auth guards (Story 24-5 — Auth-Surface Guards (Calibrated)).
 *
 * The three guards (`AuthGuard`, `OptionalAuthGuard`, `RequireAuthGuard`) share
 * two concerns — WHERE the access token comes from and HOW the verified user is
 * attached to the request — and the exact 401/403 body contract. Those live
 * here so the guards stay small and the calibrated semantics have a single
 * home.
 *
 * Calibrated semantics (source of truth: `wip/guest-access-calibration.md`,
 * F6-unified guest handling):
 *   - A guest is a request with NO verifiable access token → `req.userId` /
 *     `req.user` stay UNDEFINED. Consuming controllers must treat an undefined
 *     `req.userId` as "guest" and return session-local/empty data — NEVER fall
 *     through to an "all-unlocked" shape (the P0-1 cross-tenant leak is
 *     exactly that class of bug).
 *   - Transport resolution order (matches `authMiddleware.ts`): the
 *     `Authorization: Bearer <token>` header is PRIMARY; the httpOnly
 *     `accessToken` cookie is a SECONDARY fallback (new in the Nest port —
 *     cookie-parser is mounted on the shell; inert today because only the
 *     `refreshToken` cookie is ever set, and that carries the REFRESH secret,
 *     never an access token).
 */

import type { Request } from "express";
import type { TokenPayload } from "../../shared/infrastructure/security/JwtService.js";

/**
 * httpOnly access-token cookie name — the secondary auth transport for the
 * Nest guards (header wins). No surface sets this today (the auth module only
 * sets the `refreshToken` httpOnly cookie); it is a forward-compatible fallback
 * so a cookie-carrying client (e.g. the auth module port in 24-6) authenticates
 * without code changes. The `refreshToken` cookie is deliberately NOT read here
 * — it is signed with the refresh secret and must never be treated as an
 * access token.
 */
export const ACCESS_TOKEN_COOKIE = "accessToken";

/**
 * Shared 401/403 response bodies — `code` + `message` match `authMiddleware.ts`
 * byte-for-byte. Nest guards throw these as `UnauthorizedException` (401) /
 * `ForbiddenException` (403); the global `AppExceptionFilter` (24-3) serializes
 * them into the `{ code, message, requestId }` envelope.
 *
 * 401 vs 403 (kept identical to the current Express convention — the
 * calibration spec does not override it):
 *   - missing token  → 401 (not signed in)
 *   - expired token  → 401 (session expired)
 *   - invalid token  → 403 (a token is present but cannot be trusted)
 */
export const AUTH_GUARD_ERRORS = {
  /** `authenticateToken` semantics (`AuthGuard`). */
  missing: { code: "MISSING_TOKEN", message: "Access token is required" },
  expired: { code: "TOKEN_EXPIRED", message: "Access token has expired" },
  invalid: { code: "INVALID_TOKEN", message: "Invalid access token" },
  /** `requireAuth` semantics (`RequireAuthGuard`). */
  requireMissing: { code: "AUTH_REQUIRED", message: "Please sign in to access this feature" },
  requireExpired: {
    code: "TOKEN_EXPIRED",
    message: "Your session has expired. Please sign in again.",
  },
} as const;

/**
 * Resolve the access token, mirroring `authMiddleware.ts` exactly:
 *   1. `Authorization` header — `header.split(" ")[1]` (the "Bearer TOKEN"
 *      shape; a malformed header yields `undefined` → treated as MISSING).
 *   2. httpOnly `accessToken` cookie fallback (calibrated addition).
 *
 * @returns the raw token string, or `undefined` when neither source yields one.
 */
export function resolveAccessToken(req: Request): string | undefined {
  const authHeader = req.headers["authorization"];
  if (authHeader) {
    const token = authHeader.split(" ")[1]; // Bearer TOKEN — same split as authMiddleware
    if (token) {
      return token;
    }
  }

  const cookieToken = req.cookies?.[ACCESS_TOKEN_COOKIE];
  return cookieToken || undefined;
}

/**
 * Attach the verified user to the request so ported controllers read the
 * identical identity shape as on Express: `req.user` (decoded payload) + the
 * convenience `req.userId` field.
 */
export function attachAuthUser(req: Request, decoded: TokenPayload): void {
  req.user = decoded as { userId: string; email?: string } & Record<string, unknown>;
  req.userId = decoded.userId;
}
