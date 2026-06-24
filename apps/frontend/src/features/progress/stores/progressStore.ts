/**
 * @file apps/frontend/src/features/progress/stores/progressStore.ts
 * @description Zustand store for progress state (Story 17.2)
 */
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { WordProgress } from "../types";
import { progressApi } from "../services/progressService";

interface ProgressStoreState {
  wordsById: Record<string, WordProgress>;
  wordIds: string[];
  isLoading: boolean;
  error: string | undefined;

  loadProgress: () => Promise<void>;
  updateWordProgress: (wordId: string, data: Partial<WordProgress>) => void;
  batchUpdate: (updates: Array<{ wordId: string; data: Partial<WordProgress> }>) => void;
  reset: () => void;
}

const initialState = {
  wordsById: {} as Record<string, WordProgress>,
  wordIds: [] as string[],
  isLoading: false,
  error: undefined as string | undefined,
};

export const useProgressStore = create<ProgressStoreState>()(
  devtools(
    (set, _get) => ({
      ...initialState,

      loadProgress: async () => {
        set({ isLoading: true, error: undefined });
        try {
          const records = await progressApi.getAllProgress();
          const wordsById: Record<string, WordProgress> = {};
          const wordIds: string[] = [];
          for (const record of records) {
            wordsById[record.wordId] = record;
            wordIds.push(record.wordId);
          }
          set({ wordsById, wordIds, isLoading: false });
        } catch (_err) {
          set({ error: "Failed to load progress", isLoading: false });
        }
      },

      updateWordProgress: (wordId, data) =>
        set((state) => ({
          wordsById: {
            ...state.wordsById,
            [wordId]: { ...state.wordsById[wordId], ...data } as WordProgress,
          },
          wordIds: state.wordIds.includes(wordId) ? state.wordIds : [...state.wordIds, wordId],
        })),

      batchUpdate: (updates) =>
        set((state) => {
          const newWordsById = { ...state.wordsById };
          const newWordIds = [...state.wordIds];
          for (const { wordId, data } of updates) {
            newWordsById[wordId] = { ...newWordsById[wordId], ...data } as WordProgress;
            if (!newWordIds.includes(wordId)) {
              newWordIds.push(wordId);
            }
          }
          return { wordsById: newWordsById, wordIds: newWordIds };
        }),

      reset: () => set({ ...initialState }),
    }),
    { name: "progress-store" },
  ),
);
