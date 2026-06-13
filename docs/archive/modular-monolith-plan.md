# Backend Modular Monolith Plan

**Date:** June 10, 2026
**Status:** Draft
**Audience:** Backend developers

> Solves: unclear boundaries, inconsistent patterns, scattered files, testing debt, caching architecture, config/env sprawl.

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Target Architecture](#2-target-architecture)
3. [Module Design](#3-module-design)
4. [Cross-Cutting Concerns](#4-cross-cutting-concerns)
5. [Module Communication Rules](#5-module-communication-rules)
6. [Migration Phases](#6-migration-phases)

---

## 1. Problem Statement

The current backend has these structural issues:

| #   | Issue                                                                             | Root Cause                                                     |
| --- | --------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| 1   | Clean Architecture violations (`ExampleService` imports 4 infrastructure modules) | Single `core/services/` layer forces everything together       |
| 2   | Unclear boundaries between WordModule vs VocabularyModule                         | All services in one flat directory - no module encapsulation   |
| 3   | Caching creates extra services instead of middleware                              | No caching abstraction - `Cached*Service` wrappers per service |
| 4   | External vs Infrastructure ambiguity                                              | `infrastructure/external/` and `infrastructure/cache/` overlap |
| 5   | Config/env vars read directly in random files                                     | No enforcement of centralized config access                    |
| 6   | Tests scattered across 3 directory structures                                     | No per-module test co-location                                 |

### Solution: Modular Monolith

Each module is a self-contained directory with its own architectural pattern, public API, and tests. Modules communicate through explicit public interfaces only. Cross-cutting concerns (cache, config, security) live in shared infrastructure.

```
src/modules/
├── auth/          (Simple CRUD - just a database table)
├── word/          (Simple CRUD - word data)
├── vocabulary/    (Feature Slices - lists, categories, browsing)
├── quiz/          (Clean Architecture - complex business rules, SRS)
├── gamification/  (Simple CRUD - badges, streaks)
├── examples/      (Feature Slices - examples + audio generation)
└── conversation/  (Simple CRUD - deprecated, minimal maintenance)
```

As long as `quiz` only talks to `word` via its public interface (`modules/word/index.js`), `quiz` doesn't care that `word` is written as Simple CRUD while `quiz` uses Clean Architecture. This gives freedom to use the right tool for each job.

---

## 2. Target Architecture

### Directory Structure

```
apps/backend/src/
├── index.js                        # Entry point
├── container.js                    # Composition root
│
├── modules/                        # Business logic - each module is independent
│   ├── auth/
│   │   ├── api/
│   │   │   ├── AuthController.js
│   │   │   └── authRoutes.js
│   │   ├── domain/
│   │   │   └── User.js
│   │   ├── services/
│   │   │   └── AuthService.js
│   │   ├── repositories/
│   │   │   └── AuthRepository.js
│   │   ├── __tests__/
│   │   │   ├── AuthService.test.js
│   │   │   └── authController.test.js
│   │   └── index.js                # Public API - only what other modules can import
│   │
│   ├── word/                       (Simple CRUD)
│   │   ├── api/
│   │   │   ├── WordController.js
│   │   │   └── wordRoutes.js
│   │   ├── domain/
│   │   │   └── Word.js
│   │   ├── services/
│   │   │   └── WordService.js
│   │   ├── repositories/
│   │   │   └── WordRepository.js
│   │   ├── __tests__/
│   │   └── index.js
│   │
│   ├── vocabulary/                 (Feature Slices - ALL word-related UI concerns)
│   │   ├── api/
│   │   │   ├── VocabularyController.js
│   │   │   └── vocabularyRoutes.js
│   │   ├── services/
│   │   │   ├── VocabularyListService.js
│   │   │   └── VocabularyService.js  (legacy compatibility)
│   │   ├── repositories/
│   │   │   ├── VocabularyListRepository.js
│   │   │   └── VocabularyRepository.js  (legacy compatibility)
│   │   ├── __tests__/
│   │   └── index.js
│   │
│   ├── quiz/                       (Clean Architecture - complex business rules)
│   │   ├── api/
│   │   │   ├── QuizSessionController.js
│   │   │   ├── LearningController.js
│   │   │   ├── ProgressController.js
│   │   │   ├── quizSessionRoutes.js
│   │   │   ├── learningRoutes.js
│   │   │   └── progressRoutes.js
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   │   ├── QuizSession.js
│   │   │   │   ├── Question.js
│   │   │   │   ├── Progress.js
│   │   │   │   └── StudyStreak.js
│   │   │   └── interfaces/
│   │   │       ├── IQuizSessionRepository.js
│   │   │       ├── IProgressRepository.js
│   │   │       └── IStudyStreakRepository.js
│   │   ├── use-cases/
│   │   │   ├── QuizSessionOrchestrator.js
│   │   │   ├── AnswerRecordingService.js
│   │   │   ├── SummaryService.js
│   │   │   ├── LearningService.js  (SRS logic)
│   │   │   ├── ProgressService.js
│   │   │   └── StreakService.js
│   │   ├── repositories/
│   │   │   ├── QuizSessionRepository.js
│   │   │   ├── QuizSessionAnswerRepository.js
│   │   │   ├── QuizSessionSummaryRepository.js
│   │   │   ├── ProgressRepository.js
│   │   │   └── StreakRepository.js
│   │   ├── __tests__/
│   │   │   ├── use-cases/
│   │   │   │   ├── QuizSessionOrchestrator.test.js
│   │   │   │   └── AnswerRecordingService.test.js
│   │   │   └── api/
│   │   │       ├── QuizSessionController.test.js
│   │   │       └── progressController.test.js
│   │   └── index.js
│   │
│   ├── gamification/               (Simple CRUD)
│   │   ├── api/
│   │   │   ├── GamificationController.js
│   │   │   └── gamificationRoutes.js
│   │   ├── services/
│   │   │   └── GamificationService.js
│   │   ├── repositories/
│   │   │   └── BadgeRepository.js
│   │   ├── __tests__/
│   │   └── index.js
│   │
│   ├── examples/                   (Feature Slices)
│   │   ├── api/
│   │   │   ├── ExamplesController.js
│   │   │   └── examplesRoutes.js
│   │   ├── services/
│   │   │   ├── ExampleService.js
│   │   │   └── CachedExampleService.js
│   │   ├── __tests__/
│   │   └── index.js
│   │
│   └── conversation/               (Simple CRUD, deprecated)
│       ├── api/
│       ├── services/
│       │   ├── ConversationService.js
│       │   └── CachedConversationService.js
│       ├── __tests__/
│       └── index.js
│
├── infrastructure/                 # Shared infrastructure - NO business logic
│   ├── cache/
│   │   ├── CacheService.js         # Abstract base
│   │   ├── RedisCacheService.js
│   │   ├── NoOpCacheService.js
│   │   ├── GcsCacheService.js
│   │   ├── RedisClient.js
│   │   ├── RedisLockManager.js
│   │   └── index.js               # Factory
│   ├── external/
│   │   ├── GeminiClient.js
│   │   ├── GCSClient.js
│   │   └── GoogleTTSClient.js
│   ├── database/
│   │   └── client.js              # Prisma
│   └── security/
│       ├── JwtService.js
│       ├── PasswordService.js
│       └── HmacManager.js
│
├── shared/                         # Shared cross-cutting code
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   ├── errorHandler.js
│   │   ├── asyncHandler.js
│   │   ├── cacheMetrics.js
│   │   └── index.js
│   ├── config/
│   │   ├── index.js               # All env vars centralized
│   │   ├── redis.js
│   │   └── vocabulary.js
│   └── utils/
│       ├── logger.js
│       ├── errorFactory.js
│       ├── dateUtils.js
│       ├── hskValidator.js
│       ├── inputSanitizer.js
│       ├── promptUtils.js
│       ├── conversationUtils.js
│       ├── hashUtils.js
│       ├── routeUtils.js
│       └── CacheMetrics.js
│
└── container.js                    # Composition root - wires everything
```

### Architecture Per Module

| Module         | Pattern            | Why                                                                           |
| -------------- | ------------------ | ----------------------------------------------------------------------------- |
| `auth`         | Simple CRUD        | Login/register/sessions - basic DB operations, no complex rules               |
| `word`         | Simple CRUD        | Word data (CRUD + search) - pure data operations                              |
| `vocabulary`   | Feature Slices     | Lists, categories, browsing - UI-driven features, mixed concerns              |
| `quiz`         | Clean Architecture | SRS scheduling, progress tracking, session lifecycle - complex business rules |
| `gamification` | Simple CRUD        | Badges, streaks - simple data lookups                                         |
| `examples`     | Feature Slices     | Gemini prompting + GCS caching + audio - mixed external concerns              |
| `conversation` | Simple CRUD        | Deprecated, minimal maintenance                                               |

---

## 3. Module Design

### 3.1 Module Template (Simple CRUD)

```
module/
├── api/
│   ├── XxxController.js           # Express handlers
│   └── xxxRoutes.js               # Route definitions
├── services/
│   └── XxxService.js              # Business logic
├── repositories/
│   └── XxxRepository.js           # Prisma data access
├── __tests__/
│   ├── XxxService.test.js
│   └── XxxController.test.js
└── index.js                       # Public exports
```

### 3.2 Module Template (Clean Architecture)

```
module/
├── api/
│   ├── XxxController.js
│   └── xxxRoutes.js
├── domain/
│   ├── entities/                  # Business entities
│   └── interfaces/                # Repository contracts
├── use-cases/                     # Application business rules
├── repositories/                  # Interface implementations
├── __tests__/
│   ├── use-cases/
│   └── api/
└── index.js                       # Public exports
```

### 3.3 Module Template (Feature Slices)

```
module/
├── api/
├── services/
├── repositories/
├── __tests__/
└── index.js
```

### 3.4 Public API Contract (`index.js`)

Each module's `index.js` explicitly exports only what other modules can import. Nothing else is accessible.

```javascript
// modules/word/index.js
export { WordService } from "./services/WordService.js";
export { Word } from "./domain/Word.js";

// NOT exported: WordRepository, WordController, wordRoutes, internal helpers
```

```javascript
// modules/quiz/index.js
export { QuizSessionService } from "./use-cases/QuizSessionOrchestrator.js";
export { ProgressService } from "./use-cases/ProgressService.js";

// NOT exported: repositories, controllers, entities
```

### 3.5 Module Dependency Rules

```
Modules can ONLY import from:
  - Their own internals (any file within the module)
  - Other modules' `index.js` (public API)
  - `shared/` (middleware, config, utils)
  - `infrastructure/` (cache, external, database, security)

Modules CANNOT import from:
  - Other modules' internal files (bypassing index.js)
  - Direct process.env reads (must go through shared/config)
  - Infrastructure module internals directly (go through index.js)

Cross-module dependency graph:
  word (zero deps)
    <- vocabulary (depends on word)
    <- quiz (depends on word)
    <- examples (depends on word)
  auth (zero deps)
    <- gamification (depends on auth - userId)
  quiz (depends on word)
    <- gamification (depends on quiz - progress/streaks)
```

---

## 4. Cross-Cutting Concerns

### 4.1 Caching — Middleware + Optional Layer

Instead of `Cached*Service` wrappers scattered in `core/services/`, caching becomes a **middleware layer** or **optional decorator** that modules opt into.

**Target approach:**

```javascript
// shared/middleware/cacheMiddleware.js
export function withCache(serviceMethod, { ttl, keyFn }) {
  return async (...args) => {
    const cache = getCacheService();
    const key = keyFn(...args);
    const cached = await cache.get(key);
    if (cached) return cached;
    const result = await serviceMethod(...args);
    await cache.set(key, result, ttl);
    return result;
  };
}

// Usage in container.js:
import { withCache } from "./shared/middleware/cacheMiddleware.js";
const quizService = new QuizSessionService(/* deps */);
export const cachedQuizService = {
  createSession: withCache(quizService.createSession.bind(quizService), {
    ttl: TTL_QUIZ_SESSION,
    keyFn: (userId) => `quiz:session:${userId}`,
  }),
};
```

This eliminates the 4 `Cached*Service` wrappers and makes caching a transparent infrastructure concern.

### 4.2 Config — Single Source of Truth

All environment variables are read ONLY in `shared/config/index.js`. Every other file imports config:

```javascript
// shared/config/index.js
export const config = {
  jwtSecret: validatedEnv("JWT_SECRET"),
  jwtRefreshSecret: validatedEnv("JWT_REFRESH_SECRET"),
  nodeEnv: process.env.NODE_ENV || "development",
  // ... all env vars, validated at startup
};

function validatedEnv(name) {
  const val = process.env[name];
  if (!val) throw new Error(`[Config] ${name} is required but not set`);
  return val;
}
```

Files that currently read `process.env` directly must be updated:

- `api/middleware/authMiddleware.js` → import `config.jwtSecret` instead of `process.env.JWT_SECRET`
- `api/controllers/AuthController.js` → import `config.nodeEnv` instead of `process.env.NODE_ENV`
- `utils/logger.js` → import `config.enableDetailedLogs` instead of `process.env.ENABLE_DETAILED_LOGS`
- `infrastructure/security/HmacManager.js` → import HMAC keys from config

### 4.3 Testing — Co-located by Module

```
src/
└── modules/
    └── quiz/
        ├── __tests__/
        │   ├── use-cases/
        │   │   ├── QuizSessionOrchestrator.test.js
        │   │   └── AnswerRecordingService.test.js
        │   └── api/
        │       └── QuizSessionController.test.js
        ├── use-cases/
        │   └── QuizSessionOrchestrator.js
        └── api/
            └── QuizSessionController.js
```

Integration tests stay at `tests/integration/`. Co-located unit tests use `.test.js` naming.

### 4.4 Dependency Injection — Container per Module

`container.js` wires all modules together. Each module can optionally have its own internal container (or factory function) if it has complex DI needs (like `quiz` module).

```javascript
// container.js
import { createWordModule } from "./modules/word/index.js";
import { createQuizModule } from "./modules/quiz/index.js";
import { createAuthModule } from "./modules/auth/index.js";

const wordModule = createWordModule({ db: prisma });
const quizModule = createQuizModule({
  wordService: wordModule.wordService,
  // QuizModule doesn't know or care that WordModule uses Simple CRUD
});
```

---

## 5. Module Communication Rules

### 5.1 Direct Import (In-Process)

Since this is a monolith (not microservices), modules communicate via direct function calls through public `index.js` exports:

```
quiz/use-cases/ProgressService.js
  → imports { WordService } from "../../word/index.js"   ✅ allowed
  → imports { Word } from "../../word/domain/Word.js"     ❌ not allowed (internal)
```

### 5.2 No Circular Dependencies

```
Allowed:   word → vocabulary → quiz
Forbidden: quiz → vocabulary → word → quiz
```

The dependency graph must remain a DAG (directed acyclic graph). Enforced via:

- `word` has zero dependencies
- `auth` has zero dependencies
- All other modules depend only on `word` and/or `auth`

### 5.3 Shared Infrastructure

Modules never instantiate their own cache, database, or external clients. They receive them via DI in `container.js`:

```javascript
// CORRECT:
const wordRepo = new WordRepository(prisma);
// OR: wordRepo is injected into services via constructor

// WRONG:
const cache = new RedisCacheService(); // inside a module
const gemini = await import("../../infrastructure/external/GeminiClient.js"); // direct import
```

---

## 6. Migration Phases

### Verification Gates (All Phases)

Every phase must pass these gates before the next phase begins:

| Gate | Check                            | Command                                                                        |
| ---- | -------------------------------- | ------------------------------------------------------------------------------ |
| G1   | No compile/syntax errors         | `node --check src/index.js` or full app boot                                   |
| G2   | Module public API correct        | Verify `modules/<name>/index.js` exports                                       |
| G3   | No cross-module internal imports | `grep -rn "from \"\.\.[a-z]/" src/modules/*/services/` — zero results          |
| G4   | No direct process.env in modules | `grep -rn "process\.env" src/modules/` — zero results (only in shared/config/) |
| G5   | Import paths valid               | `npm test` passes OR at minimum: no runtime import errors                      |

### Test Migration Rule

During module moves:

- **Move** test files to the new `__tests__/` location with updated import paths
- **Defer** test content changes (new assertions, refactored mocks) to a follow-up phase
- **Minimum requirement:** no compile/syntax errors in moved test files
- Integration tests remain in `tests/integration/` and can be updated later

---

## PHASE 0 — Foundation

### Story 0.1 — Create Target Directory Structure

| Step  | Action                              | Details                                                                                 |
| ----- | ----------------------------------- | --------------------------------------------------------------------------------------- |
| 0.1.1 | Create `src/modules/` directory     | With subdirectories: auth, word, vocabulary, quiz, gamification, examples, conversation |
| 0.1.2 | Create `src/shared/` directory      | With subdirectories: middleware, config, utils                                          |
| 0.1.3 | Move `src/shared/config/` files     | Move config/index.js, redis.js, vocabulary.js from src/config/                          |
| 0.1.4 | Move `src/shared/utils/` files      | Move all 10 files from src/utils/                                                       |
| 0.1.5 | Move `src/shared/middleware/` files | Move all 5 files from src/api/middleware/                                               |
| 0.1.6 | Update all import paths             | Point to new shared/ locations                                                          |

### Story 0.2 — Centralize Config Access

| Step  | Action                                | Details                                                     |
| ----- | ------------------------------------- | ----------------------------------------------------------- |
| 0.2.1 | Add `validatedEnv()` helper           | In shared/config/index.js - throws on missing required vars |
| 0.2.2 | Add JWT_REFRESH_SECRET validation     | Currently missing                                           |
| 0.2.3 | Update authMiddleware.js              | Import config instead of process.env.JWT_SECRET             |
| 0.2.4 | Update AuthController.js              | Import config.nodeEnv instead of process.env.NODE_ENV       |
| 0.2.5 | Update logger.js                      | Import config.enableDetailedLogs instead of process.env     |
| 0.2.6 | Update HmacManager.js                 | Import HMAC keys from config (currently undocumented)       |
| 0.2.7 | Add EXAMPLES_CACHE_HMAC_KEY to config | Currently undocumented env vars                             |

### Story 0.3 — Fix Clean Architecture Violations

| Step  | Action                                | Details                                                                                                 |
| ----- | ------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| 0.3.1 | Refactor ExampleService.js            | Accept GcsCacheService and GeminiClient via constructor DI. Remove direct imports from infrastructure/. |
| 0.3.2 | Fix healthRoutes.js                   | Create HealthController in container.js, import from there instead of inline                            |
| 0.3.3 | Add IAIClient usage to ExampleService | Use interface instead of directly calling GeminiClient                                                  |
| 0.3.4 | Update container.js                   | Wire all dependencies for the refactored ExampleService                                                 |

---

## PHASE 1 — Simple CRUD Modules (auth, word, gamification)

### Story 1.1 — Move Auth Module

| Step  | Action                                | Details                                                       |
| ----- | ------------------------------------- | ------------------------------------------------------------- |
| 1.1.1 | Create `modules/auth/` structure      | api/, services/, repositories/, domain/, **tests**/, index.js |
| 1.1.2 | Move AuthController.js, authRoutes.js | Into modules/auth/api/                                        |
| 1.1.3 | Move AuthService.js                   | Into modules/auth/services/                                   |
| 1.1.4 | Move AuthRepository.js                | Into modules/auth/repositories/                               |
| 1.1.5 | Move User.js entity                   | Into modules/auth/domain/                                     |
| 1.1.6 | Create modules/auth/index.js          | Export AuthService (public API)                               |
| 1.1.7 | Move related tests                    | authController.test.js, AuthService.test.js                   |
| 1.1.8 | Update container.js                   | Import from modules/auth/index.js                             |

### Story 1.2 — Move Word Module

| Step  | Action                                     | Details                                                       |
| ----- | ------------------------------------------ | ------------------------------------------------------------- |
| 1.2.1 | Create `modules/word/` structure           | api/, services/, repositories/, domain/, **tests**/, index.js |
| 1.2.2 | Move WordController.js, wordRoutes.js      | Into modules/word/api/                                        |
| 1.2.3 | Move WordService.js                        | Into modules/word/services/                                   |
| 1.2.4 | Move WordRepository.js, IWordRepository.js | Into modules/word/repositories/                               |
| 1.2.5 | Move Word.js entity                        | Into modules/word/domain/                                     |
| 1.2.6 | Create modules/word/index.js               | Export WordService, Word entity                               |
| 1.2.7 | Move WordService.test.js                   | Into modules/word/**tests**/                                  |
| 1.2.8 | Update container.js + routes/index.js      | Import from modules/word/index.js                             |

### Story 1.3 — Move Gamification Module

| Step  | Action                                                | Details                                                     |
| ----- | ----------------------------------------------------- | ----------------------------------------------------------- |
| 1.3.1 | Create `modules/gamification/` structure              | api/, services/, repositories/, **tests**/, index.js        |
| 1.3.2 | Move GamificationController.js, gamificationRoutes.js | Into modules/gamification/api/                              |
| 1.3.3 | Move GamificationService.js                           | Into modules/gamification/services/                         |
| 1.3.4 | Move BadgeRepository.js                               | Into modules/gamification/repositories/                     |
| 1.3.5 | Create index.js                                       | Export GamificationService                                  |
| 1.3.6 | Move tests                                            | GamificationService.test.js, GamificationController.test.js |

---

## PHASE 2 — Feature Slice Modules (vocabulary, examples)

### Story 2.1 — Move Vocabulary Module

| Step  | Action                                                    | Details                                                                                |
| ----- | --------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| 2.1.1 | Create `modules/vocabulary/` structure                    | api/, services/, repositories/, **tests**/, index.js                                   |
| 2.1.2 | Move VocabularyController.js, vocabularyRoutes.js         | Into modules/vocabulary/api/                                                           |
| 2.1.3 | Move VocabularyListService.js, VocabularyService.js       | Into modules/vocabulary/services/                                                      |
| 2.1.4 | Move VocabularyListRepository.js, VocabularyRepository.js | Into modules/vocabulary/repositories/                                                  |
| 2.1.5 | Move IVocabularyRepository.js                             | Into modules/vocabulary/repositories/                                                  |
| 2.1.6 | Create index.js                                           | Export VocabularyListService                                                           |
| 2.1.7 | Move tests                                                | VocabularyService.test.js, VocabularyListService.test.js, vocabularyController.test.js |

### Story 2.2 — Move Examples Module

| Step  | Action                                          | Details                                                             |
| ----- | ----------------------------------------------- | ------------------------------------------------------------------- |
| 2.2.1 | Create `modules/examples/` structure            | api/, services/, **tests**/, index.js                               |
| 2.2.2 | Move ExamplesController, examplesRoutes.js      | Create ExamplesController from current controller + routes          |
| 2.2.3 | Move ExampleService.js, CachedExampleService.js | Into modules/examples/services/                                     |
| 2.2.4 | Move hskValidator.js, inputSanitizer.js         | Into modules/examples/services/ (domain-specific validators)        |
| 2.2.5 | Create index.js                                 | Export ExampleService                                               |
| 2.2.6 | Move tests                                      | exampleService.test.js, examplesRoute.test.js, hskValidator.test.js |

---

## PHASE 3 — Clean Architecture Module (quiz)

### Story 3.1 — Create Quiz Module Structure

| Step  | Action                                | Details                                                                                                                                                                    |
| ----- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 3.1.1 | Create `modules/quiz/` with CA layers | api/, domain/entities/, domain/interfaces/, use-cases/, repositories/, **tests**/                                                                                          |
| 3.1.2 | Move entities                         | QuizSession.js, Question.js, Progress.js, StudyStreak.js into domain/entities/                                                                                             |
| 3.1.3 | Move interfaces                       | IQuizSessionRepository.js, IQuizSessionAnswerRepository.js, IQuizSessionSummaryRepository.js, IProgressRepository.js into domain/interfaces/                               |
| 3.1.4 | Move use-cases                        | QuizSessionService.js → QuizSessionOrchestrator.js, AnswerRecordingService.js, SummaryService.js, LearningService.js, ProgressService.js, StreakService.js into use-cases/ |
| 3.1.5 | Move repositories                     | QuizSessionRepository.js, QuizSessionAnswerRepository.js, QuizSessionSummaryRepository.js, ProgressRepository.js, StreakRepository.js into repositories/                   |
| 3.1.6 | Move controllers + routes             | QuizSessionController.js, LearningController.js, ProgressController.js + routes                                                                                            |
| 3.1.7 | Create index.js                       | Export QuizSessionOrchestrator, ProgressService                                                                                                                            |

### Story 3.2 — Organize Quiz Tests

| Step  | Action                      | Details                                                                           |
| ----- | --------------------------- | --------------------------------------------------------------------------------- |
| 3.2.1 | Create **tests**/use-cases/ | Move QuizSessionService.test.js, ProgressService.test.js, LearningService.test.js |
| 3.2.2 | Create **tests**/api/       | Move progressController.test.js, quizSessionController tests                      |
| 3.2.3 | Verify test imports         | Update paths to match new module structure                                        |

---

## PHASE 4 — Conversation Module (deprecated)

### Story 4.1 — Move Conversation Module

| Step  | Action                                                    | Details                               |
| ----- | --------------------------------------------------------- | ------------------------------------- |
| 4.1.1 | Create `modules/conversation/` structure                  | api/, services/, **tests**/, index.js |
| 4.1.2 | Move ConversationController, conversationRoutes           | Into modules/conversation/api/        |
| 4.1.3 | Move ConversationService.js, CachedConversationService.js | Into modules/conversation/services/   |
| 4.1.4 | Create index.js                                           | Export ConversationService            |
| 4.1.5 | Move tests                                                | CachedConversationService.test.js     |
| 4.1.6 | Mark module as deprecated                                 | Add deprecation notice in index.js    |

---

## PHASE 5 — Caching Middleware + Consistency

### Story 5.1 — Create Cache Middleware

| Step  | Action                                        | Details                                |
| ----- | --------------------------------------------- | -------------------------------------- |
| 5.1.1 | Create `shared/middleware/cacheMiddleware.js` | withCache() decorator function         |
| 5.1.2 | Refactor CachedAIFeedbackService              | Replace with cacheMiddleware decorator |
| 5.1.3 | Refactor CachedConversationService            | Replace with cacheMiddleware decorator |
| 5.1.4 | Refactor CachedTTSService                     | Replace with cacheMiddleware decorator |
| 5.1.5 | Refactor CachedExampleService                 | Replace with cacheMiddleware decorator |
| 5.1.6 | Delete all 4 Cached\*Service.js files         | No longer needed                       |

### Story 5.2 — Move CacheMetrics

| Step  | Action               | Details                                                    |
| ----- | -------------------- | ---------------------------------------------------------- |
| 5.2.1 | Move CacheMetrics.js | From utils/ to shared/middleware/ or infrastructure/cache/ |
| 5.2.2 | Update import paths  | In cacheMetrics.js middleware and any consumers            |

---

## PHASE 6 — Verification & Cleanup

### Story 6.1 — Verify Module Structure

| Step  | Action                                  | Details                                                            |
| ----- | --------------------------------------- | ------------------------------------------------------------------ |
| 6.1.1 | Verify no dead files in old locations   | Old src/services/, src/utils/, src/api/middleware/ should be empty |
| 6.1.2 | Verify module index.js exports          | Each module's public API is correct                                |
| 6.1.3 | Verify no cross-module internal imports | No module imports another module's internal files                  |
| 6.1.4 | Verify no direct process.env reads      | grep for process\.env across modules/ - should be zero             |

### Story 6.2 — Test Suite

| Step  | Action                                 | Details                                                   |
| ----- | -------------------------------------- | --------------------------------------------------------- |
| 6.2.1 | Run full test suite                    | npm test must pass                                        |
| 6.2.2 | Check test co-location                 | All unit tests should be in module **tests**/ directories |
| 6.2.3 | Move remaining integration-level tests | Keep in tests/integration/, update import paths           |

### Dependency Graph

```
Phase 0: Foundation (structural + config + CA violations)
  +-- Phase 1: Simple CRUD modules (auth, word, gamification)
  |     +-- Phase 2: Feature Slice modules (vocabulary, examples)
  |     |     +-- Phase 3: Clean Architecture (quiz)
  |     |     |     +-- Phase 4: Conversation (deprecated)
  |     |     |           +-- Phase 5: Caching middleware
  |     |     |                 +-- Phase 6: Verify
  |     |     +-- Phase 5 can run in parallel
  |     +-- Phase 2, 3, 4 can run in parallel
  +-- Phase 1, 2, 3, 4 depend on Phase 0
```

Phases 1-4 can run in parallel (different modules, independent moves).
Phase 5 (caching middleware) can run in parallel with Phases 2-4.
Phase 6 (verification) depends on all previous phases.
