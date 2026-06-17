# Story 17.4: Zustand Migration (Quiz + Vocabulary)

## Description

**As a** developer,
**I want to** migrate `quizReducer` and `listReducer` to Zustand stores in their respective features,
**So that** quiz and vocabulary state management have less boilerplate and DevTools support.

## Business Value

The current `quizReducer` (~180 lines) and `listReducer` (~30 lines) use Context+useReducer patterns requiring separate context providers, dispatch hooks, and state selectors. Migrating to Zustand eliminates ~75 lines of provider plumbing per set, enables direct store access without `useContext`, and adds Redux DevTools support via middleware for debugging state transitions.

Benefits:

- ~35 lines per Zustand store vs. ~75 lines per Context+Reducer set
- No provider nesting — stores are imported directly where needed
- DevTools support for debugging state changes
- Simpler tests — no context wrapping, just direct store manipulation
- Consistent pattern for all future stores

## Acceptance Criteria

- [x] `quizReducer` migrated to Zustand store at `features/quiz/stores/quizSessionStore.ts`
  - All state preserved: `phase`, `questions`, `currentIndex`, `answers`, `sessionId`, `answerValue`, `showHint`, `aiFeedback`, `expiresAt`, `isFreshCompletion`
  - All actions preserved: `initializeSession`, `submitAnswer`, `nextQuestion`, `resetSession`, `setAnswerValue`, `toggleHint`, `setAiFeedback`, `showDailyCompleteResults`, `completeSession`, `setError`, `resumeSession`
  - DevTools middleware enabled
- [x] `listReducer` migrated to Zustand store at `features/vocabulary/stores/listStore.ts`
  - State preserved: `itemsById`, `itemIds`
  - Actions: `init`, `reset`
- [x] `QuizContext.tsx` updated to use `quizSessionStore` internally — uses Zustand selectors and `.getState()` instead of `useReducer`/`dispatch`
- [x] Quiz hooks (`useQuizSession`, `useAnswerSubmission`) updated to use Zustand store actions directly (no `dispatch` parameter)
- [x] Vocabulary store exported from barrel (`vocabulary/index.ts` exports `useListStore`)
- [x] Existing test coverage maintained — 12 new store tests added, all 271 tests pass
- [x] `npm test` passes — 32 test files, 271 tests passing
- [x] Quiz flow works end-to-end (same QuizContext API — backward compatible)

## Business Rules

1. **Identical state shape**: Zustand stores expose the same state as the reducers they replace
2. **Action parity**: Every reducer action has an equivalent Zustand store action
3. **Backward compatibility**: `QuizContext` is kept as a thin wrapper over the Zustand store until Story 17.6 removes it
4. **No provider changes**: QuizContext continues to function during transition

## Related Issues

- Epic 17: [State Restructure & Zustand Migration](README.md) (Epic parent)
- Story 17.5: [Zustand Migration (UI + User + Progress)](story-17-5-zustand-migration-ui-user-progress.md) (Migrates remaining stores)
- Story 17.6: [Provider Cleanup & Boundary Enforcement](story-17-6-provider-cleanup-boundary-enforcement.md) (Removes Context providers)

## Implementation Status

- **Status**: Completed
- **PR**: TBD
- **Merge Date**: TBD
- **Key Commit**: `12335d7`
