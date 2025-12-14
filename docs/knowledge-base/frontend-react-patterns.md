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

**Related Guides:**

- [State Management](./frontend-state-management.md) — Data loading and persistence
- [Architecture Overview](../architecture.md) — Full system design
