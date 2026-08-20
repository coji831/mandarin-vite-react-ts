---
purpose: "API client conventions, error handling, and service layer patterns for frontend-backend communication"
status: active
last-verified: 2026-08-07
type: convention
audience: frontend
---

# API Client & Integration Patterns

**Last Updated:** August 7, 2026
**Purpose:** API client conventions, error handling, and service layer patterns for frontend-backend communication

**Audience:** Frontend developers making API calls and integrating with backend services

> **When to read this:** When you need to make API calls, handle errors, or set up API service layers.

> **Note:** Use `apiClient` for all HTTP requests. See examples below.

---

## API Client Conventions

### Using apiClient (Recommended)

**Preferred for all new API calls:**

```typescript
import { apiClient } from "@/services/axiosClient";

// Type-safe GET request
interface ProgressData {
  masteredWords: number;
  reviewWords: number;
}

// Backend returns data directly — axios wraps the HTTP body as `response.data`
const response = await apiClient.get<ProgressData>("/api/v1/progress");
const progress = response.data; // Type-safe access — direct array/object

// POST with body
await apiClient.post("/api/v1/progress", { wordId: "123", confidence: 0.8 });

// Override timeout for long operations
await apiClient.get("/api/v1/export", { timeout: 30000 }); // 30s for file download
```

> **Warning:** Backend returns data **directly** — do NOT double-unwrap via `response.data.data`. The backend does not use a `{ success, data }` envelope.

### Error Handling

**Standard error handling with normalized errors:**

```typescript
try {
  const response = await apiClient.get<UserData>("/api/v1/user");
  return response.data; // Direct access — no wrapper
} catch (error) {
  const normalized = error as NormalizedError; // Auto-normalized by interceptor
  console.error(normalized.message); // User-friendly message
  console.error(normalized.status); // HTTP status code (if applicable)
  console.error(normalized.code); // Error code (ECONNABORTED, ERR_NETWORK, etc.)

  // Propagate to UI error handler
  throw normalized;
}
```

**Error types handled by interceptor:**

| Error Type       | Status | Message                  | Code             | Handling                 |
| ---------------- | ------ | ------------------------ | ---------------- | ------------------------ |
| Network Error    | -      | Network error            | ECONNABORTED     | Retry or offline state   |
| Timeout          | -      | Request timeout          | ECONNABORTED     | Show timeout message     |
| 400 Bad Request  | 400    | Invalid request          | ERR_BAD_REQUEST  | Validate input and retry |
| 401 Unauthorized | 401    | Authentication required  | ERR_UNAUTHORIZED | Redirect to login        |
| 403 Forbidden    | 403    | Insufficient permissions | ERR_FORBIDDEN    | Show permission error    |
| 404 Not Found    | 404    | Resource not found       | ERR_NOT_FOUND    | Show 404 page            |
| 500 Server Error | 500    | Internal server error    | ERR_SERVER       | Show error and retry     |

### Direct Response Pattern

Backend controllers return data **directly** — no wrapper envelope. Axios places the HTTP body under `response.data`, so you access the data at a single level.

```typescript
// Backend returns: { id: "123", email: "user@example.com", ... }
const response = await apiClient.get<UserProfile>("/api/v1/user");
const user = response.data; // ✅ UserProfile — single access

// Backend returns: [{ wordId: "123", ... }]
const response = await apiClient.get<WordProgress[]>("/api/v1/progress");
const items = response.data; // ✅ WordProgress[] — direct
```

> **Warning:** `response.data.data` is **always wrong** in this project. The backend never wraps responses in `{ success, data }`. If you see `response.data.data` in code, it is likely a migration error from a different pattern.

**Test mocks must match the direct pattern:**

```typescript
// ✅ Correct — mock returns the exact shape the backend returns
mock.onGet("/api/v1/progress").reply(200, mockProgressArray);

// ❌ Incorrect — would require `response.data.data` to access
mock.onGet("/api/v1/progress").reply(200, { success: true, data: mockProgressArray });
```

### Request Configuration

**Override defaults when needed:**

```typescript
// Custom timeout (long operations)
await apiClient.get("/api/v1/export", {
  timeout: 30000, // 30 seconds
});

// Custom headers (rare)
await apiClient.post("/api/v1/webhook", data, {
  headers: { "X-Webhook-Secret": "secret" },
});

// Progress tracking (file uploads)
await apiClient.post("/api/v1/upload", formData, {
  onUploadProgress: (progressEvent) => {
    const percentComplete = (progressEvent.loaded / progressEvent.total) * 100;
    console.log(`Upload: ${percentComplete}% complete`);
  },
});
```

### Response Interceptors

**Automatic handling:**

```typescript
// Token Refresh
// - If 401 received, automatically tries to refresh token
// - Retries original request with new token
// - Only happens once per request (prevents infinite loops)

// Error Normalization
// - All errors normalized to NormalizedError type
// - User-friendly messages extracted
// - HTTP status codes included

// Response Logging
// - Dev mode: logs all responses (configurable)
// - Production: logs only errors
```

---

> **Reference:** See [Backend Conventions](backend.md#error-scoping-pattern) for server-side error handling.

---

## Legacy API Patterns (Deprecating)

**Old pattern (still works but deprecated):**

```typescript
// ❌ Old way - migrate to axiosClient
import { authFetch } from "@/features/auth/utils/authFetch";
const response = await authFetch("/api/v1/progress");

// ✅ New way
import { apiClient } from "@/services/axiosClient";
const response = await apiClient.get("/api/v1/progress");
```

**Migration path:**

1. Identify all uses of deprecated pattern
2. Replace with `apiClient` equivalent
3. Test locally to verify behavior unchanged
4. Run tests to ensure no regressions
5. Commit with message: `refactor(api): migrate authFetch to apiClient`

---

## API Endpoint Patterns

### Request/Response Patterns

**Consistent URL structure:**

```
GET    /api/v1/words                 # List all words
GET    /api/v1/words/:id             # Get specific word
POST   /api/v1/words                 # Create word
PUT    /api/v1/words/:id             # Update word
DELETE /api/v1/words/:id             # Delete word
```

**Pagination (if applicable):**

```typescript
// Request
await apiClient.get("/api/v1/words", {
  params: { page: 1, limit: 20, sort: "pinyin" },
});

// Response (paginated array — direct, no wrapper)
[
  { id: 1, chinese: "你好", pinyin: "nǐ hǎo" },
  { id: 2, chinese: "谢谢", pinyin: "xiè xie" },
];

// Pagination metadata returned via response headers or a `meta` property on the response body
```

**Filtering & Search:**

```typescript
// Request
await apiClient.get("/api/v1/words", {
  params: { hskLevel: "3", search: "你好" },
});

// Response (filtered array — direct, no wrapper)
[{ id: 1, chinese: "你好", pinyin: "nǐ hǎo", hskLevel: "3" }];
```

---

## Service Layer Pattern

**Create typed API clients for feature areas:**

```typescript
// services/radicalsService.ts — real module: apps/frontend/src/features/radicals/services/radicalsService.ts
import { ROUTE_PATTERNS } from "@mandarin/shared-constants";
import { apiClient } from "shared/api";
import { API_CONFIG } from "config";
import type { RadicalData } from "features/radicals";

export const radicalsService = {
  async loadAllRadicals(): Promise<RadicalData[]> {
    const response = await apiClient.get(ROUTE_PATTERNS.radicals, {
      timeout: API_CONFIG.timeouts.sync,
      _skipRetry: true,
    });
    return (response.data ?? []) as RadicalData[]; // Direct access — no wrapper
  },

  async loadRadicalById(id: string): Promise<RadicalData> {
    const response = await apiClient.get(ROUTE_PATTERNS.radicalsById(id), {
      timeout: API_CONFIG.timeouts.sync,
      _skipRetry: true,
    });
    return response.data as RadicalData; // Direct access — no wrapper
  },
};

// Usage in components/hooks
import { radicalsService } from "features/radicals/services";

const radicals = await radicalsService.loadAllRadicals();
```

**Benefits:**

- Centralized API endpoints
- Reusable across components
- Type-safe requests and responses
- Easy to mock in tests
- Error handling in one place

---

## Error Boundaries & Recovery

**For frontend API errors, use error states in UI:**

```typescript
function RadicalsPanel() {
  const [data, setData] = useState<RadicalData[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        setError(null);
        const radicals = await radicalsService.loadAllRadicals();
        setData(radicals);
      } catch (err) {
        const normalized = err as NormalizedError;
        setError(normalized.message || "Failed to load radicals");
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div role="alert">Error: {error}</div>;
  if (!data) return <div>No radicals</div>;

  return <RadicalGrid radicals={data} />;
}
```

> **Reference:** See the [Error Handling Standards in Frontend Conventions](./frontend.md#error-handling-standards) for the complete pattern with `error: unknown` type narrowing.

---

## Testing API Calls

**Mock API calls in tests with Vitest manual mocks or MSW:**

```typescript
import { radicalsService } from "features/radicals/services";

vi.mock("features/radicals/services", () => ({
  radicalsService: {
    loadAllRadicals: vi.fn(),
    loadRadicalById: vi.fn(),
  }
}));

it("displays radicals when API succeeds", async () => {
  // Mock returns the exact shape the backend returns (no wrapper)
  const mockRadicals = [
    { id: "1", glyph: "木", pinyin: "mù", meaning: "tree" }
  ];

  vi.mocked(radicalsService.loadAllRadicals).mockResolvedValue(mockRadicals);

  render(<RadicalsPanel />);

  await waitFor(() => {
    expect(screen.getByText("木")).toBeInTheDocument();
  });
});

it("shows error when API fails", async () => {
  const error = new Error("Network error");
  vi.mocked(radicalsService.loadAllRadicals).mockRejectedValue(error);

  render(<RadicalsPanel />);

  await waitFor(() => {
    expect(screen.getByRole("alert")).toHaveTextContent("Network error");
  });
});
```

> **Tip:** When using MSW (Mock Service Worker), handlers must also return data directly — no envelope. See [Frontend Testing Guide](../testing/frontend.md) for MSW setup patterns.

---

## Key Resources

- [axios Documentation](https://axios-http.com)
- [axios Interceptors](https://axios-http.com/docs/interceptors)
- See also: [Frontend-Backend Integration Guide](../integrations/frontend-backend.md) for CORS & authentication
- See also: [Backend Conventions](backend.md#error-scoping-pattern) for server-side error handling
