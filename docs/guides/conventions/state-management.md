# State Management Patterns (Quick Reference)

**Last Updated:** June 3, 2026

> **When to read this:** When you need to implement reducers, actions, selectors, or React Context state management.

---

## Reducer File Pattern

**Location & Naming:** `src/features/{feature}/reducers/{domain}Reducer.ts`

```typescript
// Action types - DOMAIN/ACTION format
const LISTS_LOAD_VOCABULARY = "LISTS/LOAD_VOCABULARY";
const LISTS_ADD_ITEM = "LISTS/ADD_ITEM";
const LISTS_UPDATE_ITEM = "LISTS/UPDATE_ITEM";
const LISTS_DELETE_ITEM = "LISTS/DELETE_ITEM";
const LISTS_SET_ERROR = "LISTS/SET_ERROR";

// Action creators
export const listsActions = {
  loadVocabulary: (items: Word[]) => ({ type: LISTS_LOAD_VOCABULARY, payload: items }),
  addItem: (item: Word) => ({ type: LISTS_ADD_ITEM, payload: item }),
  updateItem: (id: string, updates: Partial<Word>) => ({
    type: LISTS_UPDATE_ITEM,
    payload: { id, updates },
  }),
  deleteItem: (id: string) => ({ type: LISTS_DELETE_ITEM, payload: id }),
  setError: (error: string | null) => ({ type: LISTS_SET_ERROR, payload: error }),
};

// Reducer
export const listsReducer = (state: ListsState, action: Action): ListsState => {
  switch (action.type) {
    case LISTS_LOAD_VOCABULARY:
      return { ...state, items: action.payload, itemIds: action.payload.map((i) => i.id) };
    case LISTS_ADD_ITEM:
      return { ...state, items: [...state.items, action.payload] };
    case LISTS_SET_ERROR:
      return { ...state, error: action.payload };
    default:
      return state;
  }
};

// Use actions hook
export const useListsActions = () => {
  const [, dispatch] = useContext(ListsContext);
  return useMemo(
    () => ({
      loadVocabulary: (items) => dispatch(listsActions.loadVocabulary(items)),
      addItem: (item) => dispatch(listsActions.addItem(item)),
      setError: (error) => dispatch(listsActions.setError(error)),
    }),
    [dispatch],
  );
};
```

---

## Selectors with Memoization

**Pattern:** Use useCallback or useMemo for memoization

```typescript
// Context selector
export const useListsState = <T>(selector: (state: ListsState) => T): T => {
  const [state] = useContext(ListsContext);
  return useMemo(() => selector(state), [state, selector]);
};

// Usage
const items = useListsState((state) => state.items);
const itemCount = useListsState((state) => state.items.length);
const hasError = useListsState((state) => !!state.error);

// Custom memoized selector hook
export const useWordById = (wordId: string) => {
  return useListsState((state) => state.items.find((w) => w.id === wordId));
};
```

---

## State Shape

**Normalized structure:**

```typescript
type ListsState = {
  itemsById: Record<string, Word>; // Fast lookup by ID
  itemIds: string[]; // Maintain order
  loading: boolean;
  error: string | null;
};

// Immutable updates
const newState = {
  ...state,
  itemsById: {
    ...state.itemsById,
    [word.id]: { ...word, updated: true },
  },
};
```

---

## Error Boundaries

**Component-level error handling:**

```typescript
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return <div>Error: {this.state.error?.message}</div>;
    }
    return this.props.children;
  }
}

// Usage
<ErrorBoundary>
  <VocabularyList />
</ErrorBoundary>
```

---

## Testing Patterns

**Test reducer:**

```typescript
describe("listsReducer", () => {
  it("should add item to list", () => {
    const state: ListsState = { items: [], itemIds: [], error: null };
    const action = listsActions.addItem({ id: "1", word: "hello" });
    const newState = listsReducer(state, action);

    expect(newState.items).toHaveLength(1);
    expect(newState.items[0].id).toBe("1");
  });
});
```

**Test hook:**

```typescript
describe("useListsActions", () => {
  it("should memoize actions", () => {
    const { result, rerender } = renderHook(() => useListsActions());
    const firstResult = result.current;

    rerender();
    expect(result.current).toBe(firstResult); // Same reference (memoized)
  });
});
```

---

## Common Patterns

**Data loading:**

```typescript
const loadVocabulary = async () => {
  dispatch(listsActions.setLoading(true));
  try {
    const data = await fetchVocabulary();
    dispatch(listsActions.loadVocabulary(data));
  } catch (error) {
    dispatch(listsActions.setError(error.message));
  }
};
```

**Conditional rendering:**

```typescript
const VocabularyList = () => {
  const items = useListsState(s => s.items);
  const error = useListsState(s => s.error);

  if (error) return <ErrorMessage message={error} />;
  if (!items.length) return <EmptyState />;
  return <List items={items} />;
};
```

---

## Documentation Reference

| Topic                | File                                                           |
| -------------------- | -------------------------------------------------------------- |
| Frontend development | [Frontend Development Guide](../setup/frontend-development.md) |
| Frontend conventions | [Frontend Conventions](./frontend.md)                          |
| Workflow             | [Workflow](../operations/workflow.md)                          |
| API patterns         | [API Client Patterns](./api-client.md)                         |

**See also:** [Frontend Conventions](./frontend.md) for general conventions
