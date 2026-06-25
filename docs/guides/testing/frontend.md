# Frontend Testing Guide

**Last Updated:** June 3, 2026  
**Audience:** Frontend developers writing tests for React components, hooks, and pages

> **When to read this:** When you need to write or run frontend tests using Vitest and React Testing Library.

Prerequisites

- See frontend setup: `apps/frontend/README.md` and [Environment Setup Guide](../getting-started/environment-setup.md)

1. Test Framework & Configuration

- Vitest with `jsdom` environment. See `apps/frontend/vite.config.ts` for the canonical config.
- Setup file: `apps/frontend/src/setupTests.ts` (DOM mocks, global cleanup).

2. React Component Testing (React Testing Library)

- Use RTL queries prioritizing accessibility: `getByRole`, `getByLabelText`, `getByText`.
- Wrap components in required providers; create `renderWithProviders` helper to centralize providers and default state.

Example `renderWithProviders`:

```ts
import { render } from '@testing-library/react';
import { AppProvider } from '../src/context';

export function renderWithProviders(ui, options = {}) {
  return render(<AppProvider>{ui}</AppProvider>, options);
}
```

3. Hook Testing

- Use `renderHook` from `@testing-library/react`.
- Mock external dependencies and timers with `vi.useFakeTimers()` where needed.

Example:

```ts
import { renderHook, act } from "@testing-library/react";
import { useCounter } from "../src/hooks/useCounter";

test("increments", () => {
  const { result } = renderHook(() => useCounter());
  act(() => result.current.increment());
  expect(result.current.count).toBe(1);
});
```

4. Context and Reducer Testing

- Test reducers as pure functions. Provide representative initial state and actions.

Example:

```ts
import { uiReducer } from "../src/reducers/uiReducer";

test("selects list", () => {
  const state = { selectedList: null };
  const next = uiReducer(state, { type: "UI/SELECT_LIST", payload: "list1" });
  expect(next.selectedList).toBe("list1");
});
```

5. Integration Testing for Pages

- Use `msw` (Mock Service Worker) to mock network requests at the network layer; keeps behavior close to real network.
- Prefer MSW over axios-mock-adapter for app integration tests because it exercises fetch/axios at network boundary and supports request inspection.

Example (setup):

```ts
// tests/setupTests.ts
import { setupServer } from "msw/node";
import { handlers } from "./mocks/handlers";

const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

6. Mock API Responses & Aligning with Backend

- Mocks must match real backend response shapes. Use shared `shared-types` and contract files when possible.
- For endpoint shape changes, update `mocks/handlers` and related test fixtures.

7. Jest → Vitest Migration Notes

- Replace `jest` imports with `vi` and adjust any global setup accordingly.
- Update snapshots if migration changed serialisation.

8. React Strict Mode Considerations

- Tests may need to expect double effects caused by Strict Mode in development. Ensure cleanup and AbortController usage.

9. Common Patterns and Anti-patterns

- Patterns:
  - Keep tests small and focused
  - Prefer behavior-driven tests using accessible queries
  - Reuse `renderWithProviders` and mock handlers across tests

- Anti-patterns:
  - Over-mocking internal component implementation details
  - Tests tightly coupled to UI markup (avoid brittle selectors)

10. Troubleshooting

> **Reference:** See [Troubleshooting Guide](../operations/troubleshooting.md) for comprehensive testing debugging.
>
> Common testing issues covered:
>
> - [TextEncoder is not defined](../operations/troubleshooting.md#textencoder-is-not-defined)
> - [Test timeout](../operations/troubleshooting.md#test-timeout)
> - [Module path errors](../operations/troubleshooting.md#cannot-find-module)
> - [Flaky timing issues](../operations/troubleshooting.md#test-timeout)

11. Cross-references

- Backend response contract: [../knowledge-base/backend/api-response-patterns.md](../../knowledge-base/backend/api-response-patterns.md)
- Frontend test setup: `apps/frontend/src/setupTests.ts`

---

## Example Test Files (quick index)

- `src/components/__tests__/Button.spec.tsx`
- `src/hooks/__tests__/useCounter.spec.ts`
- `src/pages/__tests__/HomePage.integration.spec.tsx`
