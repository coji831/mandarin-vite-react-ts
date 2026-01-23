# Epic 13 Summary: Production Backend Architecture

## 🚀 Accomplishments

- **Redis Caching Layer**: Implemented fail-open caching for TTS (24h) and Conversations (1h) using `ioredis`.
  - _Code_: `apps/backend/src/infrastructure/cache/`, `apps/backend/src/core/services/CachedTTSService.js`
- **API Versioning**: Standardized all routes under `/api/v1` and synchronized `packages/shared-constants`.
  - _Code_: `packages/shared-constants/src/index.js`, `apps/backend/src/api/routes/`
- **Security Hardening**: Migrated TTS and Conversation endpoints to protected routes requiring JWT authentication.
  - _Features_: httpOnly cookies, refresh token rotation, and auto-refresh integration in frontend.
  - _Middleware_: `apps/backend/src/api/middleware/authMiddleware.js`
- **Documentation Architecture**: Extracted over 800 lines of JSDoc into a standalone `openapi.yaml` (OpenAPI 3.1.0) with Swagger UI.
  - _Docs_: `apps/backend/src/api/docs/openapi.yaml`
- **Functional Improvements**:
  - **Toggle Mastery API**: Implemented logic for manual mastery override in user progress.
  - **GCS Integration**: Specialized `VocabularyRepository` to use Google Cloud Storage as the primary data source, eliminating local CSV dependencies in production.
- **Legacy Cleanup**: Completely removed "conversation-scaffold" mode and associated controllers/utilities.
  - _Cleanup_: Removed `mockConversationController.js`, `scaffoldUtils.js`
- **Frontend Alignment**: Updated `AudioService` and `ConversationService` to utilize `ApiClient.authRequest()`.
  - _Frontend_: `apps/frontend/src/features/mandarin/services/`

## 🔄 Plan Deviations

- **OpenAPI Strategy**: Pivoted from inline JSDoc to separate YAML file (**Option B**) to maintain code readability in route files.
- **Shared Constants Structure**: Removed `index.ts` in favor of `index.js` + `index.d.ts` to eliminate dual-file synchronization drift.
  - _Rationale_: Single source of truth for monorepo constants.
- **Public vs Protected**: Promoted TTS/Conversation routes from public to protected early in the implementation to mitigate AI cost risks.

## 🧠 New Knowledge

- **Fail-Open Caching Pattern**: Architectural pattern using `CacheService` factory to fallback to `NoOpCacheService` on Redis failure.
- **Binary-to-String Caching**: Storing MP3 audio as Base64 strings in Redis to reduce GCS/TTS latencies.
- **SHA-256 Deterministic Keys**: Implementation of hash-based cache keys for complex dialogue requests.
- **Class-Based DI Pattern**: Successfully implemented Dependency Injection (DI) for Express controllers, enabling isolated unit testing of services without mocking Express `req/res`.
- **In-Memory Integration Testing**: Utilizing `ioredis-mock` for full-service integration tests without requiring Docker containers.

## ⚠️ Lessons Learned (Struggles & Fixes)

- **Linux Case-Sensitivity**: Encountered `ERR_MODULE_NOT_FOUND` on Railway deployment.
  - _Fix_: Renamed `VocabularyController.js` to lowercase and forced Git index update.
- **ESM Extension Requirements**: Node.js ESM mode requires explicit `.js` extensions in imports, which differed from frontend Vite behavior.
- **ESM + Jest Mocking**: `jest.fn()` limitations with ES modules caused test corruption.
  - _Fix_: Migrated to manual mock patterns in `tests/services/`.
- **Vite Proxy Masking**: Proxying masked missing `VITE_API_URL` resolutions in local dev.
  - _Fix_: Centralized baseURL resolution in frontend service layer.
- **Shared Package Drift**: Discovered drift between `.js` and `.ts` files in shared constants.
  - _Fix_: Standardized on `.js` as single source of truth with `.d.ts` for type metadata.

## 📚 Documentation & Verification Checklist

To maintain the workspace as a single source of truth, the following updates are required or pending verification:

### 1. Business & Implementation Docs

- [x] **[Story 13.6 README](docs/issue-implementation/epic-13-production-backend-architecture/story-13-6-clean-architecture.md)**: Verified - Implementation results reflect Option B (standalone YAML).
- [x] **Acceptance Criteria**: Confirmed - [Epic 13 README](docs/business-requirements/epic-13-production-backend-architecture/README.md) has all items checked, including Toggle Mastery API.

### 2. Guides & Knowledge Base (KB)

- [ ] **Shared Constants Guide**: Document the requirement for maintaining **`index.js`** as the source of truth and **`index.d.ts`** for types. _(No dedicated guide exists yet - consider adding to [Code Conventions](docs/guides/code-conventions.md))_
- [x] **[Testing & ESM Guide](docs/guides/testing-guide.md)**: Added technical discovery regarding **ESM manual mocks** vs `jest.fn()`.
- [x] **[Deployment / Troubleshooting Guide](docs/guides/troubleshooting.md)**: Added entry for **Linux Case-Sensitivity** (`ERR_MODULE_NOT_FOUND`) and the `git rm --cached` fix.
- [x] **[Vite Configuration Guide](docs/guides/vite-configuration-guide.md)**: Added warning that Vite proxies can "mask" missing `VITE_API_URL` variables.

### 3. High-Level Docs

- [x] **[Architecture Overview](docs/architecture.md)**: Updated "Backend Architecture" section to reflect ESM-compliant JavaScript imports (using `.js` extensions) and shared constants structure.
- [x] **Unified API Spec**: OpenAPI YAML ([openapi.yaml](apps/backend/src/api/docs/openapi.yaml)) is now the primary source of truth, accessible via Swagger UI at `/api-docs`.
- [x] **[Environment Setup](docs/guides/environment-setup-guide.md)**: Explicitly listed `VITE_API_URL` as mandatory with warning about proxy masking.

**Status**: Completed  
**Last Update**: 2026-01-23  
**Branch**: `epic-13-production-backend-architecture`
