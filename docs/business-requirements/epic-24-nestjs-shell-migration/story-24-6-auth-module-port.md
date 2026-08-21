**Last Updated:** August 21, 2026

# Story 24.6: Auth Module Port

## Description

**As a** backend engineer,
**I want to** port the `auth` module — all 5 endpoints (`register`, `login`, `refresh`, `logout`, `me`) — from Express (`AuthController.ts` + `authRoutes.ts`) to the NestJS 11 shell (`AuthModule` + `AuthNestController`), wired with the 24-5 calibrated `AuthGuard` on `/me` and the brute-force rate-limit parity (one shared `authLimiter` on `register`/`login`, 5 req/min per IP),
**So that** the auth surface becomes contract-identical on the Nest shell — same routes, same 2xx JSON, same `code`/`message` semantics (24-3 envelope on 4xx, direct `{error, code, message}` on 429), same httpOnly refresh-token cookie + rotation, and the same brute-force 429 shape — proven by a DB-gated parity harness (real Express vs real Nest) that keeps the migration additive with the Express production path untouched until the 24-15 cutover.

## Business Value

The auth module is the security-critical surface every other protected route depends on. Porting it with an exact parity harness de-risks the remaining module ports (24-8…24-13) by proving, at the HTTP level, that the Nest shell responds identically to Express for the most sensitive endpoints: registration/login validation, credential errors, refresh-token rotation, httpOnly cookie semantics, and the brute-force 429. Because `/me` consumes the 24-5 `AuthGuard` (calibrated contract), this story is also the **first live consumer** of the guards in a real (non-hermetic) Nest module, and it documents the calibrated cookie-fallback delta (Nest authenticates via the `accessToken` httpOnly cookie where Express is header-only) so the cutover carries no hidden auth regressions. The parity suite is DB-backed and exercises real user rows, so the full register→me→login→refresh→logout→429 lifecycle is verified end-to-end on both stacks.

## Acceptance Criteria

- [x] All 5 auth endpoints ported under `apps/backend/src/modules/auth/nest/` — `POST /v1/auth/register`, `POST /v1/auth/login`, `POST /v1/auth/refresh`, `POST /v1/auth/logout`, `GET /v1/auth/me` (path + verb verbatim from `ROUTE_PATTERNS`, `/api` prefix applied by the shell) — reusing the Express `AuthService`/`AuthRepository` unchanged.
- [x] Guards applied to the right routes: `register`/`login`/`refresh`/`logout` public (matching `authRoutes.ts`), `GET /v1/auth/me` → `@UseGuards(AuthGuard)` (24-5 required auth; missing token → 401 `MISSING_TOKEN`).
- [x] Parity harness (`tests/integration/nest/auth-parity.test.ts`) green — DB-gated, boots the real Express app + the real Nest `AppModule`; status + body parity on all 5 endpoints, with the error envelope verified on 400/401/404/409 (`{code, message, requestId}` vs Express legacy `{error, code, message}` — code/message byte-for-byte).
- [x] Refresh-token rotation + httpOnly cookie semantics preserved (integration test): `refresh(R1)` → 200 + new cookie R2 on both apps; reusing R1 → 401 `INVALID_TOKEN`; `setRefreshTokenCookie`/`clearRefreshTokenCookie` byte-for-byte with the Express controller; cookie cleared on logout.
- [x] Brute-force rate-limit matches Express — one shared `authLimiter` (5 req/min per IP, `RATE_LIMIT_EXCEEDED`) mounted on `/register` + `/login`; the 6th login attempt → 429 with a body deep-equal to Express (`{error, code, message}` sent directly, no envelope).
- [x] `/me` returns the authenticated user's profile (200 `{success, data: {user}}`), 401 without a token, 404 for an unknown userId — parity with Express; the calibrated cookie-fallback delta recorded (Nest authenticates via the `accessToken` cookie, Express is header-only).
- [x] Express auth path (`container.ts`, `AuthController.ts`, `authRoutes.ts`) untouched — still the production surface until the 24-15 cutover; no 25–28 zone file touched.

## Business Rules

1. **Routes are verbatim from `ROUTE_PATTERNS`** — `authRegister`/`authLogin`/`authRefresh`/`authLogout`/`authMe` (`/v1/auth/*`, `/api` prefix applied by the shell); the Nest controller mirrors `AuthController.ts` 1:1, reusing `AuthService` unchanged.
2. **Envelope parity (24-3 contract)** — 4xx/5xx are thrown as `HttpException`s carrying the same `code` + `message` as the Express `{error, code, message}` bodies; the global `AppExceptionFilter` serializes them into `{code, message, requestId}`. `code`/`message` are byte-for-byte equal to Express; the legacy `error` key is superseded by the envelope.
3. **429 is the exception** — the brute-force limiter uses express-rate-limit's default handler, which sends the `message` object directly as the 429 body (`{error, code, message}`, no envelope) — byte-identical to Express by construction.
4. **Cookie semantics preserved** — httpOnly `refreshToken` cookie, 7-day maxAge, `secure` in production, `sameSite: none` (prod) / `lax` (dev), `path: /`; set on register/login/refresh, cleared on logout — identical to `AuthController.setRefreshTokenCookie`/`clearRefreshTokenCookie`.
5. **Refresh-token rotation preserved** — the service rotates the refresh token; the controller sets the NEW cookie exactly as Express does; a reused/rotated-out token → 401 `INVALID_TOKEN`.
6. **Guards per-route via `@UseGuards`, not global** — `AuthModule` imports `GuardsModule` (24-5) and applies `AuthGuard` only to `/me`; the four public auth routes stay public.
7. **Additive-only** — the Express auth wiring is untouched; the Nest surface coexists until the module cutover (24-15). No `packages/shared-constants` change.

## Related Issues

- Epic 24: NestJS Shell Migration — [BR](README.md) (epic parent)
- **Story 24.3: HTTP-Layer Parity** ([BR](story-24-3-http-layer-parity.md)) (dependency — the `{code, message, requestId}` envelope + rate-limit infra the auth port inherits)
- **Story 24.4: SharedModule/DatabaseModule + Async Providers** ([BR](story-24-4-shared-module-async-providers.md)) (dependency — `AuthRepository` via `useFactory`, `JwtService`/`PasswordService` from `SharedModule`)
- **Story 24.5: Auth-Surface Guards (Calibrated)** ([BR](story-24-5-auth-guards-calibrated.md)) (dependency — `AuthGuard` applied to `/me`; first live consumer)
- **Implementation (IMP twin):** `story-24-6-auth-module-port.md` → `../../issue-implementation/epic-24-nestjs-shell-migration/story-24-6-auth-module-port.md`

## Implementation Status

- **Status**: Completed
- **PR**: TBD
- **Merge Date**: TBD
- **Commit hash**: `19cf58b2`
- **Implementation note:** `AuthModule` is a 1:1 translation of `createAuthModule(deps)` (`AuthRepository` useFactory + `AuthService` useFactory injecting `AuthRepository` + `JwtService` + `PasswordService`; imports `SharedModule` + `GuardsModule`; exports `AuthService`); `AuthNestController` mirrors `AuthController.ts` 1:1 (routes verbatim, `@Res({passthrough:true})` cookie parity, `@HttpCode(200)` on login/refresh/logout); one shared `authLimiter` (5/min/IP) mounted on `/register` + `/login` in `configure-app.ts`; DB-gated parity harness (`auth-parity.test.ts`, +17 integration tests) proves status + body (deep-equal where deterministic, normalized contract for token-bearing 2xx, status/envelope for 4xx), refresh-token rotation (reuse R1 → 401 `INVALID_TOKEN`), and the 429 brute-force deep-equal. All 7 ACs verified against the shipped code — commit hash deferred to epic close.
