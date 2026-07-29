/**
 * @file readingStore.ts
 * @description Scoped Zustand store for the Graded Readers feature session state.
 * Phase 4: Reading session store — popover UI state, current passage, mode.
 *
 * Only UI state lives here (popover position, mode, current passage ID).
 * Async data (passage content, word details) stays in hooks/services.
 * Cross-feature state stays in hubStore.
 */
import { create } from "zustand";
import { devtools } from "zustand/middleware";

export type ReadersMode = "library" | "reading";

interface PopoverState {
  glyph: string | null;
  position: { x: number; y: number } | null;
}

interface ReadingStore {
  /** Currently selected passage ID (null = no passage selected) */
  currentPassageId: string | null;
  /** Current reading session mode */
  mode: ReadersMode;
  /** Word popover state */
  popover: PopoverState;
  /** Currently highlighted/playing sentence index (null = no audio cursor). */
  currentAudioIndex: number | null;
  /**
   * Event signal: when non-null, the audio hook should start playback from this index.
   * The hook clears it after consuming. Used by SentenceDisplay tap-to-play.
   */
  pendingPlayIndex: number | null;

  // Actions
  setPassageId: (id: string | null) => void;
  setMode: (mode: ReadersMode) => void;
  openPopover: (glyph: string, rect: DOMRect) => void;
  closePopover: () => void;
  /** Thin setter — no engine side-effects. Only updates the cursor position. */
  setCurrentAudioIndex: (index: number | null) => void;
  /** Signal the audio hook to begin playback from the given index. */
  setPendingPlayIndex: (index: number | null) => void;
}

export const useReadingStore = create<ReadingStore>()(
  devtools(
    (set) => ({
      currentPassageId: null,
      mode: "library",
      popover: { glyph: null, position: null },
      currentAudioIndex: null,
      pendingPlayIndex: null,

      setPassageId: (id) => set({ currentPassageId: id }),

      setMode: (mode) => set({ mode }),

      openPopover: (glyph, rect) =>
        set({
          popover: {
            glyph,
            position: { x: rect.left, y: rect.bottom },
          },
        }),

      closePopover: () =>
        set({
          popover: { glyph: null, position: null },
        }),

      setCurrentAudioIndex: (index) => set({ currentAudioIndex: index }),

      setPendingPlayIndex: (index) => set({ pendingPlayIndex: index }),
    }),
    { name: "reading-store" },
  ),
);
