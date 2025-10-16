# Epic: Normalize Data & Improve Reducer Granularity (Phase 2)

## Summary

Improve scalability by normalizing vocabulary and progress data (store by-id maps and id arrays) and by moving heavy mutation logic to pure reducers. This reduces O(n) operations and makes single-item updates cheap and predictable.

## Goals

- Convert list/word storage to normalized shapes (e.g., `lists: Record<listId, { ids: string[]; byId: Record<string, Word> }>`).
- Introduce a `progressReducer` to handle core mutations using immutable patterns (spread operator).
- Provide derived selectors like `getWordsForList(listId)` for compatibility.

## Scope

Files to update or add:

- `src/features/mandarin/hooks/useProgressContext.ts`
- `src/features/mandarin/reducers/progressReducer.ts`
- `src/features/mandarin/utils/progressHelpers.ts` (migration helpers)

## Constraints

- No external libraries (no Immer). Use clear, tested immutable updates.
- Maintain compatibility surface by providing helper selectors that return arrays if components expect arrays.

## Acceptance Criteria

- Marking a single word as learned updates state in O(1) (map write) and does not require iterating entire arrays.
- Reducer unit tests cover actions: `MARK_WORD_LEARNED`, `SET_SELECTED_LIST`, `RESTORE_PROGRESS`.

## Risks & Mitigations

- Risk: Changes to data shape break components assuming arrays. Mitigation: leave selector functions that return arrays until components are updated.

## Metrics

- Memory footprint and time to mark 100 words learned (compare before/after).
- Unit test coverage for reducers (target 80% for new code).
