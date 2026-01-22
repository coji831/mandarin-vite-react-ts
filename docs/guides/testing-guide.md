# Testing Guide

Setup and best practices for testing React components, hooks, and backend services.

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

## Configuration (Frontend)

**jest.config.js:**

```javascript
export default {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  roots: ["<rootDir>/src"],
  setupFilesAfterEnv: ["<rootDir>/src/setupTests.ts"],
  transform: {
    "^.+\\.(ts|tsx)$": ["ts-jest", { tsconfig: { jsx: "react-jsx" } }],
  },
  moduleNameMapper: {
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
    "^@/(.*)$": "<rootDir>/src/$1",
  },
};
```

**setupTests.ts:**

```typescript
import "@testing-library/jest-dom";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });
```

## Component Testing

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

**Enable Strict Mode in tests:**

```typescript
function renderWithStrictMode(ui: React.ReactElement) {
  return render(<React.StrictMode>{ui}</React.StrictMode>);
}
```

**Test cleanup:**

```typescript
test("cleans up on unmount", () => {
  const cleanup = jest.fn();

  function Component() {
    useEffect(() => cleanup, []);
    return null;
  }

  const { unmount } = render(<Component />);
  unmount();

  expect(cleanup).toHaveBeenCalled();
});
```

**Handle double-mounting:**

```typescript
test("handles double API calls", async () => {
  const mockFetch = jest.fn().mockResolvedValue({ json: async () => ({}) });
  global.fetch = mockFetch;

  renderWithStrictMode(<MyComponent />);

  await waitFor(() => {
    expect(mockFetch).toHaveBeenCalledTimes(2); // Strict Mode doubles calls
  });
});
```

**Learn more:** [React Strict Mode Deep Dive](../knowledge-base/frontend-react-patterns.md#react-strict-mode-deep-dive) - Why double-mounting, race conditions, cleanup patterns

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
