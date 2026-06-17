/**
 * useProgressState.ts
 *
 * Story 17.5: Reads from Zustand stores (progressStore, uiStore, userStore) and
 * provides a RootState-shaped object to selector functions for backward compat.
 *
 * Story 17.6: ProgressStateContext removed — now reads from Zustand stores directly.
 * Consumers should migrate to using Zustand stores directly.
 */
import { useMemo } from "react";

import { useProgressStore } from "../../progress/stores/progressStore";
import { useUiStore } from "../../../shared/store/uiStore";
import { useUserStore } from "../../../shared/store/userStore";
import type { WordBasic } from "../../vocabulary/types/Word";

// RootState shape maintained for backward compat with existing selectors
export type RootState = {
  progress: { wordsById: Record<string, any>; wordIds: string[] };
  user: { userId?: string | null; preferences?: Record<string, unknown> | null };
  ui: {
    isLoading: boolean;
    lastUpdated: string | null;
    selectedList: string | null;
    selectedWords: WordBasic[];
    error: string | undefined;
    initialized: boolean;
  };
};

export function useProgressState<T>(selector: (s: RootState) => T): T {
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
