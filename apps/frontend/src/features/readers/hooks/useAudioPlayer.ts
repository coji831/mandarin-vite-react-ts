/**
 * @file hooks/useAudioPlayer.ts
 * @description Flattened orchestrator hook — replaces useSentenceAudio,
 *   useAudioAutoAdvance, useAudioEngine, and useBrowserTTS.
 * Phase 2: Reads all audio state from audioStore directly (no props for audio state).
 *   Accepts sentenceCount and sentenceTexts as options (passage data, not audio state).
 *
 * Handles: play, pause, stop, seek, auto-advance, single-sentence play (via
 *   pendingSingleIndex signal — no auto-advance), tap-to-play (via pendingIndex
 *   signal — auto-advance), popover pause/resume, page visibility, and
 *   hasJustCompleted one-shot flag.
 */
import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { LANGUAGE_CODES } from "@mandarin/shared-constants";
import { useAudioStore } from "../stores";
import { useReadingStore } from "../stores";
import { AudioEngine, BrowserTTS } from "../lib";
import { PLAYBACK_SPEEDS, PLAYBACK_START_DELAY_MS } from "../constants/audio";
import type { PlaybackSpeed } from "../constants/audio";

export type UseAudioPlayerOptions = {
  sentenceCount: number;
  sentenceTexts: string[];
};

export type UseAudioPlayerReturn = {
  currentIndex: number | null;
  status: import("../stores/audioStore").AudioStatus;
  error: string | null;
  play: (fromIndex?: number) => void;
  pause: () => void;
  stop: () => void;
  toggle: () => void;
  seekTo: (index: number) => void;
  setSpeed: (speed: PlaybackSpeed) => void;
  hasJustCompleted: boolean;
};

export function useAudioPlayer({
  sentenceCount,
  sentenceTexts,
}: UseAudioPlayerOptions): UseAudioPlayerReturn {
  // ── Stable class instances (not hooks) ─────────────────────────────────
  const audioEngineRef = useRef<AudioEngine>(new AudioEngine());
  const browserTTSRef = useRef<BrowserTTS>(new BrowserTTS());

  // ── Local state ────────────────────────────────────────────────────────
  const [hasJustCompleted, setHasJustCompleted] = useState(false);

  // ── Store selectors ────────────────────────────────────────────────────
  const currentIndex = useAudioStore((s) => s.currentIndex);
  const status = useAudioStore((s) => s.status);
  const error = useAudioStore((s) => s.error);
  const speed = useAudioStore((s) => s.speed);
  const pendingIndex = useAudioStore((s) => s.pendingIndex);
  const pendingSingleIndex = useAudioStore((s) => s.pendingSingleIndex);
  const popoverGlyph = useReadingStore((s) => s.popover.glyph);

  // ── Refs for mutable callback state (avoids stale closures) ────────────
  const currentIndexRef = useRef<number | null>(null);
  const statusRef = useRef(status);
  const speedRef = useRef<PlaybackSpeed>(speed);
  const playTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playSentenceRef = useRef<((index: number) => Promise<void>) | null>(null);
  const playSequenceRef = useRef(0);
  const wasPlayingBeforePopover = useRef(false);
  const lastCompletedRef = useRef(false);

  // Sync refs with state
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);
  useEffect(() => {
    statusRef.current = status;
  }, [status]);
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  // ── Play a single sentence; auto-advance when explicitly wanted ────────
  const playSentence = useCallback(
    async (index: number, autoAdvance = true) => {
      if (index < 0 || index >= sentenceCount) return;

      const seq = ++playSequenceRef.current;
      const audioUrls = useAudioStore.getState().audioUrls;

      useAudioStore.getState().setStatus("loading");
      useAudioStore.getState().setCurrentIndex(index);
      currentIndexRef.current = index;

      const entry = audioUrls?.[index];

      if (entry && entry.source !== "failed" && entry.url) {
        try {
          await audioEngineRef.current.playUrl(entry.url, speedRef.current);
        } catch {
          // Expected graceful degradation (epic-21): Tier-2 on-demand audio failed
          // (e.g. 401 for guests) → fall back to Tier-3 browser SpeechSynthesis.
          // Audio is delivered either way, so no error-level log here.
          await browserTTSRef.current.speak(
            sentenceTexts[index],
            speedRef.current,
            LANGUAGE_CODES.CHINESE,
          );
        }
      } else {
        // Browser TTS fallback
        await browserTTSRef.current.speak(
          sentenceTexts[index],
          speedRef.current,
          LANGUAGE_CODES.CHINESE,
        );
      }

      useAudioStore.getState().setStatus("playing");

      // Auto-advance only when still playing and this sequence is still active.
      // Read the live store status (not statusRef — that lags until React's effect
      // flushes, and must also reflect an immediate pause()/stop() mid-sentence).
      if (
        autoAdvance &&
        useAudioStore.getState().status === "playing" &&
        currentIndexRef.current === index &&
        playSequenceRef.current === seq
      ) {
        const nextIndex = index + 1;
        if (nextIndex < sentenceCount) {
          playSentenceRef.current?.(nextIndex);
        } else {
          // Reached end — complete
          audioEngineRef.current.stop();
          browserTTSRef.current.cancel();
          useAudioStore.getState().setCurrentIndex(null);
          useAudioStore.getState().setStatus("completed");
          setHasJustCompleted(true);
          lastCompletedRef.current = true;
        }
      }
    },
    [sentenceCount, sentenceTexts],
  );

  // Keep the ref in sync (avoids stale closures in recursive auto-advance)
  playSentenceRef.current = playSentence;

  // ── Stop helper ────────────────────────────────────────────────────────
  const stopPlayback = useCallback(() => {
    playSequenceRef.current++;
    if (playTimeoutRef.current) {
      clearTimeout(playTimeoutRef.current);
      playTimeoutRef.current = null;
    }
    audioEngineRef.current.stop();
    browserTTSRef.current.cancel();
    useAudioStore.getState().setCurrentIndex(null);
    useAudioStore.getState().setStatus("idle");
    setHasJustCompleted(false);
    lastCompletedRef.current = false;
  }, []);

  // ── Public API ─────────────────────────────────────────────────────────
  const play = useCallback(
    (fromIndex?: number) => {
      const startAt = fromIndex ?? currentIndexRef.current ?? 0;
      stopPlayback();
      if (playTimeoutRef.current) clearTimeout(playTimeoutRef.current);
      playTimeoutRef.current = setTimeout(() => playSentence(startAt), PLAYBACK_START_DELAY_MS);
    },
    [playSentence, stopPlayback],
  );

  const pause = useCallback(() => {
    audioEngineRef.current.pause();
    browserTTSRef.current.cancel();
    useAudioStore.getState().setStatus("paused");
  }, []);

  const stop = useCallback(() => {
    stopPlayback();
  }, [stopPlayback]);

  const toggle = useCallback(() => {
    if (statusRef.current === "playing") {
      pause();
    } else {
      play();
    }
  }, [pause, play]);

  const seekTo = useCallback(
    (index: number) => {
      if (index < 0 || index >= sentenceCount) return;
      stopPlayback();
      useAudioStore.getState().setCurrentIndex(index);
    },
    [sentenceCount, stopPlayback],
  );

  const setSpeed = useCallback((newSpeed: PlaybackSpeed) => {
    const validSpeed = (PLAYBACK_SPEEDS.includes(newSpeed) ? newSpeed : 1) as PlaybackSpeed;
    useAudioStore.getState().setSpeed(validSpeed);
    audioEngineRef.current.setRate(validSpeed);
  }, []);

  // ── Consume pendingIndex signal (tap-to-play, AUTO-ADVANCE) ────────────────
  // Legacy tap-to-play signal: starts playback from the given index and continues
  // through the whole passage. The per-sentence 🔊 button does NOT use this — it
  // uses pendingSingleIndex below so a single sentence does not auto-advance.
  useEffect(() => {
    if (pendingIndex !== null) {
      const index = pendingIndex;
      useAudioStore.getState().setPendingIndex(null);
      play(index);
    }
  }, [pendingIndex, play]);

  // ── Consume pendingSingleIndex signal (single-sentence, NO auto-advance) ────
  // The per-sentence 🔊 button must play ONLY that sentence — no auto-advance.
  // Only global play (AudioControlBar → play()) auto-advances the whole passage.
  useEffect(() => {
    if (pendingSingleIndex !== null) {
      const index = pendingSingleIndex;
      useAudioStore.getState().setPendingSingleIndex(null);
      stopPlayback();
      playSentence(index, false);
    }
  }, [pendingSingleIndex, playSentence, stopPlayback]);

  // ── Popover pause/resume ──────────────────────────────────────────────
  useEffect(() => {
    if (popoverGlyph) {
      if (status === "playing") {
        wasPlayingBeforePopover.current = true;
        pause();
      }
    } else {
      if (wasPlayingBeforePopover.current) {
        wasPlayingBeforePopover.current = false;
        if (currentIndex !== null) {
          play(currentIndex);
        }
      }
    }
  }, [popoverGlyph, pause, play, status, currentIndex]);

  // ── Page Visibility API ───────────────────────────────────────────────
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && statusRef.current === "playing") {
        pause();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [pause]);

  // ── Stable API object ─────────────────────────────────────────────────
  const api = useMemo<UseAudioPlayerReturn>(
    () => ({
      currentIndex,
      status,
      error,
      play,
      pause,
      stop,
      toggle,
      seekTo,
      setSpeed,
      hasJustCompleted,
    }),
    [currentIndex, status, error, play, pause, stop, toggle, seekTo, setSpeed, hasJustCompleted],
  );

  return api;
}
