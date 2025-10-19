# Implementation 9-3: Split Contexts & Hooks

## Technical Scope

Implement `ProgressStateContext` and `ProgressDispatchContext`, provide `useProgressState(selector)` and `useProgressActions()` hooks, and convert 2–3 heavy consumers to the new hook API.

Deliverables:

- `src/features/mandarin/context/ProgressContext.tsx` (split contexts)
- `src/features/mandarin/hooks/useProgressState.ts`
- `src/features/mandarin/hooks/useProgressActions.ts`
- Conversion PRs for at least two heavy consumers
- Ensure selectors are memoized and keep hook implementations stable to minimize re-renders.

## Implementation Details

Hook patterns:

```ts
// useProgressState.ts
import { useContext, useMemo } from "react";
import { ProgressStateContext } from "../context/ProgressContext";

export function useProgressState<T>(selector: (s: ProgressState) => T): T {
  const state = useContext(ProgressStateContext);
  return useMemo(() => selector(state), [state, selector]);
}
```

```ts
// useProgressActions.ts
import { useContext, useCallback } from "react";
import { ProgressDispatchContext } from "../context/ProgressContext";

export function useProgressActions() {
  const dispatch = useContext(ProgressDispatchContext);
  return useMemo(
    () => ({
      markWordLearned: (id: string) =>
        dispatch({ type: "MARK_WORD_LEARNED", payload: { id, when: new Date().toISOString() } }),
    }),
    [dispatch]
  );
}
```

### Files to create / update

- `src/features/mandarin/hooks/useProgressState.ts` — typed selector hook: `useProgressState<T>(selector: (s)=>T):T`.
- `src/features/mandarin/hooks/useProgressActions.ts` — stable action hooks returning memoized action functions.
- `src/features/mandarin/hooks/useProgressContext.ts` — optional adapter to reduce immediate consumer churn.
- Consumer components to update: `VocabularyCard.tsx`, `ConversationTurns.tsx`, `Flashcard.tsx` (examples).

### Missing scope (source scan) — story 9.3

Files relevant to PR 9.3 (include or reference in PR):

- `src/features/mandarin/hooks/useProgressState.ts`
- `src/features/mandarin/hooks/useProgressActions.ts`
- `src/features/mandarin/hooks/useProgressContext.ts`
- `src/features/mandarin/components/VocabularyCard.tsx`
- `src/features/mandarin/components/ConversationTurns.tsx`
- `src/features/mandarin/components/Flashcard.tsx`

PR verification (copy into PR description):

- [ ] Hook modules added and exported
- [ ] Converted consumers use `useProgressState`/`useProgressActions` and have brief smoke-check notes in PR description
- [ ] Memoization and selector usage documented in code comments where relevant

## Architecture Integration

- Replace direct context consumers with `useProgressState` or `useProgressActions` as appropriate.
- Ensure memoization to avoid recomputing derived selectors frequently.

## Technical Challenges & Solutions

Problem: ensuring selectors remain performant and do not cause re-renders of unrelated components.

Solution: provide small memoized selectors and prioritize converting heaviest consumers first.
