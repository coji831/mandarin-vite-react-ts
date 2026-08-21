**Last Updated:** August 21, 2026

# Implementation 24-3: HTTP-Layer Parity — `{code, message, requestId}` Envelope + RequestId + Rate-Limit

> **BR Reference:** `docs/business-requirements/epic-24-nestjs-shell-migration/story-24-3-http-layer-parity.md`
> **Last Updated:** August 21, 2026
> **Status:** Completed
> **Commit hash:** _(to be filled at epic close)_

## Implementation Summary

Shipped HTTP-layer parity on the Nest shell: every 4xx/5xx now emits the Express `{ code, message, requestId }` envelope, `X-Request-Id` is set and echoed per request, `express-rate-limit` is retained with the same per-route configs, and the body-parser limits are reproduced — verified by the route-parity harness extended **23 → 30 assertions**. Express remains the production entry, untouched by this story.

**Key shipping decisions:**

- **`AppExceptionFilter` + pure `resolveHttpError()`/`logError()`** (`src/nest/exception.filter.ts`) — the global `@Catch()` filter maps every error to `{ code: err.code || "INTERNAL_ERROR", message: err.message || "An unexpected error occurred", requestId }` with status `err.status || err.statusCode || 500` and logs `API Error { requestId, code, message, stack }` identically to `src/shared/middleware/errorHandler.ts` (O1 error-visibility parity). The mapping + logging are pure helpers shared with the Express error bridge, so the two paths can never diverge.
- **`mountExpressErrorBridge()` mounted LAST** — Nest's exception filter cannot see errors thrown by pre-router `app.use(...)` middleware (body-parser, cookie-parser) because they bypass the Nest router. An Express error-handling bridge is therefore mounted after every other mount so those errors emit the exact same envelope via the shared mapper — this is what makes body-parser 413 (and the seeded 500) parity possible.
- **`request-id.middleware.ts` re-exports the shared `requestIdMiddleware`** — the shell mounts the exact same function the Express app uses today, so `requestId` format and `X-Request-Id` header behavior can never drift (zero drift by construction).
- **Retained `express-rate-limit`, rejected `@nestjs/throttler`** (decision recorded) — `words` limiters (60/min user, 20/min guest) applied path-scoped at `/api/v1/words`; auth/readers limiters declared as **infra** and applied when those modules are ported (24-6 / 24-12); real-IP honored via `trust proxy 1` mirroring `src/app/index.ts`.
- **Body-parser via `bodyParser: false` + explicit `express.json()` / `express.urlencoded({ extended: true })`** in `configure-app.ts` — Nest's built-in parser is disabled so this single authoritative config matches `src/app/index.ts`; oversized bodies fail with the identical 413 + envelope.
- **Harness extended 23 → 30 assertions** — 413 envelope deep-equal on both apps, `X-Request-Id` present + unique + client-echo, seeded 429 + 500 envelopes, and a log-parity check on the oversized-body path.

**Honest parity nuance:** on the ported routes the Express 4xx bodies are still the **legacy controller shape** `{ error, code }` (they do not pass through the Express `errorHandler`), so the harness asserts identical status + the Nest envelope shape on those paths, but cross-app **envelope deep-equal is proven on the 413 path** — the one ported path where Express also reaches the errorHandler. Nest bare `HttpException`s map to `code: "INTERNAL_ERROR"` defaults; richer code mapping lands with the controller ports.

## Technical Scope

Make the Nest shell contract-identical at the HTTP layer before any more modules land on it: a global `ExceptionFilter` reproducing the Express `errorHandler` envelope `{code, message, requestId}` byte-for-byte, a requestId interceptor/middleware replicating `requestIdMiddleware`, and `express-rate-limit` mounted via `app.use` on the Nest Express adapter with the identical per-route configs. Extend the parity harness to assert envelope shape on 4xx/5xx across all ported routes. No `@nestjs/throttler` adoption (parity risk — decision recorded).

**Files:**

- `apps/backend/src/nest/main.ts` — **UPDATE**: `bodyParser: false` at `NestFactory.create`; configure the shell (`configureNestShellApp`) then `mountExpressErrorBridge()` (bridge last).
- `apps/backend/src/nest/app.module.ts` — **UPDATE**: register the global `AppExceptionFilter` via the `APP_FILTER` provider.
- `apps/backend/src/nest/configure-app.ts` — **UPDATE**: mount `express.json()` + `express.urlencoded({ extended: true })` (body-parser parity), `requestIdMiddleware`, and the path-scoped `words` rate-limiters; `trust proxy 1` + `/api` prefix + CORS (from 24-2).
- `apps/backend/src/nest/exception.filter.ts` — **NEW**: global `AppExceptionFilter` → `{ code, message, requestId }` (Express status mapping) + pure `resolveHttpError()`/`logError()` + `mountExpressErrorBridge()`.
- `apps/backend/src/nest/request-id.middleware.ts` — **NEW**: re-exports the shared `requestIdMiddleware` (zero drift — same `uuid` + `X-Request-Id` + `req.requestId` behavior).
- `apps/backend/src/nest/rate-limit.config.ts` — **NEW**: shared `express-rate-limit` configs (trust-proxy real-IP; `words` applied path-scoped; auth/readers declared as infra for 24-6/24-12; test low-limit configs).
- `apps/backend/tests/integration/nest/route-parity.test.ts` — **UPDATE**: 4xx/5xx envelope-shape assertions, `X-Request-Id` present + unique + client-echo, seeded 429 + 500 envelopes, body-parser 413 deep-equal + log-parity.

## Implementation Details

### Global `ExceptionFilter` — `src/nest/exception.filter.ts` (NEW)

Reproduces `src/shared/middleware/errorHandler.ts` output **byte-for-byte**:

```typescript
@Catch()
export class ExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse();
    const req = ctx.getRequest();
    const err = exception as {
      code?: string;
      message?: string;
      status?: number;
      statusCode?: number;
    };
    const requestId = req.requestId || uuidv4();
    const status = err.status || err.statusCode || 500;
    res.status(status).json({
      code: err.code || "INTERNAL_ERROR",
      message: err.message || "An unexpected error occurred",
      requestId,
    });
  }
}
```

Key parity points (verified against `src/shared/middleware/errorHandler.ts`): the envelope is `{ code, message, requestId }`; status = `err.status || err.statusCode || 500`; `requestId` is present even on 4xx/5xx. Register via `APP_FILTER` in `AppModule` so it is global.

### RequestId parity — interceptor/middleware (NEW)

Replicates `requestIdMiddleware` (`src/shared/middleware/errorHandler.ts`): `req.requestId = req.headers["x-request-id"] || uuidv4()`, then `res.setHeader("X-Request-Id", req.requestId)`. Mounted so every request carries the header + the ID flows into the envelope.

### Rate-limit parity — retain `express-rate-limit` (NEW config module)

`express-rate-limit` (`^8.5.2`) is already a dependency. Mount it via `app.use` on the Nest Express adapter with the identical configs (trust-proxy real-IP — `app.getHttpAdapter().getInstance().set("trust proxy", 1)` from 24-2). Per-route limits for not-yet-ported `auth` (brute-force) and `readers` (5/day DB-backed) are **declared as infra** here and applied in 24-6/24-12 copying whatever is current then.

### Error-visibility parity — the filter logs every 4xx/5xx (O1)

The global `ExceptionFilter` must also **log** every 4xx/5xx with `requestId`/`code`/`message` identically to `src/shared/middleware/errorHandler.ts` — same fields, same severity, same logger call — so the O1 release-safety gate (error visibility preserved on the migrated surface) is satisfied here, not deferred. Verified by a log-parity check on seeded 4xx/5xx paths (capture both Express and Nest logs for the same request, assert identical `requestId`/`code`/`message` fields).

### Body-parser parity — json + urlencoded limits

Reproduce the Express body-parser configuration from `src/app/index.ts` on the Nest Express adapter: `express.json()` + `express.urlencoded()` with the identical size/limit options. Verified by an oversized-body test that returns the identical 4xx status + `{code, message, requestId}` envelope.

> **Decision — `@nestjs/throttler`: REJECT.** `@nestjs/throttler` would require a rewrite of each rate-limit config with a high risk of parity drift (key generation, trust-proxy, response shape). Retaining `express-rate-limit` gives exact parity with zero rewrite. If the cutover later exposes a reason to adopt `@nestjs/throttler`, the parity harness (429 status + envelope) is the regression gate.

### Parity harness extensions

- **4xx/5xx:** assert status + `{code, message, requestId}` shape deep-equal to Express on all ported routes.
- **`X-Request-Id`:** present on every response + unique per request; format identical to Express.
- **Rate-limit 429:** seeded test route under a low limit; 429 status + envelope match Express (auth-specific limits deferred to 24-6).
- **Error-visibility:** seeded 4xx/5xx paths logged by the Nest filter with `requestId`/`code`/`message` — fields match `errorHandler.ts` (log-parity check).
- **Body-parser:** oversized JSON/urlencoded body yields the identical 4xx status + envelope on Nest vs Express.

## Architecture Integration

```
[Story 24-3: HTTP-Layer Parity]
├── src/nest/main.ts — app.use(requestId, rate-limit); APP_FILTER registered
├── src/nest/exception.filter.ts — {code, message, requestId} envelope (byte-for-byte vs Express errorHandler.ts)
├── src/nest/request-id.middleware.ts — X-Request-Id header + req.requestId (parity vs requestIdMiddleware.ts)
├── src/nest/rate-limit.config.ts — express-rate-limit infra (retained, not @nestjs/throttler)
└── tests/integration/nest/route-parity.test.ts — envelope/requestId/429 assertions extended
```

Dependencies: **24-2** (the shell + harness). Parallel-safety: **low** — the error envelope + requestId are stable (epic-25 doesn't change them); auth rate-limit config is declared but auth routes aren't ported yet → no overlap with 25–28.

## Technical Challenges & Solutions

### Byte-for-byte envelope parity vs Nest's default error shape

```
Problem: Nest's default error response is `{statusCode, message}` — not Express's
        `{code, message, requestId}` envelope the frontend and epics depend on.
Solution: Global ExceptionFilter that maps every error to `{code, message, requestId}`
        with the same status mapping as `errorHandler.ts`; requestId is sourced from
        the requestId middleware so it is present even on 4xx/5xx.
```

### Rate-limit parity without rewriting every config

```
Problem: Porting per-route rate limits to @nestjs/throttler would rewrite each config
        (key generation, trust-proxy, response shape) with parity-drift risk.
Solution: Retain express-rate-limit and mount it on the adapter via app.use with the
        identical configs. Decision REJECT @nestjs/throttler recorded in this IMP.
```

### Doc Truth-Check

- [x] Endpoints match `ROUTE_PATTERNS` in `packages/shared-constants/src/index.js` (path + verb copied verbatim)
- [x] Feature/module/component names verified against `apps/backend/src/modules/` and `apps/frontend/src/features/`
- [x] Data source (static JSON vs Postgres/API) matches the backing service/repository code
- [x] All relative markdown links resolve
- [x] Last Updated / Last Update date is current (same commit as the edit)

## Testing Implementation

- **Parity harness (extended):** 4xx/5xx deep-equal (status + envelope shape) across all ported routes; `X-Request-Id` present + unique per request; rate-limit 429 status + envelope on a seeded test route.
- **Existing suites:** unchanged and green (Express paths untouched; `createXModule(mockDeps)` factories intact).
- **Gates:** Tier 1 `build`/`lint` (0 errors)/`test`; Tier 2 `test:full`/`typecheck`/`check:module-boundaries`/`test:integration` (extended harness green).
