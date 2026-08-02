/**
 * @file stores/audioStore.ts
 * @description Zustand store for audio playback state in the Graded Readers feature.
 * Phase 1: Extracted from readingStore for SRP compliance.
 *
 * Manages all audio playback state: cursor position, status, speed, and URLs.
 * This is separate from the reading session store because audio state changes
 * at a different frequency and has different consumers (AudioControlBar,
 * SentenceDisplay, useAudioAutoAdvance).
 */
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { SentenceAudioMap } from "../types";
import type { PlaybackSpeed } from "../constants/audio";

export type AudioStatus = "idle" | "loading" | "playing" | "paused" | "completed" | "errored";

interface AudioStore {
  // State
  /** Currently highlighted/playing sentence index (null = no audio cursor). */
  currentIndex: number | null;
  /**
   * Event signal: when non-null, the audio hook should start playback from this
   * index and AUTO-ADVANCE through the rest of the passage. The hook clears it
   * after consuming. Used by tap-to-play surfaces that continue the passage —
   * NOT by the per-sentence 🔊 button (which uses pendingSingleIndex).
   */
  pendingIndex: number | null;
  /**
   * Event signal: when non-null, the audio hook should play ONLY this single
   * sentence (no auto-advance). The hook clears it after consuming. Used by the
   * per-sentence 🔊 button in SentenceDisplay — distinct from global play
   * (AudioControlBar ▶) and from pendingIndex (auto-advance tap-to-play).
   */
  pendingSingleIndex: number | null;
  status: AudioStatus;
  error: string | null;
  speed: PlaybackSpeed;
  audioUrls: SentenceAudioMap | null;

  // Actions
  setCurrentIndex: (index: number | null) => void;
  setPendingIndex: (index: number | null) => void;
  setPendingSingleIndex: (index: number | null) => void;
  setStatus: (status: AudioStatus) => void;
  setError: (error: string | null) => void;
  setSpeed: (speed: PlaybackSpeed) => void;
  loadAudioUrls: (urls: SentenceAudioMap) => void;
  clearAudioUrls: () => void;
  reset: () => void;
}

export const useAudioStore = create<AudioStore>()(
  devtools(
    (set) => ({
      currentIndex: null,
      pendingIndex: null,
      pendingSingleIndex: null,
      status: "idle",
      error: null,
      speed: 1,
      audioUrls: null,

      setCurrentIndex: (index) => set({ currentIndex: index }),
      setPendingIndex: (index) => set({ pendingIndex: index }),
      setPendingSingleIndex: (index) => set({ pendingSingleIndex: index }),
      setStatus: (status) => set({ status }),
      setError: (error) => set({ error }),
      setSpeed: (speed) => set({ speed }),
      loadAudioUrls: (urls) => set({ audioUrls: urls }),
      clearAudioUrls: () => set({ audioUrls: null }),
      reset: () =>
        set({
          currentIndex: null,
          pendingIndex: null,
          pendingSingleIndex: null,
          status: "idle",
          error: null,
          audioUrls: null,
        }),
    }),
    { name: "audio-store" },
  ),
);
