# Epic: Split into Sub-Reducers & Granular Actions (Phase 3)

## Summary

Partition the large FeatureState into smaller sub-reducers (e.g., `lists`, `user`, `ui`) combined with a lightweight `combineReducers` pattern. Make actions granular and pure to enable easier testing and future migration to tools like XState.

## Goals

- Add `src/features/mandarin/reducers/rootReducer.ts` and sub-reducers such as `listsReducer.ts`, `userReducer.ts`, and `uiReducer.ts`.
- Standardize action shapes and names (e.g., `MARK_WORD_LEARNED`, `SET_SELECTED_LIST`).
- Keep action creators stable and memoized in providers.

## Scope

Files to add/update:

- `src/features/mandarin/reducers/*.ts`
- `src/features/mandarin/hooks/useProgressContext.ts` (useReducer integration)
- Tests for reducers and action creators

## Constraints

- Keep reducers pure and side-effect free; side effects remain in hooks or service modules.

## Acceptance Criteria

- Reducers are unit-tested and deterministic.
- Provider exposes memoized action creators that dispatch reducer actions.

## Risks & Mitigations

- Increased code surface area. Mitigation: keep reducer functions small and documented.

## Metrics

- Test coverage for reducers.
- Developer velocity when adding new actions (should be faster; measure via PR review feedback).
