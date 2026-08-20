# Implementation 9-1: Types & Reducer Skeletons

## Technical Scope

Create canonical normalized types and reducer skeletons used by the Mandarin progress domain. Deliverables:

- `src/features/mandarin/types/ProgressNormalized.ts`
- `src/features/mandarin/reducers/progressReducer.ts` (skeleton)
- Exported `initialState` (used by provider)

## Implementation Details

Example normalized type and reducer skeleton (starter):

```typescript
// src/features/mandarin/types/ProgressNormalized.ts
export type WordId = string;

export interface WordEntity {
  id: WordId;
  word: string;
  learnedAt?: string | null;
}

export interface ProgressState {
  wordsById: Record<WordId, WordEntity>;
  wordIds: WordId[];
}

export const initialState: ProgressState = { wordsById: {}, wordIds: [] };
```

```typescript
// src/features/mandarin/reducers/progressReducer.ts
import { ProgressState, initialState } from "../types/ProgressNormalized";

export type Action =
  | { type: "INIT" }
  | { type: "MARK_WORD_LEARNED"; payload: { id: string; when: string } };

export function progressReducer(
  state: ProgressState = initialState,
  action: Action
): ProgressState {
  switch (action.type) {
    case "INIT":
      return state;
    case "MARK_WORD_LEARNED":
      const { id, when } = action.payload;
      const entity = state.wordsById[id];
      if (!entity) return state;
      return {
        ...state,
        wordsById: { ...state.wordsById, [id]: { ...entity, learnedAt: when } },
      };
    default:
      return state;
  }
}
```

## Architecture Integration

The reducer and types are the core building blocks for PR 9.2 (provider conversion). Export `initialState` from the reducer module so the provider can import it for initialization.

## Technical Challenges & Solutions

Problem: converting existing array-based code to normalized shapes may require small adapter code in a few import sites.

Solution: keep the reducer and types minimal in 9.1 and provide small transitional selectors (e.g., `getWordsForList`) in later PRs.

### Files to create / minimal purpose

- `src/features/mandarin/types/ProgressNormalized.ts` — canonical normalized type surface (byId/ids) and exported action types.
- `src/features/mandarin/reducers/progressReducer.ts` — reducer skeleton and exported `initialState`.
- `src/features/mandarin/services/cache.ts` — optional in-memory TTL cache (if needed for early perf work).

### Missing scope (source scan) — story 9.1

Files relevant to PR 9.1 (include or reference in PR):

- `src/features/mandarin/types/ProgressNormalized.ts`
- `src/features/mandarin/reducers/progressReducer.ts` (export `initialState`)
- (optional infra) `src/features/mandarin/services/cache.ts`

PR verification (copy into PR description):

- [ ] Files above are present or noted as deferred with rationale
- [ ] `initialState` exported from reducer module
- [ ] Reducer skeleton compiles (type-check) and includes clear TODOs for further actions
