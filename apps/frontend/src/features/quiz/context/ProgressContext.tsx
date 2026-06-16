/**
 * ProgressContext.tsx
 *
 * Story 17.5: Transitional wrapper over Zustand stores.
 * Will be removed entirely in Story 17.6.
 *
 * Components should migrate to useProgressStore, useUiStore, useUserStore directly.
 */
import React, { createContext, ReactNode, useEffect, useState } from "react";

import { useProgressStore } from "../../progress/stores/progressStore";
import { useUiStore } from "../../../shared/store/uiStore";
import { useUserStore } from "../../../shared/store/userStore";
import { RootState } from "../reducers/rootReducer";

export const ProgressStateContext = createContext<RootState | null>(
  null,
) as React.Context<RootState | null>;
export const ProgressDispatchContext = createContext<React.Dispatch<any> | null>(
  null,
) as React.Context<React.Dispatch<any> | null>;

type Props = { children: ReactNode };

export function ProgressProvider({ children }: Props) {
  const [ready, setReady] = useState(false);
  const loadProgress = useProgressStore((s) => s.loadProgress);
  const progressWordsById = useProgressStore((s) => s.wordsById);
  const progressWordIds = useProgressStore((s) => s.wordIds);
  const progressIsLoading = useProgressStore((s) => s.isLoading);
  const progressError = useProgressStore((s) => s.error);
  const uiIsLoading = useUiStore((s) => s.isLoading);
  const uiError = useUiStore((s) => s.error);
  const uiSelectedList = useUiStore((s) => s.selectedList);
  const uiSelectedWords = useUiStore((s) => s.selectedWords);
  const uiInitialized = useUiStore((s) => s.initialized);
  const userId = useUserStore((s) => s.userId);

  useEffect(() => {
    async function init() {
      try {
        await loadProgress();
      } finally {
        setReady(true);
      }
    }
    void init();
  }, [loadProgress]);

  if (!ready) return null;

  // Build a RootState-like shape for backward compat
  const state: RootState = {
    progress: {
      wordsById: progressWordsById,
      wordIds: progressWordIds,
    },
    ui: {
      isLoading: uiIsLoading || progressIsLoading,
      lastUpdated: null,
      selectedList: uiSelectedList,
      selectedWords: uiSelectedWords,
      error: progressError || uiError,
      initialized: uiInitialized,
    },
    user: {
      userId: userId,
      preferences: null,
    },
  };

  // Noop dispatch for backward compat during transition
  const noopDispatch: React.Dispatch<any> = () => {};

  return (
    <ProgressStateContext.Provider value={state as RootState}>
      <ProgressDispatchContext.Provider value={noopDispatch}>
        {children}
      </ProgressDispatchContext.Provider>
    </ProgressStateContext.Provider>
  );
}
