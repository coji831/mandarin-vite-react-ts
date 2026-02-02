# Advanced React Patterns

**Category:** Frontend Development  
**Last Updated:** December 9, 2025

---

## useReducer with Context Pattern

**When Adopted:** Epic 3 (State Management Refactor), Epic 9 (State Performance Core)  
**Why:** Complex state logic, predictable state transitions, better testability  
**Use Case:** Application state with multiple actions, complex updates

### Minimal Example

```typescript
// 1. Define state and actions
interface State {
  count: number;
  user: User | null;
}

type Action = { type: "INCREMENT" } | { type: "DECREMENT" } | { type: "SET_USER"; payload: User };

// 2. Create reducer
function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "INCREMENT":
      return { ...state, count: state.count + 1 };
    case "DECREMENT":
      return { ...state, count: state.count - 1 };
    case "SET_USER":
      return { ...state, user: action.payload };
    default:
      return state;
  }
}

// 3. Setup with Context
const StateContext = createContext<State | undefined>(undefined);
const DispatchContext = createContext<Dispatch<Action> | undefined>(undefined);

function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, { count: 0, user: null });

  return (
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>{children}</DispatchContext.Provider>
    </StateContext.Provider>
  );
}

// 4. Custom hooks
function useAppState() {
  const context = useContext(StateContext);
  if (!context) throw new Error("useAppState must be used within AppProvider");
  return context;
}

function useAppDispatch() {
  const context = useContext(DispatchContext);
  if (!context) throw new Error("useAppDispatch must be used within AppProvider");
  return context;
}

// 5. Usage in components
function Counter() {
  const { count } = useAppState();
  const dispatch = useAppDispatch();

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => dispatch({ type: "INCREMENT" })}>+</button>
      <button onClick={() => dispatch({ type: "DECREMENT" })}>-</button>
    </div>
  );
}
```

### Key Lessons

- Split State and Dispatch contexts (prevents unnecessary re-renders)
- Prefix action types with domain (`'progress/UPDATE'` not `'UPDATE'`)
- Use TypeScript discriminated unions for actions
- Export reducer for testing

### When to Use

Complex state logic with multiple actions, need for predictable state updates

---

## Context Splitting for Performance

**When Adopted:** Epic 9 (State Performance Core)  
**Why:** Reduce re-renders by separating state and dispatch  
**Use Case:** Large context providers causing performance issues

### Minimal Example

```typescript
// ❌ Single context (everything re-renders on any change)
const AppContext = createContext<{
  state: State;
  dispatch: Dispatch<Action>;
}>(null!);

// ✅ Split contexts (only state consumers re-render)
const StateContext = createContext<State>(null!);
const DispatchContext = createContext<Dispatch<Action>>(null!);

// Provider
function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>{children}</DispatchContext.Provider>
    </StateContext.Provider>
  );
}

// Selective consumption
function DisplayComponent() {
  const state = useContext(StateContext); // Re-renders on state change
  return <div>{state.value}</div>;
}

function ActionComponent() {
  const dispatch = useContext(DispatchContext); // Never re-renders
  return <button onClick={() => dispatch({ type: "UPDATE" })}>Update</button>;
}
```

### Key Lessons

- Dispatch context never changes (stable reference)
- State consumers only re-render when state changes
- Measure with React DevTools Profiler
- Use selectors for fine-grained subscriptions

### When to Use

Performance issues with large context, many consumers

---

## HTTP Client Interceptor Architecture

**When Adopted:** Epic 14 (API Modernization), Story 14.3  
**Why:** Centralize auth token management, automatic retry, error normalization  
**Use Case:** JWT refresh, network error resilience, consistent error handling

### Minimal Example: Auth Refresh Interceptor

```typescript
// Race condition prevention with singleton promise
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (refreshPromise) return refreshPromise; // Prevent multiple simultaneous refreshes

  refreshPromise = (async () => {
    try {
      // Use native axios to avoid circular interceptor dependency
      const response = await axios.post(
        `${API_CONFIG.baseURL}/api/v1/auth/refresh`,
        {},
        { withCredentials: true }, // Send httpOnly refresh token cookie
      );
      const newToken = response.data.data.accessToken;
      localStorage.setItem("accessToken", newToken);
      return newToken;
    } catch (error) {
      localStorage.removeItem("accessToken");
      throw error;
    } finally {
      refreshPromise = null; // Reset for next refresh
    }
  })();

  return refreshPromise;
}

// Request interceptor: Proactive token refresh
apiClient.interceptors.request.use(async (config) => {
  const token = localStorage.getItem("accessToken");
  if (token && isTokenExpired(token)) {
    try {
      const newToken = await refreshAccessToken();
      config.headers.Authorization = `Bearer ${newToken}`;
    } catch {
      config.headers.Authorization = `Bearer ${token}`; // Fallback to existing
    }
  } else if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: Reactive 401 handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401: Refresh token and retry once
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true; // Prevent infinite loop
      try {
        const newToken = await refreshAccessToken();
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        logoutCallback?.(); // Trigger app-level logout
        return Promise.reject(createNormalizedError(error));
      }
    }

    return Promise.reject(createNormalizedError(error));
  },
);
```

### Key Patterns

**1. Proactive vs Reactive Refresh:**

- **Proactive** (Request interceptor): Check token expiry before request, refresh if within 30s buffer
- **Reactive** (Response interceptor): Handle 401, refresh token, retry request
- **Hybrid approach**: Proactive prevents most 401s; reactive catches edge cases (clock skew, network latency)

**2. Race Condition Prevention:**

- Use singleton `refreshPromise` to coalesce multiple simultaneous refresh requests
- First 401 creates promise; subsequent 401s await same promise
- Prevents: Concurrent localStorage writes, backend load from duplicate refresh requests

**3. Circular Dependency Avoidance:**

- Refresh endpoint must use native `axios.create()`, NOT `apiClient`
- Otherwise: Refresh request triggers interceptors → detects expired token → calls refresh → infinite loop

**4. Infinite Loop Prevention:**

- Add `_retry` flag to request config (max 1 refresh attempt per request)
- If refresh fails (refresh token expired), trigger logout immediately

**5. Callback Pattern for App Integration:**

```typescript
let logoutCallback: (() => void) | null = null;

export function setLogoutCallback(callback: () => void): void {
  logoutCallback = callback;
}

// In AuthContext:
useEffect(() => {
  setLogoutCallback(() => {
    /* logout logic */
  });
  return () => clearLogoutCallback();
}, []);
```

### Network Retry with Exponential Backoff

```typescript
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retryCount?: number };

    // Retry network errors (no response received)
    const isNetworkError =
      !error.response && (error.code === "ECONNABORTED" || error.code === "ERR_NETWORK");

    if (isNetworkError && originalRequest && (originalRequest._retryCount || 0) < 3) {
      originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
      const delay = Math.pow(2, originalRequest._retryCount - 1) * 1000; // 1s, 2s, 4s

      await new Promise((resolve) => setTimeout(resolve, delay));
      return apiClient(originalRequest);
    }

    return Promise.reject(createNormalizedError(error));
  },
);
```

**Exponential Backoff Benefits:**

- Prevents overwhelming server during outage (thundering herd problem)
- Gives transient failures time to recover (network reconnect, server restart)
- Industry standard: AWS SDK, Google Cloud SDK, Azure SDK all use exponential backoff

### Token Expiry Detection

```typescript
function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1])); // Decode JWT payload
    const expiryTime = payload.exp * 1000; // JWT exp is in seconds, JS uses milliseconds
    return expiryTime - 30000 < Date.now(); // 30s buffer for network latency
  } catch {
    return true; // Invalid token format
  }
}
```

**Buffer Rationale:**

- Network latency: 100-300ms typical, 1s+ on poor connections
- Server clock skew: Can be 5-10s on misconfigured servers
- Request processing time: Auth middleware, database lookup adds 50-200ms
- 30s buffer: Conservative safety margin

### When to Use

**Use interceptors for:**

- JWT token refresh (avoid manual token management in every service)
- Transient network error retry (Wi-Fi drops, mobile connectivity issues)
- Global error normalization (consistent error structure across app)
- Request/response logging (debugging, analytics)
- API versioning headers (X-API-Version)

**Avoid interceptors for:**

- Business logic (keep in services/hooks)
- Component-specific transforms (use service layer)
- One-off overrides (use axios config per-request)

### Tradeoffs

**Benefits:**

- Eliminates 90%+ of manual token refresh code
- Improves UX (no visible failed requests during token refresh)
- Reduces backend load (coalesced refresh requests)
- Auto-recovery from transient failures

**Costs:**

- Adds latency to requests with expired tokens (~100-300ms for refresh)
- Retry delays add up to 7s max for persistent failures (1s + 2s + 4s)
- Complexity: Debugging interceptor chains harder than explicit service calls
- Test complexity: axios-mock-adapter doesn't simulate realistic error signatures

**When acceptable:**

- Multi-request apps with JWT auth (99% of SPAs)
- Mobile apps with spotty connectivity
- Long-running sessions (learning apps, dashboards)

**When to avoid:**

- Single-request apps (static site generators)
- No authentication (public APIs)
- Extremely latency-sensitive operations (real-time trading, gaming)

---

## Selector Pattern with Memoization

**When Adopted:** Epic 9 (State Performance Core)  
**Why:** Prevent re-renders from irrelevant state changes  
**Use Case:** Components that only need part of state

### Minimal Example

```typescript
// 1. Selector hook with equality check
function useAppState<T>(selector: (state: State) => T): T {
  const state = useContext(StateContext);
  const [selectedState, setSelectedState] = useState(() => selector(state));

  useEffect(() => {
    const newState = selector(state);
    if (!shallowEqual(selectedState, newState)) {
      setSelectedState(newState);
    }
  }, [state, selector]);

  return selectedState;
}

// 2. Usage (only re-renders when count changes)
function Counter() {
  const count = useAppState((state) => state.count);
  return <div>Count: {count}</div>;
}

// 3. With useMemo for complex selectors
function UserList() {
  const users = useAppState((state) =>
    useMemo(() => state.userIds.map((id) => state.usersById[id]), [state.userIds, state.usersById])
  );

  return (
    <ul>
      {users.map((u) => (
        <li key={u.id}>{u.name}</li>
      ))}
    </ul>
  );
}

// 4. Reusable selectors
const selectActiveUsers = (state: State) =>
  state.userIds.map((id) => state.usersById[id]).filter((u) => u.active);

function ActiveUserList() {
  const activeUsers = useAppState(selectActiveUsers);
  return (
    <ul>
      {activeUsers.map((u) => (
        <li key={u.id}>{u.name}</li>
      ))}
    </ul>
  );
}
```

### Key Lessons

- Use shallow equality checks (not deep)
- Memoize complex selectors
- Create reusable selector functions
- Profile before optimizing

### When to Use

Components that only need subset of state, expensive derived data

---

## Reducer Composition Pattern

**When Adopted:** Epic 9 (State Performance Core)  
**Why:** Break large reducers into smaller, testable units  
**Use Case:** Complex state with multiple domains

### Minimal Example

```typescript
// 1. Sub-reducers for each domain
function listsReducer(state: ListsState, action: Action): ListsState {
  switch (action.type) {
    case "ADD_LIST":
      return {
        ...state,
        byId: { ...state.byId, [action.payload.id]: action.payload },
        ids: [...state.ids, action.payload.id],
      };
    default:
      return state;
  }
}

function userReducer(state: UserState, action: Action): UserState {
  switch (action.type) {
    case "SET_USER":
      return { ...state, current: action.payload };
    default:
      return state;
  }
}

// 2. Combine into root reducer
interface RootState {
  lists: ListsState;
  user: UserState;
}

function rootReducer(state: RootState, action: Action): RootState {
  return {
    lists: listsReducer(state.lists, action),
    user: userReducer(state.user, action),
  };
}

// 3. Test sub-reducers independently
describe("listsReducer", () => {
  it("adds list", () => {
    const state = { byId: {}, ids: [] };
    const action = { type: "ADD_LIST", payload: { id: "1", name: "Test" } };
    const newState = listsReducer(state, action);

    expect(newState.ids).toContain("1");
    expect(newState.byId["1"].name).toBe("Test");
  });
});
```

### Key Lessons

- Each sub-reducer owns one slice of state
- Root reducer just delegates to sub-reducers
- Test sub-reducers in isolation
- Actions can affect multiple slices

### When to Use

Large state objects with distinct domains, complex reducer logic

---

**Related Guides:**

- [React Patterns](./frontend-react-patterns.md) — Basic Context API
- [State Management](./frontend-state-management.md) — Normalized state
