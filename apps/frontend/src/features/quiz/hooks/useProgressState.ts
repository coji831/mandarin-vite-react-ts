/**
 * useProgressState.ts
 *
 * Story 17.5: Reads from ProgressStateContext (which now delegates to Zustand stores).
 * Falls back to reading from Zustand stores directly if no context is available.
 * Will be removed in Story 17.6 — use useProgressStore/useUiStore directly.
 */
import { useContext, useMemo } from "react";

import { ProgressStateContext } from "../context";
import { useProgressStore } from "../../progress/stores/progressStore";
import { useUiStore } from "../../../shared/store/uiStore";
import { useUserStore } from "../../../shared/store/userStore";
import { RootState } from "../reducers/rootReducer";

export function useProgressState<T>(selector: (s: RootState) => T): T {
  const ctx = useContext(ProgressStateContext);

  // If context is available (e.g., in tests), use it
  if (ctx !== null) {
    return useMemo(() => selector(ctx), [ctx, selector]);
  }

  // Fall back to reading from Zustand stores directly
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

  return useMemo(() => selector(state), [state, selector]);
}
