/**
 * @file hooks/useSentenceAudio.ts
 * @description Composed hook managing sequential per-sentence audio playback.
 * Story 21.5: Audio Sync — Phase 3b
 * Story 21.6: Decomposed into useAudioEngine + useBrowserTTS + useAudioAutoAdvance.
 *
 * Composes the three sub-hooks and adds higher-level orchestration:
 * - Popover pause/resume: pauses when popover opens, resumes when closed
 * - Page Visibility API: pauses when tab is backgrounded
 *
 * Public API is identical to the pre-decomposition version for consumer compatibility.
 */
import { useRef, useCallback, useEffect } from "react";
import { useReadingStore } from "../stores";
import { useAudioAutoAdvance } from "./useAudioAutoAdvance";
import type { SentenceAudioMap } from "../types";

type UseSentenceAudioOptions = {
  sentenceCount: number;
  audioUrls: SentenceAudioMap | null;
  sentenceTexts: string[];
};

type UseSentenceAudioReturn = {
  currentIndex: number | null;
  isPlaying: boolean;
  isAudioLoading: boolean;
  hasCompleted: boolean;
  speed: number;
  play: (fromIndex?: number) => void;
  pause: () => void;
  stop: () => void;
  toggle: () => void;
  setSpeed: (speed: number) => void;
  seekTo: (index: number) => void;
};

export function useSentenceAudio({
  sentenceCount,
  audioUrls,
  sentenceTexts,
}: UseSentenceAudioOptions): UseSentenceAudioReturn {
  const {
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
  } = useAudioAutoAdvance({
    audioUrls,
    sentenceCount,
    sentenceTexts,
  });

  // Popover coordination
  const popoverGlyph = useReadingStore((s) => s.popover.glyph);
  const wasPlayingBeforePopover = useRef(false);

  // Keep refs in sync for use in effects/callbacks that need current values
  const isPlayingRef = useRef(false);
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  const currentIndexRef = useRef<number | null>(null);
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  const toggle = useCallback(() => {
    if (isPlayingRef.current) {
      pause();
    } else {
      play();
    }
  }, [pause, play]);

  // Effect: Popover pause/resume
  useEffect(() => {
    if (popoverGlyph) {
      if (isPlaying) {
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
  }, [popoverGlyph, pause, play, isPlaying, currentIndex]);

  // Effect: Page Visibility API
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && isPlayingRef.current) {
        pause();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [pause]);

  return {
    currentIndex,
    isPlaying,
    isAudioLoading,
    hasCompleted,
    speed,
    play,
    pause,
    stop,
    toggle,
    setSpeed,
    seekTo,
  };
}
