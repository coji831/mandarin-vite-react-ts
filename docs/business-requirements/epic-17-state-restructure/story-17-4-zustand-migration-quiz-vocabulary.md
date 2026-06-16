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

- [ ] `quizReducer` migrated to Zustand store at `features/quiz/stores/quizSessionStore.ts`
  - All state preserved: `phase`, `questions`, `currentIndex`, `answers`, `sessionId`, `answerValue`, `showHint`, `aiFeedback`, `feedbackLoading`, `expiresAt`, `isFreshCompletion`
  - All actions preserved: `initializeSession`, `submitAnswer`, `nextQuestion`, `resetSession`, `setAnswerValue`, `toggleHint`, `setAiFeedback`, `setFeedbackLoading`
  - DevTools middleware enabled
- [ ] `listReducer` migrated to Zustand store at `features/vocabulary/stores/listStore.ts`
  - State preserved: `itemsById`, `itemIds`
  - Actions: `init`, `reset`
- [ ] `QuizContext.tsx` updated to use `quizSessionStore` internally (or directly replaced)
- [ ] Quiz page and components updated to read from Zustand store instead of QuizContext where possible
- [ ] Vocabulary consumers updated to use `listStore` instead of context/reducer
- [ ] Existing test coverage maintained — reducer tests adapted to store tests
- [ ] `npm test` passes for quiz and vocabulary features
- [ ] Quiz flow works end-to-end (start → answer → next → results)

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

- **Status**: Planned
- **PR**: TBD
- **Merge Date**: TBD
- **Key Commit**: TBD
