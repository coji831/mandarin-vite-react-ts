/**
 * @file mnemonicReducer.ts
 * @description Reducer state, actions, and logic for the Mnemonic section state machine.
 * Story 20.2: Mnemonic Display UI
 *
 * Discriminated union state machine with 9 states:
 * Loading, Cached, Empty, Generating, Display, Editing, Error, Timeout, Pictograph.
 */

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
  | { type: "Pictograph"; character: string };

export type MnemonicAction =
  | { type: "LOADED_CACHED"; story: string }
  | { type: "LOADED_EDITED"; story: string }
  | { type: "NOT_FOUND" }
  | { type: "IS_PICTOGRAPH"; character: string }
  | { type: "LOAD_ERROR"; message: string }
  | { type: "GENERATE_START" }
  | { type: "GENERATE_SUCCESS"; story: string; isEdited: boolean }
  | { type: "GENERATE_ERROR"; message: string }
  | { type: "GENERATE_TIMEOUT" }
  | { type: "START_EDIT" }
  | { type: "EDIT_UPDATE"; story: string }
  | { type: "SAVE_SUCCESS"; story: string }
  | { type: "CANCEL_EDIT" }
  | { type: "RETRY" }
  | { type: "RESET" };

// ─── Constants ──────────────────────────────────────────────────────

export const GENERATE_TIMEOUT_MS = 30_000;

// ─── Reducer ─────────────────────────────────────────────────────────

export function mnemonicReducer(state: MnemonicState, action: MnemonicAction): MnemonicState {
  switch (action.type) {
    case "LOADED_CACHED":
      return { type: "Cached", story: action.story };
    case "LOADED_EDITED":
      return { type: "Display", story: action.story, isEdited: true };
    case "NOT_FOUND":
      return { type: "Empty" };
    case "IS_PICTOGRAPH":
      return { type: "Pictograph", character: action.character };
    case "LOAD_ERROR":
      return { type: "Error", message: action.message };
    case "GENERATE_START":
      return { type: "Generating" };
    case "GENERATE_SUCCESS":
      return { type: "Display", story: action.story, isEdited: action.isEdited };
    case "GENERATE_ERROR":
      return { type: "Error", message: action.message };
    case "GENERATE_TIMEOUT":
      return { type: "Timeout" };
    case "START_EDIT": {
      if (state.type === "Display") {
        return {
          type: "Editing",
          story: state.story,
          previousStory: state.story,
          previousIsEdited: state.isEdited,
        };
      }
      if (state.type === "Cached") {
        return {
          type: "Editing",
          story: state.story,
          previousStory: state.story,
          previousIsEdited: false,
        };
      }
      return state;
    }
    case "EDIT_UPDATE": {
      if (state.type === "Editing") {
        return { ...state, story: action.story };
      }
      return state;
    }
    case "SAVE_SUCCESS":
      return { type: "Display", story: action.story, isEdited: true };
    case "CANCEL_EDIT": {
      if (state.type === "Editing") {
        return {
          type: "Display",
          story: state.previousStory,
          isEdited: state.previousIsEdited,
        };
      }
      return state;
    }
    case "RETRY":
      return { type: "Empty" };
    case "RESET":
      return { type: "Loading" };
    default:
      return state;
  }
}
