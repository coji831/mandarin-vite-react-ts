# Story 13-6: Clean Architecture Review Results

**Epic:** 13 - Production Backend Architecture  
**Story:** 13-6 - Clean Architecture Preparation for .NET Migration  
**Created:** 2026-01-22  
**Status:** In Progress

---

## 📋 Review Summary

This document captures the results of the clean architecture review for the `apps/backend` folder. Findings are categorized by layer and include specific change requests to align with the Clean Architecture Review Checklist.

---

## 🛠️ Change Requests

### 🔴 High Priority

| ID        | Layer    | Location         | Finding                                                                                 | Change Request                                                  |
| :-------- | :------- | :--------------- | :-------------------------------------------------------------------------------------- | :-------------------------------------------------------------- |
| **CR-01** | -        | `src/`           | **Legacy Bloat**: Deprecated folders (`controllers/`, `services/`, etc.) still present. | Delete legacy folders after verification of migration.          |
| **CR-02** | **API**  | `api/routes/`    | **Path Error**: Routes reference `../../middleware/` (legacy root).                     | Update imports to `../middleware/` within the `api/` layer.     |
| **CR-03** | **API**  | `api/routes/`    | **Dependency Leak**: Routes import from legacy `../../services/`.                       | Refactor to use `infrastructure/` or `core/` via DI.            |
| **CR-04** | **Core** | `core/services/` | **DI Violation**: `ConversationService.js` uses direct imports (no class/DI).           | Convert to class; inject clients via constructor.               |
| **CR-05** | **Core** | `core/services/` | **Missing Service**: Explicit `TtsService` absent; inline mocking in routes.            | Create `TtsService` class using `GoogleTTSClient`.              |
| **CR-07** | -        | `index.js`       | **Singleton Leak**: Exports `cacheService` / `RedisClient` from legacy paths.           | Refactor to `infrastructure/cache/`; inject via DI into routes. |

### 🟡 Medium Priority

| ID        | Layer   | Location           | Finding                                                              | Change Request                                               |
| :-------- | :------ | :----------------- | :------------------------------------------------------------------- | :----------------------------------------------------------- |
| **CR-06** | **API** | `api/controllers/` | **Legacy Export**: `healthController.js` exports a router object.    | Convert to DI-compliant class; route logic in `api/routes/`. |
| **CR-08** | **API** | `api/controllers/` | **Logic Leak**: `ConversationController` handles health check logic. | Relocate health logic to `core/` services.                   |

### 🟢 Low Priority

| ID        | Layer     | Location          | Finding                                                               | Change Request                                                              |
| :-------- | :-------- | :---------------- | :-------------------------------------------------------------------- | :-------------------------------------------------------------------------- |
| **CR-09** | **Infra** | `infrastructure/` | **File Redundancy**: `models/` folder still exists with Prisma logic. | Verify `infrastructure/database/client.js` is the source; delete `models/`. |

---

## 🔍 Deep Dive File Analysis (Phase II)

This phase examines individual file content against logic and clean architecture patterns based on the Story 13-6 Checklist.

### 🔴 High Priority

| ID        | Title                  | Finding                                                                                                                                  | Change Request                                                                                                                         |
| :-------- | :--------------------- | :--------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **CR-10** | **Infra Cross-Import** | `VocabularyRepository.js` imports `downloadFile` from legacy `services/gcsService.js` instead of `infrastructure/external/GCSClient.js`. | Refactor `VocabularyRepository` to use `GCSClient`.                                                                                    |
| **CR-11** | **Core Service DI**    | `ConversationService.js` uses functional exports and hard-coded infrastructure imports (Gemini/TTS/GCS).                                 | Convert to `class ConversationService` with DI constructor.                                                                            |
| **CR-12** | **Service Leak**       | `conversationRoutes.js` imports legacy services from `src/services/` and passes them to the controller.                                  | Update routes to only use `core/services` and `infrastructure/`.                                                                       |
| **CR-22** | **Prisma Leak**        | Prisma client is imported directly in some controllers or root index.                                                                    | Enforce that only `infrastructure/repositories/` can import Prisma.                                                                    |
| **CR-23** | **Test Framework**     | Jest is currently incompatible with the ESM/monorepo setup and requires experimental flags.                                              | Migrate to **Vitest** for better ESM support and alignment with the frontend.                                                          |
| **CR-24** | **Broken Path Tests**  | `auth.test.js` and `database.test.js` fail due to incorrect relative paths (`../src`) after migration to `tests/integration/`.           | Update paths to `../../src` or use module aliases.                                                                                     |
| **CR-25** | **DI Test Failure**    | `ProgressService.test.js` and `auth.test.js` fail because they don't mock the now-required dependencies in constructor.                  | Update tests to use `vi.mock()` for repository/service injection.                                                                      |
| **CR-30** | **Prisma Test Error**  | Integration tests (`database.test.js`) fail with Prisma runtime errors when executing queries.                                           | Investigate `PrismaPg` adapter initialization in Vitest environment.                                                                   |
| **CR-31** | **Infra / Test**       | `tests/integration/`                                                                                                                     | **Vitest Forking Failure**: Prisma 7 `PrismaPg` adapter appears to fail under Vitest's default thread/fork model in integration tests. | Configure `poolOptions` or use a single-threaded mode (`--runInBand` equivalent) for integration tests hitting the database. Attempted: `singleFork: true` did NOT resolve the issue. Root cause appears to be Prisma 7 adapter incompatibility with Vitest's test isolation. |
| **CR-32** | **Test / API**         | `tests/unit/api/`                                                                                                                        | **Missing Controller Unit Tests**: Controllers like `Auth`, `Vocabulary`, and `Conversation` lack isolated unit tests.                 | Create unit tests for each controller class, mocking the underlying service layer completely.                                                                                                                                                                                 |
| **CR-33** | **Test / Core**        | `tests/unit/core/`                                                                                                                       | **Missing Service Unit Tests**: `AuthService`, `VocabularyService`, and `ConversationService` lack pure unit tests.                    | Implement isolated service tests using mock repositories and external clients.                                                                                                                                                                                                |
| **CR-34** | **Test / Security**    | `tests/unit/infra/`                                                                                                                      | **Missing Security Layer Tests**: `JwtService` and `PasswordService` have no dedicated tests for signature or hashing logic.           | Create unit tests for token generation/verification and password validation/hashing.                                                                                                                                                                                          |
| **CR-35** | **Test / Infra**       | `tests/unit/infra/`                                                                                                                      | **Missing Infrastructure Client Tests**: External clients (`GeminiClient`, `GCSClient`) are not tested in isolation.                   | Implement unit tests for external clients using network-level mocks (e.g., `msw` or `vi.fn()` on fetch/SDK).                                                                                                                                                                  |
| **CR-36** | **Test Isolation**     | `tests/integration/`                                                                                                                     | **Integration Bloat**: Current integration tests (e.g., `auth.test.js`) test business logic AND database state simultaneously.         | Refactor integration tests to focus strictly on Repository-to-DB mapping, moving business logic checks to Service unit tests.                                                                                                                                                 |
| **CR-37** | **Unnecessary Tests**  | `tests/unit/`                                                                                                                            | **Redundant/Stale Files**: `googleTTSService.test.js` is a placeholder that does not reflect the current Clean Architecture structure. | Delete stale test files and replace with appropriate `infra/` client tests.                                                                                                                                                                                                   |

### 🟡 Medium Priority

| ID        | Title                    | Finding                                                                                                                       | Change Request                                                         |
| :-------- | :----------------------- | :---------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------- |
| **CR-13** | **Middleware Standards** | `errorHandler.js` contains a header referencing `local-backend` and doesn't use the project standard `logger`.                | Align `errorHandler.js` with project standards and standard logger.    |
| **CR-14** | **Empty Interfaces**     | `IVocabularyRepository.js` exports an empty object `{}`.                                                                      | Use consistent `@typedef` or abstract class pattern in all interfaces. |
| **CR-15** | **Path Headers**         | `authMiddleware.js` in `api/middleware/` has a file header claiming it is in `src/middleware/`.                               | Correct all internal file path documentation in headers.               |
| **CR-16** | **Index Routing**        | `index.js` contains manual route-scraping logic and redundant server setup.                                                   | Clean up `index.js` to focus solely on app initialization/wiring.      |
| **CR-17** | **Legacy Service**       | `CachedConversationService.js` references `import('../../infrastructure/cache/CacheService.js')` which might be broken/empty. | Verify existence and content of base `CacheService` class.             |
| **CR-19** | **Broken Tests**         | Unit tests correlate to legacy `src/services` and `src/models` paths.                                                         | Refactor `tests/` imports to point to `core/services`.                 |
| **CR-21** | **Infra Interfaces**     | No interfaces defined for external clients (Gemini, GCS, TTS).                                                                | Create `IGCSClient.js`, `IAIClient.js` in `core/interfaces/`.          |
| **CR-26** | **Missing Ctl Tests**    | Controllers (`Auth`, `Vocabulary`, `Conversation`, `Health`, `Tts`) lack dedicated unit tests.                                | Create unit tests for all controllers in `tests/unit/api/`.            |
| **CR-27** | **Missing Repo Tests**   | Repositories (`Auth`, `Vocabulary`, `Progress`) lack unit tests for data access logic.                                        | Create unit tests for all repositories in `tests/unit/infra/`.         |
| **CR-28** | **Missing Svc Tests**    | Core services (`AuthService`, `VocabularyService`, `ConversationService`) lack unit tests.                                    | Create unit tests for all core services in `tests/unit/core/`.         |
| **CR-29** | **Stale Tests**          | `googleTTSService.test.js` is a placeholder and doesn't test the new `GoogleTTSClient`.                                       | Replace with meaningful unit tests for `GoogleTTSClient`.              |

### 🟢 Low Priority

| ID        | Title             | Finding                                              | Change Request                                                       |
| :-------- | :---------------- | :--------------------------------------------------- | :------------------------------------------------------------------- |
| **CR-20** | **Config Header** | `config/index.js` header references `local-backend`. | Update all config headers to reflect the current monorepo structure. |

---

## 🧪 Testing Audit Results

Results from `npm test` run on 2026-01-22.

| Test File                                           | Status     | Issues / Findings                                                 |
| :-------------------------------------------------- | :--------- | :---------------------------------------------------------------- |
| `tests/integration/auth.test.js`                    | ❌ FAIL    | Prisma runtime errors (CR-31). DI issues resolved.                |
| `tests/integration/cache.test.js`                   | ✅ PASS    | Successfully tests Redis integration via `ioredis-mock`.          |
| `tests/integration/database.test.js`                | ❌ FAIL    | Prisma runtime errors (CR-30/CR-31).                              |
| `tests/unit/ProgressService.test.js`                | ✅ PASS    | Verified after DI refactor and mock migration.                    |
| `tests/unit/progressController.test.js`             | ✅ PASS    | Verified after manual fix for DI instantiation.                   |
| `tests/unit/errorHandler.test.js`                   | ✅ PASS    | -                                                                 |
| `tests/unit/googleTTSService.test.js`               | ✅ DELETED | Stale placeholder deleted (CR-37).                                |
| `tests/unit/infrastructure/JwtService.test.js`      | ✅ PASS    | Created unit tests for JWT token generation/verification (CR-34). |
| `tests/unit/infrastructure/PasswordService.test.js` | ✅ PASS    | Created unit tests for password hashing and validation (CR-34).   |
| `tests/services/cache/RedisCacheService.test.js`    | ✅ PASS    | Verified infrastructure layer logic.                              |
| `tests/services/tts/CachedTTSService.test.js`       | ✅ PASS    | Verified service layer logic.                                     |

### Summary of Coverage Gaps

**✅ Completed:**

- ✅ Security services (`JwtService`, `PasswordService`) now have full unit test coverage (CR-34).
- ✅ Stale test file (`googleTTSService.test.js`) removed (CR-37).

**🟡 In Progress / Remaining:**

- **API Layer**: 4/5 controllers still need unit tests (Auth, Vocabulary, Conversation, Health). Controller tests should mock Services.
- **Core Layer**: 3/4 core services still need unit tests (Auth, Vocabulary, Conversation). Service tests should mock Repositories and External Clients.
- **Infrastructure Layer**:
  - Repositories (`Auth`, `Vocabulary`, `Progress`) lack systematic integration tests (DB state verification only).
  - External Clients (`GeminiClient`, `GCSClient`) have NO isolated tests.
- **Test Alignment**: Existing integration tests (e.g., `auth.test.js`) are "High-Level Integration" tests that should be decomposed into Service Unit Tests and Repository Integration Tests for better isolation.
- **Prisma Integration Issue**: CR-31 remains unresolved; Prisma 7 `PrismaPg` adapter fails in Vitest test environment.

---

## 🚀 Implementation Roadmap (Updated)

To ensure a stable transition, follow this sequence. **DO NOT** delete files until Phase 4.

### Phase 1: Core & Infrastructure (The Foundation)

1. **Refactor Core Services (CR-11, CR-04)**: Convert `ConversationService` and `CachedConversationService` to formal DI classes.
2. **Standardize Infrastructure (CR-10)**: Fix `VocabularyRepository` to use the correct `GCSClient` and `GeminiClient` instead of legacy `src/services/`.
3. **Fix Interfaces (CR-14, CR-21)**: Populate `IVocabularyRepository` and create new interfaces for base external clients (GCS, AI).

### Phase 2: API Layer (The Wiring)

1. **Refactor Controllers (CR-06, CR-08, CR-22)**: Update `healthController` and ensure all controllers use repositories instead of direct Prisma/Model imports.
2. **Update Route Wiring (CR-12, CR-02, CR-03)**: Change route files to instantiate services/repositories and inject them into controllers. Point all middleware imports to `../middleware/`.
3. **Standarize Middlewares (CR-13, CR-15)**: Fix headers and logging in `errorHandler` and `auth` middlewares.

### Phase 3: Root & Integration (The Application)

1. **Refactor index.js (CR-07, CR-16, CR-20)**: Move the singleton initialization of `cacheService` to `infrastructure/cache/index.js`. Fix stale headers in config files.
2. **API Routes Index (CR-18)**: Standardize `api/routes/index.js` to only import and use Routers, not controllers.

### Phase 4: Final Cleanup (The Polish)

1. **Test Migration & Verification (CR-19, CR-23)**: Migrate the test runner from **Jest to Vitest** to resolve ESM compatibility issues. Refactor test suite imports to match the new structure and run `npm test`.
2. **Delete Legacy Folders (CR-01, CR-09)**: Once all imports are redirected and tests pass, delete:
   - `src/controllers/`
   - `src/services/`
   - `src/middleware/`
   - `src/models/`

---

## ✅ Verified Files (Compliant)

- `apps/backend/src/api/controllers/authController.js` (Class-based, DI used)
- `apps/backend/src/api/controllers/VocabularyController.js` (Class-based, DI used)
- `apps/backend/src/api/routes/vocabularyRoutes.js` (Correct DI wiring)
- `apps/backend/src/core/services/AuthService.js` (DI-compliant class)
- `apps/backend/src/core/services/VocabularyService.js` (DI-compliant class)
- `apps/backend/src/infrastructure/repositories/AuthRepository.js` (Implements interface)
- `apps/backend/src/infrastructure/repositories/VocabularyRepository.js` (Implements interface)
- `apps/backend/src/infrastructure/database/client.js` (Centralized Prisma client)

---

## 📝 Detailed Findings

### API Layer (api/)

- **Middleware Duplication**: The `middleware/` folder in `src/` is a duplicate of `api/middleware/`. Routes are inconsistent in which one they import.
- **Controller Inconsistency**: `VocabularyController` and `authController` follow the new pattern, but `healthController` and others still use functional exports or router exports.
- **Route Wiring**: Routes like `conversationRoutes.js` are manually "mocking" services in the route file (e.g., `const ttsService = { ... }`) instead of using formal service classes from the `core/` layer.

### Core Layer (core/)

- **Service Pattern**: Some services (`AuthService`, `VocabularyService`) correctly use the class/constructor pattern for DI. Others (`ConversationService`) are still just functional exports importing their own dependencies.
- **Interfaces**: Interfaces exist but aren't strictly enforced in JS, which is fine, but they should be used consistently as type documentation.

### Infrastructure Layer (infrastructure/)

- **Client Exports**: `infrastructure/external/` clients like `GeminiClient` and `GoogleTTSClient` should be standardized as either classes or module exports that are easily injectable.
- **Cache Implementation**: `infrastructure/cache/` should be the only place cache logic lives. Legacy `services/cache` must be removed.

### Testing & Validation

- **Framework Compatibility**: The current Jest setup relies on `--experimental-vm-modules` and is prone to breakage in the monorepo ESM context.
- **Migration Plan**: Migrate to **Vitest**. Since the frontend already uses Vite/Vitest, this will unify the testing stacks and provide better native support for ESM and TypeScript (via `tsx` or `vitest` built-in transform).
- **Import Refactoring**: All tests must be updated to import from `@mandarin/backend/core/...` or equivalent paths once the refactor is complete.

---

**Reviewer:** GitHub Copilot  
**Date:** 2026-01-22
