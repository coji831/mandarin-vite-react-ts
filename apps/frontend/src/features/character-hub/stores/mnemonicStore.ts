/**
 * @file mnemonicStore.ts
 * @description Zustand store for the Mnemonic section state machine.
 * Story 20.2: Mnemonic Display UI
 *
 * Replaces the old useReducer-based state machine.
 * Discriminated union state machine with 9 states:
 * Loading, Cached, Empty, Generating, Display, Editing, Error, Timeout, Pictograph.
 *
 * Async actions handle API calls + timeout internally.
 */

import { create } from "zustand";
import { getMnemonic, generateMnemonic, updateMnemonic } from "../services";
import { PICTOGRAPH_CHARS } from "../constants";

// ─── Types ───────────────────────────────────────────────────────────

export type MnemonicState =
  | { type: "Loading" }
  | { type: "Cached"; story: string }
  | { type: "Empty" }
  | { type: "Generating" }
  | { type: "Display"; story: string; isEdited: boolean }
  | { type: "Editing"; story: string; previousStory: string; previousIsEdited: boolean }
  | { type: "Error"; message: string }
  | { type: "Timeout" }
  | { type: "Saving"; story: string }
  | { type: "Pictograph"; character: string };

export const GENERATE_TIMEOUT_MS = 30_000;

// ─── Store ───────────────────────────────────────────────────────────

interface MnemonicStore {
  state: MnemonicState;

  /** Load mnemonic on mount / character change */
  loadMnemonic: (character: string) => Promise<void>;
  /** Generate a new mnemonic story with timeout protection */
  generateMnemonic: (character: string) => Promise<void>;
  /** Save an edited mnemonic story */
  saveMnemonic: (character: string, story: string) => Promise<void>;
  /** Enter editing mode from Display or Cached state */
  startEdit: () => void;
  /** Update story text while editing */
  updateEdit: (story: string) => void;
  /** Cancel editing — revert to previous story */
  cancelEdit: () => void;
  /** Retry from Error or Timeout — back to Empty */
  retry: () => void;
  /** Reset to Loading state */
  reset: () => void;
}

export const useMnemonicStore = create<MnemonicStore>()((set, get) => ({
  state: { type: "Loading" },

  loadMnemonic: async (character: string) => {
    // Check pictograph first
    if (PICTOGRAPH_CHARS.has(character)) {
      set({ state: { type: "Pictograph", character } });
      return;
    }

    set({ state: { type: "Loading" } });

    try {
      const result = await getMnemonic(character);

      if (result === null) {
        set({ state: { type: "Empty" } });
      } else if (result.isPictograph) {
        set({ state: { type: "Pictograph", character: result.characterGlyph } });
      } else if (result.isEdited) {
        set({ state: { type: "Display", story: result.story, isEdited: true } });
      } else {
        set({ state: { type: "Cached", story: result.story } });
      }
    } catch {
      set({ state: { type: "Error", message: "Failed to load mnemonic story." } });
    }
  },

  generateMnemonic: async (character: string) => {
    set({ state: { type: "Generating" } });

    let timedOut = false;
    const timeoutId = setTimeout(() => {
      timedOut = true;
      const currentState = get().state;
      if (currentState.type === "Generating") {
        set({ state: { type: "Timeout" } });
      }
    }, GENERATE_TIMEOUT_MS);

    try {
      const result = await generateMnemonic(character);
      clearTimeout(timeoutId);

      if (!timedOut) {
        set({
          state: { type: "Display", story: result.story, isEdited: result.isEdited },
        });
      }
    } catch {
      clearTimeout(timeoutId);
      if (!timedOut) {
        set({ state: { type: "Error", message: "Failed to generate mnemonic story." } });
      }
    }
  },

  saveMnemonic: async (character: string, story: string) => {
    set({ state: { type: "Saving", story } });
    try {
      const result = await updateMnemonic(character, story);
      set({ state: { type: "Display", story: result.story, isEdited: true } });
    } catch {
      set({ state: { type: "Error", message: "Failed to save mnemonic story." } });
    }
  },

  startEdit: () => {
    const currentState = get().state;
    if (currentState.type === "Display") {
      set({
        state: {
          type: "Editing",
          story: currentState.story,
          previousStory: currentState.story,
          previousIsEdited: currentState.isEdited,
        },
      });
    } else if (currentState.type === "Cached") {
      set({
        state: {
          type: "Editing",
          story: currentState.story,
          previousStory: currentState.story,
          previousIsEdited: false,
        },
      });
    }
  },

  updateEdit: (story: string) => {
    const currentState = get().state;
    if (currentState.type === "Editing") {
      set({ state: { ...currentState, story } });
    }
  },

  cancelEdit: () => {
    const currentState = get().state;
    if (currentState.type === "Editing") {
      set({
        state: {
          type: "Display",
          story: currentState.previousStory,
          isEdited: currentState.previousIsEdited,
        },
      });
    }
  },

  retry: () => {
    set({ state: { type: "Empty" } });
  },

  reset: () => {
    set({ state: { type: "Loading" } });
  },
}));
