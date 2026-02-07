# Epic 14: API & Infrastructure Modernization

## Epic Summary

**Goal:** Refactor frontend API layer to use Axios with centralized configuration, interceptors for auth refresh, and typed responses for improved maintainability and developer experience.

**Key Points:**

- Centralized API configuration eliminates duplicated `VITE_API_URL` resolution across 5+ service files
- Axios interceptors handle token refresh automatically, preventing user-visible 401 errors
- Typed responses enforce API contracts at compile time, catching integration bugs early
- Retry logic with exponential backoff improves reliability for transient network failures
- Foundation established for Epic 15-17 features requiring robust API infrastructure

**Status:** Planned

**Last Update:** February 2, 2026

## Stories

This epic is broken down into the following stories:

1. [**Story 14.1: Jest to Vitest Migration**](./story-14-1-jest-to-vitest-migration.md) — ✅ **Completed**
   - Migrate testing infrastructure from Jest to Vitest for Vite compatibility

2. [**Story 14.2: Centralized API Configuration**](./story-14-2-centralized-api-config.md) — ✅ **Completed**
   - Create centralized API configuration and Axios client

3. [**Story 14.3: Axios Interceptors & Auth Resilience**](./story-14-3-axios-interceptors.md) — ✅ **Completed**
   - Implement request/response interceptors for token refresh and retry logic

4. [**Story 14.4: Progress Service Migration**](./story-14-4-progress-service-migration.md) — ✅ **Completed**
   - Migrate progress service to Axios with typed responses

5. [**Story 14.5: Conversation Service Migration**](./story-14-5-conversation-service-migration.md) — 🔲 **Planned**
   - Migrate conversation service to Axios with typed responses

6. [**Story 14.6: Audio Service Migration**](./story-14-6-audio-service-migration.md) — 🔲 **Planned**
   - Migrate audio service to Axios with typed responses (completes epic)

## Technical Overview

This epic modernizes the frontend API layer by migrating from custom `fetch` wrappers to industry-standard Axios with centralized configuration and interceptors. The current architecture has duplicated API configuration across multiple service files, inconsistent error handling, and no automatic token refresh mechanism.

**Current State:**

```typescript
// apps/frontend/src/config/api.ts (ALREADY EXISTS)
export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3001",
  timeout: 10000,
  withCredentials: true,
};

// apps/frontend/src/features/auth/utils/authFetch.ts (ALREADY EXISTS)
// Custom implementation of token refresh + retry
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = await getValidToken(); // Manual JWT decode + expiry check
  const response = await fetch(API_BASE + url, { ...options, headers });
  if (response.status === 401) {
    await refreshAccessToken(); // Single retry attempt
    return fetch(API_BASE + url, { ...options, headers });
  }
  return response;
}

// apps/frontend/src/services/progressService.ts (EXAMPLE)
import { authFetch } from "../../auth/utils/authFetch";

const response = await authFetch(API_ENDPOINTS.PROGRESS, { method: "GET" });
if (!response.ok) throw new Error("Failed");
return response.json(); // ❌ No type safety
```

**Target State (Replace authFetch with Axios):**

```typescript
// apps/frontend/src/config/api.config.ts
export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3001",
  timeout: 10000,
  withCredentials: true,
};

// apps/frontend/src/services/api.client.ts
export const apiClient = axios.create(API_CONFIG);
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      await refreshAuthToken();
      return apiClient.request(error.config);
    }
    return Promise.reject(error);
  },
);
```

**Scope:**

- Centralized API configuration utility
- Axios client with request/response interceptors
- Migration of 4 core services (conversation, audio, auth, progress)
- Typed API responses with TypeScript interfaces
- Retry logic for network failures
- User-friendly error messages

## Architecture Decisions

1. **Axios as HTTP client library** — Industry standard with built-in interceptor support, retry mechanisms, and excellent TypeScript integration; reduces custom code vs. enhanced `fetch` wrappers
2. **Response interceptor for automatic token refresh** — Seamless UX; users never see 401 errors if refresh token valid; prevents disruptive re-login flows
3. **Exponential backoff retry strategy** — 3 retries with delays of 1s, 2s, 4s for transient network failures; prevents overwhelming backend during outages
4. **TypeScript interfaces for all responses** — Compile-time type safety catches API contract violations early; improves IDE autocomplete and refactoring confidence

## Technical Implementation

### Architecture

```
Frontend Components
    ↓
Service Layer (conversationService, audioService, authService, progressService)
    ↓
API Client (api.client.ts)
    ↓
[Request Interceptor] → Add auth headers, request ID
    ↓
Axios HTTP Request
    ↓
[Response Interceptor] → Handle 401 (refresh token), retry on network error
    ↓
Backend API (Express + Prisma)
```

**Key Components:**

1. **API Config** (`src/config/api.config.ts`)
   - Environment-aware base URL resolution
   - Global timeout (10s default)
   - Credentials configuration (httpOnly cookies)

2. **API Client** (`src/services/api.client.ts`)
   - Axios instance with base config
   - Request interceptor: Attach request ID for tracing
   - Response interceptor: Token refresh on 401
   - Response interceptor: Retry on network error (3x max)

3. **Service Migration** (4 services total)
   - Replace `fetch()` calls with `apiClient.get/post/put/delete`
   - Add TypeScript interfaces for request/response types
   - Remove duplicated error handling (handled by interceptors)

### API Endpoints (No changes - interface only)

All existing endpoints remain unchanged; this epic refactors **how** frontend calls them:

- `GET /api/conversations/:wordId`
- `POST /api/audio/generate`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `GET /api/progress`
- `POST /api/progress/review`

### Component Relationships

```
api.config.ts (configuration)
    ↓
api.client.ts (Axios instance + interceptors)
    ↓
conversationService.ts
audioService.ts
authService.ts
    ↓
useProgressActions.ts (hooks)
    ↓
React Components
```

**Data Flow Example (Token Refresh):**

```
1. User action triggers API call (e.g., fetch conversation)
2. apiClient.get('/api/conversations/123')
3. Backend returns 401 (token expired)
4. Response interceptor catches 401
5. Calls refreshAuthToken() (POST /api/auth/refresh)
6. Receives new access token (httpOnly cookie)
7. Retries original request with new token
8. Success → returns data to component
```

### Dependencies

**New Dependencies:**

- `axios` (^1.6.0) - HTTP client
- `@types/axios` - TypeScript definitions

**Impacted Files:**

- `src/config/api.ts` (update to export Axios config)
- `src/services/axiosClient.ts` (new - replaces ApiClient)
- `src/features/mandarin/services/conversationService.ts` (migrate from ApiClient)
- `src/features/mandarin/services/audioService.ts` (migrate from ApiClient)
- `src/features/mandarin/services/progressService.ts` (migrate from authFetch)
- `src/features/mandarin/hooks/useProgressActions.ts` (update imports)
- `src/features/auth/utils/authFetch.ts` (deprecated, keep for rollback)
- `src/services/apiClient.ts` (deprecated, keep for rollback)

### Testing Strategy

**Unit Tests:**

- `api.client.test.ts` - Test interceptors in isolation
  - Token refresh interceptor triggers on 401
  - Retry interceptor retries 3x on network error
  - Error transformation produces user-friendly messages

**Integration Tests:**

- `conversationService.test.ts` - Mock Axios, verify typed responses
- `authService.test.ts` - Verify token refresh flow end-to-end

**Manual Testing:**

- Trigger 401 by expiring token manually
- Disconnect network, verify retry behavior
- Verify typed responses in IDE (autocomplete working)

### Performance Considerations

**Improvements:**

- Retry logic reduces failed requests due to transient errors
- Automatic token refresh eliminates unnecessary re-login flows

**Tradeoffs:**

- Retries increase latency for genuine failures (max 7s additional delay)
- Token refresh adds 1 extra round-trip on first 401 (acceptable tradeoff for UX)

**Monitoring:**

- Log retry attempts to backend for monitoring
- Track token refresh frequency (high rate indicates expiry issues)

### Security Considerations

- **httpOnly cookies**: Token storage unchanged (already secure)
- **Retry limits**: Prevent infinite loops with `_retry` flag
- **Error messages**: Avoid exposing sensitive backend details in user-facing errors

### Migration Strategy

**Phase 1 (Story 14.1):**

1. Create `api.config.ts` and `api.client.ts`
2. Add Axios dependency
3. No breaking changes (foundation only)

**Phase 2 (Story 14.2):**

1. Migrate `conversationService.ts` to Axios
2. Migrate `audioService.ts` to Axios
3. Migrate `authService.ts` to Axios
4. Remove `authFetch.ts` wrapper

**Phase 4 (Story 14.4):**

1. Migrate `useProgressActions.ts` to Axios
2. Add typed interfaces for progress API
3. Verify all `fetch()` calls removed

**Rollback Plan:**

- Each service can revert to `fetch()` independently
- Axios client optional until all services migrated
- Keep old service code in git history for emergency rollback

### Documentation Updates

- Update `docs/architecture.md` with API client architecture
- Update `docs/guides/code-conventions.md` with Axios patterns
- Add examples to `docs/guides/api-client-guide.md` (new)

---

**Related Documentation:**

- [Epic 14 BR](../../business-requirements/epic-14-api-modernization/README.md)
- [Story 14.1 Implementation](./story-14-1-jest-to-vitest-migration.md)
- [Story 14.2 Implementation](./story-14-2-centralized-api-config.md)
- [Story 14.3 Implementation](./story-14-3-axios-interceptors.md)
- [Story 14.4 Implementation](./story-14-4-progress-service-migration.md)
- [Story 14.5 Implementation](./story-14-5-conversation-service-migration.md)
- [Story 14.6 Implementation](./story-14-6-audio-service-migration.md)
- [Architecture Overview](../../architecture.md)
- [Code Conventions](../../guides/code-conventions.md)
