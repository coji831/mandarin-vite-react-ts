# Infrastructure & Shared Layer Cleanup Proposal

**Date:** 2026-06-10
**Author:** DeepSeek V4 Flash Analysis

## Executive Summary

This proposal catalogs every file in the backend's `infrastructure/` and `shared/` layers, identifies issues across 6 dimensions (singleton consistency, error handling, config coupling, testability, duplicate code, dead exports), and phases the fixes into Quick Wins (low risk), Structural Changes (medium risk), and Architectural Improvements (high risk, requires design review).

**Key stats:**

- **28 files** analyzed across `infrastructure/` (15) and `shared/` (13)
- **~20 distinct issues** identified (4 high, 8 medium, 8 low severity)
- **3-phase plan**: Quick Fixes (4 tasks), Structural (5 tasks), Architectural (3 tasks)

---

## 1. Infrastructure Layer

### 1.1 Cache Layer (`infrastructure/cache/`)

#### File-by-File Analysis

| File                   | Issues                                                                                                                                                                                                                                                                                                                                                               | Severity | Action                                                                                    |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------- |
| `RedisClient.js`       | (1) Exports instance AND class — class export unused. (2) No `getInstance()` method (removed, good). (3) Reads `redisConfig` at module load-time — tight coupling to shared/config. (4) `export { RedisClient }` unused outside tests.                                                                                                                               | **high** | Remove class export; consider injecting config via constructor                            |
| `CacheService.js`      | Abstract base — methods: `get`, `set`, `delete`, `clear`, `getMulti`. All present. No issues.                                                                                                                                                                                                                                                                        | **none** | No action needed                                                                          |
| `GcsFileStore.js`      | (1) Method signatures mismatch `CacheService` — `exists()`, `getSignedUrl()` not in base. (2) Imports `* as gcsClient` from external/GCSClient.js — tight coupling, should inject via constructor. (3) Renamed from `GcsCacheService` — no remaining references to old name found.                                                                                   | **med**  | Add DI for GCSClient; move to `infrastructure/storage/`                                   |
| `cache/index.js`       | (1) RACE CONDITION: `getCacheService()` sets `cacheServiceInstance` synchronously but does not guard against concurrent calls — two calls could each create a `RedisCacheService`. (2) `createCacheService()` is async (pings Redis) but `getCacheService()` is sync — dual API confusing. (3) `resetCacheService()` useful for tests but not used in any test file. | **high** | Fix race condition with module-level promise guard; unify to single async factory pattern |
| `RedisCacheService.js` | (1) Fail-open pattern correct. (2) Method signatures match `CacheService`. (3) `getMulti` not used by any caller — potential dead code.                                                                                                                                                                                                                              | **low**  | Verify `getMulti` usage; add deprecation notice if dead                                   |
| `NoOpCacheService.js`  | (1) Method signatures match `CacheService`. (2) Logs warning in constructor — correct. (3) Imports path references old `services/cache/` location (line 1 comment).                                                                                                                                                                                                  | **low**  | Fix stale comment path                                                                    |
| `RedisLockManager.js`  | (1) Only consumed by `container.js` → `withGcsCache()` in examples pipeline. (2) Default TTL 5000ms — reasonable. (3) Lua script for safe release — correct. (4) Graceful fallback when Redis unavailable.                                                                                                                                                           | **low**  | No action needed; well-implemented                                                        |

#### Key Findings

1. **Race condition in cache/index.js**: `getCacheService()` has no concurrency guard. If two modules import `cacheService` from `container.js` before the first finishes initialization... actually, `container.js` calls `getCacheService()` at module scope, so this executes synchronously during the first import. The race condition only matters if `getCacheService()` is called concurrently from async contexts. Risk is **low in practice** but the code is not provably correct.

2. **Dual API confusion**: `getCacheService()` (sync, no health check) vs `createCacheService()` (async, pings Redis). Only `getCacheService()` is used in production (via `container.js`). `createCacheService()` appears to be dead code — no callers found.

3. **GcsFileStore is NOT a CacheService**: `GcsFileStore` does not extend `CacheService` — it's a file store with `exists()`, `get()`, `set()`, `getSignedUrl()`. This is architecturally correct (GCS is a file store, not a TTL cache), but its location in `cache/` is misleading. Consider moving to `infrastructure/storage/GcsFileStore.js`.

---

### 1.2 External Clients (`infrastructure/external/`)

| File                 | Issues                                                                                                                                                                                                                                                                                                                                                                                                                                             | Severity | Action                                                                                                                     |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------- |
| `GCSClient.js`       | (1) `initializeGCS()` defined but NEVER CALLED — 0 grep hits outside own definition. (2) Lazy init pattern with race condition (two concurrent calls to `getGCSClient()` before first resolves could create two clients). (3) Comment says "Uses GOOGLE_TTS_CREDENTIALS_RAW as fallback" — actually config.gcsCredentials resolves to `GEMINI_API_CREDENTIALS_RAW` (same var), not TTS credentials. Fallback is same env var, not a different one. | **high** | Remove dead `initializeGCS()`; fix comment to accurately reflect config; consider module-level promise guard for lazy init |
| `GeminiClient.js`    | (1) Dynamic `import("google-auth-library")` and `import("node-fetch")` — WHY? These are static deps in package.json. Dynamic import adds latency per-first-call. (2) `healthCheck()` calls `generateText("Hello", { maxTokens: 5 })` — this is a REAL API call that costs money and adds latency. Should be a lightweight token check or omitted. (3) Same lazy init race condition as GCSClient.                                                  | **med**  | Replace dynamic imports with static imports; replace healthCheck with lightweight endpoint probe                           |
| `GoogleTTSClient.js` | (1) Same lazy init pattern as GCSClient. (2) `healthCheck()` uses `listVoices()` — correct (free API call). (3) No race condition in practice (single-module init).                                                                                                                                                                                                                                                                                | **low**  | No action needed; well-implemented                                                                                         |

#### Key Findings

1. **Three singleton patterns but consistent**: All external clients use module-level `let` variable + lazy init on first call. This is actually **consistent**.

2. **Dead code**: `initializeGCS()` in GCSClient.js has zero callers outside its own definition. Should be removed or marked `@private`.

3. **Dynamic imports**: GeminiClient.js uses dynamic `import()` for `google-auth-library` and `node-fetch` — both are listed in `package.json` as regular dependencies. Dynamic imports add ~50-200ms latency on first call for no benefit. Convert to static imports.

---

### 1.3 Database (`infrastructure/database/`)

| File        | Issues                                                                                                                                                                                                                                                                                                                  | Severity | Action                                                       |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------ |
| `client.js` | (1) No `$disconnect()` handling in shutdown. (2) Singleton export — correct. (3) Uses `config.databaseUrl` — may be undefined in test environments (config validation throws before reaching here if JWT secrets missing). (4) 9 repository files import directly from here — all use `import { prisma }` named import. | **med**  | Add shutdown hook; consider lazy init to avoid test failures |

#### Key Findings

1. **No graceful shutdown**: The `index.js` entry point handles SIGTERM/SIGINT for Redis (`cacheService.quit()`) but NOT for Prisma (`prisma.$disconnect()`). This can cause connection pool leaks during deployments.

2. **Import pattern consistent**: All 9 repositories import `{ prisma }` via named import — consistent, good.

---

### 1.4 Security (`infrastructure/security/`)

| File                 | Issues                                                                                                                                                                                                                                                             | Severity | Action                                                            |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- | ----------------------------------------------------------------- |
| `HmacManager.js`     | (1) Constructor reads `config.examplesCacheHmacKey` directly — tight coupling. (2) Only used in `container.js` (one call site) + own test. (3) No default secret — throws if env var missing (correct).                                                            | **low**  | Consider constructor DI for testability; current state acceptable |
| `JwtService.js`      | (1) Uses `import config from ...` default import — inconsistent with other services that use `{ config }` named import. (2) No default secrets — throws if env vars missing (correct). (3) `this.ACCESS_TOKEN_EXPIRY = "15m"` hardcoded — should come from config. | **med**  | Unify import style; move expiry durations to config               |
| `PasswordService.js` | (1) Stateless, no config — correct. (2) `SALT_ROUNDS = 10` hardcoded — acceptable. (3) Clean interface.                                                                                                                                                            | **none** | No action needed                                                  |

#### Key Findings

1. **Import inconsistency**: `JwtService.js` uses `import config from "../../shared/config/index.js"` (default import) while all other infrastructure services use `import { config } from ...` (named import).

2. **Hardcoded values**: JwtService hardcodes `"15m"` and `"7d"` for token expiry, PasswordService hardcodes `10` salt rounds. These could be config-driven but are acceptable defaults.

---

### 1.5 Parsers (`infrastructure/parsers/`)

| File           | Issues                                                                                                                                        | Severity | Action           |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ---------------- |
| `CsvParser.js` | (1) Still actively used by `VocabularyRepository` and `VocabularyListRepository` (2 callers). (2) No issues — clean, minimal, single-purpose. | **none** | No action needed |

---

### 1.6 Cross-Cutting Infrastructure Issues

**A. Singleton Pattern Inconsistency (3 patterns):**

1. **Instance export** (RedisClient): `export const redisClient = new RedisClient()` — singleton created at module load time
2. **Lazy closure init** (GCSClient, GeminiClient, GoogleTTSClient): Module-level `let` variable, initialized on first call
3. **Module-level promise guard** (cache/index.js): `let cacheServiceInstance = null`, set on first call (no guard)

**Recommendation**: Unify to Pattern 2 (lazy closure) for all infrastructure clients. This defers initialization until first use, avoids import-time failures, and improves testability.

**B. Error Handling Consistency:**

| Service              | Pattern                                     | Correct?          |
| -------------------- | ------------------------------------------- | ----------------- |
| RedisClient          | Fail-open (graceful no-op when Redis down)  | ✅ For cache      |
| GCSClient            | Fail-closed (throws if credentials missing) | ✅ For storage    |
| GeminiClient         | Fail-closed (throws on API errors)          | ✅ For AI service |
| GoogleTTSClient      | Fail-closed (throws if credentials missing) | ✅ For TTS        |
| JwtService           | Fail-closed (throws if secrets missing)     | ✅ For security   |
| HmacManager          | Fail-closed (throws if key missing)         | ✅ For security   |
| CacheService factory | Fail-open (falls back to NoOpCacheService)  | ✅ For cache      |

The division is **correct**: cache is fail-open (app works without cache), security and external clients are fail-closed (app must not run with broken security/missing credentials).

**C. Config Dependency Patterns (3 patterns):**

1. **Module load-time** (RedisClient → `import { redisConfig }` at top level)
2. **Lazy** (GCSClient → `config.gcsCredentials` inside `getGCSClient()`)
3. **Constructor DI** (JwtService, HmacManager → constructor receives config values directly)

**Recommendation**: Use Pattern 3 (constructor DI) for all services that are instantiated in `container.js`. Use Pattern 2 (lazy) for module-level function exports. Pattern 1 (load-time) is the worst — it couples the module to a specific config shape and breaks if config changes between imports.

---

## 2. Shared Layer

### 2.1 Config (`shared/config/`)

| File               | Issues                                                                                                                                                                                                                                                                                                                                                                                                     | Severity | Action                                                                                                                   |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------ |
| `index.js`         | (1) DUAL EXPORT: `export const config` AND `export default config` — 11 named imports, 1 default import. (2) Load-time validation THROWS if env vars missing — breaks any test file that imports config. (3) `gcsCredentials` reuses `GEMINI_API_CREDENTIALS_RAW` — confusing. (4) `envPath` resolves 5 levels up from config dir — brittle. (5) Logs `console.log` at import time — pollutes test output. | **high** | Remove default export; make validation lazy (separate `validateConfig()` function); move env path resolution to a helper |
| `redis.js`         | (1) Loads `dotenv` AGAIN (duplicate of index.js). (2) `parseRedisUrl()` runs at module load time. (3) Only consumed by `RedisClient.js` + `cache/index.js`.                                                                                                                                                                                                                                                | **med**  | Remove duplicate dotenv load; consider moving redis config into `config/index.js`                                        |
| `BusinessRules.js` | (1) Pure constants + pure functions — correct location? (2) Used by 5 files across gamification and quiz modules. (3) Re-exports `getEndOfDay` from dateUtils.js with `@deprecated` tag. (4) Sits in `config/` but is not configuration — it's domain constants.                                                                                                                                           | **med**  | Move to `modules/shared/domain/BusinessRules.js`; remove deprecated re-export                                            |
| `vocabulary.js`    | (1) Used by 2 vocabulary repository files. (2) Reads `process.env.GCS_ENABLED` directly — bypasses config/index.js.                                                                                                                                                                                                                                                                                        | **low**  | Move `gcsEnabled` to `config/index.js`; remove direct `process.env` read                                                 |

#### Key Findings

1. **Config validation breaks tests**: `config/index.js` throws at import time if `JWT_SECRET`, `JWT_REFRESH_SECRET`, `GCS_BUCKET_NAME`, `GOOGLE_TTS_CREDENTIALS_RAW`, or `GEMINI_API_CREDENTIALS_RAW` are missing. Any test file that imports any module that transitively imports config will fail in CI without these env vars.

2. **Dual export**: 11 files use `import { config }` (named) while 2 files use `import config` (default). Remove the default export to enforce consistency.

3. **Duplicate dotenv loading**: Both `config/index.js` and `config/redis.js` call `dotenv.config()` with the same `envPath`. This is redundant.

---

### 2.2 Middleware (`shared/middleware/`)

| File                  | Issues                                                                                                                                                                                                                                                                                                                                  | Severity | Action                                                                    |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------- |
| `authMiddleware.js`   | (1) Reads `config.jwtSecret` directly via import — tight coupling. (2) Used by 9 route files (heavy usage). (3) Well-structured with `authenticateToken` + `optionalAuth`.                                                                                                                                                              | **low**  | Consider DI for config; current state acceptable for middleware           |
| `cacheMiddleware.js`  | (1) `withCache()` calls `getCacheService()` at call time — correct (deferred). (2) `withGcsCache()` is well-implemented with double-check locking, audit logging. (3) `getMetrics()` attached to wrapped function — elegant.                                                                                                            | **none** | No action needed                                                          |
| `cacheMetrics.js`     | (1) `registerCacheMetrics` and `getCacheMetrics` used by container.js and HealthController. (2) Clean registry pattern. (3) `getCacheMetricsMiddleware` — NOT a middleware, NO callers found for that name.                                                                                                                             | **low**  | Rename to avoid "middleware" misnomer; file is a registry, not middleware |
| `errorHandler.js`     | (1) `requestIdMiddleware` — only used in its own test file, NOT mounted in `index.js`. (2) `errorHandler` is properly mounted in `index.js`. (3) Clean implementation.                                                                                                                                                                  | **med**  | Mount `requestIdMiddleware` in `index.js` or remove it                    |
| `HealthController.js` | (1) Located in `shared/middleware/` but is a Controller, not middleware. FILE PATH in header says `src/api/controllers/` — path mismatch. (2) Properly uses DI (receives geminiService, ttsService, redisClient, getCacheMetrics via constructor). (3) Calls `createHealthResponse` from conversationUtils.js (cross-utils dependency). | **med**  | Move to `modules/health/api/HealthController.js`; fix header comment path |
| `healthRoutes.js`     | (1) Located in `shared/middleware/` but is a route file. (2) Imports `healthController` from `container.js` — correct composition root pattern. (3) Path says `src/api/routes/` — mismatch.                                                                                                                                             | **med**  | Move to `modules/health/api/healthRoutes.js`                              |
| `asyncHandler.js`     | (1) Well-implemented HOF. (2) Accepts optional `validateSchema` for request validation. (3) Used by route files.                                                                                                                                                                                                                        | **none** | No action needed                                                          |
| `index.js` (barrel)   | (1) Exports: `errorHandler.js` (full) + `cacheMiddleware.js` (withCache, withGcsCache). (2) Missing: `authMiddleware.js`, `asyncHandler.js`, `cacheMetrics.js`, `HealthController.js`. (3) NOT imported by any file — dead barrel export.                                                                                               | **low**  | Either make it a complete barrel and wire it in, or remove it             |

#### Key Findings

1. **Mislocated files**: `HealthController.js` and `healthRoutes.js` live in `shared/middleware/` but are controllers/routes, not middleware. They should move to a `modules/health/` feature module.

2. **Unmounted middleware**: `requestIdMiddleware` in `errorHandler.js` is defined and tested but never mounted in the Express app (`index.js`).

3. **Dead barrel**: `middleware/index.js` is never imported by any file. No consumer is found via grep.

---

### 2.3 Utils (`shared/utils/`)

| File                   | Issues                                                                                                                                                                                                                                                                                                                                                                      | Severity | Action                                                                                                                                 |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `CacheMetrics.js`      | (1) Singleton export (`export const cacheMetrics`). (2) NOT used by any file — no grep hits for `import.*cacheMetrics` outside container.js (which imports from middleware/cacheMetrics.js instead). (3) Duplicated purpose with `middleware/cacheMetrics.js` — two different cache metrics systems.                                                                        | **high** | Remove file or consolidate with middleware/cacheMetrics.js                                                                             |
| `conversationUtils.js` | (1) TODO comment says "Move conversation domain utilities to core/domain/". (2) `createConversationResponse()` used by ConversationController. (3) `createHealthResponse()` used by HealthController — cross-domain dependency. (4) `extractTextFromConversation()` used by ConversationService. (5) Contains domain logic in generic utils folder — confirmed mislocation. | **med**  | Move to `modules/conversation/utils/`; extract `createHealthResponse` to a shared helper or inline in HealthController                 |
| `dateUtils.js`         | (1) Single function `getEndOfDay()`. (2) Re-exported by `BusinessRules.js` with `@deprecated` tag. (3) Clean, pure function.                                                                                                                                                                                                                                                | **low**  | Remove deprecated re-export from BusinessRules.js; have callers import directly                                                        |
| `errorFactory.js`      | (1) Used by `asyncHandler.js`, `inputSanitizer.js` (both copies), and `ExampleService.js`. (2) Clean factory functions. (3) Consistent error structure with `code`, `statusCode`, `metadata`.                                                                                                                                                                               | **none** | No action needed                                                                                                                       |
| `hashUtils.js`         | (1) Used by `TtsController.js`, `ExampleService.js`, `ConversationService.js` (3 callers). (2) Pure functions — clean. (3) `computeConversationTextHash` has backward-compatibility note.                                                                                                                                                                                   | **none** | No action needed                                                                                                                       |
| `hskValidator.js`      | (1) DUPLICATE of `modules/examples/services/hskValidator.js` — nearly identical content. (2) Examples version has EXTRA function `getHskSet()`. (3) Shared version has ZERO callers outside its own definition. (4) Both load the same HSK JSON file with the same path resolution.                                                                                         | **high** | Remove one copy; consolidate to shared/utils/ and add `getHskSet()`; update ExampleService to import from shared                       |
| `inputSanitizer.js`    | (1) DUPLICATE of `modules/examples/services/inputSanitizer.js` — identical content. (2) Shared version has ZERO callers. (3) Examples version imported by ExampleService + its own test. (4) Both define `ExampleRequest` class — domain-level validation in utils folder.                                                                                                  | **high** | The canonical copy is the examples module one; remove the shared copy entirely (domain validation belongs in module, not shared utils) |
| `logger.js`            | (1) Reads `config.features.enableDetailedLogs` directly via import. (2) Clean Logger class with standard methods. (3) `config` import at module scope — breaks in test env without env vars.                                                                                                                                                                                | **low**  | Make enableDetailedLogs a constructor option; defer config read                                                                        |
| `promptUtils.js`       | (1) TODO comment says "Move prompt-building logic to core/domain/". (2) Only caller: `ConversationService`. (3) Contains AI-domain logic (prompt construction) in generic utils.                                                                                                                                                                                            | **med**  | Move to `modules/conversation/utils/` or inline in ConversationService                                                                 |
| `routeUtils.js`        | (1) Single function `getAllRoutes()`. (2) ZERO callers in production code. (3) Debugging utility for listing Express routes.                                                                                                                                                                                                                                                | **low**  | Move to `scripts/` or remove if unused                                                                                                 |

#### Key Findings

1. **Duplicate files confirmed**:
   - `inputSanitizer.js`: Shared copy has 0 callers; examples module copy is canonical. **Remove shared copy.**
   - `hskValidator.js`: Shared copy has 0 callers; examples module copy has additional `getHskSet()`. **Remove shared copy.**

2. **Dead code**: `CacheMetrics.js` (singleton) is completely unused — the cache metrics system migrated to `middleware/cacheMetrics.js` (registry pattern) but the old file was never cleaned up.

3. **Mislocated domain logic**: `conversationUtils.js` and `promptUtils.js` contain domain-specific logic (conversation response shaping, prompt building) in a generic `utils/` folder. These should live in their respective feature modules.

---

### 2.4 Cross-Cutting Shared Issues

**A. Testability Impact of Config Load-Time Validation**

Any test file that imports a module that transitively imports `config/index.js` will fail if required env vars are missing. This affects:

- `logger.js` (imports config for `enableDetailedLogs`)
- `authMiddleware.js` (imports config for `jwtSecret`)
- All 3 security services (import config in constructors)

**Fix**: Make config validation lazy. Export a `validateConfig()` function called explicitly in `index.js`.

**B. No Barrel Export for utils/**

`middleware/` has `index.js` barrel export (though unused). `utils/` has no barrel export. This isn't a bug but inconsistent. A barrel would allow:

```js
import { createLogger, errorFactory, hashUtils } from "../../shared/utils/index.js";
```

---

## 3. Guiding Principles (Design Decisions)

Based on architectural review and analysis, these principles govern the cleanup:

| Principle                              | Meaning                                                                                                                                        | Impact                                                                             |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| **Centralized config**                 | Single `config/index.js` is the sole source of truth. No duplicate `dotenv.load()` calls. Single export style (named `{ config }`).            | Remove dual export, deduplicate redis.js                                           |
| **Graceful degradation**               | If a required config is missing, the dependent service logs a warning and disables itself (no-op) rather than crashing the app at import time. | Cache falls back to NoOp, JWT/HMAC still fail-closed (security)                    |
| **Move domain logic out of `shared/`** | Utils that belong to a specific feature module live in that module. `shared/utils/` is for truly cross-cutting pure functions.                 | conversationUtils → `modules/conversation/`, promptUtils → `modules/conversation/` |
| **Remove orphaned code**               | If a file has zero callers, delete it. No "keep for later."                                                                                    | CacheMetrics.js, initializeGCS(), middleware/index.js barrel                       |
| **Infra as clients, not singletons**   | Infrastructure services receive config via constructor (DI), enabling multiple instances for different providers if needed.                    | RedisClient, GcsFileStore accept injected config                                   |
| **Health as a simple module**          | Health endpoint is a lightweight feature module (`modules/health/`) with its own controller + route, not middleware.                           | Move HealthController + healthRoutes out of shared/middleware/                     |
| **Integration tests deferred**         | Tests requiring a real DB are excluded from `npm test`. Separate config for CI with DB.                                                        | Already done in Phase 4 of previous cleanup                                        |

---

## 4. Implementation Plan

### Phase 1: Dead Code & Quick Fixes

| #   | Task                                                                           | File(s)                                                       | Effort | Risk                            |
| --- | ------------------------------------------------------------------------------ | ------------------------------------------------------------- | ------ | ------------------------------- |
| 1   | Remove dead `utils/CacheMetrics.js` (superseded by middleware/cacheMetrics.js) | `shared/utils/CacheMetrics.js`                                | 5 min  | Low — zero callers              |
| 2   | Remove dead `initializeGCS()` function (zero callers)                          | `infrastructure/external/GCSClient.js`                        | 5 min  | Low                             |
| 3   | Remove dual default export from config — keep only `export const config`       | `shared/config/index.js` + update `JwtService.js`, `index.js` | 10 min | Low — only 2 default consumers  |
| 4   | Replace Gemini dynamic imports with static imports                             | `infrastructure/external/GeminiClient.js`                     | 10 min | Low — both deps in package.json |
| 5   | Remove duplicate `inputSanitizer.js` (shared copy, 0 callers)                  | `shared/utils/inputSanitizer.js` — delete                     | 5 min  | Low                             |
| 6   | Remove duplicate `hskValidator.js` (shared copy, 0 callers)                    | `shared/utils/hskValidator.js` — delete                       | 5 min  | Low                             |
| 7   | Remove duplicate `dotenv.config()` from `config/redis.js`                      | `shared/config/redis.js`                                      | 5 min  | Low                             |
| 8   | Remove dead barrel export `middleware/index.js` (0 callers)                    | `shared/middleware/index.js` — delete                         | 5 min  | Low                             |
| 9   | Remove or mount `requestIdMiddleware` in `index.js`                            | `shared/middleware/errorHandler.js` + `index.js`              | 5 min  | Low                             |

### Phase 2: Structural Moves (Medium Risk)

| #   | Task                                                                                        | File(s)                                                                                                                                                                                                                   | Effort | Risk |
| --- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ---- |
| 10  | Create `modules/health/` — move HealthController + healthRoutes out of `shared/middleware/` | `shared/middleware/HealthController.js` → `modules/health/api/HealthController.js`, `healthRoutes.js` → `modules/health/api/healthRoutes.js`, create `modules/health/index.js` + update `container.js`, `routes/index.js` | 30 min | Med  |
| 11  | Move `conversationUtils.js` to conversation module                                          | `shared/utils/conversationUtils.js` → `modules/conversation/utils/conversationUtils.js` + update 3 imports                                                                                                                | 15 min | Med  |
| 12  | Move `promptUtils.js` to conversation module                                                | `shared/utils/promptUtils.js` → `modules/conversation/utils/promptUtils.js` + update `ConversationService.js` import                                                                                                      | 10 min | Med  |
| 13  | Move `cacheMetrics.js` to `infrastructure/` (rename from middleware)                        | `shared/middleware/cacheMetrics.js` → `infrastructure/cache/CacheMetricsRegistry.js` + update imports in `container.js`, `HealthController.js`                                                                            | 15 min | Med  |

### Phase 3: Architectural (Higher Risk)

| #   | Task                                                                                       | File(s)                                                                                                    | Effort | Risk                     |
| --- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- | ------ | ------------------------ |
| 14  | Make config validation lazy — extract `validateConfig()` called explicitly from `index.js` | `shared/config/index.js` + `index.js`                                                                      | 30 min | High — affects all tests |
| 15  | Unify cache factory to single lazy async pattern with promise guard                        | `infrastructure/cache/index.js`                                                                            | 20 min | Med                      |
| 16  | Move `BusinessRules.js` from `config/` to domain constants file                            | `shared/config/BusinessRules.js` → `modules/gamification/domain/BusinessRules.js` + container.js re-export | 20 min | Med                      |
| 17  | Move `GcsFileStore` from `infrastructure/cache/` to `infrastructure/storage/`              | `infrastructure/cache/GcsFileStore.js` → `infrastructure/storage/GcsFileStore.js` + update imports         | 10 min | Med                      |

---

## 4. Risk Assessment

| Risk                                           | Likelihood | Impact | Mitigation                                                    |
| ---------------------------------------------- | ---------- | ------ | ------------------------------------------------------------- |
| Config validation change breaks tests          | High       | High   | Phase 3 — do last; announce to team; run full CI before merge |
| Cache factory change causes startup failure    | Low        | High   | Phase 3 — test locally with Redis down/up before deploying    |
| Moving HealthController breaks health endpoint | Low        | Medium | Phase 2 — verify `/api/v1/health` responds after move         |
| Removing dual config export                    | Low        | Low    | Phase 1 — grep confirms only 2 default import consumers       |
| Consolidating duplicates breaks ExampleService | Low        | Medium | Phase 2 — run example tests after consolidation               |

---

## 5. Dependency Map (Files that need import updates)

| Change                       | Files to Update                                                              |
| ---------------------------- | ---------------------------------------------------------------------------- |
| Remove config default export | `JwtService.js`, `index.js` (entry)                                          |
| Move HealthController        | `container.js`, `healthRoutes.js`, `routes.js`                               |
| Move conversationUtils       | `ConversationController.js`, `ConversationService.js`, `HealthController.js` |
| Move promptUtils             | `ConversationService.js`                                                     |
| Consolidate inputSanitizer   | `ExampleService.js`, examples test file                                      |
| Consolidate hskValidator     | `ExampleService.js` (imports from `./hskValidator.js`)                       |
| Remove CacheMetrics.js       | No imports — delete only                                                     |

---

## Appendix A: Import Pattern Inventory

### `config/index.js` imports (12 files total)

| Style                       | Files                                                                                                                                                                            |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `import { config }` (named) | logger.js, authMiddleware.js, GCSClient.js, GeminiClient.js, GoogleTTSClient.js, database/client.js, HmacManager.js, ConversationService.js, TtsController.js, AuthController.js |
| `import config` (default)   | JwtService.js, index.js (entry)                                                                                                                                                  |
| `import config` (wildcard)  | None                                                                                                                                                                             |

### `infrastructure/database/client.js` imports (9 files)

All use `import { prisma }` — consistent.

### `infrastructure/cache/` exports

- `index.js`: exports `createCacheService`, `getCacheService`, `resetCacheService`, `cacheConfig`
- `RedisClient.js`: exports `redisClient` (instance) — no `export { RedisClient }` found (removed) ✅

### Caller count summary

| Export                 | Consumers                                  |
| ---------------------- | ------------------------------------------ |
| `config` (named)       | 10 files                                   |
| `prisma`               | 9 files                                    |
| `redisClient` instance | 2 files (container.js, cache/index.js)     |
| `authenticateToken`    | 9 route files                              |
| `getCacheService`      | 2 files (container.js, cacheMiddleware.js) |
| `errorHandler`         | 2 files (index.js, middleware/index.js)    |
