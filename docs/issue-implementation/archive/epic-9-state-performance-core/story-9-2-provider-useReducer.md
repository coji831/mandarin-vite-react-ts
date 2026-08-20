# Implementation 9-2: Provider -> useReducer

## Technical Scope

Convert the `Progress` provider internals to `useReducer`, wire the reducer, export `initialState`, and ensure legacy persisted progress is cleared during initialization.

Deliverables:

- Updated `src/features/mandarin/context/ProgressContext.tsx`
- Exported `initialState` from reducer package
- Ensure provider initialization is deterministic and that legacy persisted progress is cleared before consumers mount.

## Implementation Details

Key pattern for provider conversion:

```tsx
// ProgressProvider.tsx (outline)
const ProgressProvider: React.FC = ({ children }) => {
  const [state, dispatch] = useReducer(progressReducer, initialState);

  // Clear legacy persisted progress on first mount
  useEffect(() => {
    const legacy = readLegacyProgress();
    if (legacy) {
      clearLegacyProgress();
      dispatch({ type: "INIT" });
    }
  }, []);

  return (
    <ProgressStateContext.Provider value={state}>
      <ProgressDispatchContext.Provider value={dispatch}>
        {children}
      </ProgressDispatchContext.Provider>
    </ProgressStateContext.Provider>
  );
};
```

### Files to create / update

- `src/features/mandarin/context/ProgressContext.tsx` — Provider + split state/dispatch contexts and deterministic initialization.
- `src/features/mandarin/reducers/*` — ensure `initialState` is exported from the reducer package.
- `src/router/Router.tsx` — verify provider wiring at app root; update imports if necessary.

### Missing scope (source scan) — story 9.2

Files relevant to PR 9.2 (include or reference in PR):

- `src/features/mandarin/context/ProgressContext.tsx`
- `src/features/mandarin/reducers/*` (export `initialState`)
- `src/router/Router.tsx`

PR verification (copy into PR description):

- [ ] Provider updated to use `useReducer` and exposes `ProgressStateContext` and `ProgressDispatchContext`
- [ ] Provider initialization clears legacy persisted progress (documented behavior)
- [ ] `initialState` imported from reducer module and used consistently

## Architecture Integration

- Provider should import `initialState` from the reducer module so initialization is deterministic.
- Ensure provider wiring at the app root remains stable; update `src/router/Router.tsx` if necessary.

## Technical Challenges & Solutions

Problem: Provider initialization ordering and ensuring legacy data is cleared before consumers mount.

Solution: run legacy-clear logic in a mount-effect before rendering children or delay child rendering until initialization completes.
