/**
 * useProgressActions.ts
 *
 * Returns memoized action creators that dispatch to the Progress reducer.
 * Keeps action wiring local so consumers use stable APIs and migration is incremental.
 * Related docs:
 * - docs/automation/ai-file-operations.md
 * - docs/automation/automation-protocol.md
 */
import { useMemo } from "react";
import { useProgressDispatch } from "./useProgressDispatch";

export function useProgressActions() {
  const dispatch = useProgressDispatch();

  return useMemo(
    () => ({
      markWordLearned: (id: string) =>
        dispatch({ type: "MARK_WORD_LEARNED", payload: { id, when: new Date().toISOString() } }),
      resetProgress: () => dispatch({ type: "RESET" }),
      init: () => dispatch({ type: "INIT" }),
    }),
    [dispatch]
  );
}
