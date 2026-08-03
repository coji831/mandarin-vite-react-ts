/**
 * @file shared/store/audioStore.ts
 * @description Presentational-only Zustand store for the UI audio snapshot.
 *
 * Audio Playback consolidation (Phase A): this cross-cutting store replaces the
 * readers feature's signal-carrying store (migrated in a later phase). It holds
 * ONLY the UI snapshot `{ status, currentIndex, rate, error, hasCompleted }`,
 * written by `useAudioManager` when manager events change the snapshot — never
 * on `timeupdate` (no progress ticks).
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { AudioSnapshot, AudioStatus } from "../audio";

export interface AudioStoreState {
  status: AudioStatus;
  currentIndex: number | null;
  rate: number;
  error: string | null;
  hasCompleted: boolean;

  /** Mirror a manager snapshot into the store (values only, no commands). */
  setSnapshot: (snapshot: AudioSnapshot) => void;
  reset: () => void;
}

const INITIAL_SNAPSHOT: AudioSnapshot = {
  status: "idle",
  currentIndex: null,
  rate: 1,
  error: null,
  hasCompleted: false,
};

export const useAudioStore = create<AudioStoreState>()(
  devtools(
    (set) => ({
      ...INITIAL_SNAPSHOT,

      setSnapshot: (snapshot) =>
        set({
          status: snapshot.status,
          currentIndex: snapshot.currentIndex,
          rate: snapshot.rate,
          error: snapshot.error,
          hasCompleted: snapshot.hasCompleted,
        }),
      reset: () => set({ ...INITIAL_SNAPSHOT }),
    }),
    { name: "audio-store" },
  ),
);
