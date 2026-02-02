# Testing Guide

Setup and best practices for testing React components, hooks, and backend services.

## Frontend Testing (Vitest)

**As of Epic 14**: The frontend uses **Vitest** for all testing (migrated from Jest).

### Quick Start (Frontend)

```bash
# In apps/frontend
npm test                      # Run all tests
npm test -- <path>            # Run specific file
npm run test:coverage         # Check coverage
npm run test:ui               # Interactive UI test runner
npm run test:watch            # Watch mode (auto-rerun on changes)
```

### Configuration

**Location**: `apps/frontend/vite.config.ts`

```typescript
/// <reference types="vitest" />
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true, // describe, it, expect available without imports
    environment: "jsdom", // Simulate browser DOM for React
    setupFiles: "./src/setupTests.ts", // Runs before each test file
    clearMocks: true, // Auto-reset mocks between tests
    mockReset: true,
    restoreMocks: true,
    testTimeout: 10000, // 10s timeout (industry standard)
    coverage: {
      provider: "v8", // Fast coverage provider
      reporter: ["text", "json", "html"],
      thresholds: {
        branches: 40,
        functions: 40,
        lines: 40,
        statements: 40,
      },
    },
  },
});
```

**Setup File**: `apps/frontend/src/setupTests.ts`

```typescript
import "@testing-library/jest-dom";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock browser APIs (required for many components)
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

global.IntersectionObserver = class IntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
} as any;
```

### Jest to Vitest Migration

**When migrating tests from Jest**:

1. **Import changes**:

   ```typescript
   // Before (Jest)
   import { jest } from "@jest/globals";

   // After (Vitest)
   import { vi } from "vitest";
   ```

2. **Mock function replacements**:

   ```typescript
   // Before (Jest)
   const mockFn = jest.fn();
   jest.spyOn(module, "method");
   jest.clearAllMocks();
   jest.resetAllMocks();
   jest.mock("./module");

   // After (Vitest)
   const mockFn = vi.fn();
   vi.spyOn(module, "method");
   vi.clearAllMocks();
   vi.resetAllMocks();
   vi.mock("./module");
   ```

3. **Everything else stays the same**:
   - `describe`, `it`, `expect` work identically
   - React Testing Library unchanged
   - `beforeEach`, `afterEach` unchanged

**Automated migration script**:

```bash
# PowerShell (Windows)
Get-ChildItem -Path apps/frontend/src -Filter *.test.ts* -Recurse | ForEach-Object {
  $content = Get-Content $_.FullName -Raw
  $content = $content -replace 'jest\.fn\(', 'vi.fn('
  $content = $content -replace 'jest\.spyOn\(', 'vi.spyOn('
  $content = $content -replace 'jest\.mock\(', 'vi.mock('
  $content = $content -replace 'jest\.clearAllMocks\(', 'vi.clearAllMocks('
  $content = $content -replace 'jest\.resetAllMocks\(', 'vi.resetAllMocks('
  Set-Content -Path $_.FullName -Value $content
}
```

### Component Testing with Context Providers

**Problem**: Component tests fail with "must be used within Provider" errors.

**Solution**: Wrap components in required context providers:

```typescript
import { render, screen } from '@testing-library/react';
import { ProgressStateContext } from '../../context';
import { RootState } from '../../reducers';
import { VocabularyCard } from '../VocabularyCard';

const createMockState = (overrides = {}): RootState => ({
  progress: { wordsById: {}, wordIds: [] },
  user: { userId: null, preferences: {} },
  ui: { selectedList: null, selectedWords: [], isLoading: false, error: '' },
  vocabLists: { itemsById: {}, itemIds: [] },
  ...overrides,
});

it('renders correctly', () => {
  const mockState = createMockState({
    progress: {
      wordsById: {
        word1: { wordId: 'word1', confidence: 1, lastReviewed: new Date().toISOString() },
      },
      wordIds: ['word1'],
    },
  });

  render(
    <ProgressStateContext.Provider value={mockState}>
      <VocabularyCard list={{...}} onSelect={() => {}} />
    </ProgressStateContext.Provider>
  );

  expect(screen.getByText('Test List')).toBeInTheDocument();
});
```

## Backend Testing (Vitest)

The backend uses **Vitest** for unit and integration testing.

### Quick Start (Backend)

```bash
# In apps/backend
npm test                      # Run all tests
npm test -- <path>            # Run specific file
npm run test:coverage         # Check coverage
```

### Mocking Strategy (Clean Architecture)

We follow a hierarchical mocking pattern to ensure isolation:

1.  **Controllers**: Mock the **Service layer**. Test HTTP status codes, cookie management, and request/response mapping.
2.  **Services**: Mock the **Repository layer** and any **Infrastructure clients** (Gemini, GCS). Test business logic, validation, and orchestration.
3.  **Infrastructure**: Test in isolation. Mock external network calls (SDKs, APIs) but use real logic for side-effect free services (JWT, Password hashing).

#### Example: Mocking Repositories in Services

```javascript
const mockRepository = {
  findUserByEmail: vi.fn(),
  create: vi.fn(),
};
const service = new AuthService(mockRepository, jwtService, passwordService);
```

### Performance Optimization

- **Bcrypt Hashing**: Regular hashing is intentionally slow. In unit tests, this can bottleneck the suite. If performance becomes an issue (>1s per file), consider using a decreased cost factor for testing if the logic allows.
- **Test Isolation**: Prefer `vi.mock()` for external modules to prevent side effects and improve speed.

### ESM Module Mocking (Epic 13 Discovery)

**Problem**: `jest.fn()` and automated mocking patterns can cause corruption when testing ES modules with complex dependencies.

**Solution**: Use manual mock patterns for service-layer tests:

```javascript
// tests/services/AuthService.test.js
const mockRepository = {
  findUserByEmail: vi.fn(),
  create: vi.fn(),
};

const mockJwtService = {
  generateAccessToken: vi.fn(),
  generateRefreshToken: vi.fn(),
};

const service = new AuthService(mockRepository, mockJwtService, passwordService);
```

**Why**: Manual mocks provide explicit control over dependencies and prevent module resolution issues in Vitest/Jest with ESM.

**When to use**:

- Service-layer unit tests that inject repositories/clients
- Controller tests that inject services
- Any test requiring isolation of business logic from infrastructure

## HTTP Client Testing (axios-mock-adapter)

**When to Use**: Testing Axios interceptors, API service layers, error handling

### Basic Setup

```typescript
import MockAdapter from "axios-mock-adapter";
import { apiClient } from "../services/axiosClient";

describe("apiClient", () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(apiClient);
    localStorage.clear();
  });

  afterEach(() => {
    mock.restore(); // Always restore to avoid leaking mocks
  });

  it("should handle successful response", async () => {
    mock.onGet("/users").reply(200, { success: true, data: { users: [] } });

    const response = await apiClient.get("/users");
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
  });
});
```

### Testing Request Interceptors

```typescript
it("should add Authorization header when token exists", async () => {
  localStorage.setItem("accessToken", "test-token-123");

  mock.onGet("/protected").reply((config) => {
    expect(config.headers!.Authorization).toBe("Bearer test-token-123");
    return [200, { success: true, data: {} }];
  });

  await apiClient.get("/protected");
});

it("should make request without Authorization header when no token", async () => {
  mock.onGet("/public").reply((config) => {
    expect(config.headers!.Authorization).toBeUndefined();
    return [200, { success: true, data: {} }];
  });

  await apiClient.get("/public");
});
```

### Testing Error Handling

```typescript
it("should normalize 500 server errors", async () => {
  mock.onGet("/error").reply(500, { message: "Internal server error" });

  try {
    await apiClient.get("/error");
    expect.fail("Should have thrown error");
  } catch (error) {
    const normalized = error as NormalizedError;
    expect(normalized.status).toBe(500);
    expect(normalized.message).toBe("Internal server error");
    expect(normalized.code).toBe("ERR_BAD_RESPONSE");
  }
});

it("should normalize network errors", async () => {
  mock.onGet("/network-fail").networkError();

  try {
    await apiClient.get("/network-fail");
    expect.fail("Should have thrown error");
  } catch (error) {
    const normalized = error as NormalizedError;
    expect(normalized.code).toBe("ERR_NETWORK");
    expect(normalized.message).toBeTruthy();
  }
});
```

### axios-mock-adapter Limitations

**Problem 1: Network errors don't set error.code**

```typescript
// ❌ This doesn't work for testing retry logic
mock.onGet("/test").networkError();
// Mock creates error without error.code property
// Interceptor checks: error.code === 'ERR_NETWORK' → false
// Retry logic never executes

// ✅ Workaround: Test error normalization instead of retry execution
it("should normalize network errors gracefully", async () => {
  mock.onGet("/network-fail").networkError();
  try {
    await apiClient.get("/network-fail");
  } catch (error) {
    expect(error.code).toBe("ERR_NETWORK");
  }
});
```

**Problem 2: Timeout doesn't match production behavior**

```typescript
// Production: ECONNABORTED error with error.code set
// Mock: Creates generic timeout without code

// ✅ Verify timeout normalization exists
it("should normalize timeout errors with proper code", async () => {
  mock.onGet("/timeout").timeout();
  try {
    await apiClient.get("/timeout");
  } catch (error) {
    expect(error.code).toBe("ECONNABORTED"); // Preserved by interceptor
    expect(error.message).toContain("timeout");
  }
});
```

**Problem 3: Status 0 doesn't trigger network retry**

```typescript
// ❌ Status 0 used by some for network errors, but doesn't match production
mock.onGet("/test").reply(0, null);
// Doesn't set error.response to null (required for network detection)

// ✅ Use .networkError() or .timeout() instead
mock.onGet("/test").networkError(); // Correct pattern
```

**Best Practices for Interceptor Testing:**

1. **Test error normalization, not retry execution**: Mock adapter limitations make testing retry logic unreliable
2. **Verify retry indirectly**: Use console logs or timeout test duration to confirm retries execute
3. **Test 401 refresh separately**: Mock refresh endpoint with `.replyOnce(401).onGet(...).reply(200)` for retry simulation
4. **Use config inspection**: Reply with function `(config) => { expect(config.headers); return [200, {}]; }`
5. **Clear localStorage between tests**: Token state bleeds between test cases

### Testing Token Refresh Flow

```typescript
it("should handle 401 error and normalize message", async () => {
  localStorage.setItem("accessToken", "invalid-token");

  mock.onGet("/protected").reply(401, { message: "Token invalid" });
  mock.onPost("/api/v1/auth/refresh").reply(401, { message: "Refresh failed" });

  try {
    await apiClient.get("/protected");
    expect.fail("Should have thrown error");
  } catch (error) {
    const normalized = error as NormalizedError;
    expect(normalized.status).toBe(401);
    expect(normalized.message).toBe("Token invalid");
  }
});
```

**Why this works:**

- Tests reactive 401 handling path (refresh attempt)
- Verifies error normalization after refresh failure
- Avoids testing proactive refresh (requires JWT decoding, complex setup)

### Performance Considerations

**Test Duration with Retry Logic:**

- Exponential backoff delays: 1s + 2s + 4s = 7s per retry test
- Timeout tests: 7s+ per test (waiting for actual timeout)
- **Mitigation**: Use `testTimeout: 10000` in vitest.config.ts
- **Tip**: Group slow tests in separate suite, run in parallel

```typescript
describe("Network Retry Logic", () => {
  it("should normalize timeout errors with proper code", async () => {
    mock.onGet("/timeout").timeout();
    // Test takes 7+ seconds due to retry delays
  }, 10000); // Explicit 10s timeout for this test
});
```

---

## Component Testing (React Testing Library)

```typescript
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "./Button";

test("calls onClick when clicked", async () => {
  const handleClick = jest.fn();
  render(<Button onClick={handleClick}>Click me</Button>);

  await userEvent.click(screen.getByRole("button"));

  expect(handleClick).toHaveBeenCalledTimes(1);
});
```

**With Context:**

```typescript
function renderWithContext(ui: React.ReactElement) {
  return render(<AppProvider>{ui}</AppProvider>);
}

test("displays user data from context", () => {
  renderWithContext(<UserProfile />);
  expect(screen.getByText("John Doe")).toBeInTheDocument();
});
```

## Hook Testing

```typescript
import { renderHook, act } from "@testing-library/react";
import { useCounter } from "./useCounter";

test("increments counter", () => {
  const { result } = renderHook(() => useCounter());

  act(() => {
    result.current.increment();
  });

  expect(result.current.count).toBe(1);
});
```

## React Strict Mode Testing

React Strict Mode intentionally double-mounts components in development to expose side effects and missing cleanup.

**Quick Fix:** Ensure useEffect cleanup functions properly cancel async operations.

**Example:**

```typescript
useEffect(() => {
  const controller = new AbortController();

  fetch("/api/data", { signal: controller.signal })
    .then((data) => setState(data))
    .catch((err) => {
      if (err.name === "AbortError") return; // Ignore aborts
    });

  return () => controller.abort(); // Cleanup on unmount
}, []);
```

**When testing with Strict Mode:**

```typescript
// API calls may happen twice in tests
expect(mockFetch).toHaveBeenCalledTimes(2); // Double-mount behavior
```

📖 **Deep Dive:** See [React Strict Mode Deep Dive](../knowledge-base/frontend-react-patterns.md#react-strict-mode-deep-dive) for:

- Why double-mounting happens
- Common race conditions and solutions
- AbortController patterns
- Testing strategies for concurrent features

## Backend Testing

```typescript
import request from "supertest";
import { app } from "../server";

describe("Auth API", () => {
  test("POST /api/auth/login returns token", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: "test@example.com", password: "password" });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("user");
  });
});
```

## Best Practices

**1. Test Behavior, Not Implementation**

```typescript
// ❌ Bad: Testing implementation
expect(component.state.count).toBe(1);

// ✅ Good: Testing behavior
expect(screen.getByText("Count: 1")).toBeInTheDocument();
```

**2. Use Accessible Queries**

```typescript
// ✅ Preferred (accessible)
screen.getByRole("button", { name: /submit/i });
screen.getByLabelText("Email");

// ⚠️ Fallback only
screen.getByTestId("submit-button");
```

**3. Wait for Async Updates**

```typescript
await waitFor(() => {
  expect(screen.getByText("Loaded")).toBeInTheDocument();
});
```

**4. Mock External Dependencies**

```typescript
jest.mock("../services/api", () => ({
  fetchUser: jest.fn().mockResolvedValue({ id: 1, name: "John" }),
}));
```

## Troubleshooting

**"Not wrapped in act(...)"**

- Use `waitFor` for async updates
- Ensure all state updates are inside `act()`

**Tests pass individually but fail together**

- Add `afterEach(() => jest.clearAllMocks())`
- Clean up side effects in `afterEach`

**"Can't perform state update on unmounted component"**

- Add cleanup functions in `useEffect`
- Use AbortController for fetch requests

## Reference

- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)

**Learn more:**

- [React Patterns](../knowledge-base/frontend-react-patterns.md) - Strict Mode, cleanup patterns
- [Testing Guide (Full)](./testing-guide-detailed.md) - Advanced patterns, integration tests

---

**Last Updated:** January 9, 2026
