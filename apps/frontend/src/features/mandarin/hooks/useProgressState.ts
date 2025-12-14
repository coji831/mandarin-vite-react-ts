/**
 * useProgressState.ts
 *
 * Selector hook for reading the Mandarin progress state from the `ProgressStateContext`.
 * Keep this hook minimal: consumers should pass small selectors to avoid re-renders.
 */
import { useContext, useMemo } from "react";

import { ProgressStateContext } from "../context";
import { RootState } from "../reducers/rootReducer";

export function useProgressState<T>(selector: (s: RootState) => T): T {
  const state = useContext(ProgressStateContext);
  if (state === null) throw new Error("useProgressState must be used within a ProgressProvider");
  // simple memoization hook; keep minimal for now
  return useMemo(() => selector(state), [state, selector]);
}
