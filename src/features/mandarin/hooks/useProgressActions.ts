/**
 * useProgressActions.ts
 *
 * Returns memoized action creators that dispatch to the Progress reducer.
 * Keeps action wiring local so consumers use stable APIs and migration is incremental.
 * Related docs:
 * - docs/automation/ai-file-operations.md
 * - docs/automation/automation-protocol.md
 */
import { useMemo } from "react";

import { RootState } from "../reducers";
import { Word } from "../types";
import { useProgressDispatch } from "./useProgressDispatch";
import { useProgressState } from "./useProgressState";

export function useProgressActions() {
  const dispatch = useProgressDispatch();

  const selectedList = useProgressState((s: RootState) => s.ui?.selectedList ?? null);

  return useMemo(
    () => ({
      // Legacy-compatible setters
      setSelectedList: (listId: string | null) =>
        dispatch({ type: "UI/SET_SELECTED_LIST", payload: { listId } }),
      setSelectedWords: (words: Word[]) =>
        dispatch({ type: "UI/SET_SELECTED_WORDS", payload: { words } }),
      setLoading: (isLoading: boolean) =>
        dispatch({ type: "UI/SET_LOADING", payload: { isLoading } }),
      setError: (error?: string) => dispatch({ type: "UI/SET_ERROR", payload: { error } }),

      // Set entire mastered progress map (serialized form)
      setMasteredProgress: (mastered: Record<string, Record<string, boolean>>) =>
        dispatch({ type: "UI/SET_MASTERED_PROGRESS", payload: { mastered } }),

      // Mark word learned: update compatibility slice (Set) and normalized slice
      markWordLearned: (id: string) => {
        // update normalized reducer
        dispatch({ type: "MARK_WORD_LEARNED", payload: { id, when: new Date().toISOString() } });
        // update compatibility ui slice
        if (selectedList) {
          dispatch({
            type: "UI/ADD_MASTERED_WORD",
            payload: { listId: selectedList, wordId: id, when: new Date().toISOString() },
          });
        }
      },

      resetProgress: () => dispatch({ type: "RESET" }),
      init: () => dispatch({ type: "INIT" }),
    }),
    [dispatch, selectedList]
  );
}
