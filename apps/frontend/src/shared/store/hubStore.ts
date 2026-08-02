/**
 * @file shared/store/hubStore.ts
 * @description Zustand store for LexicalHub overlay state (generalized)
 * Story 18.5: Character Detail Hub (Phase 1 Minimal)
 * Story 21.4: Reading UI + LexicalHub Phase 1 — generalized to support any entity type
 * Story 21.4 (refactor): Simplified to single open() + back() — removed openExternal/navigateTo/pushNavigation
 *
 * Manages hub open/close, current entity, and navigation stack.
 * Each hub section fetches its own data independently via dedicated hooks/services.
 * Follows patterns from shared/store/uiStore.ts.
 */

import { create } from "zustand";
import type { EntityRef } from "../types";

// ─── Store type ────────────────────────────────────────────────────
export type HubState = {
  isOpen: boolean;
  /** null = no entity selected; EntityRef = currently viewed entity */
  currentEntity: EntityRef | null;
  navigationStack: EntityRef[];

  /**
   * @internal Use openHub() from shared/hub-entry instead.
   * Opens the hub with the given entity reference.
   * @param resetStack - If true, clears navigation stack (external entry).
   *                     If false, preserves history (internal navigation).
   */
  open: (entityRef: EntityRef, resetStack: boolean) => void;

  /** Close the hub and reset all state. */
  close: () => void;

  /** Pop the navigation stack and set currentEntity to the popped item. */
  back: () => void;
};

// ─── Initial state ─────────────────────────────────────────────────
const initialState = {
  isOpen: false,
  currentEntity: null as EntityRef | null,
  navigationStack: [] as EntityRef[],
};

export const useHubStore = create<HubState>()((set, get) => ({
  ...initialState,

  open: (entityRef, resetStack) => {
    if (resetStack) {
      set({
        isOpen: true,
        currentEntity: entityRef,
        navigationStack: [],
      });
    } else {
      const current = get().currentEntity;
      set((state) => ({
        isOpen: true,
        currentEntity: entityRef,
        navigationStack: current ? [...state.navigationStack, current] : state.navigationStack,
      }));
    }
  },

  close: () =>
    set({
      isOpen: false,
      currentEntity: null,
      navigationStack: [],
    }),

  back: () => {
    const state = get();
    if (state.navigationStack.length === 0) return;
    const stack = [...state.navigationStack];
    const popped = stack.pop()!;
    set({ navigationStack: stack, currentEntity: popped });
  },
}));
