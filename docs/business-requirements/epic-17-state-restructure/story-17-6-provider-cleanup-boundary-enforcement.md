# Story 17.6: Provider Cleanup & Boundary Enforcement

## Description

**As a** developer,
**I want to** remove the monolithic `ProgressProvider` from `LearnLayout`, clean up dead provider nesting, and add ESLint rules to enforce module boundaries,
**So that** the modular monolith pattern is enforced automatically and the provider tree is flat.

## Business Value

After Stories 17.1-17.5, all state management uses Zustand stores that need no Context providers. However, the provider wrappers (`ProgressProvider`, `UserIdentityProvider`, `QuizProvider`) still exist in the component tree, adding unnecessary nesting and suggesting the old pattern. Removing them cleans up the component tree, reduces bundle size, and signals the architectural shift. ESLint rules prevent developers from accidentally reintroducing cross-feature store imports.

Benefits:

- Flat provider tree — `LearnLayout` no longer wraps content in unnecessary providers
- ESLint catches cross-feature store imports at lint time
- Dead code eliminated (~150 lines of provider boilerplate)
- Clear architectural signal: use Zustand stores, not Context
- `rootReducer.ts` and all reducer files cleaned up

## Acceptance Criteria

- [ ] `ProgressProvider` removed from `LearnLayout.tsx` — `/learn/*` routes no longer wrapped
- [ ] `UserIdentityProvider` removed from `LearnLayout.tsx` — identity handled by Zustand `userStore`
- [ ] `QuizProvider` removed from `QuizPage.tsx` — quiz state uses `quizSessionStore` directly
- [ ] `ProgressContext.tsx` deleted — no longer referenced anywhere
- [ ] `UserIdentityContext.tsx` deleted — no longer referenced anywhere
- [ ] `QuizContext.tsx` deleted — no longer referenced anywhere
- [ ] `rootReducer.ts` deleted — no longer referenced anywhere
- [ ] All reducer files deleted: `quizReducer.ts`, `progressReducer.ts`, `uiReducer.ts` (if still present), `userReducer.ts` (if still present), `listReducer.ts`
- [ ] ESLint rule added: no direct imports from `features/*/stores/*` — must use barrel exports
- [ ] ESLint rule added: no direct imports from `shared/store/*` — must use barrel exports
- [ ] `npm test` passes for all affected features
- [ ] All `/learn/*` routes load and function correctly without providers
- [ ] `npm run lint` passes with new ESLint rules

## Business Rules

1. **No behavioral impact**: Removing providers must not change any component behavior
2. **ESLint enforcement**: Cross-feature store imports are forbidden — features expose public API through barrel files
3. **Graceful migration**: Components already using Zustand stores directly continue working; any remaining Context consumers must be migrated first

## Related Issues

- Epic 17: [State Restructure & Zustand Migration](README.md) (Epic parent)
- Story 17.4: [Zustand Migration (Quiz + Vocabulary)](story-17-4-zustand-migration-quiz-vocabulary.md)
- Story 17.5: [Zustand Migration (UI + User + Progress)](story-17-5-zustand-migration-ui-user-progress.md)

## Implementation Status

- **Status**: Planned
- **PR**: TBD
- **Merge Date**: TBD
- **Key Commit**: TBD
