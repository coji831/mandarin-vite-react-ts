**Last Updated:** August 21, 2026

# Implementation 24-6: Auth Module Port

> **BR Reference:** `docs/business-requirements/epic-24-nestjs-shell-migration/story-24-6-auth-module-port.md`
> **Last Updated:** August 21, 2026
> **Status:** Completed
> **Commit hash:** `19cf58b2`

## Implementation Summary

Ported the `auth` module (all 5 endpoints) from Express to the NestJS 11 shell as `AuthModule` + `AuthNestController` under `apps/backend/src/modules/auth/nest/`, wired with the 24-5 calibrated `AuthGuard` on `/me` and the brute-force rate-limit parity (one shared `authLimiter` on `/register` + `/login`, 5 req/min per IP). The port is a **1:1 mechanical translation**: `auth.module.ts` mirrors `createAuthModule(deps)`, and `auth-nest.controller.ts` mirrors `AuthController.ts` reusing `AuthService` unchanged, with the routes verbatim from `ROUTE_PATTERNS`.

**Module wiring (`auth.module.ts`)** — `imports: [SharedModule, GuardsModule]` (`SharedModule` from 24-4 provides `JwtService`/`PasswordService`; `GuardsModule` from 24-5 provides `AuthGuard` and re-exports `SharedModule` so `@UseGuards(AuthGuard)` resolves in this module's context). Providers use explicit `useFactory` + `inject` (NOT auto constructor-param injection) because `tsx` (esbuild) does not emit decorator metadata in the dev loop; the compiled tsc build gets metadata for free:

```typescript
@Module({
  imports: [SharedModule, GuardsModule],
  controllers: [AuthNestController],
  providers: [
    { provide: AuthRepository, useFactory: () => new AuthRepository() },
    {
      provide: AuthService,
      useFactory: (authRepository, jwtService, passwordService) =>
        new AuthService(authRepository, jwtService, passwordService),
      inject: [AuthRepository, JwtService, PasswordService], // same 3 deps createAuthModule(deps) takes
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}
```

**Controller wiring (`auth-nest.controller.ts`)** — route + guard mapping verbatim from `authRoutes.ts`:

| Route (with `/api` prefix) | Verb | Guard | Status |
| --- | --- | --- | --- |
| `/v1/auth/register` | POST | public (brute-force limiter in `configure-app.ts`) | 201 |
| `/v1/auth/login` | POST | public (brute-force limiter) | 200 (`@HttpCode`) |
| `/v1/auth/refresh` | POST | public (matches Express — no guard) | 200 (`@HttpCode`) |
| `/v1/auth/logout` | POST | public (matches Express — no guard) | 200 (`@HttpCode`) |
| `/v1/auth/me` | GET | `@UseGuards(AuthGuard)` (24-5 required auth) | 200 |

**Cookie parity** — `setRefreshTokenCookie`/`clearRefreshTokenCookie` are byte-for-byte copies of the Express `AuthController` helpers (httpOnly `refreshToken`, 7-day maxAge, `secure` in production, `sameSite: none`/`lax`, `path: /`), and every cookie-writing handler uses `@Res({ passthrough: true })` so `res.cookie()`/`res.clearCookie()` set the same httpOnly cookie while Nest still serializes the returned body.

**Rate-limit parity** — one shared `authLimiter` instance (5 req/min per IP, `AUTH_LIMITER_CONFIG` — `{ error, code: "RATE_LIMIT_EXCEEDED", message }`) is mounted on BOTH `/register` and `/login` in `configure-app.ts` via `rateLimitAuth`, mirroring `authRoutes.ts` (one `authLimiter` guards both routes → one shared per-IP counter). express-rate-limit's default handler sends the `message` object directly as the 429 body, so the Nest 429 is byte-identical to Express (no envelope) — proven deep-equal by the harness.

**Envelope parity** — 4xx/5xx are thrown as `HttpException`s carrying the SAME `code` + `message` as the Express `{error, code, message}` bodies; the global 24-3 `AppExceptionFilter` serializes them into `{code, message, requestId}`. `code`/`message` are byte-for-byte equal to Express on every mapped status (`MISSING_FIELDS` 400, `INVALID_PASSWORD` 400, `USER_EXISTS` 409, `INVALID_CREDENTIALS` 401, `MISSING_TOKEN` 400 / 401, `INVALID_TOKEN` 401, `MISSING_REFRESH_TOKEN` 400, `USER_NOT_FOUND` 404).

**Parity harness (`tests/integration/nest/auth-parity.test.ts`, +17 tests)** — DB-gated (`checkDatabase` — real Prisma against the test DB; missing `DATABASE_URL` skips the suite). Boots the real Express app (`src/app/index.ts`) + the real Nest shell (`NestFactory.create(AppModule)` + `configureNestShellApp` + `mountExpressErrorBridge`). Registers real users (unique per run), cleans up (sessions + users) in `afterAll`. Assertion strategy:

- **2xx deterministic → deep-equal**: logout 200 `{success, message}`; `/me` 200 `{success, data: {user}}` (same DB user + same access token across apps); the 429 brute-force body.
- **2xx token-bearing (non-deterministic) → normalized contract**: register/login/refresh — identical status, top-level/data key sets, user identity fields, token types, and the httpOnly `refreshToken` Set-Cookie.
- **4xx → status + envelope**: identical status; Nest `{code, message, requestId}` with `code`/`message` byte-for-byte equal to Express's legacy `{error, code, message}`, and `requestId` echoing `X-Request-Id`.
- **Refresh-token rotation**: `refresh(R1)` → 200 + new cookie R2; reusing R1 → 401 `INVALID_TOKEN` (both apps).
- **Brute-force 429**: dedicated fixed `X-Forwarded-For` IP; 5 attempts → 401, 6th → 429 with an IDENTICAL body on both apps (`RATE_LIMIT_EXCEEDED`).
- **Rate-limit isolation**: register/login are limited to 5/min per IP on both apps, so every request sends a UNIQUE `X-Forwarded-For` (both apps set `trust proxy 1` → `req.ip` honors it) → each request gets its own bucket and never trips the limiter mid-suite.

**Calibrated delta (documented):** Nest `/me` authenticates via the `accessToken` httpOnly cookie (24-5 calibrated cookie fallback); Express is header-only → 401 `MISSING_TOKEN` on a cookie-only request. Recorded in the harness as the deliberate calibrated addition.

**Flagged deltas to record:**

1. **Envelope** — Express auth 4xx uses the legacy `{error, code, message}` controller shape; Nest emits the 24-3 `{code, message, requestId}` envelope. `code`/`message` are identical byte-for-byte; the legacy `error` key is superseded.
2. **500-path bodies are not deterministically reachable in the harness** — the internal-error branches (`REGISTRATION_FAILED` / `LOGIN_FAILED` / `REFRESH_FAILED` / `LOGOUT_FAILED` / `PROFILE_LOAD_FAILED`) throw in paths the parity suite cannot trigger deterministically; they are covered by the existing `AuthController` unit tests, and the Nest controller mirrors the same `code`/`message`.
3. **`/me` cookie-fallback** — Nest authenticates via the `accessToken` cookie where Express is header-only (calibrated 24-5 addition; documented delta above).
4. **Pre-existing `ERR_ERL_KEY_GEN_IPV6` warning** — the 24-3 `words` limiters emit a non-fatal express-rate-limit IPv6 key-generator validation warning on boot; it is a 24-3 follow-up, NOT from this story (the auth limiter uses the default key generator).

**Verification results (story gates):** typecheck ✅ · `npm run build` ✅ (both dist entries — `dist/app/index.js` Express + `dist/nest/main.js` Nest) · `test:full` ✅ 58 files / 631 tests (unchanged — auth-parity runs in the integration project) · `test:integration` ✅ 17 files / 142 tests (**+17**: the auth-parity suite) · `lint` ✅ 0 errors · `check:module-boundaries` ✅ green · `dev:nest` smoke ✅ (register → me → login → refresh → logout → 6th login 429).

## Technical Scope

Port the `auth` module's 5 Express endpoints to the NestJS 11 shell with contract-identical behavior: `AuthModule` (1:1 of `createAuthModule(deps)` via `useFactory` providers) + `AuthNestController` (1:1 of `AuthController.ts`), the 24-5 `AuthGuard` applied to `/me`, one shared brute-force `authLimiter` (5/min/IP) mounted on `/register` + `/login`, byte-for-byte cookie parity via `@Res({passthrough:true})`, and a DB-gated parity harness proving all 5 endpoints + the 429 against the real Express app. The Express auth path is untouched.

**Files:**

- `apps/backend/src/modules/auth/nest/auth.module.ts` — **NEW**: `AuthModule` — `imports: [SharedModule, GuardsModule]`, `useFactory` providers for `AuthRepository` + `AuthService` (inject `AuthRepository`+`JwtService`+`PasswordService`), `exports: [AuthService]`.
- `apps/backend/src/modules/auth/nest/auth-nest.controller.ts` — **NEW**: `AuthNestController` (`@Controller("v1/auth")`) — mirrors `AuthController.ts` 1:1: register/login/refresh/logout (public, `@HttpCode(200)` where Express returns 200, `@Res({passthrough:true})` cookie parity) + `/me` (`@UseGuards(AuthGuard)`); `setRefreshTokenCookie`/`clearRefreshTokenCookie` byte-for-byte.
- `apps/backend/src/nest/rate-limit.config.ts` — **UPDATE**: add the shared `authLimiter` instance (`AUTH_LIMITER_CONFIG`: 5/min/IP, `{error, code: "RATE_LIMIT_EXCEEDED", message}`) + `rateLimitAuth` route-level helper (the `[INFRA]` marker from 24-3 is now applied).
- `apps/backend/src/nest/configure-app.ts` — **UPDATE**: mount `rateLimitAuth` on `/api/v1/auth/register` + `/api/v1/auth/login` (one shared per-IP counter, mirroring `authRoutes.ts`).
- `apps/backend/src/nest/app.module.ts` — **UPDATE**: import `AuthModule` into the shell.
- `apps/backend/tests/integration/nest/auth-parity.test.ts` — **NEW**: DB-gated parity harness — real Express app vs real Nest `AppModule` (17 tests; deep-equal where deterministic, normalized contract for token-bearing 2xx, status + envelope for 4xx, rotation proof, 429 deep-equal).

## Implementation Details

### Cookie parity — `@Res({ passthrough: true })`

```typescript
// Identical to AuthController.setRefreshTokenCookie (Express), byte-for-byte.
private setRefreshTokenCookie(res: Response, refreshToken: string): void {
  const isProduction = config.nodeEnvironment === "production";
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

@Post("login")
@HttpCode(200)
async login(@Body() body, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
  // ... validate + delegate to AuthService ...
  this.setRefreshTokenCookie(res, result.tokens.refreshToken);
  return { success: true, data: { user: result.user, accessToken: result.tokens.accessToken } };
}
```

`@Res({ passthrough: true })` is the key: it hands the underlying Express `res` through so `res.cookie()`/`res.clearCookie()` write the httpOnly `refreshToken` cookie exactly as Express does, while Nest still serializes the returned object as the response body (status from `@HttpCode`/default, body from the return value).

### Shared brute-force limiter — one instance, two mounts

```typescript
// rate-limit.config.ts — AUTH_LIMITER_CONFIG (mirrors authRoutes.ts authLimiter)
export const AUTH_LIMITER_CONFIG: LimiterConfig = {
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: {
    error: "Too Many Requests",
    code: "RATE_LIMIT_EXCEEDED",
    message: "Too many authentication attempts. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
};
const authLimiter = rateLimit(AUTH_LIMITER_CONFIG);

// configure-app.ts — one shared instance guards BOTH routes (one per-IP counter)
expressApp.use("/api/v1/auth/register", rateLimitAuth);
expressApp.use("/api/v1/auth/login", rateLimitAuth);
```

The single instance is deliberate: `authRoutes.ts` creates **one** `authLimiter` applied to both register and login, so a shared per-IP counter (not two independent ones) is the parity-correct behavior. Because `AUTH_LIMITER_CONFIG` provides a `message` object, express-rate-limit's default 429 handler sends it directly as the body — so the Nest 429 (`{ error, code: "RATE_LIMIT_EXCEEDED", message }`, no envelope) is byte-identical to Express, verified deep-equal in the harness.

### Guard application — `/me` only

```typescript
@Get("me")
@UseGuards(AuthGuard) // 24-5 calibrated required auth — missing token → 401 MISSING_TOKEN
async getCurrentUser(@Req() req: Request): Promise<unknown> {
  const userId = req.userId as string; // attached by AuthGuard via attachAuthUser
  const user = await this.authService.getUserById(userId)...
  if (!user) throw new NotFoundException({ code: "USER_NOT_FOUND", message: "User not found" });
  return { success: true, data: { user } };
}
```

`AuthModule` imports `GuardsModule` (not global `APP_GUARD`), so the four public auth routes stay public and only `/me` requires auth — matching `authRoutes.ts` (`authenticateToken` on `authMe` only).

## Architecture Integration

```
[Story 24-6: Auth Module Port]
├── modules/auth/nest/auth.module.ts — 1:1 of createAuthModule(deps): useFactory AuthRepository
│     + AuthService (inject AuthRepository + JwtService + PasswordService); imports SharedModule +
│     GuardsModule; exports AuthService
├── modules/auth/nest/auth-nest.controller.ts — mirrors AuthController.ts 1:1 (AuthService unchanged);
│     register/login/refresh/logout public, /me → @UseGuards(AuthGuard); @Res({passthrough:true})
│     cookie parity (setRefreshTokenCookie/clearRefreshTokenCookie byte-for-byte)
├── nest/rate-limit.config.ts — shared authLimiter (5/min/IP) + rateLimitAuth (AUTH_LIMITER_CONFIG applied)
├── nest/configure-app.ts — mounts rateLimitAuth on /api/v1/auth/register + /login
├── nest/app.module.ts — imports AuthModule (shell surface)
├── tests/integration/nest/auth-parity.test.ts — DB-gated parity harness (real Express vs real Nest, +17)
├── Express modules/auth/container.ts + api/AuthController.ts + api/authRoutes.ts — UNTOUCHED
│     (production auth path until 24-15 cutover)
└── Dependencies: 24-3 (envelope + rate-limit infra) · 24-4 (SharedModule providers) · 24-5 (AuthGuard + GuardsModule)
```

Dependencies: **24-3** (the `{code, message, requestId}` envelope + rate-limit infra), **24-4** (`SharedModule` — `JwtService`/`PasswordService` providers), **24-5** (`AuthGuard` + `GuardsModule`, first live consumer). Parallel-safety: **additive** — the Express auth wiring is untouched; **no** `packages/shared-constants` change; **no** 25–28 collision-zone file touched.

## Technical Challenges & Solutions

### Rate-limit isolation in the parity suite — unique `X-Forwarded-For` per request

```
Problem: register/login are limited to 5/min per IP on BOTH apps. The parity suite makes many
        register/login requests — if they shared a bucket they would trip the limiter mid-suite
        and break unrelated parity assertions.
Root Cause: both apps set `trust proxy 1`, so `req.ip` honors `X-Forwarded-For`; without control
        of that header every request from the test client shares the same (loopback) IP.
Solution: every register/login request sends a UNIQUE X-Forwarded-For from the documented
        TEST-NET-3 range (203.0.113.0/24) — each request gets its own 5/min bucket and never
        trips the limiter. The 429 test uses a DEDICATED fixed IP (203.0.113.250) and fires
        exactly 6 sequential requests at it (5 pass → 401, 6th → 429), deterministically.
Impact: the suite runs the full lifecycle without self-throttling while still proving the 429
        deterministically on a dedicated bucket.
```

### 429 body deep-equal — express-rate-limit default handler sends `message` directly

```
Problem: the 24-3 envelope (`{code, message, requestId}`) is the shell's 4xx contract, but the
        auth 429 must match Express byte-for-byte — Express's authLimiter sends `{error, code,
        message}` directly (no envelope). A naive envelope-wrapped 429 would break parity.
Root Cause: express-rate-limit's DEFAULT handler responds with the configured `message` object
        as the raw JSON body; Nest inherits that behavior when the limiter is mounted via
        `app.use` on the Express adapter — it never passes through the Nest exception filter.
Solution: mirror `authRoutes.ts` exactly — `AUTH_LIMITER_CONFIG` carries the same
        `{ error, code: "RATE_LIMIT_EXCEEDED", message }` message object, so the default handler
        emits it verbatim. The harness asserts the 6th-attempt 429 body is deep-equal across
        Express and Nest (plus status 429 + `code`/`message` checks).
Impact: the brute-force 429 is contract-identical with zero special handling — the default
        handler IS the parity.
```

### Cookie parity with `@Res({ passthrough: true })`

```
Problem: Nest controllers normally own the response (return value → body, decorator → status),
        but auth must set/clear an httpOnly `refreshToken` cookie exactly as Express does.
Root Cause: taking `@Res()` (without passthrough) puts the handler in raw-Response mode and Nest
        stops serializing the returned body — you'd have to write the JSON by hand.
Solution: `@Res({ passthrough: true })` — Nest hands the Express `res` through so
        `res.cookie()`/`res.clearCookie()` write the same httpOnly cookie, while Nest still
        serializes the returned object as the body (status from `@HttpCode(200)` on
        login/refresh/logout, 201 default on register).
Impact: cookie writes are byte-for-byte with Express (verified by the harness: identical
        Set-Cookie on register/login/refresh, `refreshToken=;` clear on logout) with the normal
        Nest body serialization preserved.
```

### Nest `@Post()` defaults to 201 — `@HttpCode(200)` on login/refresh/logout

```
Problem: the first harness run failed 3 cases — Nest returned 201 for login/refresh/logout
        where Express returns 200 (register legitimately returns 201).
Root Cause: Nest `@Post()` handlers default to 201 Created; only register should be 201.
Solution: `@HttpCode(200)` on login, refresh, and logout (register stays 201).
Impact: status parity restored on all 5 endpoints; caught and fixed by the parity harness
        (3 fails → fix) — exactly the regression the harness exists to catch.
```

### Doc Truth-Check

- [x] Endpoints match `ROUTE_PATTERNS` in `packages/shared-constants/src/index.js` (path + verb copied verbatim) — `authRegister`/`authLogin`/`authRefresh`/`authLogout`/`authMe` (`/v1/auth/*`, `/api` prefix applied by the shell)
- [x] Feature/module/component names verified against `apps/backend/src/modules/` and `apps/frontend/src/features/` — `AuthModule`/`AuthNestController`/`AuthService`/`AuthRepository`/`rateLimitAuth`/`AUTH_LIMITER_CONFIG` copied from the shipped `modules/auth/nest/**`, `nest/rate-limit.config.ts`, `nest/configure-app.ts` files
- [x] Data source (static JSON vs Postgres/API) matches the backing service/repository code — **DB-backed**: `AuthRepository` (Prisma) + real user registration in the DB-gated parity harness (`checkDatabase`)
- [x] All relative markdown links resolve
- [x] Last Updated / Last Update date is current (same commit as the edit)

## Testing Implementation

- **DB-gated parity harness** (`tests/integration/nest/auth-parity.test.ts`, **+17 tests**) — boots the real production Express app (`src/app/index.ts`) and the real Nest shell (`NestFactory.create(AppModule)` + `configureNestShellApp` + `mountExpressErrorBridge`); `describe.skipIf(!db.available)` skips the whole suite when `DATABASE_URL` is missing/unreachable. Coverage per endpoint:
  - **register** (4): 201 identical success contract (key sets, user identity fields, sensitive-field sanitization, access token + httpOnly cookie); 400 `MISSING_FIELDS`; 400 `INVALID_PASSWORD` (weak password); 409 `USER_EXISTS`.
  - **login** (3): 200 identical success contract (same DB user deep-equals across apps); 401 `INVALID_CREDENTIALS`; 400 `MISSING_FIELDS`.
  - **refresh** (3): 200 rotation (`refresh(R1)` → 200 + new cookie R2, R1 ≠ R2, reuse R1 → 401 `INVALID_TOKEN` on BOTH apps, 2xx contract parity); 400 `MISSING_TOKEN`; 401 `INVALID_TOKEN` (garbage cookie).
  - **logout** (2): 200 identical body (deep-equal `{success, message}`) + cookie cleared on both; 400 `MISSING_REFRESH_TOKEN` + cookie cleared on both.
  - **me** (4): 200 identical body (deep-equal, same access token); 401 `MISSING_TOKEN`; 404 `USER_NOT_FOUND` (valid token, unknown userId); **calibrated delta** — Nest `/me` authenticates via `accessToken` cookie (200), Express is header-only (401 `MISSING_TOKEN`).
  - **brute-force** (1): 6 sequential logins on a fixed `X-Forwarded-For` — 5× 401 then 429 with an IDENTICAL body on both apps (`RATE_LIMIT_EXCEEDED`).
- **4xx assertion helper** (`expectParity4xx`): identical status; Express legacy `{error, code, message}` + Nest `{code, message, requestId}` envelope with `code`/`message` byte-for-byte equal and `requestId` echoing `X-Request-Id`.
- **Cleanup**: `afterAll` deletes the created users (+ cascaded sessions) and disconnects the DB.
- **Gates:** typecheck ✅ · `build` ✅ (both dist entries) · `test:full` 58/631 ✅ · `test:integration` 17/142 (+17) ✅ · `lint` 0 errors ✅ · `check:module-boundaries` green ✅ · `dev:nest` smoke (register → me → login → refresh → logout → 6th login 429) ✅.
