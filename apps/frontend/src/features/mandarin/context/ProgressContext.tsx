/**
 * ProgressContext.tsx
 *
 * Provider scaffold for Epic-9 Story 9.2. Converts the provider internals to useReducer
 * and exports split state/dispatch contexts.
 *
 * Story 13.4: Backend-only progress loading (no localStorage)
 */
import React, { createContext, ReactNode, useEffect, useReducer, useState } from "react";

import type { ProgressResponse } from "@mandarin/shared-types";
import { initialState, RootAction, rootReducer, RootState } from "../reducers/rootReducer";
import { progressApi } from "../services/progressService";
import { WordProgress } from "../types";

export const ProgressStateContext = createContext<RootState | null>(
  null
) as React.Context<RootState | null>;
export const ProgressDispatchContext = createContext<React.Dispatch<RootAction> | null>(
  null
) as React.Context<React.Dispatch<RootAction> | null>;

type Props = { children: ReactNode };

export function ProgressProvider({ children }: Props) {
  const [state, dispatch] = useReducer<React.Reducer<RootState, RootAction>>(
    rootReducer,
    initialState
  );
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        await loadBackendProgress(dispatch);
      } finally {
        setReady(true);
      }
    }

    void init();
  }, []);

  if (!ready) return null;

  return (
    <ProgressStateContext.Provider value={state as RootState}>
      <ProgressDispatchContext.Provider value={dispatch}>
        {children}
      </ProgressDispatchContext.Provider>
    </ProgressStateContext.Provider>
  );
}

/**
 * Transform backend ProgressResponse to WordProgress format
 */
function transformProgressRecords(records: ProgressResponse[]): WordProgress[] {
  return records.map((p) => ({
    ...p,
    learnedAt: p.confidence >= 1.0 ? p.updatedAt : null,
  }));
}

/**
 * Load progress from backend API
 */
async function loadBackendProgress(dispatch: React.Dispatch<RootAction>): Promise<void> {
  const accessToken = localStorage.getItem("accessToken");
  if (!accessToken) {
    return;
  }

  try {
    dispatch({ type: "UI/SET_LOADING", payload: { isLoading: true } });

    const progressRecords = await progressApi.getAllProgress();
    const transformed = transformProgressRecords(progressRecords);

    dispatch({
      type: "PROGRESS/LOAD_ALL",
      payload: { progressRecords: transformed },
    });

    dispatch({ type: "UI/SET_LOADING", payload: { isLoading: false } });
  } catch (error) {
    console.error("Failed to load progress from backend:", error);
    dispatch({
      type: "UI/SET_ERROR",
      payload: { error: "Failed to load progress from server" },
    });
    dispatch({ type: "UI/SET_LOADING", payload: { isLoading: false } });
  }
}
