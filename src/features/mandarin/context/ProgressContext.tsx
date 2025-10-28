/**
 * ProgressContext.tsx
 *
 * Provider scaffold for Epic-9 Story 9.2. Converts the provider internals to useReducer
 * and exports split state/dispatch contexts. This file intentionally implements a minimal
 * deterministic initialization sequence that clears legacy persisted progress before
 * mounting consumers.
 */
import React, { createContext, ReactNode, useEffect, useReducer, useState } from "react";

import { initialState, ProgressAction, progressReducer, RootState } from "../reducers";
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
export const ProgressDispatchContext = createContext<React.Dispatch<ProgressAction> | null>(
  null
) as React.Context<React.Dispatch<ProgressAction> | null>;

type Props = { children: ReactNode };

export function ProgressProvider({ children }: Props) {
  const [state, dispatch] = useReducer(progressReducer, initialState);
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
          dispatch({ type: "UI/SET_MASTERED_PROGRESS", payload: { mastered: serialized } });
        }
      } finally {
        setReady(true);
      }
    }

    void init();
  }, []);

  // Persist compatibility UI mastered progress when it changes (selectedList, selectedWords)
  useEffect(() => {
    // we only persist when a user identity exists
    try {
      const identity = getUserIdentity();
      const userId = identity.userId;
      const masteredMap = (state.ui && state.ui.masteredProgress) || {};
      const userProgress = persistMasteredProgress(masteredMap, getUserProgress(userId));
      saveUserProgress(userId, userProgress);
    } catch (e) {
      // best-effort persistence — don't block UI
      console.warn("Progress persistence failed:", e);
    }
  }, [state.ui, state.ui.masteredProgress, state.ui.selectedList, state.ui.selectedWords]);

  if (!ready) return null;

  return (
    <ProgressStateContext.Provider value={state}>
      <ProgressDispatchContext.Provider value={dispatch}>
        {children}
      </ProgressDispatchContext.Provider>
    </ProgressStateContext.Provider>
  );
}
