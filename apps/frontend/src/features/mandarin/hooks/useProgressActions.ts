/**
 * useProgressActions.ts
 *
 * Returns memoized action creators that dispatch to the Progress reducer.
 * Story 13.4: Added API integration with optimistic updates + server sync (backend-only)
 * Story 14.4: Updated to use apiClient instead of authFetch (automatic token refresh)
 * Related docs:
 * - docs/automation/ai-file-operations.md
 * - docs/automation/automation-protocol.md
 */
import { useMemo } from "react";

import { WordBasic, WordProgress } from "../types";
import { progressApi } from "../services/progressService";
import { useProgressDispatch } from "./useProgressDispatch";

export function useProgressActions() {
  const dispatch = useProgressDispatch();

  return useMemo(
    () => ({
      // Legacy-compatible setters
      setSelectedList: (listId: string | null) =>
        dispatch({ type: "UI/SET_SELECTED_LIST", payload: { listId } }),
      setSelectedWords: (words: WordBasic[]) =>
        dispatch({ type: "UI/SET_SELECTED_WORDS", payload: { words } }),
      setLoading: (isLoading: boolean) =>
        dispatch({ type: "UI/SET_LOADING", payload: { isLoading } }),
      setError: (error?: string) => dispatch({ type: "UI/SET_ERROR", payload: { error } }),

      // Mark word learned: optimistic update + API sync (backend-only)
      markWordLearned: async (id: string) => {
        const now = new Date().toISOString();

        // Optimistic update to progress reducer (binary: 1.0 = mastered)
        dispatch({
          type: "PROGRESS/UPDATE_WORD",
          payload: {
            wordId: id,
            data: {
              studyCount: 1,
              correctCount: 1,
              confidence: 1.0,
              learnedAt: now,
            },
          },
        });

        // Background API sync (always set confidence = 1.0)
        try {
          const updated = await progressApi.updateWordProgress(id, {
            studyCount: 1,
            correctCount: 1,
            confidence: 1.0,
            learnedAt: now,
          });

          // Reconcile with server response
          dispatch({
            type: "PROGRESS/SYNC_WORD",
            payload: {
              wordId: id,
              data: updated,
            },
          });
        } catch (error) {
          console.error("Failed to sync progress to backend:", error);
          // Optimistic update remains; user can retry or it will sync on next load
        }
      },

      // Unmark word learned: optimistic delete + API sync
      unmarkWordLearned: async (id: string) => {
        // Optimistic delete from progress reducer
        dispatch({
          type: "UNMARK_WORD_LEARNED",
          payload: { wordId: id },
        });

        // Background API sync (delete from backend)
        try {
          await progressApi.deleteProgress(id);
        } catch (error) {
          console.error("Failed to delete progress from backend:", error);
          // Optimistic delete remains; could implement rollback here if needed
        }
      },

      // Load all progress from backend (Story 14.4)
      loadAllProgress: async () => {
        try {
          dispatch({ type: "UI/SET_LOADING", payload: { isLoading: true } });

          const progressRecords = await progressApi.getAllProgress();

          // progressRecords are already in WordProgress format (Story 14.4)
          dispatch({
            type: "PROGRESS/LOAD_ALL",
            payload: { progressRecords },
          });

          dispatch({ type: "UI/SET_LOADING", payload: { isLoading: false } });
        } catch (error) {
          console.error("Failed to load progress:", error);
          dispatch({
            type: "UI/SET_ERROR",
            payload: { error: "Failed to load progress from server" },
          });
          dispatch({ type: "UI/SET_LOADING", payload: { isLoading: false } });
        }
      },

      // Update word progress (generic)
      updateWordProgress: async (wordId: string, data: Partial<WordProgress>) => {
        // Optimistic update
        dispatch({
          type: "PROGRESS/UPDATE_WORD",
          payload: { wordId, data },
        });

        // Background API sync
        if (data.studyCount || data.correctCount || data.confidence) {
          try {
            const updated = await progressApi.updateWordProgress(wordId, { ...data });

            // Reconcile with server response
            dispatch({
              type: "PROGRESS/SYNC_WORD",
              payload: {
                wordId,
                data: { ...updated },
              },
            });
          } catch (error) {
            console.error("Failed to sync word progress:", error);
          }
        }
      },

      resetProgress: () => dispatch({ type: "RESET" }),
      init: () => dispatch({ type: "INIT" }),
    }),
    [dispatch],
  );
}
