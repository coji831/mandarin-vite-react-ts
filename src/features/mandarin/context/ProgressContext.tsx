/**
 * ProgressContext.tsx
 *
 * Provider scaffold for Epic-9 Story 9.2. Converts the provider internals to useReducer
 * and exports split state/dispatch contexts. This file intentionally implements a minimal
 * deterministic initialization sequence that clears legacy persisted progress before
 * mounting consumers.
 */
import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { progressReducer, initialState } from "../reducers";
import { readLegacyProgress, clearLegacyProgress } from "../utils/legacyProgress";

export const ProgressStateContext = createContext<typeof initialState | null>(null);
export const ProgressDispatchContext = createContext<React.Dispatch<any> | null>(null);

type Props = { children: ReactNode };

export const ProgressProvider: React.FC<Props> = ({ children }) => {
  const [state, dispatch] = useReducer(progressReducer, initialState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const legacy = readLegacyProgress();
      if (legacy) {
        clearLegacyProgress();
        dispatch({ type: "INIT" });
      }
    } finally {
      setReady(true);
    }
  }, []);

  if (!ready) return null;

  return (
    <ProgressStateContext.Provider value={state}>
      <ProgressDispatchContext.Provider value={dispatch}>
        {children}
      </ProgressDispatchContext.Provider>
    </ProgressStateContext.Provider>
  );
};

export function useProgressState<T>(selector?: (s: typeof initialState) => T) {
  const ctx = useContext(ProgressStateContext);
  if (ctx === null) throw new Error("useProgressState must be used within a ProgressProvider");
  // If no selector provided, return full state
  // Consumer code should prefer selectors to avoid re-renders.
  // Note: keep implementation minimal here; memoization can be added later.
  // @ts-ignore
  return selector ? selector(ctx) : ctx;
}

export function useProgressDispatch() {
  const ctx = useContext(ProgressDispatchContext);
  if (ctx === null) throw new Error("useProgressDispatch must be used within a ProgressProvider");
  return ctx;
}

// Compatibility adapter for existing consumers that expect `useProgressContext()`
// Returns an object similar to the previous `ProgressContextType` while mapping
// into the new state/dispatch contexts. Consumers can migrate to useProgressState
// and useProgressDispatch over time.
export function useProgressContext() {
  const state = useProgressState();
  const dispatch = useProgressDispatch();

  return {
    state,
    dispatch,
  };
}
