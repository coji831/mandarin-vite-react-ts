# Story 17.2: Extract Progress Feature (Frontend)

## Description

**As a** developer,
**I want to** extract progress tracking from `features/quiz/` into its own `features/progress/` with a Zustand store and public `useRecordActivity()` hook,
**So that** quiz, reading, and radicals can all record progress without cross-feature imports.

## Business Value

Progress tracking is a cross-cutting concern — quiz sessions, reading practice, and radical learning all generate progress data. Currently it's embedded inside the quiz feature, forcing every future feature to import from `features/quiz/` to record progress. Extracting progress into its own feature with a clean public API (`useRecordActivity()`) enables any feature to record progress through a single hook, without importing internal quiz state.

Benefits:

- Reading and radicals features can record progress without depending on quiz
- Clean public API (`useRecordActivity()`) vs. current fragmented dispatch pattern
- Zustand store replaces Context provider — no nesting, simpler tests
- Types and services are co-located with the store in the progress feature

## Acceptance Criteria

- [ ] New `features/progress/` directory created with standard feature structure (`stores/`, `hooks/`, `services/`, `types/`, `index.ts`)
- [ ] Zustand store created at `features/progress/stores/progressStore.ts` — mirrors existing `ProgressState` shape (`wordsById`, `wordIds`) with devtools middleware
- [ ] Store actions: `loadProgress`, `updateWordProgress`, `batchUpdate`, `reset`
- [ ] `useRecordActivity()` hook created at `features/progress/hooks/useRecordActivity.ts`
  - API: `(params: { feature: string; wordId: string; correct: boolean; data?: Record<string, unknown> }) => Promise<void>`
  - Calls backend API, updates local store optimistically, reconciles on response
- [ ] `progressService.ts` moved from `features/quiz/services/` to `features/progress/services/` — API client for progress endpoints
- [ ] Types moved: `WordProgress`, `ProgressState`, `UserProgress` from `features/quiz/types/` to `features/progress/types/`
- [ ] `features/progress/index.ts` barrel exports: store hooks, `useRecordActivity`, `progressService`, types
- [ ] Quiz feature updated to delegate progress recording to `useRecordActivity()` instead of dispatching to progressReducer directly
- [ ] `npm test` passes for all affected test files
- [ ] Zustand dependency installed (`npm install zustand` in `apps/frontend/`)

## Business Rules

1. **Store shape preserved**: The Zustand store has the same state shape as the existing `ProgressState` — `wordsById: Record<string, WordProgress>` and `wordIds: string[]`
2. **Optimistic updates**: The hook updates the store immediately, then reconciles with the server response
3. **Feature-agnostic**: The hook's `feature` parameter enables backend event routing but does not affect local store state
4. **Barrel-only access**: External features import `useRecordActivity` from `features/progress/index.ts`, never from internal paths

## Related Issues

- Epic 17: [State Restructure & Zustand Migration](README.md) (Epic parent)
- Story 17.3: [Extract Progress Module (Backend)](story-17-3-extract-progress-module-backend.md) (Backend counterpart)
- Story 17.5: [Zustand Migration (UI + User + Progress)](story-17-5-zustand-migration-ui-user-progress.md) (Replaces prelude with full Zustand)

## Implementation Status

- **Status**: Planned
- **PR**: TBD
- **Merge Date**: TBD
- **Key Commit**: TBD
