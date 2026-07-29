/**
 * AudioPlayer.tsx
 * Phase 1 Gate Quiz — Audio playback using shared TTS hook
 *
 * Plays audio for quiz questions using character from question data.
 */

import { useState, useCallback } from "react";
import { useAudioPlayback } from "shared/hooks";
import { Button } from "shared/components";

type AudioPlayerProps = {
  /** Pinyin audio key (e.g., "bā") */
  audioKey: string;
  /** Chinese character for TTS (if available, skips API lookup) */
  character?: string | null;
  /** Custom label for the button */
  label?: string;
};

/** Audio playback button using shared TTS hook */
export function AudioPlayer({ audioKey, character, label = "Play Audio" }: AudioPlayerProps) {
  const [hasPlayed, setHasPlayed] = useState(false);
  const { playWordAudio, isPlaying, isLoading, error } = useAudioPlayback();

  const handlePlay = useCallback(async () => {
    // Use character directly if provided, otherwise fall back to plain pinyin
    const chineseText = character || audioKey;
    await playWordAudio({ chinese: chineseText, fallbackToBrowserTTS: true });
    setHasPlayed(true);
  }, [audioKey, character, playWordAudio]);

  const buttonDisabled = isPlaying || isLoading;

  return (
    <div className="flex-center">
      <Button
        variant="primary"
        size="md"
        onClick={handlePlay}
        disabled={buttonDisabled}
        title={isPlaying ? "Playing audio..." : hasPlayed ? "Replay audio" : "Play audio"}
        className="quiz-audio-btn hover-lift disabled:op-60"
      >
        <span className="font-xl">{isLoading ? "⏳" : isPlaying ? "🔊" : "🔊"}</span>
        <span className="font-md">
          {error ? "⚠️ Error" : isLoading ? "Loading..." : isPlaying ? "Playing..." : label}
        </span>
      </Button>
    </div>
  );
}
