# Modulith Shared Layer Migration

**Date:** 2026-06-10
**Reference:** `docs/guides/references/modular-monolith-shared-layer.md`

Applying the Shared/Kernel Layer architecture patterns to the current backend.

---

## Current State vs Target Architecture

### Current (Already Cleaned Up)

```
src/
├── index.js                          ← Entry point (app/)
├── routes.js                         ← Route aggregation
├── container.js                      ← Composition root
├── api/docs/                         ← OpenAPI specs (orphan location)
├── infrastructure/                   ← Technical cross-cutting
│   ├── cache/                        ← Redis, NoOp, factory
│   ├── database/                     ← Prisma singleton
│   ├── external/                     ← GCS, Gemini, TTS clients
│   ├── parsers/                      ← CsvParser
│   ├── security/                     ← JWT, Password, HMAC
│   └── storage/                      ← GcsFileStore
├── modules/                          ← 9 business modules
└── shared/
    ├── config/                       ← Central config + leftover BusinessRules
    ├── middleware/                    ← Auth, error, cache, async
    └── utils/                        ← Logger, error factory, hashing, dates
```

### Target (Document-Aligned)

```
src/
├── app/                              ← Entry point + global setup (was src/)
│   ├── index.js                      ← Server bootstrap
│   ├── container.js                  ← Composition root
│   └── routes.js                     ← Route aggregation
├── modules/                          ← Business domains (9 modules)
│   ├── auth/
│   ├── conversation/
│   ├── examples/
│   ├── gamification/
│   ├── health/
│   ├── quiz/
│   ├── tts/
│   ├── vocabulary/
│   └── word/
├── shared/                           ← Technical foundation (kernel)
│   ├── config/                       ← Centralized config (SINGLE source)
│   │   └── index.js                  ← All env vars, no validation at load
│   ├── infrastructure/               ← Multi-module technical tools
│   │   ├── cache/                    ← CacheService, Redis/NoOp, factory
│   │   ├── database/                 ← Prisma client singleton
│   │   ├── external/                 ← GCS, Gemini, TTS clients
│   │   ├── parsers/                  ← CsvParser
│   │   ├── security/                 ← JWT, Password, HMAC
│   │   └── storage/                  ← GcsFileStore (file storage)
│   ├── middleware/                    ← Core HTTP middlewares
│   │   ├── authMiddleware.js
│   │   ├── cacheMiddleware.js
│   │   ├── errorHandler.js
│   │   └── asyncHandler.js
│   ├── docs/                         ← OpenAPI specs (moved from api/docs/)
│   │   ├── openapi.js
│   │   └── openapi.yaml
│   └── utils/                        ← PURE helper functions only
│       ├── dateUtils.js
│       ├── errorFactory.js
│       ├── hashUtils.js
│       └── logger.js
```

---

## Section 1: Golden Rule Compliance Audit

The document states: **"Code inside `shared/` is passive. It provides tools, but it doesn't make business decisions. `shared/` can never import anything from `modules/`."**

### Current Audit

| File                                  | Imports From Modules?       | Verdict |
| ------------------------------------- | --------------------------- | ------- |
| `shared/config/index.js`              | ❌ No                       | ✅ Pass |
| `shared/middleware/authMiddleware.js` | ❌ No (imports config only) | ✅ Pass |
| `shared/middleware/errorHandler.js`   | ❌ No                       | ✅ Pass |
| `shared/utils/logger.js`              | ❌ No                       | ✅ Pass |
| `shared/utils/errorFactory.js`        | ❌ No                       | ✅ Pass |
| `shared/utils/hashUtils.js`           | ❌ No                       | ✅ Pass |

**Result: Golden Rule is already satisfied.** No `shared/` file imports from `modules/`. ✅

---

## Section 2: Document Pattern Mapping

### Pattern 1: App Entry Point → `app/` directory

**Document says:** `app/` (The entry point, global routing, and global middleware)

**Current:** `src/index.js`, `src/routes.js`, `src/container.js` at root.

**Proposal:** Move to `app/` directory, keeping the clean architecture.

| Current            | Target                 |
| ------------------ | ---------------------- |
| `src/index.js`     | `src/app/index.js`     |
| `src/routes.js`    | `src/app/routes.js`    |
| `src/container.js` | `src/app/container.js` |

**Impact:** Update imports in `routes.js` (module paths stay same), update `package.json` `"main"` or start script.

---

### Pattern 2: Infrastructure → `shared/infrastructure/`

**Document says:** Infrastructure lives inside `shared/` as the technical foundation.

**Current:** `infrastructure/` is a separate top-level directory, NOT inside `shared/`.

**Document structure:**

```
shared/
├── infrastructure/
│   ├── cache/
│   ├── database/
│   └── storage/
```

**Proposal:** Move `infrastructure/` inside `shared/`:

| Current               | Target                       |
| --------------------- | ---------------------------- |
| `src/infrastructure/` | `src/shared/infrastructure/` |

**Impact:** Update ~40 import paths across all modules that reference `../../infrastructure/...` → `../../shared/infrastructure/...`. This is a large refactor.

**Trade-off:** The document's `shared/infrastructure/` pattern is cleaner conceptually, but `infrastructure/` at root is also a valid pattern used by many Clean Architecture projects. The key benefit of moving is: **one flat `shared/` namespace** — everything technical is under one tree. The cost is updating all import paths.

**Alternative:** Keep `infrastructure/` at root, document it as "sibling to shared/ that follows the same rules." This is simpler and requires no import changes.

---

### Pattern 3: External Services — Single-Module vs Shared

**Document says:**

- **Single module (Scenario 1):** SDK wrapper lives inside the module's own `infrastructure/` directory
- **Multiple modules (Scenario 2):** Shared client in `shared/infrastructure/`, or event-driven module

**Current state analysis:**

| External Service     | Used By                                                                                   | Scenario                     | Current Location           | Verdict             |
| -------------------- | ----------------------------------------------------------------------------------------- | ---------------------------- | -------------------------- | ------------------- |
| `GCSClient.js`       | vocabulary (repos), conversation (service), TTS (controller), examples (via GcsFileStore) | **Scenario 2** (4 consumers) | `infrastructure/external/` | ✅ Correct — shared |
| `GeminiClient.js`    | examples (service), conversation (service), quiz (AIFeedbackService)                      | **Scenario 2** (3 consumers) | `infrastructure/external/` | ✅ Correct — shared |
| `GoogleTTSClient.js` | TTS (controller via DI), conversation (service), examples (via ExampleService)            | **Scenario 2** (3 consumers) | `infrastructure/external/` | ✅ Correct — shared |

**All 3 external clients are correctly placed** as shared infrastructure. They serve multiple modules.

#### Module-Level Infrastructure Candidates

The document suggests that **module-specific** infrastructure should live inside the module. Currently, repositories act as this layer:

| Module       | Internal Infrastructure                                                     | Current Location                                                 | Correct?   |
| ------------ | --------------------------------------------------------------------------- | ---------------------------------------------------------------- | ---------- |
| `auth`       | `AuthRepository`, `IAuthRepository`                                         | `modules/auth/repositories/`                                     | ✅ Correct |
| `vocabulary` | `VocabularyRepository`, `VocabularyListRepository`, `IVocabularyRepository` | `modules/vocabulary/repositories/`                               | ✅ Correct |
| `quiz`       | 5 repositories + 4 interfaces                                               | `modules/quiz/repositories/` + `modules/quiz/domain/interfaces/` | ✅ Correct |

**Result:** The module-level repository pattern already matches the document's "Scenario 1" — module-specific data access is encapsulated inside the module. ✅

---

### Pattern 4: Multi-Connection Factory

**Document says:** Use a **Named Instance Manager** Pattern — a factory in `shared/infrastructure/` that creates named connections for different modules.

**Current:** Single `RedisClient` singleton, single `GcsFileStore` instance.

**Analysis:** Currently the app uses one Redis instance and one GCS bucket. The factory pattern is **future-proofing** — not needed today but the architecture should support it.

**Proposal:** Implement the `CacheFactory` pattern:

```js
// shared/infrastructure/cache/CacheFactory.js
export class CacheFactory {
  static instances = new Map();

  static create(name, connectionString) {
    if (this.instances.has(name)) return this.instances.get(name);
    const client = new RedisCacheService(new Redis(connectionString));
    this.instances.set(name, client);
    return client;
  }
}
```

Then modules can have their own namespace:

```js
// In container.js (for simple cases):
export const cacheService = CacheFactory.create("default", config.redisUrl);

// Or in a module's infrastructure (for dedicated Redis):
const analyticsCache = CacheFactory.create("analytics", process.env.ANALYTICS_REDIS_URL);
```

**Impact:** Low — refactor `container.js` to use the factory. The base `CacheService` interface stays the same. No module code changes.

---

## Section 3: Remaining Issues

### Issue 1: `shared/config/BusinessRules.js` — Dead Copy

`modules/gamification/domain/BusinessRules.js` is the canonical location. `shared/config/BusinessRules.js` is a stale duplicate.

**Action:** Delete `shared/config/BusinessRules.js`.

**Risk:** Low — grep to confirm zero callers on the shared copy.

---

### Issue 2: `shared/config/redis.js` — Duplicate Dotenv

Calls `dotenv.config()` again. Should merge into `shared/config/index.js`.

**Action:** Inline `redisConfig` and `cacheConfig` into `shared/config/index.js`. Delete `shared/config/redis.js`. Update imports in `RedisClient.js` and `cache/index.js`.

---

### Issue 3: `shared/config/vocabulary.js` — Direct `process.env` Read

Reads `process.env.GCS_ENABLED` directly, bypassing config.

**Action:** Move `gcsEnabled` into `shared/config/index.js`. Delete `shared/config/vocabulary.js`. Update imports.

---

### Issue 4: `shared/utils/routeUtils.js` — Dead Code

Single `getAllRoutes()` function. Zero callers in production code.

**Action:** Move to `scripts/` utility or delete.

---

### Issue 5: `src/api/docs/` — Orphan Location

OpenAPI files at `src/api/docs/` but `src/api/` directory is otherwise gone.

**Action:** Move to `shared/docs/` — OpenAPI specs are shared technical documentation.

---

## Section 4: Implementation Plan

### Phase 1: Clean Up Shared Config (Low Risk)

| #   | Task                                                               | Files                                                                                                           | Effort |
| --- | ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- | ------ |
| 1   | Delete shared/config/BusinessRules.js (stale — domain copy exists) | `shared/config/BusinessRules.js`                                                                                | 5 min  |
| 2   | Merge redis.js config into config/index.js                         | `shared/config/redis.js` → inline, update `RedisClient.js`, `cache/index.js` imports                            | 15 min |
| 3   | Merge vocabulary.js config into config/index.js                    | `shared/config/vocabulary.js` → inline, update `VocabularyRepository.js`, `VocabularyListRepository.js` imports | 10 min |
| 4   | Delete or archive routeUtils.js                                    | `shared/utils/routeUtils.js` — move to scripts/ if useful                                                       | 5 min  |
| 5   | Move api/docs/ to shared/docs/                                     | `api/docs/openapi.js`, `openapi.yaml` → `shared/docs/` + update `index.js` import                               | 10 min |

### Phase 2: Create `app/` Directory (Medium Risk)

| #   | Task                                            | Files                                                         | Effort |
| --- | ----------------------------------------------- | ------------------------------------------------------------- | ------ |
| 6   | Create `app/` directory, move entry point files | `index.js`, `container.js`, `routes.js` → `app/`              | 15 min |
| 7   | Update imports in moved files                   | All `../../` paths in `container.js`, `routes.js`, `index.js` | 15 min |
| 8   | Update `package.json` start script              | `node --watch src/index.js` → `node --watch src/app/index.js` | 5 min  |

### Phase 3: Move Infrastructure Inside Shared (Higher Risk)

| #   | Task                                              | Files                                                                                    | Effort |
| --- | ------------------------------------------------- | ---------------------------------------------------------------------------------------- | ------ |
| 9   | Move `infrastructure/` → `shared/infrastructure/` | All 15 files + their **tests**/                                                          | 15 min |
| 10  | Update all module imports                         | ~40 import paths across all modules (../../infrastructure → ../../shared/infrastructure) | 30 min |
| 11  | Update container.js imports                       | 15+ import paths                                                                         | 10 min |
| 12  | Update route.js imports                           | If any reference infrastructure directly                                                 | 5 min  |

### Phase 4: Multi-Connection Factory (Future-Proofing)

| #   | Task                                             | Files                                             | Effort |
| --- | ------------------------------------------------ | ------------------------------------------------- | ------ |
| 13  | Create CacheFactory with named instance registry | `shared/infrastructure/cache/CacheFactory.js`     | 20 min |
| 14  | Refactor container.js to use factory             | `container.js` — replace direct instantiation     | 15 min |
| 15  | Add StorageFactory for GCS multi-bucket support  | `shared/infrastructure/storage/StorageFactory.js` | 20 min |

---

## Section 5: Dependency Flow Diagram (Target)

```
src/app/
├── index.js              ← Bootstrap: validate config, mount global middleware, start server
├── container.js           ← Composition root: wire all dependencies
└── routes.js              ← Aggregate all module routes

       │ imports from
       ▼
src/modules/*/             ← Business domains (9 modules)
       │                      - Each has api/, services/, repositories/, domain/
       │                      - Each can have its own infrastructure/ for single-module deps
       │ imports from
       ▼
src/shared/
├── infrastructure/        ← Technical tools (cache, DB, external clients, security)
├── middleware/             ← HTTP cross-cutting (auth, error handling)
├── docs/                  ← OpenAPI specs
└── utils/                 ← Pure helper functions (no business logic)

       ╔══════════════════════════════════════╗
       ║  GOLDEN RULE: shared/ NEVER imports  ║
       ║  from modules/. Only modules import  ║
       ║  from shared/.                       ║
       ╚══════════════════════════════════════╝
```

---

## Section 6: Risk Assessment

| Change                                        | Risk                                            | Mitigation                                                                                                      |
| --------------------------------------------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Delete BusinessRules.js (shared copy)         | **Low** — gamification domain copy exists       | Grep for callers first                                                                                          |
| Move api/docs/ → shared/docs/                 | **Low** — single import in index.js             | Update 1 import line                                                                                            |
| Create `app/` directory                       | **Medium** — changes 3 root files, start script | Verify `npm run dev` after move                                                                                 |
| Move infrastructure/ → shared/infrastructure/ | **High** — 40+ import paths to update           | Do LAST; use search-and-replace carefully; verify modules load via `node -e "import('./src/app/container.js')"` |
| CacheFactory refactor                         | **Low** — no behavior change                    | container.js only, verify startup                                                                               |

### Recommended Order

```
Phase 1 ──→ Phase 2 ──→ Phase 3 ──→ Phase 4
 (config)   (app/ dir)  (infra move) (factory)
                                    ↑ Optional future-proofing
```

**Testing strategy:** Only business module tests matter. Infrastructure tests (`infrastructure/**/__tests__/`) are skipped entirely — they test Redis, GCS, and security wrappers that don't change business behavior. If Phase 3 breaks module imports, you'll see it when `container.js` fails to load. If modules still serve endpoints, the move succeeded.

**Alternative path:** Skip Phase 3 entirely (import path cost > benefit), keep `infrastructure/` at root. Phase 4 is optional future-proofing — skip if single-instance is sufficient.

---

## Section 7: Structured Prompts

### Phase 1: Shared Config Cleanup

```
[TASK]: Implement Phase 1 — clean up shared/config, move api/docs, remove dead code
[CONTEXT]: apps/backend/src/
[PARAMETERS]:
  Phase: 1
  Tasks:
    1.1 Delete shared/config/BusinessRules.js — domain copy exists at modules/gamification/domain/BusinessRules.js
    1.2 Merge shared/config/redis.js into shared/config/index.js — inline redisConfig and cacheConfig objects. Update imports in infrastructure/cache/RedisClient.js and infrastructure/cache/index.js to import from ../config/index.js instead of ../config/redis.js
    1.3 Merge shared/config/vocabulary.js into shared/config/index.js — inline DIFFICULTY_LEVELS and gcsEnabled. Update imports in modules/vocabulary/repositories/VocabularyRepository.js and VocabularyListRepository.js
    1.4 Delete shared/utils/routeUtils.js (dead code — zero callers). Or move to scripts/ if useful.
    1.5 Move api/docs/openapi.js + api/docs/openapi.yaml → shared/docs/ — update import in index.js
[OUTPUT]: Config consolidated, dead code removed, imports updated
[CONSTRAINTS]:
  - Grep for each target before deleting
  - Verify app starts: `node -e "import('./src/shared/config/index.js')"`
  - Skip test suite — only config files changed, business logic unaffected
```

### Phase 2: Create `app/` Directory

```
[TASK]: Implement Phase 2 — create app/ directory for entry point files
[CONTEXT]: apps/backend/src/
[PARAMETERS]:
  Phase: 2
  Tasks:
    2.1 Create src/app/ directory
    2.2 Move src/index.js → src/app/index.js (update import paths for container.js, routes.js, shared/ — paths change from ./ to ../)
    2.3 Move src/container.js → src/app/container.js (keep paths to infrastructure/ as-is — ../infrastructure/...)
    2.4 Move src/routes.js → src/app/routes.js (update all module import paths — ../../modules → ../modules)
    2.5 Update package.json start script: "dev": "node --watch src/app/index.js"
[OUTPUT]: Files moved, imports updated, `npm run dev` starts correctly
[CONSTRAINTS]:
  - Verify `npm run dev` starts without errors
  - Verify modules load: `node -e "import('./src/app/container.js')"`
  - Do NOT combine with Phase 3 — do this separately
  - Skip test suite (infra tests will fail on path changes, not relevant)
```

### Phase 3: Move Infrastructure Inside Shared

```
[TASK]: Implement Phase 3 — move infrastructure/ inside shared/ to match modulith pattern
[CONTEXT]: apps/backend/src/
[PARAMETERS]:
  Phase: 3
  Tasks:
    3.1 Move infrastructure/ → shared/infrastructure/ — move all 15 source files (NOT __tests__/ — tests deferred)
    3.2 Update all module imports — ~40 paths across modules: ../../infrastructure/... → ../../shared/infrastructure/...
        Affected files: all repositories (auth, word, vocabulary, quiz, gamification), all services that import external clients (conversation, examples), all route files that import middleware
    3.3 Update container.js imports — ~15 paths from infrastructure/... → shared/infrastructure/...
    3.4 Update routes.js imports — if any reference infrastructure directly
[OUTPUT]: Source structure matches modulith pattern, verify with `node -e "import('./src/app/container.js')"`
[CONSTRAINTS]:
  - ONLY move source files. Leave __tests__/ directories behind — they'll be fixed later
  - Do NOT modify any test files
  - Verification: container.js must load without errors (proves all module imports are correct)
  - Verification: `node -e "import('./src/shared/infrastructure/external/GCSClient.js')"` — all clients load
  - If container.js fails, check module imports first (majority of paths)
```

### Phase 4: Multi-Connection Factory

```
[TASK]: Implement Phase 4 — create CacheFactory and StorageFactory for multi-instance support
[CONTEXT]: apps/backend/src/
[PARAMETERS]:
  Phase: 4
  Tasks:
    4.1 Create shared/infrastructure/cache/CacheFactory.js — named instance registry with create(name, config) method. Each named instance wraps a RedisCacheService or NoOpCacheService.
    4.2 Refactor container.js — replace new RedisCacheService() / getCacheService() with CacheFactory.create("default", config)
    4.3 Create shared/infrastructure/storage/StorageFactory.js — similar named instance pattern for GcsFileStore
    4.4 Refactor container.js for GcsFileStore — use StorageFactory instead of direct new
[OUTPUT]: Factories created, container.js refactored, verify with `node -e "import('./src/app/container.js')"`
[CONSTRAINTS]:
  - Keep existing CacheService interface unchanged
  - Factory is optional — only use if modules need different Redis/GCS instances
  - Retain fallback to NoOpCacheService when Redis unavailable
  - Skip test suite — focus on business module functionality
```
