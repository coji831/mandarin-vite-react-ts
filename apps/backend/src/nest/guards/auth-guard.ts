/**
 * @file apps/backend/src/nest/guards/auth-guard.ts
 * @description NestJS `AuthGuard` — required-auth guard ported from the
 * Express `authenticateToken` middleware (Story 24-5 — Auth-Surface Guards
 * (Calibrated)).
 *
 * Contract (calibrated F6 guest semantics; source `wip/guest-access-
 * calibration.md`):
 *   - No token       → 401 `{ code: "MISSING_TOKEN", message: "Access token is required" }`
 *   - Expired token  → 401 `{ code: "TOKEN_EXPIRED",  message: "Access token has expired" }`
 *   - Invalid token  → 403 `{ code: "INVALID_TOKEN",  message: "Invalid access token" }`
 *   - Valid token    → attaches `req.user` + `req.userId`, allows the request.
 *
 * A guest (no verifiable token) is REJECTED — never let an unauthenticated
 * request through as a "full user". Use for routes that must have a signed-in
 * user (e.g. `/auth/me`). For the user-scoped / cost-bearing routes that need
 * the friendlier "Please sign in" message, use `RequireAuthGuard` instead.
 *
 * Throws `UnauthorizedException`/`ForbiddenException`; the global
 * `AppExceptionFilter` (24-3) serializes them into the
 * `{ code, message, requestId }` envelope.
 */

import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request } from "express";
import { JwtService, type TokenPayload } from "../../shared/infrastructure/security/JwtService.js";
import { AUTH_GUARD_ERRORS, attachAuthUser, resolveAccessToken } from "./auth-guard.shared.js";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(@Inject(JwtService) private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const token = resolveAccessToken(req);

    if (!token) {
      throw new UnauthorizedException(AUTH_GUARD_ERRORS.missing);
    }

    let decoded: TokenPayload;
    try {
      decoded = this.jwtService.verifyAccessToken(token);
    } catch (error) {
      if (error instanceof Error && error.name === "TokenExpiredError") {
        throw new UnauthorizedException(AUTH_GUARD_ERRORS.expired);
      }
      throw new ForbiddenException(AUTH_GUARD_ERRORS.invalid);
    }

    attachAuthUser(req, decoded);
    return true;
  }
}
