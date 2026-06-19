/**
 * @file shared/store/hubStore.ts
 * @description Zustand store for Character Detail Hub overlay state
 * Story 18.5: Character Detail Hub (Phase 1 Minimal)
 *
 * Manages hub open/close, character selection, and trigger position for animation.
 * Follows patterns from shared/store/uiStore.ts.
 */

import { create } from "zustand";

export type HubState = {
  isOpen: boolean;
  character: string | null;
  pinyin: string | null;
  triggerPosition?: { x: number; y: number };

  open: (character: string, pinyin?: string, position?: { x: number; y: number }) => void;
  close: () => void;
};

const initialState = {
  isOpen: false,
  character: null as string | null,
  pinyin: null as string | null,
  triggerPosition: undefined as { x: number; y: number } | undefined,
};

export const useHubStore = create<HubState>()((set) => ({
  ...initialState,

  open: (character, pinyin, position) =>
    set({
      isOpen: true,
      character,
      pinyin: pinyin ?? null,
      triggerPosition: position,
    }),

  close: () =>
    set({
      isOpen: false,
      character: null,
      pinyin: null,
      triggerPosition: undefined,
    }),
}));
