/**
 * @file hooks/useAudioAutoAdvance.ts
 * @description Sequential per-sentence audio playback orchestration.
 * Story 21.6: Extracted from useSentenceAudio for SRP compliance.
 *
 * Single responsibility: sequence playback across sentences — play, pause,
 * stop, auto-advance, and cancellation tokens. Consumes the pendingPlayIndex
 * signal from the readingStore.
 *
 * Does NOT handle popover coordination or page visibility (those live in
 * useSentenceAudio, which composes this hook).
 */
import { useState, useRef, useCallback, useEffect } from "react";
import { LANGUAGE_CODES } from "@mandarin/shared-constants";
import { useReadingStore } from "../stores";
import { PLAYBACK_SPEEDS, PLAYBACK_START_DELAY_MS } from "../constants/audio";
import { useAudioEngine } from "./useAudioEngine";
import { useBrowserTTS } from "./useBrowserTTS";
import type { SentenceAudioMap } from "../types";
import type { PlaybackSpeed } from "../constants/audio";

interface UseAudioAutoAdvanceOptions {
  audioUrls: SentenceAudioMap | null;
  sentenceCount: number;
  sentenceTexts: string[];
}

export interface UseAudioAutoAdvanceReturn {
  currentIndex: number | null;
  isPlaying: boolean;
  isAudioLoading: boolean;
  hasCompleted: boolean;
  speed: PlaybackSpeed;
  play: (fromIndex?: number) => void;
  pause: () => void;
  stop: () => void;
  seekTo: (index: number) => void;
  setSpeed: (speed: number) => void;
}

export function useAudioAutoAdvance({
  audioUrls,
  sentenceCount,
  sentenceTexts,
}: UseAudioAutoAdvanceOptions): UseAudioAutoAdvanceReturn {
  const audioEngine = useAudioEngine();
  const browserTTS = useBrowserTTS();

  const [isPlaying, setIsPlaying] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);
  const [speed, setSpeedState] = useState<PlaybackSpeed>(1);

  // Read audio cursor from store
  const currentIndex = useReadingStore((s) => s.currentAudioIndex);

  // Refs for mutable callback state (avoids stale closures in recursive auto-advance)
  const currentIndexRef = useRef<number | null>(null);
  const isPlayingRef = useRef(false);
  const speedRef = useRef<PlaybackSpeed>(1);
  const playTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playSentenceRef = useRef<((index: number) => Promise<void>) | null>(null);
  const playSequenceRef = useRef(0);

  // Read pending-play signal from store (set by SentenceDisplay tap via container)
  const pendingPlayIndex = useReadingStore((s) => s.pendingPlayIndex);

  // Sync refs
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  // Play a single sentence; auto-advance only when explicitly wanted
  const playSentence = useCallback(
    async (index: number, autoAdvance = true) => {
      if (!audioUrls || index < 0 || index >= sentenceCount) return;

      const seq = ++playSequenceRef.current;

      setIsAudioLoading(true);
      setIsPlaying(true);
      useReadingStore.getState().setCurrentAudioIndex(index);
      currentIndexRef.current = index;

      try {
        const entry = audioUrls[index];
        if (!entry || entry.source === "failed" || !entry.url) {
          // Browser TTS fallback
          await browserTTS.speak(sentenceTexts[index], speedRef.current, LANGUAGE_CODES.CHINESE);
        } else {
          await audioEngine.playUrl(entry.url, speedRef.current);
        }
      } catch {
        await browserTTS.speak(sentenceTexts[index], speedRef.current, LANGUAGE_CODES.CHINESE);
      } finally {
        setIsAudioLoading(false);
      }

      // Auto-advance only when explicitly enabled, still playing, and this sequence is still active
      if (
        autoAdvance &&
        isPlayingRef.current &&
        currentIndexRef.current === index &&
        playSequenceRef.current === seq
      ) {
        const nextIndex = index + 1;
        if (nextIndex < sentenceCount) {
          playSentenceRef.current?.(nextIndex);
        } else {
          // Reached end — complete
          audioEngine.stop();
          useReadingStore.getState().setCurrentAudioIndex(null);
          setIsPlaying(false);
          setHasCompleted(true);
        }
      }
    },
    [audioUrls, sentenceCount, sentenceTexts, audioEngine, browserTTS],
  );

  // Keep the ref in sync (avoids stale closures in recursive auto-advance)
  playSentenceRef.current = playSentence;

  // Stop helper
  const stopPlayback = useCallback(() => {
    // Invalidate any pending playSentence sequence
    playSequenceRef.current++;
    if (playTimeoutRef.current) {
      clearTimeout(playTimeoutRef.current);
      playTimeoutRef.current = null;
    }
    audioEngine.stop();
    browserTTS.cancel();
    useReadingStore.getState().setCurrentAudioIndex(null);
    setIsPlaying(false);
    setIsAudioLoading(false);
    setHasCompleted(false);
  }, [audioEngine, browserTTS]);

  // Public API
  const play = useCallback(
    (fromIndex?: number) => {
      const startAt = fromIndex ?? currentIndexRef.current ?? 0;
      stopPlayback();
      setHasCompleted(false);
      if (playTimeoutRef.current) clearTimeout(playTimeoutRef.current);
      playTimeoutRef.current = setTimeout(() => playSentence(startAt), PLAYBACK_START_DELAY_MS);
    },
    [playSentence, stopPlayback],
  );

  const pause = useCallback(() => {
    audioEngine.pause();
    browserTTS.cancel();
    setIsPlaying(false);
  }, [audioEngine, browserTTS]);

  const stop = useCallback(() => {
    stopPlayback();
  }, [stopPlayback]);

  const seekTo = useCallback(
    (index: number) => {
      if (index < 0 || index >= sentenceCount) return;
      stopPlayback();
      useReadingStore.getState().setCurrentAudioIndex(index);
    },
    [sentenceCount, stopPlayback],
  );

  const setSpeed = useCallback(
    (newSpeed: number) => {
      const validSpeed = (
        PLAYBACK_SPEEDS.includes(newSpeed as PlaybackSpeed) ? newSpeed : 1
      ) as PlaybackSpeed;
      setSpeedState(validSpeed);
      audioEngine.setRate(validSpeed);
    },
    [audioEngine],
  );

  // Effect: Consume pendingPlayIndex signal and start playback
  useEffect(() => {
    if (pendingPlayIndex === null) return;
    // Clear the signal immediately
    useReadingStore.getState().setPendingPlayIndex(null);
    const targetIndex = pendingPlayIndex;
    // Stop any current playback, then start from target
    stopPlayback();
    setHasCompleted(false);
    if (playTimeoutRef.current) clearTimeout(playTimeoutRef.current);
    playTimeoutRef.current = setTimeout(
      () => playSentence(targetIndex, false),
      PLAYBACK_START_DELAY_MS,
    );
  }, [pendingPlayIndex, stopPlayback, playSentence]);

  // Effect: Cleanup on unmount
  useEffect(() => {
    return () => {
      if (playTimeoutRef.current) clearTimeout(playTimeoutRef.current);
      stopPlayback();
    };
  }, [stopPlayback]);

  return {
    currentIndex,
    isPlaying,
    isAudioLoading,
    hasCompleted,
    speed,
    play,
    pause,
    stop,
    seekTo,
    setSpeed,
  };
}
