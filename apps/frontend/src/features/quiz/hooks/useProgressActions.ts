/**
 * useProgressActions.ts
 *
 * Story 17.5: Delegates to Zustand stores (useProgressStore, useUiStore).
 * Will be removed in Story 17.6 — components should use Zustand stores directly.
 */
import { useMemo } from "react";

import { WordBasic } from "../../vocabulary/types/Word";
import { WordProgress } from "../types";
import { useProgressStore } from "../../progress/stores/progressStore";
import { useUiStore } from "../../../shared/store/uiStore";
import { progressApi } from "../services/progressService";

export function useProgressActions() {
  return useMemo(
    () => ({
      // Legacy-compatible setters — delegate to Zustand
      setSelectedList: (listId: string | null) => useUiStore.getState().setSelectedList(listId),
      setSelectedWords: (words: WordBasic[]) => useUiStore.getState().setSelectedWords(words),
      setLoading: (isLoading: boolean) => useUiStore.getState().setLoading(isLoading),
      setError: (error?: string) => useUiStore.getState().setError(error),

      // Mark word learned: optimistic update + API sync
      markWordLearned: async (id: string) => {
        const now = new Date().toISOString();

        // Optimistic update to progress store
        useProgressStore.getState().updateWordProgress(id, {
          studyCount: 1,
          correctCount: 1,
          confidence: 1.0,
        });

        // Background API sync
        try {
          const updated = await progressApi.updateWordProgress(id, {
            studyCount: 1,
            correctCount: 1,
            confidence: 1.0,
          });

          // Reconcile with server response
          useProgressStore.getState().updateWordProgress(id, updated);
        } catch (error) {
          console.error("Failed to sync progress to backend:", error);
        }
      },

      // Unmark word learned
      unmarkWordLearned: async (id: string) => {
        // Optimistic delete from progress store
        useProgressStore.getState().updateWordProgress(id, { confidence: 0 });

        try {
          await progressApi.deleteProgress(id);
        } catch (error) {
          console.error("Failed to delete progress from backend:", error);
        }
      },

      // Load all progress from backend
      loadAllProgress: async () => {
        useUiStore.getState().setLoading(true);
        try {
          await useProgressStore.getState().loadProgress();
        } catch (error) {
          console.error("Failed to load progress:", error);
          useUiStore.getState().setError("Failed to load progress from server");
        } finally {
          useUiStore.getState().setLoading(false);
        }
      },

      // Update word progress (generic)
      updateWordProgress: async (wordId: string, data: Partial<WordProgress>) => {
        useProgressStore.getState().updateWordProgress(wordId, data);

        if (data.studyCount || data.correctCount || data.confidence) {
          try {
            const updated = await progressApi.updateWordProgress(wordId, { ...data });
            useProgressStore.getState().updateWordProgress(wordId, updated);
          } catch (error) {
            console.error("Failed to sync word progress:", error);
          }
        }
      },

      resetProgress: () => useProgressStore.getState().reset(),
      init: () => {
        /* no-op — progress store initializes on first load */
      },
    }),
    [],
  );
}
