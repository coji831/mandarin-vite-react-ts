# Story 17.5: Zustand Migration (UI + User + Progress)

## Description

**As a** developer,
**I want to** migrate `uiReducer`, `userReducer`, and the progress reducer to Zustand stores,
**So that** all state management is consistent across the application.

## Business Value

This story completes the Zustand migration by converting the remaining three state slices. After this story, all frontend state management uses the same pattern — Zustand stores with devtools middleware. The `.prelude.ts` files from Story 17.1 are replaced with real Zustand stores. The progress store from Story 17.2 becomes the definitive progress state source, replacing the transitional `progressReducer`.

Benefits:

- Consistent state management across all 5 stores
- No more `*.prelude.ts` temporary files
- Progress state single source of truth (no dual Context+Zustand)
- All stores support DevTools debugging
- All stores use the same pattern — selectors, actions, middleware

## Acceptance Criteria

- [x] `uiStore.prelude.ts` replaced by `shared/store/uiStore.ts` — Zustand store with devtools middleware
  - State: `isLoading`, `lastUpdated`, `selectedList`, `selectedWords`, `error`, `initialized`
  - Actions: `setLoading`, `setUpdated`, `setSelectedList`, `setSelectedWords`, `setError`, `setInitialized`, `reset`
- [x] `userStore.prelude.ts` replaced by `shared/store/userStore.ts` — Zustand store with devtools middleware
  - State: `userId`, `preferences`
  - Actions: `setUserId`, `setPreferences`, `refresh`, `reset`
- [x] `features/progress/stores/progressStore.ts` is the definitive store — `useProgressActions` delegates to it
- [x] `ProgressContext.tsx` updated to delegate to Zustand stores — reads from `useProgressStore`, `useUiStore`, `useUserStore`
- [x] `useProgressState`, `useProgressActions`, `useProgressDispatch` updated to delegate to Zustand stores
- [x] `useUserIdentity` updated to read from Zustand `useUserStore`
- [x] New tests: `uiStore.test.ts` (5 tests), `userStore.test.ts` (4 tests)
- [x] `npm test` passes — 280 tests, 34 files passing

## Business Rules

1. **State shape preserved**: Each Zustand store has the same state shape as the reducer it replaces
2. **Action parity**: Every reducer action has an equivalent Zustand store action
3. **Backward compatibility**: `ProgressContext` continues to function as a thin wrapper over Zustand stores
4. **No provider changes**: Story 17.6 handles provider removal

## Related Issues

- Epic 17: [State Restructure & Zustand Migration](README.md) (Epic parent)
- Story 17.1: [State Ownership Restructure](story-17-1-state-ownership-restructure.md) (Created `.prelude.ts` files)
- Story 17.2: [Extract Progress Feature (Frontend)](story-17-2-extract-progress-feature-frontend.md) (Created initial progress store)
- Story 17.6: [Provider Cleanup & Boundary Enforcement](story-17-6-provider-cleanup-boundary-enforcement.md) (Removes Context providers)

## Implementation Status

- **Status**: Completed
- **PR**: TBD
- **Merge Date**: TBD
- **Key Commit**: `5a49475`
