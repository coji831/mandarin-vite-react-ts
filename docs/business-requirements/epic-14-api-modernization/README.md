# Epic 14: API & Infrastructure Modernization

## Epic Summary

**Goal:** Modernize frontend API layer to industry-standard patterns with centralized configuration, typed responses, and automatic retry/refresh logic.

**Key Points:**

- Replace scattered `VITE_API_URL` resolution with centralized API configuration utility
- Migrate from custom `fetch` wrappers to Axios with interceptors for auth token refresh
- Implement typed API responses with proper error handling and retry logic
- Provide foundation for Epic 15-17 features requiring robust API infrastructure
- Reduce boilerplate and improve developer experience for future API integrations

**Status:** Planned

**Last Update:** February 2, 2026

## Background

The current frontend API layer has **partial centralization** with existing infrastructure:

**Existing Infrastructure:**

- ✅ Centralized config: `src/config/api.ts` with `API_CONFIG`
- ✅ Auth wrapper: `src/features/auth/utils/authFetch.ts` handles token refresh
- ✅ Unified client: `src/services/apiClient.ts` provides `authRequest()`/`publicRequest()`

**However, limitations remain:**

- **Custom fetch implementation**: `authFetch` reinvents patterns Axios provides (interceptors, retries)
- **Manual token expiry checking**: Uses `atob()` to decode JWT and check expiry time manually
- **Single retry attempt**: Only retries once on 401, no exponential backoff for network errors
- **No typed responses**: Services return raw `Response` objects, not type-safe data
- **Inconsistent error handling**: Services parse errors differently (some check `response.ok`, others throw generically)
- **Developer friction**: Adding interceptor logic requires modifying `authFetch` core code

Migrating to industry-standard Axios with centralized configuration addresses these issues while establishing a robust foundation for upcoming features (retention system, word examples, knowledge hub).

## User Stories

This epic consists of the following user stories:

1. [**Story 14.1: Jest to Vitest Migration**](./story-14-1-jest-to-vitest-migration.md)
   - As a **frontend developer**, I want to **migrate all frontend tests from Jest to Vitest**, so that **testing infrastructure aligns with Vite tooling and avoids monorepo module resolution issues**.

2. [**Story 14.2: Centralized API Configuration**](./story-14-2-centralized-api-config.md)
   - As a **frontend developer**, I want to **configure API base URLs in one location**, so that **changes don't require editing multiple service files**.

3. [**Story 14.3: Axios Migration with Interceptors**](./story-14-3-axios-interceptors.md)
   - As a **frontend developer**, I want to **use Axios with automatic token refresh interceptors**, so that **401 responses trigger seamless re-authentication without user disruption**.

4. [**Story 14.4: Progress Service Axios Migration**](./story-14-4-progress-service-migration.md)
   - As a **frontend developer**, I want to **migrate progress API calls to the new Axios client**, so that **progress tracking benefits from centralized error handling and retry logic**.

5. [**Story 14.5: Conversation Service Axios Migration**](./story-14-5-conversation-service-migration.md)
   - As a **frontend developer**, I want to **migrate conversation API calls to the new Axios client**, so that **conversation generation benefits from automatic retry and seamless token refresh**.

6. [**Story 14.6: Audio Service Axios Migration**](./story-14-6-audio-service-migration.md)
   - As a **frontend developer**, I want to **migrate audio API calls to the new Axios client**, so that **audio generation (TTS) benefits from automatic retry logic for flaky external APIs**.

## Story Breakdown Logic

This epic is divided into stories based on incremental migration approach:

- **Story 14.1** migrates testing infrastructure from Jest to Vitest, resolving monorepo module resolution issues
- **Story 14.2** focuses on foundational infrastructure (centralized API config) with new Axios client
- **Story 14.3** implements interceptor infrastructure for token refresh and retry logic
- **Story 14.4** migrates progress service (most critical data), validating the pattern
- **Story 14.5** migrates conversation service (LLM integration, benefits from retry)
- **Story 14.6** migrates audio service (TTS integration, completes epic)

Each story builds upon the previous, allowing iterative testing and rollback if issues emerge. Story 14.1 is implemented first to ensure clean testing infrastructure for all subsequent API changes.

## Acceptance Criteria

- [x] All `import.meta.env.VITE_API_URL` references removed from service files (Story 14.2)
- [x] Single source of truth for API configuration exists (`src/config/api.config.ts`) (Story 14.2)
- [x] Axios client created with request/response interceptors (Story 14.3)
- [x] 401 responses automatically trigger token refresh without user disruption (Story 14.3)
- [x] Network errors retry 3x with exponential backoff (Story 14.3)
- [x] All API responses typed with TypeScript interfaces (Stories 14.4-14.6)
- [ ] No `ApiClient.authRequest` calls remain in `conversationService.ts`, `audioService.ts` (Stories 14.5-14.6)
- [x] Progress API calls use Axios client with typed responses (Story 14.4)
- [x] Conversation API calls use Axios client with typed responses (Story 14.5 - Planned)
- [x] Audio API calls use Axios client with typed responses (Story 14.6 - Planned)
- [x] Error handling surfaces meaningful messages to users (not raw HTTP codes) (Stories 14.4-14.6)
- [x] Tests cover interceptor logic (token refresh, retry, error transformation) (Story 14.3)

## Architecture Decisions

- **Decision: Axios over custom fetch wrappers** (Axios)
  - **Rationale**: Industry standard with built-in interceptors, retry logic, and TypeScript support; reduces custom code maintenance
  - **Alternatives considered**: Enhanced custom `authFetch` wrapper, SWR/React Query
  - **Implications**: Initial migration effort (~20 hours); team must learn Axios patterns; long-term maintenance reduction

- **Decision: Centralized config over environment variable duplication** (Single config file)
  - **Rationale**: DRY principle; single source of truth for API base URLs, timeouts, credentials
  - **Alternatives considered**: Environment variables imported per-service, proxy configuration only
  - **Implications**: All services depend on shared config; config changes affect entire API layer

- **Decision: Automatic token refresh via interceptor** (Response interceptor)
  - **Rationale**: Seamless UX; users never see 401 errors if refresh token valid
  - **Alternatives considered**: Manual refresh on 401, refresh before expiry (proactive)
  - **Implications**: Adds complexity to error handling; must prevent infinite retry loops; increases backend refresh endpoint load

## Implementation Plan

1. Create centralized API configuration utility (`src/config/api.config.ts`)
2. Create Axios client instance with base configuration (`src/services/api.client.ts`)
3. Implement request interceptor for authentication headers
4. Implement response interceptor for token refresh on 401
5. Implement response interceptor for retry logic on network errors
6. Migrate `conversationService.ts` to use Axios client
7. Migrate `audioService.ts` to use Axios client
8. Migrate `authService.ts` to use Axios client (replace `authFetch`)
9. Migrate progress service hooks to use Axios client
10. Add TypeScript interfaces for all API responses
11. Update error handling to surface user-friendly messages
12. Add unit tests for interceptor logic
13. Remove deprecated `authFetch` wrapper
14. Update documentation (`docs/architecture.md`, `docs/guides/code-conventions.md`)

## Risks & Mitigations

- **Risk: Breaking changes during migration disrupt active features** — Severity: High
  - **Mitigation**: Incremental migration one service at a time; keep old patterns until all services migrated; comprehensive testing per story
  - **Rollback**: Revert individual service files to `fetch` implementation; Axios client optional until all services migrated

- **Risk: Infinite refresh loop if token refresh fails** — Severity: Medium
  - **Mitigation**: Add `_retry` flag to request config; skip interceptor if flag set; limit refresh attempts to 1
  - **Rollback**: Disable automatic refresh interceptor; fall back to manual logout on 401

- **Risk: TypeScript type mismatches cause runtime errors** — Severity: Medium
  - **Mitigation**: Add runtime validation for critical responses; use `unknown` type initially, narrow with type guards
  - **Rollback**: Revert to untyped responses (`any`) for problematic endpoints

- **Risk: Team unfamiliar with Axios patterns** — Severity: Low
  - **Mitigation**: Document common patterns in `docs/guides/code-conventions.md`; pair programming during initial stories
  - **Rollback**: N/A (training issue, not technical)

## Implementation notes

- **Conventions**: Follow `docs/guides/code-conventions.md` and `docs/guides/solid-principles.md`
- **Axios patterns**: Use async/await, proper error handling with try/catch, TypeScript types for all responses
- **Testing**: Write unit tests for interceptors before migrating services
- **Migration**: One service at a time to minimize risk; verify tests pass after each migration

---

**Related Documentation:**

- [Epic 14 Implementation](../../issue-implementation/epic-14-api-modernization/README.md)
- [Story 14.1 BR](./story-14-1-jest-to-vitest-migration.md)
- [Story 14.2 BR](./story-14-2-centralized-api-config.md)
- [Story 14.3 BR](./story-14-3-axios-interceptors.md)
- [Story 14.4 BR](./story-14-4-progress-service-migration.md)
- [Story 14.5 BR](./story-14-5-conversation-service-migration.md)
- [Story 14.6 BR](./story-14-6-audio-service-migration.md)
- [Code Conventions Guide](../../guides/code-conventions.md)
- [Architecture Overview](../../architecture.md)
