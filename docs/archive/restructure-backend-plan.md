# Backend Restructure Plan

**Date:** June 8, 2026
**Status:** Draft for review
**Audience:** Backend developers

This document covers the backend module restructure. For the full FE↔BE alignment and frontend plan, see [restructure-plan.md](./restructure-plan.md).

---

## Table of Contents

1. [Current State](#1-current-state)
2. [Target Module Structure](#2-target-module-structure)
3. [Repository Pattern Assessment](#3-repository-pattern-assessment)
4. [Migration Phases](#4-migration-phases)

---

## 1. Current State

### 1.1 Current Backend Module Boundaries

```
apps/backend/src/
+-- api/controllers/      10 controllers (1 per route group)
+-- api/routes/           12 route files (including examplesRoute)
+-- core/services/        12 services
+-- core/domain/
|   +-- entities/          2 entities (QuizSession, Question) [X] 11 missing
|   +-- constants/         1 file (BusinessRules.js)
+-- core/interfaces/      10 interfaces (6 are empty stubs)
+-- infrastructure/       Caches, DB, external clients, repos, security
+-- services/ (flat)       5 misplaced files (B4 audit finding)
```

### 1.2 Current Backend-Frontend Asymmetry

```
FRONTEND FEATURES            BACKEND DOMAINS
-----------------            -----------------
features/auth                AuthModule (clean, 1:1)
features/mandarin     =======+ WordModule (core)
  (super-feature)     |    +== VocabularyModule (lists, categories, filters)
  calls 6 domains     |    +== ConversationModule (deprecated)
                      |    +== ExamplesModule (non-recorded, vocab-related)
                      |    +== QuizModule (sessions, progress, SRS)
                      |    +== GamificationModule (cross-cutting)
features/quiz               QuizModule (clean)
features/gamification       GamificationModule (cross-cutting)
features/dashboard          QuizModule (via leech endpoint)
features/word         ----- ExamplesModule (duplicate, delete)
```

### 1.3 Key Backend Issues

| ID  | Issue                                                       | Severity                   | Status                                   | Resolved In        |
| --- | ----------------------------------------------------------- | -------------------------- | ---------------------------------------- | ------------------ | ------------ | ---------- |
| B4  | 5 files misplaced in flat `services/`                       | Medium                     | ✅ Completed                             | BE Phase 4         |
| B5  | `examplesRoutes.js` bypasses container DI                   | Medium                     | ✅ Completed                             | BE Phase 5         |
| B8  | Unsafe `                                                    |                            | "default_jwt_secret"` defaults in config | **Critical**       | ✅ Completed | BE Phase 5 |
| BE2 | 6 of 10 interfaces are empty stubs                          | Low (documented via JSDoc) | ✅ Completed                             | BE Phase 5 (JSDoc) |
| BE3 | Only 2 domain entities for 13 Prisma models                 | Medium                     | ✅ Completed                             | BE Phase 1         |
| BE4 | `VocabularyRepository` is a god repo (13 methods)           | Medium                     | ✅ Completed                             | BE Phase 2         |
| BE6 | `getEndOfDay()` in wrong location                           | Low                        | ✅ Completed                             | BE Phase 2         |
| BE7 | `QuizSessionService` has 8 dependencies (god service smell) | Medium                     | ✅ Completed                             | BE Phase 5         |

---

## 2. Target Module Structure

### 2.1 Clean Architecture Layer Map

```
FRAMEWORKS & DRIVERS  (outermost — no core code depends on these)
  api/routes/               Express routing, HTTP verbs, URL paths
  infrastructure/cache/     Redis client, cache service
  infrastructure/database/  Prisma client
  infrastructure/external/  GCS, Gemini, Google TTS clients
  infrastructure/security/  JWT, password hashing, HMAC
  config/                   Environment config
  index.js                  Entry point
          |
          |  Framework code calls controllers
          v
INTERFACE ADAPTERS (inbound)
  api/controllers/          AuthController, WordController, VocabularyController,
                            QuizSessionController, LearningController,
                            ProgressController, GamificationController,
                            ConversationController, TtsController, etc.
          |
          |  Controllers call services (use cases)
          v
USE CASES (application business rules)
  core/services/            WordService, VocabularyListService, AuthService,
                            QuizSessionService, LearningService, ProgressService,
                            StreakService, GamificationService, etc.
          |
          |  Services depend on interfaces (DIP)
          v
INTERFACE BOUNDARY
  core/interfaces/          IWordRepository, IVocabularyListRepository,
                            IProgressRepository, IAuthRepository,
                            IQuizSessionRepository, ICacheService,
                            IAIClient, IGCSClient, ITTSClient, etc.
          ^
          |  Repositories implement interfaces
          |
INTERFACE ADAPTERS (outbound)
  infrastructure/repositories/  WordRepository, VocabularyListRepository,
                                AuthRepository, ProgressRepository,
                                QuizSessionRepository, etc.

  === COMPOSITION ROOT ===
  container.js              Wires all dependencies — infra -> core -> API
```

### 2.2 Module Boundaries (Logical, Across Layers)

Each module spans multiple layers but is wired via a single container. No module is a separate process or deployment unit.

```
                        +-------------------------------------------------------------+
                        |                  WordModule (core)                           |
                        |  Zero dependencies — everyone depends on it                  |
                        +---------------+------------------+--------------------------+
                        |  Entities     |  Use Cases       |  Adapters                |
                        |  (core/)      |  (core/)         |  (api/ + infra/)         |
+-----------------------+---------------+------------------+--------------------------+
|  WordModule           | Word entity   | WordService      | wordController           |
|  (independent)        |               | WordSeeder       | wordRoutes               |
|                       |               |                  | WordRepository           |
|                       |               |                  | IWordRepository          |
+-----------------------+---------------+------------------+--------------------------+
|  VocabularyModule     | VocabList     | VocabListService | vocabController (trim)   |
|  (depends on Word)    | entity *NEW   |                  | VocabListRepository      |
+-----------------------+---------------+------------------+--------------------------+
|  QuizModule           | QuizSession   | QuizSessionSvc  | quizSessionController    |
|  (depends on Word)    | Question      | LearningSvc(SRS)| learningController       |
|                       | Progress*NEW  | ProgressService | progressController       |
|                       | StudyStreak   | StreakService   | QuizSessionRepository    |
|                       | *SHARED       |                  | ProgressRepository       |
|                       |               |                  | AnswerRepository         |
|                       |               |                  | SummaryRepository        |
+-----------------------+---------------+------------------+--------------------------+
|  AuthModule           | User *NEW     | AuthService     | authController           |
|  (independent)        | Session       | JwtService      | authRoutes               |
|                       |               |                  | AuthRepository           |
+-----------------------+---------------+------------------+--------------------------+
|  GamificationModule   | Badge *NEW    | GamificationSvc | gamificationController   |
|  (cross-cutting)      | (inline)      |                  | BadgeRepository          |
|                       |               |                  | (shares StudyStreak)     |
+-----------------------+---------------+------------------+--------------------------+
```

**Dependency Rule:** WordModule <- VocabularyModule, QuizModule <- AuthModule <- GamificationModule. Inner modules have zero outward dependencies.

### 2.3 Module <-> Prisma Model Mapping

| Module                 | Prisma Models                                                                                  |
| ---------------------- | ---------------------------------------------------------------------------------------------- |
| **WordModule**         | VocabularyWord                                                                                 |
| **VocabularyModule**   | VocabularyList, Category, WordCategory, WordList                                               |
| **QuizModule**         | QuizSession, QuizSessionQuestion, QuizSessionAnswer, QuizSessionSummary, Progress, StudyStreak |
| **AuthModule**         | User, Session                                                                                  |
| **GamificationModule** | (no dedicated table -- inline badge data)                                                      |

### 2.4 Directory Tree (with Layer Labels)

```
apps/backend/src/
+-- api/                          [Interface Adapters -- inbound]
|   +-- controllers/          11 controllers *+1 (wordController)
|   +-- routes/               12 route files (rename examplesRoute, +wordRoutes)
|   +-- middleware/            5 files (unchanged)
|   +-- docs/                 3 files (unchanged)
|
+-- core/                         [Use Cases + Entities -- innermost]
|   +-- domain/
|   |   +-- entities/         * Word entity (pure word data -- NO audioUrl)
|   |   |                        + existing User, QuizSession, Question
|   |   |                        + Progress, StudyStreak, Badge
|   |   +-- constants/        BusinessRules.js (move getEndOfDay() to utils)
|   +-- interfaces/           * IWordRepository *NEW
|   |                            + existing 10 interfaces (populate 6 stubs)
|   +-- services/
|       |                     * WordService *NEW (CRUD + search + seed)
|       |                     * VocabularyListService *EXTRACTED (lists/categories only)
|       |                        12 existing core services (unchanged)
|       |                        ProgressService *STAYS (moves to QuizModule conceptually)
|       |                        LearningService *STAYS
|       |                        StreakService *STAYS
|
+-- infrastructure/               [Interface Adapters -- outbound + Frameworks]
|   +-- cache/                6 files (unchanged)
|   +-- database/             client.js (unchanged)
|   +-- external/             GCSClient, GeminiClient, GoogleTTSClient
|   |                         [x] + geminiClient (moved from services/)
|   +-- parsers/              CsvParser (unchanged)
|   +-- repositories/
|   |   |                    * WordRepository *NEW (extracted from VocabularyRepository)
|   |   |                    * VocabularyListRepository *EXTRACTED (lists/categories)
|   |   |                        8 existing repositories (unchanged)
|   +-- security/             3 files (unchanged)
|
+-- scripts/                       [Standalone -- not part of app runtime]
|   |                         * seed-words.js *NEW (standalone word CSV import)
|
+-- services/                  [DEL] REMOVED -- all files relocated:
|   +-- exampleService.js     -> core/services/
|   +-- gcsCacheService.js    -> infrastructure/cache/ (or delete if superseded)
|   +-- geminiClient.js       -> infrastructure/external/
|   +-- examples/
|       +-- hskValidator.js   -> utils/
|       +-- inputSanitizer.js -> utils/
|
+-- utils/                    5 files + 2 new validators
+-- config/                   3 files (unchanged)
+-- container.js              Updated DI wiring (+WordService, +WordRepository)
+-- index.js                  (unchanged)
```

## 3. Repository Pattern Assessment

**Q: Are we using the repository pattern correctly?**

**A: Yes, correctly for JavaScript.**

| File                               | Assessment                                                     |
| ---------------------------------- | -------------------------------------------------------------- |
| `IProgressRepository.js`           | [x] Full JSDoc `@typedef` with 5 methods + data shape          |
| `IVocabularyRepository.js`         | [x] Full JSDoc `@typedef` for data shapes and methods          |
| `IAIClient.js`                     | [x] `generateText` + `healthCheck` defined                     |
| `IGCSClient.js`                    | [x] `fileExists`, `downloadFile`, `uploadFile`, `getPublicUrl` |
| `IAuthRepository.js`               | [x] 7 methods fully documented                                 |
| `ICacheService.js`                 | [x] `get`, `set`, `delete`, `clear`, `getMulti`                |
| `IQuizSessionRepository.js`        | [x] Full JSDoc contract                                        |
| `IQuizSessionAnswerRepository.js`  | [x] 4 methods documented                                       |
| `IQuizSessionSummaryRepository.js` | [x] Full JSDoc with all methods                                |
| `ITTSClient.js`                    | [x] `synthesizeSpeech` + `healthCheck`                         |

**Key observations:**

1. **Dependency Inversion is correct** -- `core/services/` depends on JSDoc interfaces in `core/interfaces/`. No core code imports from `infrastructure/`. The `container.js` wires concrete implementations at composition root.

2. **No enforcement mechanism** -- JavaScript has no interfaces. The JSDoc `@typedef` blocks serve as documentation contracts. The `export default {}` lines are just module wrappers -- the real interface is the JSDoc above.

3. **Services document their dependencies** -- Every service has a comment like `this.repository // IProgressRepository` making the dependency explicit.

4. **The "6 empty interfaces" finding (BE2) should be downgraded** -- Based on symbol counting, which doesn't account for JSDoc-defined contracts.

**Action:** No code changes needed. Pattern is implemented correctly for JavaScript.

---

## 4. Migration Phases

---

## PHASE 0 - Decisions

### Story 0.1 - Architecture Decisions

| Step  | Decision                            | Recommended | Details                                                                       |
| ----- | ----------------------------------- | ----------- | ----------------------------------------------------------------------------- |
| 0.1.1 | Split VocabularyRepository?         | yes         | Word CRUD separates from list/category operations.                            |
| 0.1.2 | Create 5 domain entities?           | yes         | User, VocabularyWord, Progress, StudyStreak, Badge.                           |
| 0.1.3 | Populate 6 empty interfaces?        | no          | Documented via JSDoc - see Section 3. No code change needed.                  |
| 0.1.4 | Decompose QuizSessionService? (BE7) | yes         | Split into QuizSessionOrchestrator + AnswerRecordingService + SummaryService. |
| 0.1.5 | Move flat services/ files?          | yes         | Relocate 4 files to correct layers, delete 1 dead file (geminiClient.js).     |

---

## PHASE 1 - Create WordModule Core

### Story 1.1 - Create Domain Entities & Interface

| Step  | Action                                     | Details                                                                                                       |
| ----- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| 1.1.1 | Create Word.js entity                      | Pure word data: id, simplified, traditional, pinyin, english, hskLevel. NO audioUrl, NO exampleSentence.      |
| 1.1.2 | Create IWordRepository.js interface        | JSDoc typedef with methods: findAll, findById, findByList, search                                             |
| 1.1.3 | Create remaining domain entities (5 files) | User.js (from AuthContext), VocabularyWord.js (from CSV), Progress.js (from Prisma), StudyStreak.js, Badge.js |

### Story 1.2 - Create Repository & Service

| Step  | Action                             | Details                                                                                   |
| ----- | ---------------------------------- | ----------------------------------------------------------------------------------------- |
| 1.2.1 | Create WordRepository.js           | Implements IWordRepository, word CRUD against Prisma, extracted from VocabularyRepository |
| 1.2.2 | Create VocabularyListRepository.js | Extracted from VocabularyRepository, lists/categories only                                |
| 1.2.3 | Create WordService.js              | CRUD + search + seed methods for Word entity                                              |
| 1.2.4 | Create VocabularyListService.js    | List/category operations only                                                             |

### Story 1.3 - Create Controller, Routes & Seed Script

| Step  | Action                   | Details                                                                  |
| ----- | ------------------------ | ------------------------------------------------------------------------ |
| 1.3.1 | Create wordController.js | CRUD + search + seed endpoints                                           |
| 1.3.2 | Create wordRoutes.js     | GET /api/v1/words/:id, GET /api/v1/words/search, POST /api/v1/words/seed |
| 1.3.3 | Create seed-words.js     | Standalone CSV import script in scripts/ directory                       |

**Verify:** Word.js has correct fields. IWordRepository has all 4 JSDoc method signatures. GET /api/v1/words/:id returns a word. GET /api/v1/words/search?q=... returns results. POST /api/v1/words/seed imports CSV data. New domain entities match Prisma schemas.

---

## PHASE 2 - Split & Modify Existing

### Story 2.1 - Split Repositories & Services

| Step  | Action                        | Details                                                                                               |
| ----- | ----------------------------- | ----------------------------------------------------------------------------------------------------- |
| 2.1.1 | Split VocabularyRepository.js | Extract word CRUD into WordRepository.js (Phase 1), keep list/category in VocabularyListRepository.js |
| 2.1.2 | Split VocabularyService.js    | Extract word methods into WordService.js (Phase 1), keep list/category in VocabularyListService.js    |
| 2.1.3 | Update container.js           | Add WordService + WordRepository wiring                                                               |

### Story 2.2 - Move Validators & Extract Utility

| Step  | Action                 | Details                                            |
| ----- | ---------------------- | -------------------------------------------------- |
| 2.2.1 | Move hskValidator.js   | From services/examples/ to utils/hskValidator.js   |
| 2.2.2 | Move inputSanitizer.js | From services/examples/ to utils/inputSanitizer.js |
| 2.2.3 | Extract getEndOfDay()  | From BusinessRules.js to utils/dateUtils.js        |

**Verify:** npm test passes. Old VocabularyRepository no longer has word CRUD methods. utils/dateUtils.js exists with getEndOfDay(). BusinessRules.js no longer contains getEndOfDay(). container.js wires all new dependencies.

---

## PHASE 3 - Rename Controllers to PascalCase

### Story 3.1 - Rename Controller Files

| Step  | Action                                                        | Details                                       |
| ----- | ------------------------------------------------------------- | --------------------------------------------- |
| 3.1.1 | Rename authController.js -> AuthController.js                 | Update container.js and authRoutes.js imports |
| 3.1.2 | Rename healthController.js -> HealthController.js             | Update container.js and healthRoutes.js       |
| 3.1.3 | Rename conversationController.js -> ConversationController.js | Update container.js and conversationRoutes.js |
| 3.1.4 | Rename learningController.js -> LearningController.js         | Update container.js and learningRoutes.js     |
| 3.1.5 | Rename progressController.js -> ProgressController.js         | Update container.js and progressRoutes.js     |
| 3.1.6 | Rename quizSessionController.js -> QuizSessionController.js   | Update container.js and quizSessionRoutes.js  |
| 3.1.7 | Rename ttsController.js -> TtsController.js                   | Update container.js and ttsRoutes.js          |
| 3.1.8 | Rename vocabularyController.js -> VocabularyController.js     | Update container.js and vocabularyRoutes.js   |

_Note: GamificationController.js and AIFeedbackController.js are already PascalCase._

### Story 3.2 - Fix Route & Update Tests

| Step  | Action                                       | Details                                                           |
| ----- | -------------------------------------------- | ----------------------------------------------------------------- |
| 3.2.1 | Rename examplesRoute.js -> examplesRoutes.js | Update routes/index.js import                                     |
| 3.2.2 | Update test files                            | authController.test.js, vocabularyController.test.js import paths |

**Verify:** All 8 controller files use PascalCase. container.js imports correct paths. routes/index.js imports examplesRoutes.js. Test files updated.

---

## PHASE 4 - Relocate Misplaced Services

### Story 4.1 - Move Active Services

| Step  | Action                                                             | Details                                                                                                                                                            |
| ----- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 4.1.1 | Move exampleService.js -> core/services/ExampleService.js          | Fix internal import: ./gcsCacheService.js -> ../infrastructure/cache/GcsCacheService.js. Update container.js, examplesRoute.js, tests/unit/exampleService.test.js. |
| 4.1.2 | Move gcsCacheService.js -> infrastructure/cache/GcsCacheService.js | Update container.js                                                                                                                                                |
| 4.1.3 | Move hskValidator.js -> utils/hskValidator.js                      | Update ExampleService.js import + tests/unit/hskValidator.test.js                                                                                                  |
| 4.1.4 | Move inputSanitizer.js -> utils/inputSanitizer.js                  | Update ExampleService.js import                                                                                                                                    |

### Story 4.2 - Delete Dead Code & Update Container

| Step  | Action                 | Details                                                                                          |
| ----- | ---------------------- | ------------------------------------------------------------------------------------------------ |
| 4.2.1 | Delete geminiClient.js | Dead code - no callers. Container already uses infrastructure/external/GeminiClient.js directly. |
| 4.2.2 | Update container.js    | Point all imports to new service locations                                                       |

**Verify:** 4 relocated files + 1 deleted file (geminiClient.js). exampleService.js internal import path updated. Test files updated: exampleService.test.js, hskValidator.test.js. container.js imports from new locations. No broken imports.

---

## PHASE 5 - Fix Issues & Delete Old Code

### Story 5.1 - Security & DI Fixes

| Step  | Action                           | Issue | Details                                                                |
| ----- | -------------------------------- | ----- | ---------------------------------------------------------------------- | --- | ---------------------------------------------------------------------- |
| 5.1.1 | Fix config/index.js JWT defaults | B8    | Replace                                                                |     | "default_jwt_secret" with env var validation + hard failure if missing |
| 5.1.2 | Fix examplesRoutes.js DI bypass  | B5    | Inject ExampleService via container.js instead of new ExampleService() |

### Story 5.2 - Decompose God Service

| Step  | Action                            | Issue | Details                                                                      |
| ----- | --------------------------------- | ----- | ---------------------------------------------------------------------------- |
| 5.2.1 | Decompose QuizSessionService.js   | BE7   | Split into QuizSessionOrchestrator + AnswerRecordingService + SummaryService |
| 5.2.2 | Update QuizSessionService.test.js | BE7   | Adjust imports/mocks for new service boundaries                              |

### Story 5.3 - JSDoc Cleanup & Delete

| Step  | Action                              | Issue | Details                                                 |
| ----- | ----------------------------------- | ----- | ------------------------------------------------------- |
| 5.3.1 | Populate JSDoc in 6 interface stubs | BE2   | Add @typedef method signatures                          |
| 5.3.2 | Delete backend/services/ directory  | --    | All files relocated in Phase 4, geminiClient.js deleted |

**Verify:** config/index.js rejects missing JWT_SECRET. examplesRoutes.js uses container DI. QuizSessionService decomposed. 6 interfaces have JSDoc. services/ directory deleted. Test files updated: QuizSessionService.test.js. npm test passes.

---

## PHASE 6 - Verification & Audit

### Story 6.1 - Full Test Suite

| Step  | Action                              | Details                                                            |
| ----- | ----------------------------------- | ------------------------------------------------------------------ |
| 6.1.1 | Run npm test                        | All tests must pass (check for broken imports after renames/moves) |
| 6.1.2 | Check for remaining dead references | Search for services/ and camelCase controller imports              |

### Story 6.2 - Audit Report Update

| Step  | Action                         | Details                                                                                                                        |
| ----- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| 6.2.1 | Verify container.js imports    | No broken imports after all renames and relocations                                                                            |
| 6.2.2 | Update audit report checklists | Mark B4, B5, B8, BE2, BE3, BE4, BE6, BE7 as completed                                                                          |
| 6.2.3 | Verify test files updated      | exampleService.test.js, hskValidator.test.js, QuizSessionService.test.js, authController.test.js, vocabularyController.test.js |

**Verify:** npm test 100% pass. No services/ imports. No camelCase controller imports. Test files updated. Audit report updated.

### Dependency Graph

`Phase 0: Decisions (shared FE + BE)
  |
  +-- BE Phase 1: Create WordModule -----------+
  |     +-- BE Phase 2: Split & Modify         |
  |           |                                |
  |           +-- BE Phase 3: Rename Ctrls ----+--+ (parallel)
  |           |     +-- BE Phase 4: Relocate --+  |
  |           |           +-- BE Phase 5: Fix  |  |
  |           |                 +-- BE Phase 6 |  |
  |           |                       Verify   |  |
  |           +-- BE Phase 3,4,5 can run ------+  |
  |               in any order after Phase 2      |
  |                                               |
  +-- FE Phase 1: Move to vocabulary/ ------------+
        +-- FE Phase 2: Move to quiz/
              +-- FE Phase 3: Rename/Delete
                    +-- FE Phase 4: Router Updates
                          +-- FE Phase 5: Verify`

Backend Phase 1 runs in parallel with Frontend Phase 1.
Backend Phase 2 depends on Backend Phase 1.
Backend Phases 3, 4, 5 can run in parallel (independent operations) after Phase 2.
Backend Phase 6 (Verify) depends on Backend Phase 5 + Frontend Phase 4.
