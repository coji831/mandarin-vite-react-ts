**Last Updated:** August 21, 2026

# Implementation 24-5: Auth-Surface Guards (Calibrated)

> **BR Reference:** `docs/business-requirements/epic-24-nestjs-shell-migration/story-24-5-auth-guards-calibrated.md`
> **Last Updated:** August 21, 2026
> **Status:** Completed
> **Commit hash:** `9c97ba95`

## Implementation Summary

Shipped the three calibrated Nest auth guards under `apps/backend/src/nest/guards/` — `AuthGuard` (`authenticateToken` semantics), `OptionalAuthGuard` (`optionalAuth` semantics), `RequireAuthGuard` (`requireAuth` semantics) — ported against the **calibrated F6 guest contract** from the guest-access calibration spec (`wip/guest-access-calibration.md`), not the current pre-calibration code. The guards are wired into `app.module.ts` via `GuardsModule` and are available to later module ports (24-6 auth, 24-8 mnemonics, 24-10 audio, 24-11 review, 24-12 readers, 24-13 quiz/progression) to apply per-route with `@UseGuards`.

**Shared helpers** (`auth-guard.shared.ts`): `resolveAccessToken(req)` resolves the token — `Authorization: Bearer <token>` header first (the exact `header.split(" ")[1]` from `authMiddleware.ts`), httpOnly `accessToken` cookie secondary (`ACCESS_TOKEN_COOKIE` const); `attachAuthUser(req, decoded)` sets `req.user` (decoded payload) + the convenience `req.userId`; `AUTH_GUARD_ERRORS` holds the 401/403 bodies whose `code` + `message` match `authMiddleware.ts` **byte-for-byte**.

**Guard semantics** (identical to the Express convention): missing token → 401, expired token → 401, invalid/forged token → 403 — codes `MISSING_TOKEN` (401, `AuthGuard`), `AUTH_REQUIRED` (401, `RequireAuthGuard`), `TOKEN_EXPIRED` (401, both), `INVALID_TOKEN` (403, both). `OptionalAuthGuard` never throws: no/invalid/expired token → request proceeds with `req.userId`/`req.user` **undefined** (the caller is a guest — never 401, never a valid user, never an all-unlocked fall-through). Token resolution = Bearer header first, httpOnly cookie secondary; a valid token sets `req.userId` on the request.

**Calibrated deltas vs current code (recorded explicitly):**

1. **Envelope** — the guards throw `UnauthorizedException` (401) / `ForbiddenException` (403); the 24-3 global `AppExceptionFilter` serializes them into the `{ code, message, requestId }` envelope. The legacy `error` key from the Express controller shape is dropped (superseded by the 24-3 contract); `code` + `message` are identical.
2. **Cookie fallback is new (inert today)** — only the `refreshToken` httpOnly cookie is ever set, and it is deliberately NOT read as an access token (it carries the refresh secret); the `accessToken` cookie fallback is a forward-compatible addition for a cookie-carrying client (e.g. the auth module port in 24-6). The parity test documents the delta: Express (header-only) 401s on a cookie-only request; Nest (calibrated) authenticates.
3. **F6 guest contract** — `OptionalAuthGuard` leaves `req.userId` undefined for no/invalid/expired tokens, never 401s, never promotes a guest to a valid user. Downstream F6-inconsistent controllers (progression `/gates` GUEST object, `/phase-gate` all-unlocked) are **not** touched here — they port in **24-13** against this calibrated shape.
4. **Bad-token-on-optionalAuth → guest/empty** — an invalid or expired token on an optional read is treated as guest (user undefined, no 401), matching `optionalAuth` and the calibrated spec.

**Wiring:** `GuardsModule` is a **providers module, NOT global** (no `APP_GUARD`) — public routes on the 4 ported reference modules are unaffected; later stories import `GuardsModule` and apply guards per-route via `@UseGuards`. **Key discovery:** `GuardsModule` must **re-export `SharedModule`** (see Technical Challenges) or `@UseGuards(AuthGuard)` can't resolve `JwtService` in the consuming module's context.

**Verification results (story gates):** typecheck ✅ · `npm run build` ✅ (both dist entries — `dist/app/index.js` Express + `dist/nest/main.js` Nest) · `test:full` ✅ 58 files / 631 tests (**+20**: 15 guard unit tests + 5 `JwtService.verifyAccessToken` tests) · `test:integration` ✅ 16 files / 125 tests (**+13**: the hermetic parity suite) · `lint` ✅ 0 errors · `check:module-boundaries` ✅ green · `dev:nest` boots ✅.

**Honest caveat (noted):** a full-suite 401/200 smoke on a **real shell route** is deferred — there is no live protected route yet (the guards are first consumed from 24-6 onward). The 401/200 semantics are proven at the HTTP level by the **hermetic parity test** (real Express `authMiddleware` vs real Nest guards on identical test-protected routes). Also noted: the parity `TestingModule` hits an `APP_FILTER` + `useClass` `metatype is not a constructor` quirk, so the test registers the 24-3 `AppExceptionFilter` via `app.useGlobalFilters` instead; the `NestFactory.create(AppModule)` path used by the route-parity harness (where `AppModule` declares `{ provide: APP_FILTER, useClass: AppExceptionFilter }`) is unaffected.

## Technical Scope

Port the three Express auth-middleware semantics to Nest guards targeting the **calibrated** F6 guest contract (the calibration spec is the source of truth, not current code), with shared token-resolution/attachment helpers and an exact byte-for-byte 401/403 contract. The guards are providers (wired via `GuardsModule` into `app.module.ts`), NOT global — public routes on the 4 ported reference modules are unaffected. No production endpoints are introduced; a hermetic parity harness proves the semantics at the HTTP level against the real Express middleware.

**Files:**

- `apps/backend/src/nest/guards/auth-guard.ts` — **NEW**: `AuthGuard` (required-auth, `authenticateToken` semantics — missing/expired 401, invalid 403, valid → attach + allow).
- `apps/backend/src/nest/guards/optional-auth.guard.ts` — **NEW**: `OptionalAuthGuard` (best-effort, `optionalAuth` semantics — never 401/403; no/invalid/expired → guest with `req.userId` undefined; valid → attach).
- `apps/backend/src/nest/guards/require-auth.guard.ts` — **NEW**: `RequireAuthGuard` (guest-rejecting, `requireAuth` semantics — friendlier `AUTH_REQUIRED` message; missing/expired 401, invalid 403).
- `apps/backend/src/nest/guards/auth-guard.shared.ts` — **NEW**: shared `resolveAccessToken` (header→cookie), `attachAuthUser` (`req.user`/`req.userId`), `AUTH_GUARD_ERRORS` (byte-for-byte `code`+`message`), `ACCESS_TOKEN_COOKIE` const.
- `apps/backend/src/nest/guards/guards.module.ts` — **NEW**: `GuardsModule` — providers module (`imports: [SharedModule]`, `providers`/`exports` the three guards + re-exports `SharedModule` so `@UseGuards` consumers resolve `JwtService`).
- `apps/backend/src/nest/guards/__tests__/auth-guards.test.ts` — **NEW**: guard unit tests (success / failure / guest / expired-token / transport) with a mocked `JwtService`.
- `apps/backend/src/nest/app.module.ts` — **UPDATE**: import `GuardsModule` (the guards become available to later ports; still NOT applied globally).
- `apps/backend/src/shared/infrastructure/security/JwtService.ts` — **UPDATE**: additive `verifyAccessToken(token)` (`jwt.verify` with the access secret) so the guards consume `JwtService` via the `SharedModule` provider instead of importing `jsonwebtoken` directly; the Express `authMiddleware.ts` path is untouched (still calls `jwt.verify` directly).
- `apps/backend/src/shared/infrastructure/security/__tests__/JwtService.test.ts` — **UPDATE**: add a `verifyAccessToken` unit suite (valid decodes `userId`; expired throws `jwt expired`; invalid/wrong-secret/refresh-token all throw).
- `apps/backend/tests/integration/nest/auth-guards-parity.test.ts` — **NEW**: hermetic parity harness — real Express `authMiddleware` vs real Nest guards on identical test-protected routes (`/api/v1/_guards/{required,optional,require}`), asserting identical 401/403 status + guest-vs-user body (deep-equal), with the Nest envelope's `code`/`message` equal to Express's.

## Implementation Details

### The three guards — calibrated semantics (all four token states)

```typescript
// AuthGuard (authenticateToken semantics) — excerpts
if (!token) throw new UnauthorizedException(AUTH_GUARD_ERRORS.missing);   // 401 MISSING_TOKEN
try {
  decoded = this.jwtService.verifyAccessToken(token);
} catch (error) {
  if (error instanceof Error && error.name === "TokenExpiredError")
    throw new UnauthorizedException(AUTH_GUARD_ERRORS.expired);           // 401 TOKEN_EXPIRED
  throw new ForbiddenException(AUTH_GUARD_ERRORS.invalid);                // 403 INVALID_TOKEN
}
attachAuthUser(req, decoded);                                             // req.user + req.userId
return true;
```

`RequireAuthGuard` is identical except it throws `AUTH_GUARD_ERRORS.requireMissing` (401 `AUTH_REQUIRED`) / `AUTH_GUARD_ERRORS.requireExpired` (401 `TOKEN_EXPIRED`, "Your session has expired…") — the friendlier per-route messages exactly as the Express routes pick them. `OptionalAuthGuard` never throws: no token → return `true` (guest); verify inside `try`/`catch`, attach on success, and swallow invalid/expired so the caller proceeds as a guest with `req.userId` undefined — the calibrated F6 guest contract.

### Shared helpers — one home for the calibrated contract

```typescript
export const ACCESS_TOKEN_COOKIE = "accessToken";   // httpOnly cookie fallback (inert today)

export const AUTH_GUARD_ERRORS = {
  missing:         { code: "MISSING_TOKEN", message: "Access token is required" },
  expired:         { code: "TOKEN_EXPIRED", message: "Access token has expired" },
  invalid:         { code: "INVALID_TOKEN", message: "Invalid access token" },
  requireMissing:  { code: "AUTH_REQUIRED", message: "Please sign in to access this feature" },
  requireExpired:  { code: "TOKEN_EXPIRED", message: "Your session has expired. Please sign in again." },
} as const;   // code + message match authMiddleware.ts byte-for-byte

export function resolveAccessToken(req: Request): string | undefined {
  const authHeader = req.headers["authorization"];
  if (authHeader) {
    const token = authHeader.split(" ")[1];          // Bearer TOKEN — same split as authMiddleware
    if (token) return token;
  }
  return req.cookies?.[ACCESS_TOKEN_COOKIE] || undefined;   // calibrated cookie fallback
}

export function attachAuthUser(req: Request, decoded: TokenPayload): void {
  req.user = decoded as { userId: string; email?: string } & Record<string, unknown>;
  req.userId = decoded.userId;
}
```

The guards read the calibration spec's F6 contract through `OptionalAuthGuard` (guest → identity undefined) and through the shared helpers; they never import `createGuestPhaseGate` or `packages/shared-constants` — the explicit no-dependency-on-24-7 guarantee.

### Wiring — `GuardsModule` (providers, not global)

```typescript
@Module({
  imports: [SharedModule],                       // JwtService comes from SharedModule (24-4)
  providers: [AuthGuard, OptionalAuthGuard, RequireAuthGuard],
  exports: [SharedModule, AuthGuard, OptionalAuthGuard, RequireAuthGuard],  // re-export is load-bearing
})
export class GuardsModule {}
```

Registered in `app.module.ts` (`imports: [..., SharedModule, GuardsModule]`) **without** an `APP_GUARD` provider — so the 4 ported reference modules' public routes stay unauthenticated. Later stories import `GuardsModule` and apply `@UseGuards(AuthGuard)` / `@UseGuards(OptionalAuthGuard)` / `@UseGuards(RequireAuthGuard)` per-route.

### Hermetic parity harness — `tests/integration/nest/auth-guards-parity.test.ts`

Boots two in-process HTTP servers exposing `/api/v1/_guards/{required, optional, require}` returning `{ userId: req.userId ?? null }`: an Express app mounting the **real** `authenticateToken`/`optionalAuth`/`requireAuth` from `src/shared/middleware/authMiddleware.ts`, and a Nest testing app (`SharedModule` + `GuardsModule` + a test controller applying the real guards + the real 24-3 `AppExceptionFilter`). 13 scenarios cover: guest (401 MISSING_TOKEN / 401 AUTH_REQUIRED / optional → `{ userId: null }`), invalid token (403 / optional → guest), expired token (401 / optional → guest), valid token via Bearer header (200 with the user), and the calibrated cookie-only case (Nest authenticates, Express 401 — the documented delta). **Hermetic** — no DB: `PrismaClient` overridden with a stub and `REDIS_URL` emptied (no-op cache), so it runs even without `DATABASE_URL` (unlike the DB-gated `route-parity.test.ts`).

## Architecture Integration

```
[Story 24-5: Auth-Surface Guards (Calibrated)]
├── src/nest/guards/ — AuthGuard · OptionalAuthGuard · RequireAuthGuard
│     └── auth-guard.shared.ts — resolveAccessToken (header→cookie) · attachAuthUser · AUTH_GUARD_ERRORS
├── src/nest/guards/guards.module.ts — providers module (imports + re-exports SharedModule) — NOT global
├── app.module.ts — imports GuardsModule (guards available to later ports; no APP_GUARD)
├── JwtService.verifyAccessToken — additive (24-4 provider consumed via SharedModule)
├── Express authMiddleware.ts — UNTOUCHED (still the production auth path)
└── Consumers (later stories): 24-6 /auth/me (AuthGuard) · 24-8 mnemonics (OptionalAuthGuard) ·
      24-10 TTS (OptionalAuthGuard) · 24-11 review (RequireAuthGuard) · 24-12 readers (RequireAuthGuard) ·
      24-13 quiz/progression (calibrated OptionalAuthGuard + F6 re-point)
```

Dependencies: **24-4** (the `JwtService` provider via `SharedModule`). Parallel-safety: **additive** — `JwtService.ts` gains `verifyAccessToken` without changing existing methods; Express `authMiddleware.ts` is untouched; **no** `packages/shared-constants` change; **no** 25–28 collision-zone file touched.

## Technical Challenges & Solutions

### `@UseGuards(AuthGuard)` can't resolve `JwtService` in the consuming module — `GuardsModule` must re-export `SharedModule`

```
Problem: A later module that imports GuardsModule and applies @UseGuards(AuthGuard) fails with
        "can't resolve JwtService" — Nest resolves enhancer (guard) dependencies through the
        CONSUMING module's imported/exposed providers, not through GuardsModule's own imports.
Root Cause: GuardsModule imported SharedModule to build the guards, but a controller applying the
        guard via @UseGuards resolves the guard's dependencies (JwtService) in ITS module context;
        without SharedModule exposed there, JwtService is unresolvable.
Solution: GuardsModule exports SharedModule alongside the guards —
        `exports: [SharedModule, AuthGuard, OptionalAuthGuard, RequireAuthGuard]` — so any consumer
        importing GuardsModule also sees the JwtService provider. Verified by the parity test
        (a test controller applying the real guards resolves them through GuardsModule).
Impact: The documented wiring pattern for every later port: import GuardsModule → @UseGuards works.
```

### `TestingModule` `APP_FILTER` + `useClass` — `metatype is not a constructor` quirk

```
Problem: The parity test's Test.createTestingModule declared the 24-3 AppExceptionFilter via an
        `{ provide: APP_FILTER, useClass: AppExceptionFilter }` provider, which the TestingModule
        provider loader rejects with "metatype is not a constructor".
Root Cause: A TestingModule metatype-resolution quirk with APP_FILTER + useClass providers (the
        TestingModule does not wire APP_FILTER the way NestFactory.create does).
Solution: Register the filter imperatively instead — `nestApp.useGlobalFilters(new AppExceptionFilter())`
        — after compile, before init. The NestFactory.create(AppModule) path used by the route-parity
        harness (where AppModule declares `{ provide: APP_FILTER, useClass: AppExceptionFilter }`)
        is unaffected.
Impact: 4xx carry the 24-3 `{code, message, requestId}` envelope in the parity test; the real
        application path (NestFactory.create) keeps the declarative APP_FILTER provider.
```

### Doc Truth-Check

- [x] Endpoints match `ROUTE_PATTERNS` in `packages/shared-constants/src/index.js` (path + verb copied verbatim) — **N/A: this story adds no production routes**; the `_guards` parity routes are test-protected harness-only (deliberately not in `ROUTE_PATTERNS`)
- [x] Feature/module/component names verified against `apps/backend/src/modules/` and `apps/frontend/src/features/` — guard/helper names copied from the shipped `src/nest/guards/**` files
- [x] Data source (static JSON vs Postgres/API) matches the backing service/repository code — **N/A: guards do not read data**; the parity harness is hermetic (no DB)
- [x] All relative markdown links resolve
- [x] Last Updated / Last Update date is current (same commit as the edit)

## Testing Implementation

- **Guard unit tests** (`src/nest/guards/__tests__/auth-guards.test.ts`, 15 tests) — each guard constructed with a **mocked** `JwtService` (only `verifyAccessToken` exercised — no real JWT, no env, no DB). Covers: `AuthGuard` — missing → 401 `MISSING_TOKEN`, malformed `Bearer` header → 401, expired → 401 `TOKEN_EXPIRED`, invalid → 403 `INVALID_TOKEN`, valid → attaches `req.userId`/`req.user`, cookie-only valid → 200, header-wins-over-cookie; `OptionalAuthGuard` — guest no-token (user undefined, no 401), bad token → guest, expired token → guest, valid → attaches; `RequireAuthGuard` — guest → 401 `AUTH_REQUIRED`, expired → 401 (require message), invalid → 403, valid → attaches.
- **`JwtService.verifyAccessToken` tests** (`src/shared/infrastructure/security/__tests__/JwtService.test.ts`, +5) — valid token decodes `userId`; expired token throws `jwt expired`; invalid token, wrong-secret token, and a refresh token all throw (the error contract `authMiddleware.ts`/guards rely on).
- **Hermetic parity harness** (`tests/integration/nest/auth-guards-parity.test.ts`, 13 tests) — real Express `authMiddleware` vs real Nest guards on identical `/api/v1/_guards/*` routes; 2xx deep-equal (status + body), 4xx identical status with the Nest envelope `code`/`message` equal to Express's (the `error` key is the legacy shape, superseded); includes the calibrated cookie-only delta. Hermetic (stubbed Prisma, empty `REDIS_URL`) so it runs without `DATABASE_URL`; excluded from Tier-1 changed-scope; runs under `vitest.integration.config.ts`.
- **Gates:** typecheck + `build` green (both dist entries emitted); `lint` 0 errors; `test:full` 58/631 (+20); `test:integration` 16/125 (+13); `check:module-boundaries` green; `dev:nest` boots.
