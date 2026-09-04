/**
 * @file apps/backend/src/nest/guards/require-auth.guard.ts
 * @description NestJS `RequireAuthGuard` — guest-rejecting auth guard ported
 * from the Express `requireAuth` middleware (Story 24-5 — Auth-Surface Guards
 * (Calibrated)).
 *
 * Contract (calibrated F6 guest semantics; source `wip/guest-access-
 * calibration.md`):
 *   - No token       → 401 `{ code: "AUTH_REQUIRED", message: "Please sign in to access this feature" }`
 *   - Expired token  → 401 `{ code: "TOKEN_EXPIRED",  message: "Your session has expired. Please sign in again." }`
 *   - Invalid token  → 403 `{ code: "INVALID_TOKEN",  message: "Invalid access token" }`
 *   - Valid token    → attaches `req.user` + `req.userId`, allows the request.
 *
 * This is the guest-rejecting variant for user-scoped / cost-bearing routes
 * (SRS, progress persistence, AI-feedback generation, mnemonic generation,
 * readers generate, review) — per S11/P11 in the calibration spec, guests
 * never reach endpoints that persist their state or incur vendor cost. The
 * friendlier "Please sign in" message differs from `AuthGuard`'s generic
 * "Access token is required"; pick per-route exactly as the Express routes do.
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
export class RequireAuthGuard implements CanActivate {
  constructor(@Inject(JwtService) private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const token = resolveAccessToken(req);

    if (!token) {
      throw new UnauthorizedException(AUTH_GUARD_ERRORS.requireMissing);
    }

    let decoded: TokenPayload;
    try {
      decoded = this.jwtService.verifyAccessToken(token);
    } catch (error) {
      if (error instanceof Error && error.name === "TokenExpiredError") {
        throw new UnauthorizedException(AUTH_GUARD_ERRORS.requireExpired);
      }
      throw new ForbiddenException(AUTH_GUARD_ERRORS.invalid);
    }

    attachAuthUser(req, decoded);
    return true;
  }
}
