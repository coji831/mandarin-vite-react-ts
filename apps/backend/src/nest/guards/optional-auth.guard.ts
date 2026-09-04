/**
 * @file apps/backend/src/nest/guards/optional-auth.guard.ts
 * @description NestJS `OptionalAuthGuard` — best-effort auth guard ported from
 * the Express `optionalAuth` middleware (Story 24-5 — Auth-Surface Guards
 * (Calibrated)).
 *
 * Contract (calibrated F6 guest semantics; source `wip/guest-access-
 * calibration.md`):
 *   - No token, invalid token, or expired token → request proceeds with
 *     `req.userId` / `req.user` UNDEFINED (the caller is a guest). NEVER 401/403.
 *   - Valid token → attaches `req.user` + `req.userId` (the caller is
 *     authenticated).
 *
 * F6-calibrated guest handling: a guest is unauthenticated/empty. The guard
 * establishes that contract by leaving the identity undefined; the CONSUMING
 * controller must treat `req.userId === undefined` as guest and return
 * session-local/empty data — never fall through to an "all-unlocked" shape.
 * This is the guard behind the calibrated `optionalAuth` reads (mnemonics GET,
 * words, review/progression guests, quiz submit, TTS).
 */

import { CanActivate, ExecutionContext, Inject, Injectable } from "@nestjs/common";
import type { Request } from "express";
import { JwtService } from "../../shared/infrastructure/security/JwtService.js";
import { attachAuthUser, resolveAccessToken } from "./auth-guard.shared.js";

@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(@Inject(JwtService) private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const token = resolveAccessToken(req);

    if (!token) {
      return true; // guest — user stays undefined
    }

    try {
      const decoded = this.jwtService.verifyAccessToken(token);
      attachAuthUser(req, decoded);
    } catch {
      // Invalid or expired token — continue WITHOUT user (guest), mirroring
      // `optionalAuth`: a stale/bad token must never be treated as a valid
      // user, and must never hard-fail a public read.
    }

    return true;
  }
}
