**Last Updated:** August 21, 2026

# Story 24.5: Auth-Surface Guards (Calibrated)

## Description

**As a** backend engineer,
**I want to** port the three Express auth-middleware semantics (`authenticateToken`, `optionalAuth`, `requireAuth`) to NestJS guards (`AuthGuard`, `OptionalAuthGuard`, `RequireAuthGuard`) targeting the **calibrated** unified guest semantics — F6 (guest → session-local/empty, never all-unlocked) from the guest-access calibration spec — with the calibration spec as the source of truth rather than the current pre-calibration code,
**So that** later module ports (24-6 auth, 24-8 mnemonics, 24-10 audio, 24-11 review, 24-12 readers, 24-13 quiz/progression) apply auth per-route via `@UseGuards` with the calibrated identity contract already correct — the port **is** the fix, with no "port pre-25 then rework" (ADR-24-B).

## Business Value

This story absorbs epic-25's F6 unification (guest-auth semantics) into the migration. Because the auth surface (`authMiddleware`) is the single-most-ported middleware and the `shared-constants` guest gate is the most-coupled surface, porting the guards once — directly to the **calibrated** shape — avoids the double-touch of shipping the current F6-inconsistent shape (guest treated as a full user / `currentPhase: 4` all-unlocked) and reworking it after epic-25. It de-risks every later consumer by establishing the three guard primitives + their shared token-resolution/attachment helpers + the exact 401/403 contract, proven byte-for-byte against the Express middleware by a hermetic HTTP parity harness (real Express `authMiddleware` vs real Nest guards on identical test-protected routes).

It also ships the **calibrated guest contract** as the port target: a guest is a request with no verifiable access token → `req.userId`/`req.user` stay undefined, `OptionalAuthGuard` never 401s and never promotes a guest to a valid user, and no route ever falls through to an "all-unlocked" shape (the P0-1 cross-tenant leak is exactly that class of bug). This is the security-correct baseline that downstream F6-inconsistent controllers (progression `/gates` GUEST object, `/phase-gate` all-unlocked) re-point to in 24-13.

## Acceptance Criteria

- [x] Three Nest guards exist under `apps/backend/src/nest/guards/` — `AuthGuard` (`authenticateToken` semantics), `OptionalAuthGuard` (`optionalAuth` semantics), `RequireAuthGuard` (`requireAuth` semantics).
- [x] Guards reproduce the post-calibration semantics: missing token → 401, expired token → 401, invalid/forged token → 403 (codes `MISSING_TOKEN`/`AUTH_REQUIRED`/`TOKEN_EXPIRED`/`INVALID_TOKEN`); a valid token attaches `req.userId`/`req.user`; `OptionalAuthGuard` treats no/invalid/expired tokens as guest — `req.userId` stays undefined, never 401, never a valid user, never all-unlocked.
- [x] Parity harness (`tests/integration/nest/auth-guards-parity.test.ts`) proves 401/403 + guest-vs-user responses identical to Express on a test-protected route, with the calibrated guest shape per the calibration spec (F6).
- [x] Guard unit tests cover success/failure/guest/expired-token paths (`src/nest/guards/__tests__/auth-guards.test.ts`).
- [x] Landed with **no code dependency on 24-7** — the guards target the calibration spec (F6), never `createGuestPhaseGate`.
- [x] No change to `packages/shared-constants`.
- [x] No 25–28 collision-zone file touched.

## Business Rules

1. **Calibrated semantics are the port target, not current code (ADR-24-B)** — the guards reproduce the F6-unified guest shape from the calibration spec (guest → session-local/empty, never all-unlocked); the calibration spec is the source of truth, not `authMiddleware.ts`, wherever they differ.
2. **401 vs 403 convention preserved** — missing token → 401 (not signed in), expired token → 401 (session expired), invalid/forged token → 403 (a token is present but cannot be trusted). `code` + `message` match `authMiddleware.ts` byte-for-byte; only the legacy `error` key is dropped (superseded by the 24-3 `{ code, message, requestId }` envelope).
3. **Token transport: Bearer header primary, httpOnly `accessToken` cookie secondary** — resolution order mirrors `authMiddleware.ts` (`header.split(" ")[1]`), plus a calibrated cookie fallback (`ACCESS_TOKEN_COOKIE = "accessToken"`) that is inert today: only the `refreshToken` httpOnly cookie is ever set, and it is deliberately never read as an access token (it carries the refresh secret).
4. **`req.userId`/`req.user` attach contract** — a verified token attaches both (`attachAuthUser`); `OptionalAuthGuard` leaves both undefined for no/invalid/expired tokens so consuming controllers treat `req.userId === undefined` as guest.
5. **Guards are providers, not global (`APP_GUARD`)** — `GuardsModule` provides/exports the guards; later stories import it and apply them per-route via `@UseGuards`. A global guard would break the 4 ported reference modules' public routes (words / phonetic-clusters / grammar / chengyu are unauthenticated).
6. **No dependency on 24-7** — the guards read the calibration spec only; they never import `createGuestPhaseGate` or anything from `packages/shared-constants`.
7. **No new production routes** — the guards introduce no endpoints; the `_guards` parity routes are test-protected harness-only (deliberately not in `ROUTE_PATTERNS`).

## Related Issues

- Epic 24: NestJS Shell Migration — [BR](README.md) (epic parent)
- **Story 24.4: SharedModule/DatabaseModule + Async Providers** ([BR](story-24-4-shared-module-async-providers.md)) (dependency — provides `JwtService`, which the guards inject)
- **Story 24.6: Auth Module Port** ([IMP stub](../../issue-implementation/epic-24-nestjs-shell-migration/README.md#24-6--auth-module-port)) (consumer — applies `AuthGuard` to `/auth/me`)
- **Story 24.8: Characters + Mnemonics Port** ([IMP stub](../../issue-implementation/epic-24-nestjs-shell-migration/README.md#24-8--characters--mnemonics-port)) (consumer — calibrated `OptionalAuthGuard`)
- **Story 24.13: Quiz + Progression Port** ([IMP stub](../../issue-implementation/epic-24-nestjs-shell-migration/README.md#24-13--quiz--progression-port)) (consumer — F6-inconsistent controllers re-pointed to the calibrated guest shape)
- **Implementation (IMP twin):** `story-24-5-auth-guards-calibrated.md` → `../../../issue-implementation/epic-24-nestjs-shell-migration/story-24-5-auth-guards-calibrated.md`

## Implementation Status

- **Status**: Completed
- **PR**: TBD
- **Merge Date**: TBD
- **Commit hash**: _(to be filled at epic close)_
- **Implementation note:** `AuthGuard`/`OptionalAuthGuard`/`RequireAuthGuard` shipped under `apps/backend/src/nest/guards/` with shared helpers (`resolveAccessToken` header→cookie, `attachAuthUser` → `req.user`/`req.userId`, `AUTH_GUARD_ERRORS` 401/403 bodies matching `authMiddleware.ts` byte-for-byte, `ACCESS_TOKEN_COOKIE` const), wired into `app.module.ts` via the `GuardsModule` providers module (not global — public routes unaffected); hermetic parity harness (`tests/integration/nest/auth-guards-parity.test.ts`) proves 401/403 + guest-vs-user identical to the real Express middleware; guard unit tests cover success/failure/guest/expired-token paths; additive `JwtService.verifyAccessToken` (+ tests); no code dependency on 24-7; no `packages/shared-constants` and no 25–28 zone file touched. All 7 ACs verified against the shipped code — commit hash deferred to epic close.
