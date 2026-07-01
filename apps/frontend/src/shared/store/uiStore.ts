/**
 * @file apps/frontend/src/shared/store/uiStore.ts
 * @description Zustand store for UI state (Story 17.5)
 *
 * Replaces uiStore.prelude.ts. Manages loading, error, selected list/words state.
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";

export interface UiState {
  isLoading: boolean;
  lastUpdated: string | null;
  selectedList: string | null;
  error: string | undefined;
  initialized: boolean;

  setLoading: (isLoading: boolean) => void;
  setUpdated: (lastUpdated: string) => void;
  setSelectedList: (listId: string | null) => void;
  setError: (error?: string) => void;
  setInitialized: (initialized: boolean) => void;
  reset: () => void;
}

const initialUiState = {
  isLoading: false,
  lastUpdated: null as string | null,
  selectedList: null as string | null,
  error: undefined as string | undefined,
  initialized: false,
};

export const useUiStore = create<UiState>()(
  devtools(
    (set) => ({
      ...initialUiState,

      setLoading: (isLoading) => set({ isLoading }),
      setUpdated: (lastUpdated) => set({ lastUpdated }),
      setSelectedList: (listId) => set({ selectedList: listId }),
      setError: (error) => set({ error }),
      setInitialized: (initialized) => set({ initialized }),
      reset: () =>
        set({
          isLoading: false,
          lastUpdated: null,
          selectedList: null,
          error: undefined,
          initialized: false,
        }),
    }),
    { name: "ui-store" },
  ),
);
