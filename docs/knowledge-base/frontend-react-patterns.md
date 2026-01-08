# React Patterns

**Category:** Frontend Development  
**Last Updated:** December 9, 2025

---

## React Context API for State Management

**When Adopted:** Epic 3 (State Management Refactor)  
**Why:** Avoid prop drilling, centralize state without Redux complexity  
**Use Case:** App-wide state (user progress, vocabulary lists, UI state)

### Minimal Example

```typescript
// 1. Create Context + Reducer
interface State {
  items: Record<string, Item>;
}

const initialState: State = { items: {} };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "ADD_ITEM":
      return { ...state, items: { ...state.items, [action.id]: action.item } };
    default:
      return state;
  }
}

const StateContext = createContext<State>(initialState);
const DispatchContext = createContext<Dispatch<Action>>(() => {});

// 2. Provider Wrapper
function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>{children}</DispatchContext.Provider>
    </StateContext.Provider>
  );
}

// 3. Custom Hooks for Access
function useAppState() {
  return useContext(StateContext);
}

function useAppDispatch() {
  return useContext(DispatchContext);
}
```

### Key Lessons

- Separate State and Dispatch contexts (better performance)
- Use custom hooks to hide Context API complexity
- Prefix action types with domain (`'progress/UPDATE'` not `'UPDATE'`)

### When to Use

Cross-component state, not server data (use React Query for that)

---

## React Router v6 with TypeScript

**When Adopted:** Epic 4 (Routing Improvements)  
**Why:** Type-safe navigation, centralized route definitions  
**Use Case:** SPA navigation with route params

### Minimal Example

```typescript
// 1. Define routes with constants
export const PATHS = {
  HOME: "/",
  VOCABULARY: "/vocabulary",
  VOCABULARY_LIST: "/vocabulary/:listId",
  CONVERSATION: "/conversation",
} as const;

// 2. Router configuration
const router = createBrowserRouter([
  {
    path: PATHS.HOME,
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: PATHS.VOCABULARY, element: <VocabularyPage /> },
      { path: PATHS.VOCABULARY_LIST, element: <VocabularyListPage /> },
    ],
  },
]);

// 3. Type-safe navigation
function navigateToList(listId: string) {
  navigate(PATHS.VOCABULARY_LIST.replace(":listId", listId));
}

// 4. Access params with type safety
function VocabularyListPage() {
  const { listId } = useParams<{ listId: string }>();
  // ...
}
```

### Key Lessons

- Store route paths as constants (avoid typos)
- Use nested routes for shared layouts
- Extract params with `useParams<T>()` for type safety

### When to Use

Multi-page SPA, route params, nested layouts

---

## React Strict Mode Deep Dive

**Category:** Development Best Practices  
**Context:** Detecting side effects and concurrent rendering issues

### What is Strict Mode?

React Strict Mode is a development-only wrapper that helps identify potential problems:

```tsx
<React.StrictMode>
  <App />
</React.StrictMode>
```

**Behaviors (Development Only):**

1. **Double-invoke functions** to detect impure code
2. **Double-mount components** to catch missing cleanup
3. **Warn about deprecated APIs** (legacy lifecycle methods)
4. **Detect unexpected side effects** in rendering

### Why Double-Mounting?

React 18+ prepares for **Concurrent Rendering** features like:

- Suspense for data fetching
- Selective hydration
- Transitions (startTransition)

These features can **pause and resume** rendering, meaning:

- Components may mount → unmount → remount
- Effects may run multiple times
- Cleanup must be reliable

**Strict Mode simulates this** by:

1. Mounting component
2. Running effects
3. **Unmounting** (cleanup)
4. **Remounting** (re-run effects)

This exposes code that assumes "mount happens once."

### Common Issues Exposed

**1. Race Conditions in useEffect**

```typescript
// ❌ BAD: Race condition
useEffect(() => {
  fetch("/api/user").then((data) => {
    setUser(data); // May update after unmount!
  });
}, []);

// ✅ GOOD: Cleanup with AbortController
useEffect(() => {
  const controller = new AbortController();

  fetch("/api/user", { signal: controller.signal })
    .then((data) => setUser(data))
    .catch((err) => {
      if (err.name === "AbortError") return; // Ignore aborts
      console.error(err);
    });

  return () => controller.abort(); // Cleanup
}, []);
```

**2. Duplicate API Requests**

```typescript
// ❌ BAD: Runs twice in Strict Mode
useEffect(() => {
  loadData(); // Called on mount, then remount
}, []);

// ✅ GOOD: Idempotent requests
useEffect(() => {
  if (dataCache.has(userId)) {
    setData(dataCache.get(userId));
    return;
  }

  loadData().then((data) => {
    dataCache.set(userId, data);
    setData(data);
  });
}, [userId]);
```

**3. Missing Cleanup Functions**

```typescript
// ❌ BAD: No cleanup
useEffect(() => {
  const interval = setInterval(() => {
    checkStatus();
  }, 5000);
  // Missing cleanup! Interval keeps running after unmount
}, []);

// ✅ GOOD: Return cleanup function
useEffect(() => {
  const interval = setInterval(() => {
    checkStatus();
  }, 5000);

  return () => clearInterval(interval); // Cleanup
}, []);
```

**4. State Updates After Unmount**

```typescript
// ❌ BAD: Can update after unmount
useEffect(() => {
  async function load() {
    const data = await fetchData();
    setState(data); // Component may be unmounted!
  }
  load();
}, []);

// ✅ GOOD: Use isMounted guard
useEffect(() => {
  let isMounted = true;

  async function load() {
    const data = await fetchData();
    if (isMounted) {
      // Only update if still mounted
      setState(data);
    }
  }
  load();

  return () => {
    isMounted = false;
  }; // Cleanup
}, []);
```

### Advanced: useRef for Mutable State

For complex async workflows, use `useRef` to track mount status:

```typescript
function useAuthRefresh() {
  const isMountedRef = useRef(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    return () => {
      isMountedRef.current = false; // Mark as unmounted
    };
  }, []);

  const refreshToken = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
      });

      // Guard against unmounted component
      if (!isMountedRef.current) return;

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      if (!isMountedRef.current) return;
      console.error("Refresh failed:", error);
    }
  }, []);

  return { user, refreshToken };
}
```

**Why useRef not useState?**

- `useRef` doesn't trigger re-renders when changed
- Persists across renders
- Safe to mutate `.current` directly

### Beyond isMounted: Modern Patterns

**1. AbortController (Preferred for Fetch)**

```typescript
useEffect(() => {
  const controller = new AbortController();

  fetch("/api/data", { signal: controller.signal })
    .then((res) => res.json())
    .then(setData)
    .catch((err) => {
      if (err.name !== "AbortError") {
        console.error(err);
      }
    });

  return () => controller.abort();
}, []);
```

**2. Cleanup Functions**

```typescript
useEffect(() => {
  const subscription = dataSource.subscribe(setData);
  return () => subscription.unsubscribe();
}, []);
```

**3. Ignore Stale Responses**

```typescript
useEffect(() => {
  let ignore = false;

  async function load() {
    const data = await fetchData(query);
    if (!ignore) {
      // Only use latest result
      setData(data);
    }
  }

  load();

  return () => {
    ignore = true;
  };
}, [query]);
```

### Backend Implications: Idempotent Operations

Since Strict Mode causes double-requests, design backends to handle duplicates:

**Problem: Non-Idempotent Endpoint**

```typescript
// ❌ BAD: Always creates new record
app.post("/api/auth/refresh", async (req, res) => {
  const newToken = await createRefreshToken(user.id); // Duplicate on remount!
  res.json({ token: newToken });
});
```

**Solution: Idempotent Endpoint**

```typescript
// ✅ GOOD: Check existing before creating
app.post("/api/auth/refresh", async (req, res) => {
  const existing = await prisma.refreshToken.findFirst({
    where: {
      userId: user.id,
      revoked: false,
      expiresAt: { gt: new Date() },
    },
  });

  if (existing) {
    return res.json({ token: existing.token }); // Reuse
  }

  const newToken = await createRefreshToken(user.id);
  res.json({ token: newToken });
});
```

### Testing with Strict Mode

**Enable in Tests:**

```typescript
// Test wrapper
function renderWithStrictMode(ui: React.ReactElement) {
  return render(<React.StrictMode>{ui}</React.StrictMode>);
}

// Usage
test("handles double-mount correctly", async () => {
  const mockFetch = jest.fn().mockResolvedValue({ json: async () => ({}) });
  global.fetch = mockFetch;

  renderWithStrictMode(<MyComponent />);

  await waitFor(() => {
    expect(mockFetch).toHaveBeenCalledTimes(2); // Expect double-call
  });
});
```

**Test Cleanup:**

```typescript
test("cleans up properly", () => {
  const cleanup = jest.fn();

  function Component() {
    useEffect(() => {
      return cleanup;
    }, []);
    return null;
  }

  const { unmount } = render(<Component />);
  unmount();

  expect(cleanup).toHaveBeenCalled();
});
```

### When Strict Mode is Disabled

**Production:** Strict Mode does NOT run in production builds (automatically disabled).

**Opting Out (Not Recommended):**

```tsx
// ❌ Avoid this - fixes symptoms not root cause
<App />  // Without StrictMode

// ✅ Better: Fix the underlying issue
<React.StrictMode>
  <App />
</React.StrictMode>
```

**Valid Reasons to Disable:**

- Third-party library incompatibility (temporary workaround)
- Debugging specific issue in isolation
- Performance profiling (Strict Mode adds overhead)

### Key Takeaways

1. **Strict Mode = Good**: It catches bugs before production
2. **Double-mounting is intentional**: Prepares for Concurrent React
3. **Always cleanup**: Return cleanup functions from `useEffect`
4. **Guard async updates**: Use AbortController, `ignore` flags, or `isMounted` refs
5. **Idempotent backends**: Handle duplicate requests gracefully
6. **Test with Strict Mode**: Ensure tests match development behavior

---

**Related Guides:**

- [State Management](./frontend-state-management.md) — Data loading and persistence
- [Architecture Overview](../architecture.md) — Full system design
