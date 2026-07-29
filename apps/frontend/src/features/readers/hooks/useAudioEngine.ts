/**
 * @file hooks/useAudioEngine.ts
 * @description Core HTMLAudioElement lifecycle manager.
 * Story 21.6: Extracted from useSentenceAudio for SRP compliance.
 *
 * Single responsibility: manage an HTMLAudioElement — play, pause, stop, rate.
 * No knowledge of sentences, sequences, or TTS.
 */
import { useRef, useCallback, useEffect } from "react";

export interface UseAudioEngineReturn {
  /** Plays a URL through a fresh Audio element. Resolves on ended, rejects on error. */
  playUrl: (url: string, rate: number) => Promise<void>;
  /** Pauses current audio (keeps position). */
  pause: () => void;
  /** Stops current audio and resets position to 0. */
  stop: () => void;
  /** Sets playback rate on the current audio element. */
  setRate: (rate: number) => void;
}

export function useAudioEngine(): UseAudioEngineReturn {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playUrl = useCallback(async (url: string, rate: number): Promise<void> => {
    // Clean up any previous audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    const audio = new window.Audio();
    audio.src = url;
    audio.playbackRate = rate;
    audio.load();
    audioRef.current = audio;

    return new Promise<void>((resolve, reject) => {
      audio.onended = () => resolve();
      audio.onerror = () => reject(new Error("Audio playback failed"));
      audio.play().catch(reject);
    });
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
  }, []);

  const setRate = useCallback((rate: number) => {
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return { playUrl, pause, stop, setRate };
}
