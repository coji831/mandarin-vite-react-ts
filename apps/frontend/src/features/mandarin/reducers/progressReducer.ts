/**
 * progressReducer.ts
 *
 * Responsible for the canonical progress shape that consumers expect:
 * - wordsById: Record<WordId, WordProgress>
 * - wordIds: WordId[]
 *
 * This file is a focused replacement for the previous monolithic `progressReducer`.
 * Automation: see docs/automation/ai-file-operations.md and docs/automation/automation-protocol.md
 */
import { ProgressState, WordProgress } from "../types";

export const progressInitialState: ProgressState = { wordsById: {}, wordIds: [] };

export type ProgressAction =
  | { type: "INIT" }
  | { type: "RESET" }
  | { type: "MARK_WORD_LEARNED"; payload: { id: string; when: string } }
  | { type: "UNMARK_WORD_LEARNED"; payload: { wordId: string } }
  | { type: "PROGRESS/LOAD_ALL"; payload: { progressRecords: WordProgress[] } }
  | { type: "PROGRESS/UPDATE_WORD"; payload: { wordId: string; data: Partial<WordProgress> } }
  | { type: "PROGRESS/SYNC_WORD"; payload: { wordId: string; data: WordProgress } };

export function progressReducer(
  state: ProgressState = progressInitialState,
  action: ProgressAction
): ProgressState {
  switch (action.type) {
    case "INIT":
      return state;
    case "RESET":
      return progressInitialState;
    case "MARK_WORD_LEARNED": {
      const { id, when } = action.payload;
      const currentWordProgress: WordProgress | undefined = state.wordsById[id];
      if (!currentWordProgress) return state;
      return {
        ...state,
        wordsById: { ...state.wordsById, [id]: { ...currentWordProgress, learnedAt: when } },
      };
    }
    case "PROGRESS/LOAD_ALL": {
      // Batch load all progress from backend
      const { progressRecords } = action.payload;
      const wordsById: Record<string, WordProgress> = {};
      const wordIds: string[] = [];

      progressRecords.forEach((record) => {
        wordsById[record.wordId] = record;
        wordIds.push(record.wordId);
      });

      return {
        wordsById,
        wordIds,
      };
    }
    case "PROGRESS/UPDATE_WORD": {
      // Optimistic update for single word (before API response)
      const { wordId, data } = action.payload;
      const currentProgress = state.wordsById[wordId];

      return {
        ...state,
        wordsById: {
          ...state.wordsById,
          [wordId]: {
            ...(currentProgress || { wordId }),
            ...data,
          },
        },
        wordIds: state.wordIds.includes(wordId) ? state.wordIds : [...state.wordIds, wordId],
      };
    }
    case "UNMARK_WORD_LEARNED": {
      // Remove word from progress (undo mastery)
      const { wordId } = action.payload;
      const { [wordId]: removed, ...remainingWords } = state.wordsById;

      return {
        ...state,
        wordsById: remainingWords,
        wordIds: state.wordIds.filter((id) => id !== wordId),
      };
    }
    case "PROGRESS/SYNC_WORD": {
      // Reconcile with server response (authoritative)
      const { wordId, data } = action.payload;

      return {
        ...state,
        wordsById: {
          ...state.wordsById,
          [wordId]: data,
        },
        wordIds: state.wordIds.includes(wordId) ? state.wordIds : [...state.wordIds, wordId],
      };
    }
    default:
      return state;
  }
}

// Selectors
/**
 * Select all progress records (wordsById)
 * @param state - Progress state slice
 * @returns Record of wordId to WordProgress
 */
export function selectWordsById(state: ProgressState): Record<string, WordProgress> {
  return state.wordsById ?? {};
}
