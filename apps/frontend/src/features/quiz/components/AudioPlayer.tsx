/**
 * AudioPlayer.tsx
 * Phase 1 Gate Quiz — Audio playback using shared TTS hook
 *
 * Converts pinyin audio keys to Chinese characters via pinyinAudioMap,
 * then plays via useAudioPlayback (which calls backend TTS with fallback).
 */

import { useState, useCallback } from "react";
import { useAudioPlayback } from "../../../shared/hooks/useAudioPlayback";
import { getPinyinAudioText } from "features/foundations";

interface AudioPlayerProps {
  /** Pinyin audio key (e.g., "bā") */
  audioKey: string;
  /** Custom label for the button */
  label?: string;
}

/** Audio playback button using shared TTS hook */
export function AudioPlayer({ audioKey, label = "Play Audio" }: AudioPlayerProps) {
  const [hasPlayed, setHasPlayed] = useState(false);
  const { playWordAudio, isPlaying, isLoading, error } = useAudioPlayback();

  const handlePlay = useCallback(async () => {
    // Convert pinyin key to Chinese character for TTS
    const chineseText = await getPinyinAudioText(audioKey);
    await playWordAudio({ chinese: chineseText, fallbackToBrowserTTS: true });
    setHasPlayed(true);
  }, [audioKey, playWordAudio]);

  const buttonDisabled = isPlaying || isLoading;

  return (
    <div className="flex-center">
      <button
        className="btn-primary quiz-audio-btn hover-lift gap-sm py-md px-xl"
        onClick={handlePlay}
        disabled={buttonDisabled}
        aria-label={isPlaying ? "Playing audio..." : hasPlayed ? "Replay audio" : "Play audio"}
      >
        <span style={{ fontSize: "var(--font-xl)" }}>
          {isLoading ? "⏳" : isPlaying ? "🔊" : "🔊"}
        </span>
        <span style={{ fontSize: "var(--font-md)" }}>
          {error ? "⚠️ Error" : isLoading ? "Loading..." : isPlaying ? "Playing..." : label}
        </span>
      </button>
    </div>
  );
}
