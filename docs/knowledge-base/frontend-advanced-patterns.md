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
