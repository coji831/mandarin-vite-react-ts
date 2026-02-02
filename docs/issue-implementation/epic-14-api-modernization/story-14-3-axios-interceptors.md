# Implementation 14-2: Axios Interceptors (Auth Refresh + Retry Logic)

## Technical Scope

Implement Axios request/response interceptors to handle automatic JWT token refresh and network error retry logic, eliminating manual token management in services.

**Files Modified:**

- `apps/frontend/src/services/axiosClient.ts` (add interceptors)
- `apps/frontend/src/features/auth/utils/authFetch.ts` (extract token utilities)

**Files Created:**

- `apps/frontend/src/services/interceptors/authInterceptor.ts` (auth logic)
- `apps/frontend/src/services/interceptors/retryInterceptor.ts` (retry logic)
- `apps/frontend/src/services/__tests__/authInterceptor.test.ts` (unit tests)
- `apps/frontend/src/services/__tests__/retryInterceptor.test.ts` (unit tests)

## Implementation Details

### 1. Extract Token Utilities

```typescript
// apps/frontend/src/features/auth/utils/tokenUtils.ts (new file)
import { API_ENDPOINTS } from "@mandarin/shared-constants";

const TOKEN_KEY = "accessToken";
let onLogout: (() => void) | null = null;

/**
 * Decode JWT and check if expired
 */
export function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const expiryTime = payload.exp * 1000;
    const now = Date.now();
    // Buffer: refresh 30 seconds before actual expiry
    return expiryTime - 30000 < now;
  } catch {
    return true;
  }
}

/**
 * Get token from localStorage
 */
export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Store token in localStorage
 */
export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

/**
 * Remove token from localStorage
 */
export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * Register logout callback (called when refresh fails)
 */
export function setLogoutHandler(handler: () => void): void {
  onLogout = handler;
}

/**
 * Clear logout handler (on unmount)
 */
export function clearLogoutHandler(): void {
  onLogout = null;
}

/**
 * Trigger logout (if handler registered)
 */
export function triggerLogout(): void {
  if (onLogout) {
    onLogout();
  }
}

/**
 * Refresh access token using httpOnly cookie
 */
let refreshPromise: Promise<string> | null = null;

export async function refreshAccessToken(): Promise<string> {
  // Prevent multiple simultaneous refresh requests
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";
      const response = await fetch(API_BASE + API_ENDPOINTS.AUTH_REFRESH, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Token refresh failed");
      }

      const data = await response.json();
      const { accessToken } = data.data;

      setStoredToken(accessToken);
      return accessToken;
    } catch (error) {
      clearStoredToken();
      triggerLogout();
      throw error;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}
```

### 2. Request Interceptor (Auth Headers)

```typescript
// apps/frontend/src/services/interceptors/authInterceptor.ts
import { InternalAxiosRequestConfig } from "axios";
import {
  getStoredToken,
  isTokenExpired,
  refreshAccessToken,
} from "../../features/auth/utils/tokenUtils";

/**
 * Request interceptor: Attach Authorization header with valid token
 * Automatically refreshes token if expired
 */
export async function authRequestInterceptor(
  config: InternalAxiosRequestConfig,
): Promise<InternalAxiosRequestConfig> {
  let token = getStoredToken();

  // If token exists and is expired, refresh it
  if (token && isTokenExpired(token)) {
    try {
      token = await refreshAccessToken();
    } catch (error) {
      console.error("[authInterceptor] Token refresh failed, proceeding without token");
      // Proceed without token (request will likely 401)
    }
  }

  // Attach token to Authorization header
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
}
```

### 3. Response Interceptor (Token Refresh on 401)

```typescript
// apps/frontend/src/services/interceptors/authInterceptor.ts (continued)
import { AxiosError, AxiosResponse } from "axios";
import { apiClient } from "../axiosClient";

/**
 * Response interceptor: Handle 401 by refreshing token and retrying request
 */
export async function authResponseErrorInterceptor(error: AxiosError): Promise<any> {
  const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

  // If 401 and not already retried, attempt token refresh
  if (error.response?.status === 401 && !originalRequest._retry) {
    originalRequest._retry = true; // Prevent infinite loop

    try {
      const newToken = await refreshAccessToken();

      // Update Authorization header and retry original request
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      // Refresh failed, logout user
      console.error("[authInterceptor] Token refresh failed, user must re-authenticate");
      return Promise.reject(refreshError);
    }
  }

  return Promise.reject(error);
}
```

### 4. Retry Interceptor (Network Errors)

```typescript
// apps/frontend/src/services/interceptors/retryInterceptor.ts
import { AxiosError, InternalAxiosRequestConfig } from "axios";
import { apiClient } from "../axiosClient";

const MAX_RETRIES = 3;
const RETRY_DELAY_BASE = 1000; // 1 second

/**
 * Exponential backoff delay calculation
 * Retry 1: 1s, Retry 2: 2s, Retry 3: 4s
 */
function getRetryDelay(retryCount: number): number {
  return RETRY_DELAY_BASE * Math.pow(2, retryCount - 1);
}

/**
 * Check if error is retryable (network error, timeout, or 5xx)
 */
function isRetryableError(error: AxiosError): boolean {
  if (!error.response) {
    // Network error (no response received)
    return true;
  }

  const status = error.response.status;
  // Retry on 5xx server errors and 408 Request Timeout
  return status >= 500 || status === 408;
}

/**
 * Response error interceptor: Retry on network failures with exponential backoff
 */
export async function retryInterceptor(error: AxiosError): Promise<any> {
  const config = error.config as InternalAxiosRequestConfig & { _retryCount?: number };

  // Check if error is retryable and haven't exceeded max retries
  if (!isRetryableError(error)) {
    return Promise.reject(error);
  }

  config._retryCount = config._retryCount || 0;

  if (config._retryCount >= MAX_RETRIES) {
    console.error(`[retryInterceptor] Max retries (${MAX_RETRIES}) exceeded`);
    return Promise.reject(error);
  }

  config._retryCount += 1;
  const delay = getRetryDelay(config._retryCount);

  console.log(
    `[retryInterceptor] Retrying request (${config._retryCount}/${MAX_RETRIES}) after ${delay}ms`,
    config.url,
  );

  // Wait for delay, then retry
  await new Promise((resolve) => setTimeout(resolve, delay));
  return apiClient(config);
}
```

### 5. Register Interceptors

```typescript
// apps/frontend/src/services/axiosClient.ts (updated)
import axios, { AxiosInstance } from "axios";
import { API_CONFIG } from "../config/api";
import {
  authRequestInterceptor,
  authResponseErrorInterceptor,
} from "./interceptors/authInterceptor";
import { retryInterceptor } from "./interceptors/retryInterceptor";

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
  withCredentials: API_CONFIG.withCredentials,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: Attach auth headers
apiClient.interceptors.request.use(authRequestInterceptor, (error) => Promise.reject(error));

// Response interceptors: Handle 401 refresh, then retry logic
apiClient.interceptors.response.use(
  (response) => response, // Pass through successful responses
  async (error) => {
    // First, try auth refresh (handles 401)
    try {
      return await authResponseErrorInterceptor(error);
    } catch (authError) {
      // If auth refresh failed or error is not 401, try retry logic
      return retryInterceptor(authError as any);
    }
  },
);

export default apiClient;
```

## Architecture Integration

```
API Request Flow (Story 14.3):

Component → apiClient.get('/api/v1/progress')
                ↓
     [Request Interceptor]
            ↓
     Check token expiry → Refresh if needed → Attach Authorization header
            ↓
     Make HTTP request
            ↓
     [Response Interceptor Chain]
            ↓
     401? → Refresh token → Retry request
            ↓
     Network error? → Exponential backoff → Retry (max 3x)
            ↓
     Return response or throw error
```

## Technical Challenges & Solutions

### Challenge 1: Race Condition on Multiple 401s

**Problem:** If user makes 3 simultaneous requests and all receive 401 (token expired), each would trigger separate token refresh calls, causing:

- 3 unnecessary refresh requests (backend load)
- Potential race condition (concurrent localStorage writes)

**Solution:** Implement `refreshPromise` singleton pattern. First 401 creates refresh promise; subsequent 401s await same promise instead of creating new refresh requests.

```typescript
let refreshPromise: Promise<string> | null = null;

export async function refreshAccessToken(): Promise<string> {
  if (refreshPromise) {
    return refreshPromise; // Wait for existing refresh
  }

  refreshPromise = (async () => {
    // ... refresh logic
  })();

  return refreshPromise;
}
```

### Challenge 2: Infinite Retry Loop Prevention

**Problem:** If retry interceptor retries indefinitely on persistent 5xx errors, app could hang forever.

**Solution:** Add `_retryCount` property to request config. Track attempts and reject after 3 retries. Mark auth refreshed requests with `_retry` flag to prevent double-retry.

```typescript
config._retryCount = config._retryCount || 0;
if (config._retryCount >= MAX_RETRIES) {
  return Promise.reject(error);
}
```

### Challenge 3: Interceptor Execution Order

**Problem:** Auth interceptor and retry interceptor both handle errors. Need to ensure auth refresh happens before retry logic.

**Solution:** Chain interceptors in response error handler. Try auth refresh first; if it fails or error is not 401, pass to retry interceptor.

```typescript
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    try {
      return await authResponseErrorInterceptor(error); // Auth first
    } catch (authError) {
      return retryInterceptor(authError); // Then retry
    }
  },
);
```

### Challenge 4: Token Refresh Uses fetch, Not Axios

**Problem:** Token refresh endpoint must not use `apiClient` (would create circular dependency - refresh interceptor calling refresh endpoint that triggers refresh interceptor).

**Solution:** Use native `fetch()` for refresh endpoint only. This is isolated in `tokenUtils.ts` and explicitly documented.

## Testing Implementation

### Unit Tests - Auth Interceptor

```typescript
// apps/frontend/src/services/__tests__/authInterceptor.test.ts
import MockAdapter from "axios-mock-adapter";
import { apiClient } from "../axiosClient";
import { setStoredToken, clearStoredToken } from "../../features/auth/utils/tokenUtils";

describe("authInterceptor", () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(apiClient);
    clearStoredToken();
  });

  afterEach(() => {
    mock.restore();
  });

  it("should attach Authorization header with valid token", async () => {
    const token = "valid.jwt.token";
    setStoredToken(token);

    mock.onGet("/test").reply((config) => {
      expect(config.headers.Authorization).toBe(`Bearer ${token}`);
      return [200, { success: true }];
    });

    await apiClient.get("/test");
  });

  it("should retry request after token refresh on 401", async () => {
    const expiredToken = "expired.jwt.token";
    const newToken = "refreshed.jwt.token";
    setStoredToken(expiredToken);

    // Mock refresh endpoint
    mock.onPost("/api/v1/auth/refresh").reply(200, {
      data: { accessToken: newToken },
    });

    // First call returns 401, second succeeds
    mock
      .onGet("/api/v1/progress")
      .replyOnce(401)
      .onGet("/api/v1/progress")
      .reply(200, { success: true });

    const response = await apiClient.get("/api/v1/progress");
    expect(response.status).toBe(200);
  });

  it("should reject if token refresh fails", async () => {
    setStoredToken("expired.token");

    mock.onPost("/api/v1/auth/refresh").reply(401); // Refresh fails
    mock.onGet("/api/v1/progress").reply(401);

    await expect(apiClient.get("/api/v1/progress")).rejects.toThrow();
  });
});
```

### Unit Tests - Retry Interceptor

```typescript
// apps/frontend/src/services/__tests__/retryInterceptor.test.ts
import MockAdapter from "axios-mock-adapter";
import { apiClient } from "../axiosClient";

describe("retryInterceptor", () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(apiClient);
  });

  afterEach(() => {
    mock.restore();
  });

  it("should retry on network error with exponential backoff", async () => {
    let attempts = 0;

    mock.onGet("/test").reply(() => {
      attempts++;
      if (attempts < 3) {
        return [500, { error: "Server error" }];
      }
      return [200, { success: true }];
    });

    const response = await apiClient.get("/test");
    expect(attempts).toBe(3);
    expect(response.status).toBe(200);
  });

  it("should reject after max retries exceeded", async () => {
    mock.onGet("/test").reply(500); // Always fail

    await expect(apiClient.get("/test")).rejects.toThrow();
  });

  it("should not retry on 4xx client errors", async () => {
    let attempts = 0;

    mock.onGet("/test").reply(() => {
      attempts++;
      return [400, { error: "Bad request" }];
    });

    await expect(apiClient.get("/test")).rejects.toThrow();
    expect(attempts).toBe(1); // No retry
  });
});
```

### Manual Testing Checklist

- [ ] **Expired Token Scenario**: Modify localStorage token to expired JWT, make API call, verify auto-refresh
- [ ] **Network Failure Scenario**: Throttle network in DevTools, verify retry with exponential backoff
- [ ] **Multiple 401s**: Make 3 simultaneous API calls with expired token, verify only 1 refresh request (check Network tab)
- [ ] **Refresh Failure**: Delete refresh token cookie, make API call, verify user logged out
- [ ] **Max Retries**: Simulate persistent 500 error, verify request fails after 3 retries

## Performance Considerations

**Improvements:**

- Reduces latency for transient failures (auto-retry vs. user manual retry)
- Eliminates re-authentication flow (saves ~2-3 seconds per session)
- Concurrent refresh requests coalesced (reduces backend load)

**Tradeoffs:**

- Retry delays add up to 7s max (1s + 2s + 4s) for persistent failures
- Token refresh adds 1 round trip on first 401 (~100-300ms)

**Acceptable tradeoffs:** UX improvements far outweigh minimal latency increase for edge cases.

## Related Documentation

- [Epic 14 BR](../../business-requirements/epic-14-api-modernization/README.md)
- [Epic 14 Implementation](./README.md)
- [Story 14.3 BR](../../business-requirements/epic-14-api-modernization/story-14-3-axios-interceptors.md)
- [Story 14.2 Implementation](./story-14-1-centralized-api-config.md) (Previous)
- [Story 14.3 Implementation](./story-14-4-progress-service-migration.md) (Next)
- [Code Conventions Guide](../../guides/code-conventions.md)
