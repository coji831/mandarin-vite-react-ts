/**
 * @file apps/frontend/src/features/vocabulary/stores/listStore.ts
 * @description Zustand store for vocabulary list state (Story 17.4)
 *
 * Migrated from listReducer to Zustand. Mirrors the exact state shape
 * and actions of the reducer.
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";

type ListStoreState = {
  itemsById: Record<string, unknown>;
  itemIds: string[];
  init: () => void;
  reset: () => void;
};

export const useListStore = create<ListStoreState>()(
  devtools(
    (set) => ({
      itemsById: {},
      itemIds: [],
      init: () => {
        set({ itemsById: {}, itemIds: [] });
      },
      reset: () => set({ itemsById: {}, itemIds: [] }),
    }),
    { name: "vocab-list" },
  ),
);
