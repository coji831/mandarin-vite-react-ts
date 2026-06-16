# Story 17.1: State Ownership Restructure

## Description

**As a** developer,
**I want to** move `uiReducer`/`userReducer` files from `features/quiz/reducers/` to `shared/store/` and decouple `listReducer` from quiz's `rootReducer.ts`,
**So that** cross-feature state coupling is eliminated and each feature owns its own state.

## Business Value

This story eliminates the most critical architectural debt in the frontend — the quiz feature's `rootReducer` imports and manages vocabulary feature state (`listReducer`). This coupling means any change to vocabulary's `ListState` type or actions risks breaking the quiz feature. Moving UI and user state to `shared/store/` also gives all features a neutral home for mechanical/technical state without creating cross-feature import paths.

Benefits:

- Quiz and vocabulary features become independently maintainable
- UI/user state becomes accessible to all features without cross-feature imports
- Zero behavioral changes — pure file relocation and import updates
- Enables subsequent Zustand migration (Stories 17.4-17.5) by clearing the path

## Acceptance Criteria

- [ ] `uiReducer.ts` moved from `features/quiz/reducers/` to `shared/store/uiStore.prelude.ts` (placeholder for Zustand migration) — all imports updated
- [ ] `userReducer.ts` moved from `features/quiz/reducers/` to `shared/store/userStore.prelude.ts` (placeholder for Zustand migration) — all imports updated
- [ ] `shared/store/index.ts` created — barrel re-exporting both reducers, their initial states, action types
- [ ] `listReducer` removed from quiz's `rootReducer.ts` — vocabulary feature fully owns its own state
- [ ] `rootReducer.ts` simplified: only composes `progress` + `user` + `ui` slices (no more `vocabLists`)
- [ ] `ProgressContext.tsx` updated to use simplified `rootReducer` (3 slices instead of 4)
- [ ] `ProgressState` context type updated — `vocabLists` removed from `RootState`
- [ ] All hooks that consumed `RootState` from ProgressContext updated — references to `vocabLists` removed
- [ ] Vocabulary feature consumers that relied on `vocabLists` from ProgressContext switch to direct vocabulary feature state
- [ ] All existing reducer tests pass unchanged
- [ ] `npm test` passes across the affected features
- [ ] Barrel exports (`index.ts` for quiz, vocabulary, and shared) updated

## Business Rules

1. **No behavioral changes**: Reducer logic, action types, and state shapes remain identical — only file locations change
2. **Barrel-only imports**: External consumers import from `shared/store/` barrel, not internal paths
3. **Gradual migration path**: Files are named `*.prelude.ts` to indicate they will be replaced by Zustand stores in Stories 17.4-17.5

## Related Issues

- Epic 17: [State Restructure & Zustand Migration](README.md) (Epic parent)
- Story 17.5: [Zustand Migration (UI + User + Progress)](story-17-5-zustand-migration-ui-user-progress.md) (Replaces `.prelude.ts` files with actual Zustand stores)

## Implementation Status

- **Status**: Planned
- **PR**: TBD
- **Merge Date**: TBD
- **Key Commit**: TBD
