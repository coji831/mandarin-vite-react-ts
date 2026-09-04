**Last Updated:** August 21, 2026

# Story 24.3: HTTP-Layer Parity — `{code, message, requestId}` Envelope + RequestId + Rate-Limit

## Description

**As an** engineering lead,
**I want to** make the Nest shell serve the exact `{code, message, requestId}` error envelope, `X-Request-Id` header, and rate-limit behavior of the Express app,
**So that** every later module port (24-5…24-15) inherits contract-identical HTTP-layer semantics and the API surface stays byte-for-byte compatible through the migration.

## Business Value

This is the second unblocked story (sits directly on 24-2's runway). The HTTP layer is the contract the frontend and epics 25–28 depend on — if the Nest shell's errors, request IDs, and rate limits drift from Express, every later port inherits the drift and the cutover (24-15) becomes a bug-fixing session instead of a mechanical flip. By reproducing `errorHandler.ts` and `requestIdMiddleware.ts` output byte-for-byte and retaining the already-installed `express-rate-limit` (`^8.5.2`) mounted on the Nest Express adapter, this story locks the HTTP contract now, while the error envelope + requestId are stable (epic-25 does not change them). It also extends the parity harness into the 4xx/5xx envelope shape, turning the harness from a "success-path" check into a full contract check.

## Acceptance Criteria

- [x] 4xx/5xx responses from Nest are deep-equal to Express for status + `{code, message, requestId}` shape on all ported routes.
- [x] `X-Request-Id` header set + echoed into the envelope; identical to Express format.
- [x] Rate-limit middleware in Nest honors the same per-route configs + real-IP via `trust proxy`; 429s match Express (status only; auth-specific limits deferred to 24-5/24-10).
- [x] Parity harness extended and green; no 25–28 zone file touched.
- [x] **Error-visibility parity (O1)**: the Nest exception filter logs every 4xx/5xx with `requestId`/`code`/`message` identically to `src/shared/middleware/errorHandler.ts` (same log fields + severity on each error path) — verified by a log-parity check on seeded 4xx/5xx.
- [x] **Body-parser parity**: `express.json()` + `express.urlencoded()` limits reproduced on the Nest Express adapter (same size/limit configs as `src/app/index.ts`) — verified by an oversized-body test that yields the identical 4xx status + envelope.
- [x] `@nestjs/throttler` decision recorded in the story IMP (reject or adopt — recommend reject for parity).

## Business Rules

1. **Envelope byte-for-byte** — the global `ExceptionFilter` reproduces `src/shared/middleware/errorHandler.ts` output exactly: `{ code, message, requestId }` with the same status mapping (`err.status || err.statusCode || 500`); `requestId` present even on 4xx/5xx.
2. **RequestId parity** — the requestId interceptor/middleware replicates `requestIdMiddleware` (`uuid` per request, `X-Request-Id` header, `req.requestId`), matching the Express format.
3. **Retain `express-rate-limit`, do not adopt `@nestjs/throttler`** — `express-rate-limit` is already a dependency and mounts via `app.use` on the adapter with identical configs (trust-proxy real-IP). `@nestjs/throttler` is rejected for exact-parity risk; the decision is recorded in the story IMP.
4. **Per-route limits declared as infra, applied later** — rate-limit configs for not-yet-ported auth/readers are declared here as infra but applied in 24-6 (auth brute-force) / 24-12 (readers 5/day) copying whatever is current then.
5. **Error-visibility parity is part of the contract** — every 4xx/5xx must be logged with `requestId`/`code`/`message` identically to `errorHandler.ts`; the O1 gate (release-safety) is checked here, not deferred.
6. **Body-parser limits are part of the contract** — the same `express.json()`/`express.urlencoded()` limits as `src/app/index.ts` are mounted on the adapter; oversized bodies fail with the identical status + envelope.
7. **No 25–28 zone edits** — the error envelope + requestId are stable (epic-25 doesn't change them) and auth routes aren't ported yet, so this story has no overlap with 25–28.

## Related Issues

- Epic 24: NestJS Shell Migration — [BR](README.md) (epic parent)
- **Story 24.2: NestJS 11 Shell Scaffold + Reference-Module Proof-of-Pattern** ([BR](story-24-2-nest-shell-scaffold-proof.md)) (dependency — the shell + parity harness)
- **Story 24.4: SharedModule/DatabaseModule + Async Providers** ([BR](story-24-4-shared-module-async-providers.md)) (successor — DI substrate on the parity shell)
- **Implementation (IMP twin):** `story-24-3-http-layer-parity.md` → `../../issue-implementation/epic-24-nestjs-shell-migration/story-24-3-http-layer-parity.md`

## Implementation Status

- **Status**: Completed
- **PR**: TBD
- **Merge Date**: TBD
- **Commit hash**: `1f1f4df7`
- **Implementation note:** Global `AppExceptionFilter` (`{code, message, requestId}` envelope via pure `resolveHttpError()`/`logError()` helpers) + `mountExpressErrorBridge()` (mounted last — Nest filters can't see pre-router `app.use` errors, needed for body-parser 413 parity); `request-id.middleware.ts` re-exports the shared `requestIdMiddleware` (zero drift); `express-rate-limit` retained (`@nestjs/throttler` rejected — decision recorded) with `words` applied path-scoped and auth/readers declared as infra (24-6/24-12); body-parser via `bodyParser: false` + explicit `express.json()`/`express.urlencoded({ extended: true })`; route-parity harness extended 23→30 (413 envelope deep-equal, `X-Request-Id`, seeded 429 + 500, log-parity). All 7 ACs verified against the shipped code — commit hash deferred to epic close.
