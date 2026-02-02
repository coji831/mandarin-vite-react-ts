# Epic 19: State Management Refactor (Deferred)

## Epic Summary

**Goal:** **[CONDITIONAL]** Migrate from Context + Reducers to Zustand only if performance or debugging pain points justify 20-30 hour investment.

**Key Points:**

- Current Context + Reducer architecture following best practices with no significant issues
- Zustand migration provides DevTools, simpler API, but requires rewriting 500+ lines of state logic
- Incremental migration strategy (`ui` → `user` → `lists`) minimizes risk but blocks feature work during migration window
- Decision gate in Story 19.1 validates triggers met before proceeding with actual migration
- Reducer logic (pure functions) highly portable to Zustand stores (95% code reusable with minor syntax changes)

**Status:** **Deferred** (No current triggers met)

**Last Update:** February 2, 2026

## Technical Overview

**[THIS EPIC IS DEFERRED - Only implement if triggers documented in BR are met]**

This epic evaluates and potentially migrates frontend state management from Context API + Reducers to Zustand. The current architecture is well-structured but lacks DevTools support and has slightly more boilerplate than Zustand.

**Current Architecture:**

```typescript
// apps/frontend/src/features/mandarin/context/ListsContext.tsx
const [state, dispatch] = useReducer(listsReducer, initialState);

// apps/frontend/src/features/mandarin/reducers/listsReducer.ts
export function listsReducer(state: ListsState, action: ListsAction): ListsState {
  switch (action.type) {
    case "LISTS/LOAD_ALL":
      return { ...state, lists: action.payload };
    // ...
  }
}
```

**Zustand Architecture (if migrated):**

```typescript
// apps/frontend/src/features/mandarin/stores/listsStore.ts
import create from "zustand";
import { devtools } from "zustand/middleware";

export const useListsStore = create(
  devtools((set) => ({
    lists: [],
    loadAll: (lists) => set({ lists }),
    // ...
  })),
);
```

**Triggers for Migration:**

1. Performance issues (state updates >100ms)
2. DevTools requests (3+ developers)
3. Cross-slice dependencies unmanageable
4. Team consensus on verbosity

**Decision Gate:** Story 19.1 assessment determines whether to proceed or keep Context.

## Architecture Decisions

**[CONDITIONAL - Only relevant if migration triggered]**

1. **Zustand over Redux Toolkit** — Simpler API (no slices/thunks), smaller bundle (~1KB vs. 15KB), excellent TypeScript inference; tradeoff: less ecosystem maturity than Redux

2. **Slice-by-slice migration** — Lower risk (rollback per slice), validates approach incrementally; tradeoff: both patterns coexist for 2-3 weeks during migration

3. **Maintain API surface** — Components use same hooks (`useListsState`, `useListsActions`); Zustand stores export compatible selectors; tradeoff: wrapper layer adds slight overhead

4. **DevTools middleware** — Enable Redux DevTools extension for time-travel debugging; tradeoff: 2KB bundle increase, minimal performance overhead

## Technical Implementation

**[ONLY IF MIGRATION TRIGGERED]**

### Architecture

```
Context + Reducer (Current)
    ListsContext.tsx → listsReducer.ts → Components
    UserContext.tsx → userReducer.ts → Components
    UIContext.tsx → uiReducer.ts → Components

Zustand (Target)
    listsStore.ts (DevTools middleware) → Components
    userStore.ts (DevTools middleware) → Components
    uiStore.ts (DevTools middleware) → Components
```

**Migration Flow (per slice):**

```
1. Create Zustand store matching reducer state shape
2. Port reducer logic to store actions (pure functions reusable)
3. Export compatible selector hooks (useListsState, useListsActions)
4. Update components to import from store (not Context)
5. Remove Context provider from App.tsx
6. Validate tests pass (update mocks if needed)
7. Deploy to staging, smoke tests
8. Production rollout
```

### API Endpoints

**No backend changes** — State management refactor is frontend-only.

### Component Relationships

**Before Migration:**

```
App.tsx
    <ListsProvider>
        <UserProvider>
            <UIProvider>
                <MandarinRoutes />
```

**After Migration:**

```
App.tsx
    <MandarinRoutes />
    (Zustand stores imported directly in components)
```

### Dependencies

**New Dependencies:**

- `zustand` (^4.5.0)
- `zustand/middleware` (built-in, no additional install)

**Removed Dependencies:**

- None (Context API is built-in React)

**Impacted Files (per slice):**

- `src/features/mandarin/stores/listsStore.ts` (new)
- `src/features/mandarin/context/ListsContext.tsx` (remove)
- `src/features/mandarin/reducers/listsReducer.ts` (remove)
- All components using `useListsState` or `useListsActions` (update imports)

### Testing Strategy

**Unit Tests (per slice):**

- `listsStore.test.ts` - Test Zustand store actions and state updates
- Reuse existing reducer test logic (actions produce same state changes)

**Integration Tests:**

- `lists-integration.test.tsx` - Mock Zustand store, verify components interact correctly
- Compare behavior before/after migration (should be identical)

**Performance Tests:**

- Benchmark state update times with React Profiler (before/after comparison)
- Target: No regression (should be equal or faster)

**Manual Testing:**

- DevTools testing: Time-travel debugging functional
- Visual regression: UI unchanged after migration
- Load testing: No performance degradation

### Performance Considerations

**Expected Improvements:**

- Slightly faster re-renders (Zustand optimized for shallow comparison)
- Smaller bundle (~1KB Zustand vs. Context boilerplate)

**Potential Regressions:**

- DevTools middleware adds ~2KB
- Wrapper layer for API compatibility adds minimal overhead

**Metrics to Monitor:**

- State update time (React Profiler flame graph)
- Bundle size (before/after webpack analysis)
- Memory usage (Chrome DevTools heap snapshot)

### Security Considerations

- No security implications (state management pattern change only)
- DevTools only enabled in development builds (excluded from production bundle)

### Migration Strategy

**Phase 1: Assessment (Story 19.1: 4-6h)**

1. Profile current state performance
2. Survey team for pain points
3. Spike `ui` slice in Zustand
4. Decision gate: Proceed or defer?

**Phase 2: Small Slice (Story 19.2: 6-8h)**

1. Migrate `ui` slice (~50 lines)
2. Update 5-10 components
3. Validate tests, deploy staging
4. Learn Zustand patterns

**Phase 3: Medium Slice (Story 19.3: 8-10h)**

1. Migrate `user` slice (~150 lines)
2. Update 15-20 components
3. Build confidence with larger slice

**Phase 4: Large Slice (Story 19.4: 10-12h)**

1. Migrate `lists` slice (~300 lines)
2. Update 30-40 components
3. Remove all Context providers
4. Final cleanup and documentation

**Rollback Plan:**

- Keep Context code until all slices validated
- Revert per slice if issues emerge
- Feature flags to toggle Context vs. Zustand per slice

### Documentation Updates

- Update `docs/guides/code-conventions.md` with Zustand patterns
- Update `docs/architecture.md` with state management section
- Create migration guide: `docs/guides/zustand-migration-guide.md`

### Code Comparison Example

**Current (Context + Reducer):**

```typescript
// listsReducer.ts (18 lines)
export function listsReducer(state: ListsState, action: ListsAction): ListsState {
  switch (action.type) {
    case "LISTS/LOAD_ALL":
      return { ...state, lists: action.payload };
    case "LISTS/ADD":
      return { ...state, lists: [...state.lists, action.payload] };
    default:
      return state;
  }
}

// ListsContext.tsx (30 lines)
const [state, dispatch] = useReducer(listsReducer, initialState);
const loadAll = (lists) => dispatch({ type: "LISTS/LOAD_ALL", payload: lists });
```

**Zustand (Target):**

```typescript
// listsStore.ts (15 lines)
export const useListsStore = create(
  devtools((set) => ({
    lists: [],
    loadAll: (lists) => set({ lists }),
    addList: (list) => set((state) => ({ lists: [...state.lists, list] })),
  })),
);
```

**Reduction:** ~30% less boilerplate (48 lines → 15 lines)

---

**Related Documentation:**

- [Epic 19 BR](../../business-requirements/epic-19-state-refactor/README.md)
- [Story 19.1 Implementation](./story-19-1-zustand-assessment.md)
- [Story 19.2 Implementation](./story-19-2-migrate-ui-slice.md)
- [Story 19.3 Implementation](./story-19-3-migrate-user-slice.md)
- [Story 19.4 Implementation](./story-19-4-migrate-lists-slice.md)
- [Code Conventions](../../guides/code-conventions.md)
- [Architecture Overview](../../architecture.md)

---

## **DEFERRED STATUS - Do Not Implement Without Approval**

**Current Context + Reducer architecture is sufficient. Migration requires:**

1. Tech lead approval
2. 2+ triggers validated (performance, DevTools requests, cross-slice issues, team consensus)
3. Dedicated sprint (no parallel feature work)

**Quarterly Review Schedule:**

- Q1 2026 (March): Assess after Epic 14-17 complete
- Q2 2026 (June): Re-evaluate with production metrics
- Q3 2026 (September): Team pain point survey
- Q4 2026 (December): Annual architecture review

**Contact:** Tech lead before starting Story 19.1 assessment.
