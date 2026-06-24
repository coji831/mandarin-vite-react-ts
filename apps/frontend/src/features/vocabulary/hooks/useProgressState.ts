/**
 * @file hooks/useProgressState.ts
 * @description Combined state selector + actions for vocabulary progress
 *
 * Wraps the individual Zustand stores (progress, user, UI) into a single
 * RootState for convenient selector-based consumption in vocabulary components.
 *
 * Story 13.4: Centralized progress selector
 */

import { useCallback } from "react";
import { useProgressStore } from "../../progress/stores/progressStore";
import { useUserStore, useUiStore } from "../../../shared/store";
import type { UserState } from "../../../shared/store";
import { progressApi } from "../../progress/services/progressService";

// ─── Types ──────────────────────────────────────────────────────────────

export interface RootState {
  progress: { wordsById: Record<string, unknown>; wordIds: string[] };
  user: { userId: string | null; preferences: UserState["preferences"] };
  ui: {
    selectedList: string | null;
    selectedWords: unknown[];
    isLoading: boolean;
    error: string | undefined;
  };
}

// ─── Selector hook ──────────────────────────────────────────────────────

/**
 * Subscribe to a slice of the combined progress/user/UI state.
 * @param selector - Function that extracts the desired value from RootState
 * @returns The selected value
 */
export function useProgressState<T>(selector: (state: RootState) => T): T {
  // Read from individual Zustand stores using fine-grained selectors
  const progressWords = useProgressStore((s) => s.wordsById);
  const progressIds = useProgressStore((s) => s.wordIds);
  const userId = useUserStore((s) => s.userId);
  const preferences = useUserStore((s) => s.preferences);
  const selectedList = useUiStore((s) => s.selectedList);
  const selectedWords = useUiStore((s) => s.selectedWords);
  const isLoading = useUiStore((s) => s.isLoading);
  const error = useUiStore((s) => s.error);

  return selector({
    progress: { wordsById: progressWords, wordIds: progressIds },
    user: { userId, preferences: preferences ?? {} },
    ui: { selectedList, selectedWords, isLoading, error },
  });
}

// ─── Actions hook ───────────────────────────────────────────────────────

interface ProgressActions {
  /** Mark a word as learned / mastered via backend API */
  markWordLearned: (wordId: string) => Promise<void>;
  /** Unmark a word (remove mastered status) via backend API */
  unmarkWordLearned: (wordId: string) => Promise<void>;
}

/**
 * Hook returning progress actions (markWordLearned / unmarkWordLearned).
 * These call the backend API and update the local store on success.
 */
export function useProgressActions(): ProgressActions {
  const updateWordProgress = useProgressStore((s) => s.updateWordProgress);

  const markWordLearned = useCallback(
    async (wordId: string) => {
      await progressApi.updateWordProgress(wordId, {
        studyCount: 1,
        confidence: 1,
      });
      updateWordProgress(wordId, { studyCount: 1, confidence: 1 });
    },
    [updateWordProgress],
  );

  const unmarkWordLearned = useCallback(
    async (wordId: string) => {
      await progressApi.updateWordProgress(wordId, {
        studyCount: 0,
        confidence: 0,
      });
      updateWordProgress(wordId, { studyCount: 0, confidence: 0 });
    },
    [updateWordProgress],
  );

  return { markWordLearned, unmarkWordLearned };
}
