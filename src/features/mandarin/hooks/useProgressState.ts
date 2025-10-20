/**
 * useProgressState.ts
 *
 * Selector hook for reading the Mandarin progress state from the `ProgressStateContext`.
 * Keep this hook minimal: consumers should pass small selectors to avoid re-renders.
 */
import { useContext, useMemo } from "react";
import { ProgressStateContext } from "../context/ProgressContext";

export function useProgressState<T>(selector: (s: any) => T): T {
  const state = useContext(ProgressStateContext as any);
  // simple memoization hook; keep minimal for now
  return useMemo(() => selector(state), [state, selector]);
}
