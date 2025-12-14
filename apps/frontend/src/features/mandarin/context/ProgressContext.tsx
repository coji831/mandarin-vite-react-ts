/**
 * ProgressContext.tsx
 *
 * Provider scaffold for Epic-9 Story 9.2. Converts the provider internals to useReducer
 * and exports split state/dispatch contexts. This file intentionally implements a minimal
 * deterministic initialization sequence that clears legacy persisted progress before
 * mounting consumers.
 */
import React, { createContext, ReactNode, useEffect, useReducer, useState } from "react";

import { RootState, rootReducer, initialState, RootAction } from "../reducers/rootReducer";
import {
  getUserIdentity,
  getUserProgress,
  persistMasteredProgress,
  restoreMasteredProgress,
  saveUserProgress,
} from "../utils";

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
        // determine current user identity and load persisted progress
        const identity = getUserIdentity();
        const userProgress = getUserProgress(identity.userId);

        // restore mastered progress into compatibility UI slice
        const mastered = restoreMasteredProgress(userProgress);
        // convert mastered (Set map) into serialized shape expected by reducer
        const serialized: Record<string, Record<string, boolean>> = {};
        Object.keys(mastered).forEach((listId) => {
          const set = mastered[listId] || new Set<string>();
          const obj: Record<string, boolean> = {};
          set.forEach((id) => (obj[id] = true));
          serialized[listId] = obj;
        });

        if (Object.keys(serialized).length > 0) {
          dispatch({
            type: "UI/SET_MASTERED_PROGRESS",
            payload: { mastered: serialized },
          } as RootAction);
        }
      } finally {
        setReady(true);
      }
    }

    void init();
  }, []);

  // Persist compatibility UI mastered progress when it changes (selectedList, selectedWords)
  // Extract UI slice and relevant fields for useEffect dependencies
  const ui = (state as RootState).ui;
  const masteredProgress = ui && ui.masteredProgress;
  const selectedList = ui && ui.selectedList;
  const selectedWords = ui && ui.selectedWords;

  useEffect(() => {
    // we only persist when a user identity exists
    try {
      const identity = getUserIdentity();
      const userId = identity.userId;
      const masteredMap = masteredProgress || {};
      const userProgress = persistMasteredProgress(masteredMap, getUserProgress(userId));
      saveUserProgress(userId, userProgress);
    } catch (e) {
      // best-effort persistence — don't block UI
      console.warn("Progress persistence failed:", e);
    }
  }, [state, ui, masteredProgress, selectedList, selectedWords]);

  if (!ready) return null;

  return (
    <ProgressStateContext.Provider value={state as RootState}>
      <ProgressDispatchContext.Provider value={dispatch}>
        {children}
      </ProgressDispatchContext.Provider>
    </ProgressStateContext.Provider>
  );
}
