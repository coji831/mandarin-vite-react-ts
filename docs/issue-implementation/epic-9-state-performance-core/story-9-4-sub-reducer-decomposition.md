# Implementation 9-4: Sub-Reducer Decomposition

## Technical Scope

Decompose the large progress reducer into sub-reducers (`listsReducer`, `userReducer`, `uiReducer`), compose them into a `rootReducer`, and export sub-reducers for targeted unit testing.

Deliverables:

- `src/features/mandarin/reducers/listsReducer.ts`
- `src/features/mandarin/reducers/userReducer.ts`
- `src/features/mandarin/reducers/uiReducer.ts`
- `src/features/mandarin/reducers/index.ts` (compose rootReducer)

## Implementation Details

Compose pattern example:

```ts
// reducers/index.ts
import { listsReducer } from "./listsReducer";
import { userReducer } from "./userReducer";
import { uiReducer } from "./uiReducer";

export function rootReducer(state = initialState, action) {
  return {
    lists: listsReducer(state.lists, action),
    user: userReducer(state.user, action),
    ui: uiReducer(state.ui, action),
  } as ProgressState;
}
```

### Files to create / update

- `src/features/mandarin/reducers/listsReducer.ts` — list-specific reducer logic.
- `src/features/mandarin/reducers/userReducer.ts` — user-related state logic.
- `src/features/mandarin/reducers/uiReducer.ts` — UI/flags reducer.
- `src/features/mandarin/reducers/index.ts` or `rootReducer.ts` — compose sub-reducers and export `initialState`.

### Missing scope (source scan) — story 9.4

Files relevant to PR 9.4 (include or reference in PR):

- `src/features/mandarin/reducers/listsReducer.ts`
- `src/features/mandarin/reducers/userReducer.ts`
- `src/features/mandarin/reducers/uiReducer.ts`
- `src/features/mandarin/reducers/index.ts` or `rootReducer.ts` (compose root reducer and export `initialState`)

PR verification (copy into PR description):

- [ ] Sub-reducers added and individually documented
- [ ] `rootReducer` composes sub-reducers and `initialState` exported
- [ ] Types for state slices defined and used by sub-reducers

## Architecture Integration

- Ensure `rootReducer` shape matches `ProgressState` and provider imports it as the reducer for `useReducer`.

## Technical Challenges & Solutions

Problem: guaranteeing sub-reducers operate without interfering with each other's state slices.

Solution: define explicit state slice types and clear state boundaries so each reducer only mutates its slice.
