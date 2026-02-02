# Implementation 14-1: Centralized API Config & Axios Client Setup

## Technical Scope

Create foundational Axios client infrastructure with centralized configuration, preparing for interceptor integration in Story 14.2 and service migration in Story 14.3.

**Files Modified:**

- `apps/frontend/src/config/api.ts` (update for Axios compatibility)
- `apps/frontend/package.json` (add axios dependency)

**Files Created:**

- `apps/frontend/src/services/axiosClient.ts` (new Axios instance)
- `apps/frontend/src/services/__tests__/axiosClient.test.ts` (unit tests)

## Implementation Details

### 1. Update API Configuration

```typescript
// apps/frontend/src/config/api.ts
/**
 * Centralized API configuration for frontend
 * Single source of truth for backend URL and request settings
 */

export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3001",
  timeout: 10000, // 10 seconds
  withCredentials: true, // Include cookies for JWT refresh token
} as const;

/**
 * Get full API URL for an endpoint (legacy helper, kept for backward compatibility)
 * @param endpoint - API endpoint (should start with /)
 * @returns Full URL
 */
export function getApiUrl(endpoint: string): string {
  return API_CONFIG.baseURL + endpoint;
}
```

### 2. Create Axios Client Instance

```typescript
// apps/frontend/src/services/axiosClient.ts
import axios, { AxiosInstance } from "axios";
import { API_CONFIG } from "../config/api";

/**
 * Centralized Axios client for all API requests
 * Configured with base URL, timeout, and credentials
 *
 * Usage:
 *   import { apiClient } from '@/services/axiosClient';
 *   const response = await apiClient.get('/api/v1/progress');
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
  withCredentials: API_CONFIG.withCredentials,
  headers: {
    "Content-Type": "application/json",
  },
});

// Default export for backward compatibility
export default apiClient;
```

### 3. Install Axios Dependency

```bash
cd apps/frontend
npm install axios@^1.6.0
npm install --save-dev @types/axios
```

### 4. Unit Tests

```typescript
// apps/frontend/src/services/__tests__/axiosClient.test.ts
import { apiClient } from "../axiosClient";
import { API_CONFIG } from "../../config/api";

describe("axiosClient", () => {
  it("should be configured with correct baseURL", () => {
    expect(apiClient.defaults.baseURL).toBe(API_CONFIG.baseURL);
  });

  it("should be configured with correct timeout", () => {
    expect(apiClient.defaults.timeout).toBe(API_CONFIG.timeout);
  });

  it("should be configured with withCredentials", () => {
    expect(apiClient.defaults.withCredentials).toBe(true);
  });

  it("should have Content-Type header set to application/json", () => {
    expect(apiClient.defaults.headers["Content-Type"]).toBe("application/json");
  });
});
```

## Architecture Integration

```
API_CONFIG (config/api.ts)
       ↓ provides configuration
axiosClient (services/axiosClient.ts)
       ↓ will be used by (Story 14.2+)
[Request Interceptor] → [Response Interceptor]
       ↓ consumed by
[progressService] [conversationService] [audioService]
```

**Current State:**

- Existing `authFetch` and `ApiClient` continue to work
- New `axiosClient` available but not yet used by any service
- No breaking changes to existing functionality

**Next Steps (Story 14.2):**

- Add request interceptor for Authorization headers
- Add response interceptor for token refresh
- Add retry interceptor for network errors

## Technical Challenges & Solutions

### Challenge 1: Maintaining Backward Compatibility

**Problem:** Existing services use `authFetch` and `ApiClient`. Replacing them immediately would require coordinated changes across multiple services, increasing risk of breaking changes.

**Solution:** Create `axiosClient` as a new parallel implementation. Existing services continue using `authFetch` until Story 14.2-14.3 systematically migrate them. This allows incremental adoption and easy rollback if issues arise.

```typescript
// Existing pattern (unchanged in Story 14.2)
import { authFetch } from "../features/auth/utils/authFetch";
const response = await authFetch("/api/v1/progress");

// New pattern (available but not yet used)
import { apiClient } from "../services/axiosClient";
const response = await apiClient.get("/api/v1/progress");
```

### Challenge 2: TypeScript Configuration

**Problem:** Axios has its own TypeScript definitions that might conflict with existing global `fetch` types.

**Solution:** Import Axios types explicitly (`AxiosInstance`) and use TypeScript's path aliases for clean imports. Added `@types/axios` as dev dependency to ensure type definitions are available.

### Challenge 3: Environment Variable Resolution

**Problem:** `VITE_API_URL` may be undefined in certain build configurations, requiring fallback logic.

**Solution:** Reuse existing `API_CONFIG.baseURL` logic with fallback to `http://localhost:3001`. This ensures consistency with current behavior and prevents runtime errors in development.

## Testing Implementation

### Unit Tests

- ✅ Axios instance configuration (baseURL, timeout, withCredentials)
- ✅ Default headers (Content-Type: application/json)
- ✅ Import/export patterns (default and named exports)

### Manual Testing Checklist

- [ ] Run `npm install` in `apps/frontend` to install axios
- [ ] Run `npm test` to verify unit tests pass
- [ ] Build frontend (`npm run build`) to ensure no TypeScript errors
- [ ] Verify existing services still work (auth, progress, conversation)
- [ ] Check browser console for no new errors or warnings

### Rollback Plan

If critical issues discovered:

1. Remove axios dependency: `npm uninstall axios`
2. Delete `axiosClient.ts` file
3. Revert `api.ts` changes (no functional changes made, only comments)
4. Services continue using `authFetch` as before

## Documentation Updates

### Code Conventions Guide

Add to `docs/guides/code-conventions.md`:

````markdown
### API Client Usage

**Preferred (new code):**

```typescript
import { apiClient } from "@/services/axiosClient";

// GET request
const response = await apiClient.get<ProgressResponse>("/api/v1/progress");
const data = response.data;

// POST request with body
const response = await apiClient.post("/api/v1/progress", { wordId: "123" });
```
````

**Legacy (existing code, migrate incrementally):**

```typescript
import { authFetch } from "@/features/auth/utils/authFetch";
const response = await authFetch("/api/v1/progress");
```

````

## Security Requirements (Backend Team)

### CORS Configuration (Required)

Backend must configure CORS to support `withCredentials: true`:

```javascript
// apps/backend/src/index.js
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173", // Exact origin, NOT "*"
  credentials: true, // Required for withCredentials
}));
````

**Why:** Frontend `withCredentials: true` requires backend `Access-Control-Allow-Credentials: true` + specific origin.

### CSRF Protection (Recommended)

**Current:** JWT in httpOnly cookies + SameSite=Strict attribute (implemented in Epic 13)

**Additional (optional):** Add CSRF token header validation:

```javascript
// Backend middleware
const csrfToken = req.headers["x-xsrf-token"];
// Validate against session-bound token
```

**Frontend support:** `apiClient` can add `X-XSRF-TOKEN` header in Phase 2 (Story 14.2b).

### Domain Whitelist

Frontend only sends credentials to trusted domains (configured in `api.ts`):

- `localhost`, `127.0.0.1` (dev)
- `mandarin-app.com` (production)
- `railway.app` (backend hosting)
- `vercel.app` (preview deployments)

**Update whitelist** when adding new deployment domains.

## Performance Considerations

**No performance impact in Story 14.2a:**

- Axios bundle size: ~13KB gzipped (acceptable for features gained)
- No runtime overhead (client created once at module load)
- Existing services unchanged (no regression risk)

**Expected improvements in Story 14.2b:**

- Automatic retries reduce user-perceived latency for transient failures
- Token refresh prevents full re-authentication round trips

## Technical Guidance

**Testing Patterns**: See [Testing Guide - HTTP Client Testing](../../guides/testing-guide.md#http-client-testing-axios-mock-adapter) for axios-mock-adapter setup and error testing patterns.

**Error Normalization Pattern**: Implemented in interceptor to distinguish HTTP errors (use response message) from network errors (use axios error message). See error interceptor implementation for fallback logic.

**Security Pattern**: Conditional `withCredentials` based on domain whitelist. See [Code Conventions - API Client](../../guides/code-conventions.md#api-client-conventions-story-142a) for when to override.

**Monorepo Shared Types**: `@mandarin/shared-types/api` provides `ApiResponse<T>`, `ApiError`, `NormalizedError` for type-safe API contracts across frontend/backend.

## Related Documentation

- [Epic 14 BR](../../business-requirements/epic-14-api-modernization/README.md)
- [Epic 14 Implementation](./README.md)
- [Story 14.2 BR](../../business-requirements/epic-14-api-modernization/story-14-2-centralized-api-config.md)
- [Story 14.2 Implementation](./story-14-3-axios-interceptors.md) (Next)
- [Code Conventions Guide](../../guides/code-conventions.md)

```

```
