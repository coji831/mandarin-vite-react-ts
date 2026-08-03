/**
 * @file readingStore.ts
 * @description Scoped Zustand store for the Graded Readers feature session state.
 * Phase 4: Reading session store — popover UI state, current passage, mode.
 * Phase 1 (Epic 21): Audio state moved to audioStore (currentAudioIndex, pendingPlayIndex).
 * Story 21.7: Reading Progress — currentSentence, completedPassages, bookmarkedPassages,
 *   saveProgress, restoreSession, toggleBookmark, fetchBookmarks.
 *
 * Only UI state lives here (popover position, mode, current passage ID).
 * Async data (passage content, word details) stays in hooks/services.
 * Cross-feature state stays in hubStore.
 *
 * Progress semantics:
 * - currentSentence is updated optimistically (local first).
 * - saveProgress() is a no-op when !isAuthenticated (guest fallback).
 * - All errors are non-blocking — never block reading.
 * - bookmark toggle flips the Set immediately, then syncs async.
 *   On sync failure, the optimistic update is reverted.
 */
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { readingProgressService } from "../services/readingProgressService";

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
  // ── Reading Progress (Story 21.7) ──────────────────────────────────────

  /** Current sentence index in the active passage (0-based). */
  currentSentence: number;
  /** Set of passage IDs that the user has completed. */
  completedPassages: Set<string>;
  /** Set of passage IDs that the user has bookmarked. */
  bookmarkedPassages: Set<string>;
  /** Whether the current user is authenticated (gate for backend sync). */
  isAuthenticated: boolean;

  /** Set authentication state (synced from auth context). */
  setIsAuthenticated: (value: boolean) => void;

  // Actions (original)
  setPassageId: (id: string | null) => void;
  setMode: (mode: ReadersMode) => void;
  openPopover: (glyph: string, rect: DOMRect) => void;
  closePopover: () => void;
  // ── Progress Actions (Story 21.7) ──────────────────────────────────────

  /** Update current sentence index locally. */
  setCurrentSentence: (sentence: number) => void;
  /** Mark a passage as completed (local + async backend sync). */
  markCompleted: (passageId: string) => void;
  /**
   * Toggle bookmark state for a passage. Optimistic update: flips the Set
   * immediately, then syncs to backend. On failure, reverts the flip.
   */
  toggleBookmark: (passageId: string) => void;

  // ── Backend Sync (Story 21.7) ──────────────────────────────────────────

  /**
   * PUT current reading position to backend.
   * No-op when !isAuthenticated (guest fallback).
   * Silent retry (1 attempt) on failure.
   */
  saveProgress: () => Promise<void>;
  /**
   * GET reading session from backend, restore currentSentence.
   * On error (network / 404), falls back to 0 — never block reading.
   */
  restoreSession: (passageId: string) => Promise<void>;
  /** GET bookmarks list from backend and populate bookmarkedPassages Set. */
  fetchBookmarks: () => Promise<void>;
  /** POST or DELETE bookmark based on bookmarked flag. */
  syncBookmark: (passageId: string, bookmarked: boolean) => Promise<void>;
}

async function silentRetry<T>(fn: () => Promise<T>): Promise<T | undefined> {
  try {
    return await fn();
  } catch {
    try {
      return await fn();
    } catch {
      // Silent — non-blocking operation, never block reading
      return undefined;
    }
  }
}

export const useReadingStore = create<ReadingStore>()(
  devtools(
    (set, get) => ({
      currentPassageId: null,
      mode: "library",
      popover: { glyph: null, position: null },

      // ── Progress initial state ──────────────────────────────────────────
      currentSentence: 0,
      completedPassages: new Set<string>(),
      bookmarkedPassages: new Set<string>(),
      isAuthenticated: false,

      setIsAuthenticated: (value) => set({ isAuthenticated: value }),

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

      // ── Progress actions ────────────────────────────────────────────────

      setCurrentSentence: (sentence) => set({ currentSentence: sentence }),

      markCompleted: (passageId) => {
        const next = new Set(get().completedPassages);
        next.add(passageId);
        set({ completedPassages: next });

        // Bug 2: guests keep the session-local completion badge but do NOT
        // POST to the backend (optionalAuth would 401 and burn a refresh
        // attempt per completion). Only authenticated users persist.
        if (!get().isAuthenticated) return;

        // Async backend sync — silent retry, never block reading
        silentRetry(() => readingProgressService.completePassage(passageId));
      },

      toggleBookmark: (passageId) => {
        const current = get().bookmarkedPassages;
        const wasBookmarked = current.has(passageId);
        // Optimistic flip
        const next = new Set(current);
        if (wasBookmarked) {
          next.delete(passageId);
        } else {
          next.add(passageId);
        }
        set({ bookmarkedPassages: next });

        // Async sync — revert on failure
        get()
          .syncBookmark(passageId, !wasBookmarked)
          .catch(() => {
            // Revert optimistic update
            const reverted = new Set(get().bookmarkedPassages);
            if (wasBookmarked) {
              reverted.add(passageId);
            } else {
              reverted.delete(passageId);
            }
            set({ bookmarkedPassages: reverted });
          });
      },

      // ── Backend sync ───────────────────────────────────────────────────

      saveProgress: async () => {
        const { currentPassageId, currentSentence, isAuthenticated } = get();
        if (!isAuthenticated || !currentPassageId) return;
        await silentRetry(() =>
          readingProgressService.updatePosition(currentPassageId, currentSentence),
        );
      },

      restoreSession: async (passageId) => {
        if (!get().isAuthenticated) return;
        try {
          const session = await readingProgressService.getSession(passageId);
          set({ currentSentence: session.currentSentence });

          if (session.isCompleted) {
            const next = new Set(get().completedPassages);
            next.add(passageId);
            set({ completedPassages: next });
          }
        } catch {
          // 404 (no session yet) or network error — fall back to sentence 0
          set({ currentSentence: 0 });
        }
      },

      fetchBookmarks: async () => {
        if (!get().isAuthenticated) return;
        try {
          const { bookmarks } = await readingProgressService.listBookmarks();
          set({ bookmarkedPassages: new Set(bookmarks) });
        } catch {
          // Silent — fetching bookmarks is non-critical
        }
      },

      syncBookmark: async (passageId, bookmarked) => {
        if (!get().isAuthenticated) return;
        if (bookmarked) {
          await readingProgressService.addBookmark(passageId);
        } else {
          await readingProgressService.removeBookmarkByPassage(passageId);
        }
      },
    }),
    { name: "reading-store" },
  ),
);
