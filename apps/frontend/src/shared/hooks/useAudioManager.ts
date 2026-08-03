/**
 * @file shared/hooks/useAudioManager.ts
 * @description React bridge to the shared, framework-agnostic AudioManager.
 *
 * Audio Playback consolidation (Phase A, additive) → Phase 2 (candidates-as-data):
 * acquires the app-wide singleton (`getAudioManager()`), configures it with an
 * `AudioBehavior` contract, resolves the behavior's sources into `PlayableItem[]`
 * and loads them, subscribes to manager events and mirrors the snapshot into
 * `shared/store/audioStore.ts` (deduped by field compare — no re-render on
 * progress), exposes STABLE command callbacks that forward to the manager, and
 * registers unmount cleanup so route changes kill audio.
 */

import { useCallback, useEffect } from "react";
import { getAudioManager, resolveBehaviorSources } from "../audio";
import type {
  AudioBehavior,
  AudioEventType,
  AudioManager,
  AudioManagerInit,
  AudioStatus,
  PlayableItem,
} from "../audio";
import { useAudioStore } from "../store";

export interface UseAudioManagerOptions {
  /** Override the shared manager (tests). Defaults to the app-wide singleton. */
  manager?: AudioManager;
  /** Playback behavior contract (strategy + sources + fallback policy). */
  behavior?: AudioBehavior;
  mutedAutoplay?: AudioManagerInit["mutedAutoplay"];
  /** Items to load on mount (alternative to `behavior.sources`; bumps playId). */
  items?: PlayableItem[];
  /** Stop audio on unmount (route change). Default true. */
  stopOnUnmount?: boolean;
}

export interface UseAudioManagerReturn {
  status: AudioStatus;
  currentIndex: number | null;
  rate: number;
  error: string | null;
  hasCompleted: boolean;
  play: (index?: number, mode?: "single" | "sequence") => void;
  pause: () => void;
  stop: () => void;
  next: () => void;
  prev: () => void;
  seek: (index: number) => void;
  setRate: (rate: number) => void;
  restart: () => void;
}

const SNAPSHOT_EVENTS: AudioEventType[] = [
  "playing",
  "paused",
  "stopped",
  "indexchange",
  "completed",
  "ratechange",
  "error",
  "blocked",
  "skipped",
];

export function useAudioManager(options: UseAudioManagerOptions = {}): UseAudioManagerReturn {
  const manager = options.manager ?? getAudioManager();

  // Reconfigure the shared manager when the surface's behavior changes.
  useEffect(() => {
    manager.init({
      behavior: options.behavior,
      mutedAutoplay: options.mutedAutoplay,
    });
  }, [manager, options.behavior, options.mutedAutoplay]);

  // Load items: resolve `behavior.sources` (array or lazy producer) → load,
  // or load explicit `items` (bumps playId → aborts in-flight sessions).
  useEffect(() => {
    const behavior = options.behavior;
    if (behavior) {
      let cancelled = false;
      void resolveBehaviorSources(behavior.sources).then((items: PlayableItem[]) => {
        if (!cancelled) void manager.load(items);
      });
      return () => {
        cancelled = true;
      };
    }
    if (options.items) void manager.load(options.items);
  }, [manager, options.behavior, options.items]);

  // Subscribe to manager events → mirror snapshot into the store (deduped).
  useEffect(() => {
    const unsubscribes = SNAPSHOT_EVENTS.map((type) =>
      manager.on(type, () => {
        const snap = manager.getSnapshot();
        useAudioStore.setState((prev) => {
          if (
            prev.status === snap.status &&
            prev.currentIndex === snap.currentIndex &&
            prev.rate === snap.rate &&
            prev.error === snap.error &&
            prev.hasCompleted === snap.hasCompleted
          ) {
            // No change → return the same state reference (no subscriber notify).
            return prev;
          }
          return {
            ...prev,
            status: snap.status,
            currentIndex: snap.currentIndex,
            rate: snap.rate,
            error: snap.error,
            hasCompleted: snap.hasCompleted,
          };
        });
      }),
    );
    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }, [manager]);

  // Unmount cleanup: kill audio on route change (per surface policy).
  useEffect(() => {
    return () => {
      if (options.stopOnUnmount !== false) {
        manager.stop();
      }
    };
  }, [manager, options.stopOnUnmount]);

  // Reactive snapshot from the store.
  const status = useAudioStore((s) => s.status);
  const currentIndex = useAudioStore((s) => s.currentIndex);
  const rate = useAudioStore((s) => s.rate);
  const error = useAudioStore((s) => s.error);
  const hasCompleted = useAudioStore((s) => s.hasCompleted);

  // Stable command callbacks (manager is the singleton → stable identity).
  const play = useCallback(
    (index?: number, mode?: "single" | "sequence") => manager.play(index, mode),
    [manager],
  );
  const pause = useCallback(() => manager.pause(), [manager]);
  const stop = useCallback(() => manager.stop(), [manager]);
  const next = useCallback(() => manager.next(), [manager]);
  const prev = useCallback(() => manager.prev(), [manager]);
  const seek = useCallback((index: number) => manager.seek(index), [manager]);
  const setRate = useCallback((rateValue: number) => manager.setRate(rateValue), [manager]);
  const restart = useCallback(() => manager.restart(), [manager]);

  return {
    status,
    currentIndex,
    rate,
    error,
    hasCompleted,
    play,
    pause,
    stop,
    next,
    prev,
    seek,
    setRate,
    restart,
  };
}
