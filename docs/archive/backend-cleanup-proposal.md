# Backend Cleanup Proposal

**Date:** 2026-06-10
**Author:** DeepSeek V4 Flash Analysis

## Executive Summary

Comprehensive analysis of the backend at `apps/backend/src/` across 5 investigation areas: infrastructure layer, API docs, routes entry point, test structure, and module test failures. Key findings include **dead code** (`schemas.js`), **import bugs** in 2 test files (NoOpCacheService, ExampleService), **path resolution bugs** (hskValidator.js), **missing env vars** for 2 test suites, and **architectural inconsistencies** in the infrastructure `api/` subfolder. Total: 61 test failures, of which 19 are pre-existing (need DB), 9 are fixable bugs, and the rest cascade from startup failures. A prioritized 4-phase implementation plan is provided.

---

## 1. Infrastructure Layer (`src/infrastructure/`)

### Current Structure

```
infrastructure/
├── api/                          ← Misfit: TTS controller+routes don't belong here
│   ├── TtsController.js
│   └── ttsRoutes.js
├── cache/
│   ├── CacheService.js           ← Abstract base (interface)
│   ├── GcsCacheService.js        ← GCS-backed cache (NOT extends CacheService!)
│   ├── NoOpCacheService.js       ← extends CacheService ✓
│   ├── RedisCacheService.js      ← extends CacheService ✓
│   ├── RedisClient.js            ← Singleton wrapper
│   ├── RedisLockManager.js       ← Single-flight lock
│   ├── index.js                  ← Factory (createCacheService / getCacheService)
│   └── __tests__/
│       └── NoOpCacheService.test.js
├── database/
│   └── client.js                 ← Prisma singleton
├── external/
│   ├── GCSClient.js              ← Module-level functions (stateless singleton)
│   ├── GeminiClient.js           ← Module-level functions + lazy init
│   └── GoogleTTSClient.js        ← Module-level functions + lazy init
├── parsers/
│   └── CsvParser.js              ← Pure utility, no deps
└── security/
    ├── HmacManager.js            ← Class + constructor reads config
    ├── JwtService.js             ← Class + constructor reads config
    ├── PasswordService.js        ← Class, stateless
    └── __tests__/
        └── hmacManager.test.js
```

### File-by-File Analysis

| File                          | Pattern                                      | Issues                                                                                                                                                                                                         | Recommendation                                                                                       |
| ----------------------------- | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `api/TtsController.js`        | Class + DI (ttsService, gcsService injected) | **Architecture violation**: TTS is a module feature (Epic 1), not infrastructure. Controller belongs in `modules/tts/api/`                                                                                     | Move to `modules/tts/api/` with proper clean arch separation                                         |
| `api/ttsRoutes.js`            | Express router                               | Imports `ttsController` from `container.js` — creates dependency on composition root from infrastructure layer (inversion of control violation)                                                                | Move alongside controller                                                                            |
| `cache/CacheService.js`       | Abstract base class                          | Clean interface, properly defined. **Note**: `getMulti` takes `string[]` returns `Map` — some consumers may expect different signature                                                                         | Keep as-is                                                                                           |
| `cache/GcsCacheService.js`    | Class (standalone)                           | **Does NOT extend CacheService**. Has `exists()` instead of `delete()`/`clear()`. Different method signatures (`getSignedUrl` not in interface). This is a **different abstraction** despite naming similarity | Rename to `GcsFileStore` or document as separate interface. Does not need to conform to CacheService |
| `cache/NoOpCacheService.js`   | Class extends CacheService                   | ✅ Correct implementation                                                                                                                                                                                      | Keep as-is                                                                                           |
| `cache/RedisCacheService.js`  | Class extends CacheService                   | ✅ Correct implementation. Fail-open pattern well-documented                                                                                                                                                   | Keep as-is                                                                                           |
| `cache/RedisClient.js`        | Singleton wrapper + static `getInstance()`   | **Dual singleton**: exports both `new RedisClient()` and class. The static `getInstance()` is unused by any consumer                                                                                           | Remove static `getInstance()` + unused class export                                                  |
| `cache/RedisLockManager.js`   | Class (standalone)                           | ✅ Clean, specific-purpose lock implementation                                                                                                                                                                 | Keep as-is                                                                                           |
| `cache/index.js`              | Factory                                      | **Mixed sync/async API** (`createCacheService` async vs `getCacheService` sync). The singleton caching has a race window where two calls to `createCacheService` could both proceed                            | Keep but document race condition; or make fully async with promise caching                           |
| `database/client.js`          | Singleton export                             | Exports `prisma` singleton. Used across modules via import. This is tightly coupled (modules import infrastructure directly rather than receiving via DI)                                                      | Consider DI injection in container.js rather than direct imports                                     |
| `external/GCSClient.js`       | Module-level functions                       | Stateless singleton pattern (lazy init on first call). ✅ Consistent                                                                                                                                           | Keep as-is                                                                                           |
| `external/GeminiClient.js`    | Module-level functions                       | Stateless singleton pattern (lazy JWT init). ✅ Consistent                                                                                                                                                     | Keep as-is                                                                                           |
| `external/GoogleTTSClient.js` | Module-level functions                       | Stateless singleton pattern. ✅ Consistent                                                                                                                                                                     | Keep as-is                                                                                           |
| `parsers/CsvParser.js`        | Utility function                             | Pure function, no dependencies. **Usage**: grep shows it's imported nowhere in the backend source (used only by frontend `csvLoader.ts`)                                                                       | Consider whether backend needs it — if not, remove                                                   |
| `security/HmacManager.js`     | Class                                        | Constructor reads from `config` object (DI via container) — NOT from process.env directly. ✅ Good                                                                                                             | Keep as-is                                                                                           |
| `security/JwtService.js`      | Class                                        | Constructor reads from `config` object. ✅ Good                                                                                                                                                                | Keep as-is                                                                                           |
| `security/PasswordService.js` | Class                                        | Stateless, no config deps. ✅ Good                                                                                                                                                                             | Keep as-is                                                                                           |

### Key Findings

1. **`api/` subfolder is architecturally inappropriate.** TTS is a business feature (generating audio for Mandarin words), not infrastructure like databases or external API clients. Keeping `TtsController.js` + `ttsRoutes.js` in `infrastructure/api/` violates Clean Architecture's Dependency Rule: controllers and routes are API-layer concerns, not infrastructure. **Migration target**: `modules/tts/api/TtsController.js` + `modules/tts/api/ttsRoutes.js`.

2. **`ttsRoutes.js` imports from `container.js`.** This creates a subtle dependency inversion violation — the infrastructure layer depends on the composition root rather than receiving its dependencies via DI. Route files should import controllers from `container.js` only if they're in the API layer. Move to `modules/` resolves this.

3. **Cache service interface has two unrelated implementations**: `CacheService` (abstract base for Redis/NoOp) and `GcsCacheService` (GCS file store with different interface). The naming is misleading — `GcsCacheService` should probably be `GcsFileStore` or similar. They serve different purposes: `CacheService` is for key-value caching with TTL; `GcsCacheService` is for persistent file storage in GCS.

4. **External clients are consistently stateless singletons** using module-level function exports with lazy initialization. This is a valid pattern and consistent across all 3 clients (GCS, Gemini, TTS). No changes needed.

5. **`database/client.js` exports a Prisma singleton** that modules import directly. This creates tight coupling — modules depend on infrastructure directly rather than through repository abstractions. However, repositories in each module wrap Prisma calls, mitigating this at the service layer. Acceptable for now.

6. **Security services properly depend on config** (not `process.env` directly), enabling DI through container.js. ✅

7. **`CsvParser.js` appears unused** in the backend. It's a simple wrapper around `csv-parse/sync` and may have been leftover from a previous architecture.

### Module Boundary Analysis: Should TTS/Examples Be Standalone Modules?

A critical architectural question: should TTS and Examples be **standalone modules**, **subsumed into vocabulary**, or **consumed as infrastructure directly**?

#### Actual Dependency Graph (Traced from Code)

```
Frontend (independent API calls)
  ├── /api/v1/vocabulary/*   → vocabulary module
  ├── /api/v1/examples/*     → examples module
  ├── /api/v1/tts/*          → tts module
  └── /api/v1/conversation/* → conversation module

Modules (backend — NO module imports another module)
  vocabulary    ──infra──> GCSClient, prisma, CsvParser
  examples      ──infra──> GcsCacheService, GeminiClient, GoogleTTSClient, CacheService
  tts           ──infra──> GoogleTTSClient (DI), GCSClient (DI)
  conversation  ──infra──> GeminiClient, GoogleTTSClient, GCSClient (bare fn calls ⚠️)

Infrastructure layer (shared by all modules)
  GCSClient, GeminiClient, GoogleTTSClient, prisma, CacheService/Redis/NoOp
```

#### Key Findings

1. **Vocabulary does NOT depend on Examples or TTS.** They are independent API endpoints. The frontend calls them separately.

2. **Examples does NOT depend on Vocabulary.** It receives target words as API parameters, not from the vocabulary module's domain. It has its own complex business logic (AI prompt engineering, HSK validation, HMAC-signed caching, single-flight locks).

3. **Conversation does NOT depend on the TTS module.** It imports `GoogleTTSClient` from `infrastructure/external/` directly to generate audio internally — it doesn't call the TTS endpoint.

4. **TTS controller is a standalone orchestration layer** — validates input (1-15 words), checks GCS cache, calls GoogleTTSClient, uploads to GCS, returns URL. No module dependency.

#### Verdict: Standalone Modules (NOT subsumed into vocabulary)

| Feature                                  | Standalone Module?                    | Why                                                                                                              |
| ---------------------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **TTS**                                  | ✅ `modules/tts/`                     | Distinct business capability (audio generation), own controller+routes+logic, consumed independently by frontend |
| **Examples**                             | ✅ `modules/examples/` (keep current) | Complex AI generation pipeline, own validation+caching+HMAC, already correctly placed                            |
| **Putting TTS/Examples INTO vocabulary** | ❌ Would break modulith               | Would create coupling where none exists, violate SRP, and make vocabulary module a monolith                      |

#### How This Affects the Modulith Pattern

The current modulith pattern is **correct** for TTS and Examples:

```
✅ Correct: Module → Infrastructure only
  modules/tts/  ──>  infrastructure/external/GoogleTTSClient
  modules/tts/  ──>  infrastructure/external/GCSClient

✅ Correct: Module → Infrastructure only
  modules/examples/  ──>  infrastructure/external/GeminiClient
  modules/examples/  ──>  infrastructure/cache/GcsCacheService
  modules/examples/  ──>  infrastructure/cache/CacheService
  modules/examples/  ──>  infrastructure/external/GoogleTTSClient

✅ Correct: No module-to-module dependency
  vocabulary  ─/─>  examples   (no import)
  examples   ─/─>  vocabulary  (no import)
  tts        ─/─>  vocabulary  (no import)
  conversation ─/─> tts         (no import — uses GoogleTTSClient directly)
```

The only violation to fix:

```
⚠️ ConversationService imports GCSClient bare functions
   Fix: Receive GCS via constructor injection (like every other service)
```

#### Updated Recommendations

| Action                                                            | Why                                                        |
| ----------------------------------------------------------------- | ---------------------------------------------------------- |
| **Move** `TtsController.js` + `ttsRoutes.js` → `modules/tts/api/` | TTS is a business feature, not infrastructure              |
| **Keep** Examples as `modules/examples/` (already correct)        | Independent bounded context with complex AI logic          |
| **Do NOT** merge TTS/Examples into vocabulary                     | Would create coupling, violate SRP, no shared domain logic |
| **Fix** ConversationService DI violation                          | Only service using bare GCS function imports               |
| **Rename** `GcsCacheService` → `GcsFileStore`                     | Misleading name (it's a file store, not a cache)           |
| **Remove** unused static `RedisClient.getInstance()`              | Dead code                                                  |
| **Remove or archive** `CsvParser.js` if confirmed unused          | Possibly dead in backend                                   |

---

## 2. API Docs (`api/docs/`)

### Current State

```
api/docs/
├── openapi.js        ← Loads openapi.yaml, exports swaggerSpec
├── openapi.yaml      ← OpenAPI 3.1 specification (sole source of truth)
└── schemas.js        ← JSDoc @openapi annotations + export default {}
```

### Analysis

#### 2.1 `schemas.js` — Dead Code Confirmed

- **Content**: Defines `ListProgress` and `ProgressStats` schemas via JSDoc `@openapi` annotations, then exports `export default {}` (empty object).
- **grep search result**: `schemas.js` is imported **nowhere** in the entire workspace. Zero imports found.
- **swagger-jsdoc usage**: The `swagger-jsdoc` package is listed in `package.json` (dev dependency) but is **never imported or used** anywhere in source code. No `import swaggerJsdoc from "swagger-jsdoc"` exists.
- **openapi.yaml**: The YAML file defines its own `components/schemas` section independently (at lines 60-140+), including `Error`, `VocabularyList`, `VocabularyWord`, `Progress`, `ListProgress` — duplicating what `schemas.js` partially defines.
- **Verdict**: `schemas.js` is **completely dead code**. The file was likely created during an earlier phase when swagger-jsdoc was used to parse JSDoc annotations, but the architecture switched to a standalone YAML file. The file remains as an orphan.

#### 2.2 `openapi.yaml` — Current State

- Uses OpenAPI 3.1.0 format ✅
- Has comprehensive `components/schemas` section already defined
- Path definitions include `/v1/health`, `/v1/auth/register`, `/v1/auth/login`, `/v1/auth/refresh`
- Missing endpoints: Many routes defined in `routes/index.js` (progress, gamification, quiz, conversation, word, vocabulary, examples, TTS) are **not documented**. The YAML is incomplete.
- Single-file approach works but will grow large as more endpoints are documented

#### 2.3 Split Decision

Options evaluated:
| Option | Pros | Cons |
|--------|------|------|
| **A. Keep single YAML** | Simple, easy to find all paths | Will become large; merge conflicts risk |
| **B. Split per module** | Modular, clear ownership; each module has own `docs/openapi.yaml` fragment | Need merging logic; more files to manage |
| **C. Hybrid: keep YAML, add module refs** | Single file with clear section headers | Moderate solution |

**Recommendation**: Keep single YAML for now (Option A). The spec is not yet large enough to justify splitting. When it exceeds ~500 lines, consider per-module YAML fragments merged via a script.

### Recommendations

1. **Delete `schemas.js`** — It is dead code. Zero imports, empty export, and swagger-jsdoc is not used.
2. **Uninstall `swagger-jsdoc`** from `apps/backend/package.json` if not used elsewhere.
3. **Keep `openapi.js` + `openapi.yaml` at `src/api/docs/`** — Moving to `src/shared/docs/` would be more aligned architecturally, but the current location works and `openapi.js` is stable.
4. **Add missing endpoint documentation** to `openapi.yaml` as a follow-up task (lower priority).

---

## 3. Routes Entry Point (`api/routes/index.js`)

### Current State

- **Location**: `apps/backend/src/api/routes/index.js`
- **Mount point**: `src/index.js` does `app.use("/api", routes)`
- **Imports**: 12 routers (auth, progress, word, gamification, AI feedback, conversation, examples, TTS, vocabulary, health, quiz session, learning)
- **All routes** bake `/v1/` prefix into `ROUTE_PATTERNS` constants shared with frontend

### Import Verification

| #   | Import                                                                           | Source Path                              | Status |
| --- | -------------------------------------------------------------------------------- | ---------------------------------------- | ------ |
| 1   | `authRouter` from `../../modules/auth/api/authRoutes.js`                         | ✅ Exists                                |
| 2   | `progressRouter` from `../../modules/quiz/api/progressRoutes.js`                 | ✅ Exists                                |
| 3   | `wordRouter` from `../../modules/word/api/wordRoutes.js`                         | ✅ Exists                                |
| 4   | `gamificationRouter` from `../../modules/gamification/api/gamificationRoutes.js` | ✅ Exists                                |
| 5   | `aiFeedbackRouter` from `../../modules/quiz/api/aiFeedbackRoutes.js`             | ✅ Exists                                |
| 6   | `conversationRouter` from `../../modules/conversation/api/conversationRoutes.js` | ✅ Exists                                |
| 7   | `examplesRoute` from `../../modules/examples/api/examplesRoutes.js`              | ✅ Exists                                |
| 8   | `ttsRouter` from `../../infrastructure/api/ttsRoutes.js`                         | ✅ Exists (but should move — see Area 1) |
| 9   | `vocabularyRouter` from `../../modules/vocabulary/api/vocabularyRoutes.js`       | ✅ Exists                                |
| 10  | `healthRouter` from `../../shared/middleware/healthRoutes.js`                    | ✅ Exists                                |
| 11  | `quizSessionRouter` from `../../modules/quiz/api/quizSessionRoutes.js`           | ✅ Exists                                |
| 12  | `learningRouter` from `../../modules/quiz/api/learningRoutes.js`                 | ✅ Exists                                |

All 12 imports are valid.

### TODO Comment Analysis

The TODO states:

```
// TODO(A10): Apply /v1 prefix once here (router.use('/v1', xRouter)) instead of repeating it
// in every route file. Blocked by: ROUTE_PATTERNS in @mandarin/shared-constants already bake in
// /v1/ and are shared with the frontend — stripping the prefix from routes would require a
// coordinated change across both packages to avoid breaking the API contract.
```

**ROUTE_PATTERNS** in `packages/shared-constants/src/index.js`:

```js
export const ROUTE_PATTERNS = {
  health: "/v1/health",
  authRegister: "/v1/auth/register",
  // ... all have /v1/
};
```

Each route file does `router.use(ROUTE_PATTERNS.health, ...)` which already contains `/v1/`. The idea is to change this to `router.use('/v1', healthRouter)` and have route files use paths without `/v1/`.

**Constraint**: `ROUTE_PATTERNS` is also used by the **frontend** (e.g., for API call URLs). Removing `/v1/` would break frontend API calls. This requires a coordinated dual-package change.

**Recommendation**: Defer this refactor. Create a follow-up story. Effort: ~2-3 hours (update shared consts + all route files + frontend API calls + verify).

### Options Evaluated

| Option                                | Pros                               | Cons                                                    |
| ------------------------------------- | ---------------------------------- | ------------------------------------------------------- |
| **A. Keep as-is**                     | Simplest, least disruption         | `api/` directory is legacy name                         |
| **B. Rename to `src/routes.js`**      | Cleaner, removes legacy `api/` dir | Rename breaks nothing (single import point)             |
| **C. Move to `src/shared/routes.js`** | Shared concerns belong in shared/  | Routes isn't really "shared" — it's the API entry point |
| **D. Inline into `src/index.js`**     | Simplest                           | Clutters server entry point with 12 route imports       |

### Recommendation

**Option B: Rename to `src/routes.js`** (or keep at `src/api/routes/index.js` and just drop the `api/` directory).

The `api/` directory is a legacy artifact from before the modular architecture. Moving the routes file to `src/routes.js` would:

- Clean up the `src/` root (currently: `api/`, `container.js`, `index.js`, `infrastructure/`, `modules/`, `shared/`)
- Remove the misleading `api/` directory name
- Impact only one import line in `src/index.js` (`import routes from "./api/routes/index.js"` → `import routes from "./routes.js"`)

---

## 4. Test Structure (`tests/`)

### Current Layout

```
tests/
├── setup.js                    ← Loads dotenv
├── integration/
│   ├── auth.test.js            ← Needs real DB (15 failures)
│   └── database.test.js        ← Needs real DB (4 failures)
└── manual/
    ├── test-auth-endpoints.js  ← Manual HTTP test script
    ├── test-connection.js      ← DB connection checker
    ├── test-simple-connection.js ← Simpler DB checker
    └── view-data.js            ← Data viewer
```

### Manual Tests

These are **utility scripts** that happen to be in `tests/`. They use `node` directly (not Vitest) and connect to the real database for ad-hoc debugging.

| File                        | Purpose                      | Recommended Location |
| --------------------------- | ---------------------------- | -------------------- |
| `test-auth-endpoints.js`    | Manual HTTP endpoint testing | `scripts/manual/`    |
| `test-connection.js`        | Prisma DB connection test    | `scripts/manual/`    |
| `test-simple-connection.js` | pg-client DB connection test | `scripts/manual/`    |
| `view-data.js`              | Browse DB contents           | `scripts/manual/`    |

**Recommendation**: Move all 4 files to `scripts/manual/` — they are operational scripts, not test files.

### Integration Tests

Both `auth.test.js` and `database.test.js` require:

- A running PostgreSQL/Supabase database
- `DATABASE_URL` environment variable with valid credentials
- Prisma migrations applied
- Cleanup logic (`afterAll` hooks that delete test data)

**Current `vitest.config.js` includes them**:

```js
include: [
  "tests/**/*.test.js",  // ← This catches integration tests!
  ...
]
```

This means `npm test` will always try to run integration tests, which will fail in CI without a database.

**Recommendation**: Create separate configuration for integration tests:

1. Exclude `tests/integration/` from default `include` pattern
2. Create `vitest.integration.config.js` that only includes integration tests
3. Add npm script: `"test:integration": "vitest --config vitest.integration.config.js"`

### Options Evaluated

| Option                                  | Pros                                         | Cons                                                         |
| --------------------------------------- | -------------------------------------------- | ------------------------------------------------------------ |
| **A. Keep current structure**           | No changes needed                            | Integration tests break CI; manual tests pollute test runner |
| **B. Exclude + reconfig (recommended)** | Clean separation; CI only runs unit tests    | Need new config file; minor setup overhead                   |
| **C. Move all tests to module-level**   | Truly co-located; each module self-contained | Major restructuring; need to update all imports and configs  |

### Recommendations

1. **Exclude** `tests/integration/` from `vitest.config.js`:
   ```js
   include: [
     "tests/**/*.test.js",
     "!tests/integration/**",
     "src/modules/**/__tests__/**/*.test.js",
     "src/infrastructure/**/__tests__/**/*.test.js",
     "src/shared/**/__tests__/**/*.test.js",
   ],
   ```
2. **Create** `vitest.integration.config.js` with only integration includes
3. **Move** `tests/manual/*` to `scripts/manual/`
4. **Add** npm scripts: `"test:unit"` (default), `"test:integration"`, `"test:manual-scripts"` reminder

---

## 5. Module Test Fixes (`modules/**/__tests__/`)

### Summary

| File                                                             | Status      | Failures | Root Cause                                                                                                    | Action                                      |
| ---------------------------------------------------------------- | ----------- | -------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| `tests/integration/auth.test.js`                                 | DEFERRED    | 15       | Needs real database + env vars                                                                                | Separate via integration config             |
| `tests/integration/database.test.js`                             | DEFERRED    | 4        | Needs real database + env vars                                                                                | Separate via integration config             |
| `src/infrastructure/cache/__tests__/NoOpCacheService.test.js`    | **FIXABLE** | 6        | Import bug: uses default import but only named export exists                                                  | ✅ Fix: change import                       |
| `src/infrastructure/security/__tests__/hmacManager.test.js`      | DEFERRED    | 1        | Missing env var — config singleton caches at module load, test env override too late                          | Needs vi.resetModules() or mock             |
| `src/modules/auth/__tests__/authController.test.js`              | **FIXABLE** | 1        | Config module validation throws at import time without env vars                                               | ✅ Fix: mock config                         |
| `src/modules/examples/__tests__/exampleService.test.js`          | **FIXABLE** | 3        | Import bug (default vs named) + constructor signature mismatch                                                | ✅ Fix: both issues                         |
| `src/modules/examples/__tests__/examplesRoute.test.js`           | **FIXABLE** | 1        | Imports full app which fails config validation without env                                                    | ✅ Fix: mock config or convert to unit test |
| `src/modules/examples/__tests__/hskValidator.test.js`            | **FIXABLE** | 1        | hsk-1-3.json path resolution off by one `..` level → fallback set used                                        | ✅ Fix: correct path depth                  |
| `src/modules/gamification/__tests__/GamificationService.test.js` | **FIXABLE** | 2        | Test uses `hasUserBadge` but code uses `findByUser`; calculateXP passes bool by implementation expects number | ✅ Fix: update mocks                        |
| `src/modules/quiz/__tests__/api/progressController.test.js`      | **FIXABLE** | 3        | Mock setup needs tuning for updated controller methods                                                        | ✅ Fix: update mocks                        |

### Detailed Fixes

#### File: `src/infrastructure/cache/__tests__/NoOpCacheService.test.js`

- **Failure count**: 6 (all tests fail)
- **Root cause**: Import mismatch — test uses `import NoOpCacheService from "../NoOpCacheService.js"` (default import) but the source file only has `export class NoOpCacheService` (named export, no `export default`).
- **Fix**:
  ```js
  // Change from:
  import NoOpCacheService from "../NoOpCacheService.js";
  // To:
  import { NoOpCacheService } from "../NoOpCacheService.js";
  ```

#### File: `src/infrastructure/security/__tests__/hmacManager.test.js`

- **Failure count**: 1
- **Root cause**: The "throws if EXAMPLES_CACHE_HMAC_KEY is missing" test deletes the env var, but the `HmacManager` constructor reads `config.examplesCacheHmacKey` which is set at **module load time** (before the test runs). If the env var exists when config loads, the delete in the test has no effect on the already-loaded config. If it doesn't exist, ALL tests fail because the constructor throws.
- **Recommendation**: Mark as **DEFERRED**. Fix requires either `vi.resetModules()` + dynamic import, or mocking the config module. Low priority (1 failure).

#### File: `src/modules/auth/__tests__/authController.test.js`

- **Failure count**: 1
- **Root cause**: The test imports `AuthController` from `../api/AuthController.js`, which transitively imports `config` from `../../../shared/config/index.js`. The config module **validates required env vars at module load time** and throws if `JWT_SECRET`, `JWT_REFRESH_SECRET`, `GCS_BUCKET_NAME`, `GOOGLE_TTS_CREDENTIALS_RAW`, `GEMINI_API_CREDENTIALS_RAW` are all missing. This import-time validation causes the test file to fail before any test runs.
- **Fix**: Add `vi.mock()` for the config module at the top of the test file:
  ```js
  vi.mock("../../../shared/config/index.js", () => ({
    default: {
      nodeEnvironment: "test",
      jwtSecret: "test-secret",
      jwtRefreshSecret: "test-refresh-secret",
      // ... other fields used by AuthController
    },
    config: {
      nodeEnvironment: "test",
      jwtSecret: "test-secret",
      jwtRefreshSecret: "test-refresh-secret",
    },
  }));
  ```

#### File: `src/modules/examples/__tests__/exampleService.test.js`

- **Failure count**: 3
- **Root causes**:
  1. **Import bug**: `import ExampleService from "../services/ExampleService.js"` uses default import, but `ExampleService.js` only has `export class ExampleService` (named export, no default).
  2. **Constructor signature mismatch**: Test passes `mockGcs` directly (`new ExampleService(mockGcs)`), but the constructor expects an options object: `constructor({ gcsService, geminiClient, ttsClient, cacheService } = {})`. So `this.gcs` is `undefined` instead of the mock.
- **Fix**:

  ```js
  // 1. Change import:
  import { ExampleService } from "../services/ExampleService.js";

  // 2. Change constructor call:
  const svc = new ExampleService({ gcsService: mockGcs });
  ```

#### File: `src/modules/examples/__tests__/examplesRoute.test.js`

- **Failure count**: 1
- **Root cause**: Imports `app from "../../../index.js"` which triggers the full Express app setup. This transitively imports `config` from `src/shared/config/index.js`, which **validates required env vars at module load time** and throws.
- **Fix options**:
  1. **Primary**: Mock the config module globally in `tests/setup.js` (affects all tests)
  2. **Alternative**: Add env vars before imports using top-level process.env assignments:
     ```js
     process.env.JWT_SECRET = "test-secret";
     process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
     process.env.GCS_BUCKET_NAME = "test-bucket";
     process.env.GOOGLE_TTS_CREDENTIALS_RAW = '{"client_email":"test@test.com"}';
     process.env.GEMINI_API_CREDENTIALS_RAW =
       '{"client_email":"test@test.com","private_key":"test"}';
     ```
  3. **Convert to pure unit test**: Test the route handler directly instead of going through the full app.
- **Recommendation**: Option 3 (convert to unit test) is cleanest. Option 2 is quickest.

#### File: `src/modules/examples/__tests__/hskValidator.test.js`

- **Failure count**: 1
- **Root cause**: `hskValidator.js` at `apps/backend/src/modules/examples/services/hskValidator.js` resolves the HSK JSON path with `../../../../../../..` (7 levels up) but needs only 6 to reach the project root. The wrong path causes `loadHskSet()` to fall back to the hardcoded set `["我", "你", "他", "好", "吃", "喝", "水", "饭", "米饭", "苹果"]`, which doesn't contain "有", "一", "个", "书" — the characters the test expects.
- **Fix**: Change the path resolution from 7 `..` to 6 `..`:

  ```js
  // Current (wrong, 7 levels):
  const HSK_JSON_PATH = path.resolve(
    __dirname,
    "../../../../../../..",
    "packages", ...
  );

  // Fixed (6 levels):
  const HSK_JSON_PATH = path.resolve(
    __dirname,
    "../../../../..",
    "packages", ...
  );
  ```

- **Note**: The same bug exists in `src/shared/utils/hskValidator.js` where `../../../../../..` (6 levels) should be `../../../../..` (5 levels). Fix both.

#### File: `src/modules/gamification/__tests__/GamificationService.test.js`

- **Failure count**: 2
- **Root causes**:
  1. **Mock method mismatch**: Tests for `checkAndAwardBadges` mock `mockBadgeRepo.hasUserBadge`, but the implementation calls `this.badgeRepository.findByUser` (not `hasUserBadge`). The `findByUser` mock IS set up in `beforeEach` to return `[]`, so the badge creation logic works but the `hasUserBadge` mocks are dead code.
  2. **`calculateXP` type mismatch**: Test passes `isCorrect` (boolean) as first argument, but implementation signature says `@param {number} correctCount`. The BusinessRules `calculateXP` treats it as a number (`correctCount * XP_PER_CORRECT_ANSWER`), which happens to work because `true * 10 = 10` and `false * 10 = 0`. But tests expecting `calculateXP(true, 7)` = 15 actually compute `1 * 10 + 1 * 5 = 15` — this works by coincidence, not by design.
- **Fix**:
  1. Remove stale `mockBadgeRepo.hasUserBadge` mocks (lines using `mockBadgeRepo.hasUserBadge.mockResolvedValue(false)`)
  2. Update `calculateXP` test to pass numeric `correctCount`:
     ```js
     // Change from:
     gamificationService.calculateXP(true, 3);
     // To:
     gamificationService.calculateXP(1, 3);
     ```

#### File: `src/modules/quiz/__tests__/api/progressController.test.js`

- **Failure count**: 3
- **Root cause**: The controller constructor now takes 3 positional args: `constructor(progressService, streakService = null, gamificationService = null)`. The `vi.mock()` for `ProgressService` may interfere with proper mock setup. Additionally, the `updateWordProgress` method now validates `correctCount` (a new field the test doesn't include), which could cause unexpected behavior.
- **Fix**:
  1. Ensure `mockService` has all methods properly mocked (not just `getProgressForUser`, `getProgressForWord`, `updateProgress`, `batchUpdateProgress`, `getProgressStats`, `getDueWords`)
  2. Check that `updateProgress` mock accepts the new parameter shape `{ studyCount, correctCount, confidence }`

### Convention Compliance Summary

| File                          | Naming        | Location                              | Structure      | Mocking            | Imports             |
| ----------------------------- | ------------- | ------------------------------------- | -------------- | ------------------ | ------------------- |
| `NoOpCacheService.test.js`    | ✅ `.test.js` | ✅ `__tests__/` dir                   | ✅ describe/it | ✅ vi.fn           | ❌ default vs named |
| `hmacManager.test.js`         | ✅ `.test.js` | ✅ `__tests__/` dir                   | ✅ describe/it | N/A (no mocking)   | ✅ named import     |
| `authController.test.js`      | ✅ `.test.js` | ❌ At `api/` level (not `__tests__/`) | ✅ describe/it | ✅ vi.fn           | ✅ default import   |
| `exampleService.test.js`      | ✅ `.test.js` | ✅ `__tests__/` dir                   | ✅ describe/it | ✅ vi.spyOn        | ❌ default vs named |
| `examplesRoute.test.js`       | ✅ `.test.js` | ✅ `__tests__/` dir                   | ✅ describe/it | ✅ vi.spyOn        | ✅ default import   |
| `hskValidator.test.js`        | ✅ `.test.js` | ✅ `__tests__/` dir                   | ✅ describe/it | N/A (no mocking)   | ✅ named import     |
| `GamificationService.test.js` | ✅ `.test.js` | ✅ `__tests__/` dir                   | ✅ describe/it | ✅ vi.fn           | ✅ default import   |
| `progressController.test.js`  | ✅ `.test.js` | ✅ `__tests__/` dir                   | ✅ describe/it | ✅ vi.mock + vi.fn | ✅ default import   |

**Convention issues**:

- `authController.test.js` is at `src/modules/auth/api/` level, not in a `__tests__/` directory. This is inconsistent with the rest of the project (7 out of 8 test files use `__tests__/`).
- All files use ESM imports and Vitest's `vi` API consistently ✅

---

## 6. Implementation Plan

### Phase 1: Quick Wins (Dead Code Removal)

| Task                                                                | File(s)                                                | Effort |
| ------------------------------------------------------------------- | ------------------------------------------------------ | ------ |
| 1.1 Delete `schemas.js`                                             | `apps/backend/src/api/docs/schemas.js`                 | 5 min  |
| 1.2 Uninstall `swagger-jsdoc` if not used elsewhere                 | `apps/backend/package.json`                            | 5 min  |
| 1.3 Remove static `RedisClient.getInstance()` + unused class export | `apps/backend/src/infrastructure/cache/RedisClient.js` | 5 min  |
| 1.4 Remove unused `CsvParser.js` (verify first)                     | `apps/backend/src/infrastructure/parsers/CsvParser.js` | 10 min |

**Total Phase 1**: ~25 minutes

### Phase 2: Test Fixes (9 fixable failures → ~0 remaining)

| Task                                                        | File(s)                                                                              | Effort |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------ | ------ |
| 2.1 Fix NoOpCacheService import                             | `src/infrastructure/cache/__tests__/NoOpCacheService.test.js`                        | 5 min  |
| 2.2 Fix ExampleService import + constructor                 | `src/modules/examples/__tests__/exampleService.test.js`                              | 15 min |
| 2.3 Fix hskValidator path resolution (both copies)          | `src/modules/examples/services/hskValidator.js` + `src/shared/utils/hskValidator.js` | 10 min |
| 2.4 Fix authController test (config mock)                   | `src/modules/auth/__tests__/authController.test.js`                                  | 15 min |
| 2.5 Fix examplesRoute test (mock config or convert to unit) | `src/modules/examples/__tests__/examplesRoute.test.js`                               | 20 min |
| 2.6 Fix GamificationService test (remove stale mocks)       | `src/modules/gamification/__tests__/GamificationService.test.js`                     | 10 min |
| 2.7 Fix progressController test mocks                       | `src/modules/quiz/__tests__/api/progressController.test.js`                          | 15 min |

**Total Phase 2**: ~1.5 hours

### Phase 3: Structural Moves

| Task                                                                                  | File(s)                                                                                                                                                    | Effort |
| ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 3.1 **Create `modules/tts/`** — move TTS controller+routes from `infrastructure/api/` | Create `modules/tts/api/TtsController.js`, `modules/tts/api/ttsRoutes.js`, `modules/tts/index.js` + update `container.js` import, `routes/index.js` import | 30 min |
| 3.2 **Fix ConversationService DI** — stop bare GCS imports, receive via constructor   | `modules/conversation/services/ConversationService.js` + `container.js` wiring                                                                             | 15 min |
| 3.3 Rename `GcsCacheService` → `GcsFileStore`                                         | `GcsCacheService.js` + 3 usages in `container.js`, `exampleService.js`                                                                                     | 15 min |
| 3.4 Rename `routes/index.js` to `src/routes.js` + drop `api/` dir                     | `api/routes/index.js` → `src/routes.js` + update `src/index.js`                                                                                            | 15 min |
| 3.5 Move manual tests to `scripts/manual/`                                            | 4 files in `tests/manual/`                                                                                                                                 | 10 min |

**Total Phase 3**: ~1.5 hours

> **Design rationale**: TTS and Examples remain as **standalone modules** (not merged into vocabulary) because:
>
> - They have **independent business logic** (AI prompts, audio generation, HSK validation) with zero dependency on the vocabulary module
> - They have **their own API endpoints** consumed independently by the frontend
> - They share **infrastructure only** (GCSClient, GeminiClient, GoogleTTSClient) — correct modulith pattern
> - Merging would create a **coupled vocabulary monolith** violating Single Responsibility Principle

### Phase 4: Integration Test Separation

| Task                                                        | File(s)                                                                       | Effort |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------- | ------ |
| 4.1 Exclude `tests/integration/` from default vitest config | `vitest.config.js`                                                            | 10 min |
| 4.2 Create `vitest.integration.config.js`                   | New file                                                                      | 15 min |
| 4.3 Add npm scripts for unit + integration                  | `package.json`                                                                | 5 min  |
| 4.4 Move `authController.test.js` to `__tests__/` dir       | `src/modules/auth/api/authController.test.js` → `src/modules/auth/__tests__/` | 5 min  |

**Total Phase 4**: ~35 minutes

---

## 7. Risk Assessment

### Breaking Changes

| Change                        | Risk                                                                | Mitigation                                                         |
| ----------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Delete `schemas.js`           | **Low** — no imports, empty export                                  | Grep confirmed zero usage in entire workspace                      |
| Move TTS files → modules/tts/ | **Medium** — other files import from old path                       | Update `container.js` import + `routes/index.js` import            |
| Fix ConversationService DI    | **Low** — internal refactor, no API contract change                 | Update constructor call in `container.js`                          |
| Rename GcsCacheService        | **Medium** — impacts `container.js`, `ExampleService.js`, tests     | Update all 3-4 references; add deprecation alias during transition |
| Move routes/index.js          | **Low** — single import in `src/index.js`                           | Update single import line                                          |
| Fix hskValidator path         | **Low** — no user-facing impact; previously failed open to fallback | File path correction only                                          |
| Exclude integration tests     | **Low** — they still exist, just excluded from default `npm test`   | CI will no longer attempt them                                     |

### Test Disruption

- **Phase 2 fixes** (test bugs): No disruption — tests currently fail, fixing them makes them pass ✓
- **Phase 4 separation**: Integration tests excluded from `npm test` but still runnable via `npm run test:integration` — existing workflow unchanged
- **Manual test moves**: Tests weren't part of the Vitest suite anyway (they're `node` scripts run directly)
- **hmacManager.test.js**: 1 failure remains deferred — acceptable risk (edge case in config singleton testing)

### CI Impact

- **Immediate**: Excluding integration tests from default suite will make CI pass (currently fails on 19 DB-dependent tests)
- **Positive**: Phase 2 fixes reduce total failures from 61 to ~20 (all DB-dependent or config-dependent)
- **Long-term**: Integration tests need a CI database setup (follow-up epic — configure Supabase test DB + env vars in CI pipeline)

---

## Appendix A: Complete Test Failure Breakdown

| #   | File                                               | Failures | Classification          | Fix Available?                                   |
| --- | -------------------------------------------------- | -------- | ----------------------- | ------------------------------------------------ |
| 1   | `tests/integration/auth.test.js`                   | 15       | Pre-existing (needs DB) | Defer to CI setup                                |
| 2   | `tests/integration/database.test.js`               | 4        | Pre-existing (needs DB) | Defer to CI setup                                |
| 3   | `infrastructure/cache/NoOpCacheService.test.js`    | 6        | **Fixable test bug**    | ✅ Import fix                                    |
| 4   | `infrastructure/security/hmacManager.test.js`      | 1        | Fixable but tricky      | ⚠️ Config singleton issue (defer)                |
| 5   | `modules/auth/authController.test.js`              | 1        | **Fixable test env**    | ✅ Config mock                                   |
| 6   | `modules/examples/exampleService.test.js`          | 3        | **Fixable test bug**    | ✅ Import + constructor fix                      |
| 7   | `modules/examples/examplesRoute.test.js`           | 1        | **Fixable test env**    | ✅ Config mock                                   |
| 8   | `modules/examples/hskValidator.test.js`            | 1        | **Fixable code bug**    | ✅ Path fix                                      |
| 9   | `modules/gamification/GamificationService.test.js` | 2        | **Fixable test bug**    | ✅ Mock fix                                      |
| 10  | `modules/quiz/progressController.test.js`          | 3        | **Fixable test bug**    | ✅ Mock fix                                      |
|     | **Total**                                          | **61**   |                         | **9 fixable, 19 env/DB, 1 deferred, 31 cascade** |

_Cascade failures_: The `examplesRoute.test.js` failure likely cascades to loading all modules. Similarly, the config validation failure affects any test importing modules that transitively load config. Fixing config mocking in Phase 2 may resolve more than the listed 9 fixable failures.

---

## Appendix B: Test File Paths Quick Reference

| File                           | Absolute Path                                                                 |
| ------------------------------ | ----------------------------------------------------------------------------- |
| NoOpCacheService.test.js       | `apps/backend/src/infrastructure/cache/__tests__/NoOpCacheService.test.js`    |
| hmacManager.test.js            | `apps/backend/src/infrastructure/security/__tests__/hmacManager.test.js`      |
| authController.test.js         | `apps/backend/src/modules/auth/api/authController.test.js`                    |
| exampleService.test.js         | `apps/backend/src/modules/examples/__tests__/exampleService.test.js`          |
| examplesRoute.test.js          | `apps/backend/src/modules/examples/__tests__/examplesRoute.test.js`           |
| hskValidator.test.js           | `apps/backend/src/modules/examples/__tests__/hskValidator.test.js`            |
| GamificationService.test.js    | `apps/backend/src/modules/gamification/__tests__/GamificationService.test.js` |
| progressController.test.js     | `apps/backend/src/modules/quiz/__tests__/api/progressController.test.js`      |
| auth.test.js (integration)     | `apps/backend/tests/integration/auth.test.js`                                 |
| database.test.js (integration) | `apps/backend/tests/integration/database.test.js`                             |
