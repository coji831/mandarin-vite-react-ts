/**
 * AudioPlayer.tsx
 * Phase 1 Gate Quiz — Audio playback using shared per-item audio hook
 *
 * Plays audio for quiz questions using character from question data.
 * Routes through useAudioItemPlayback → the shared AudioManager with the
 * default word contract (guest + user POST /v1/tts; network/5xx → browser-TTS
 * candidate; auth/rate-limit → empty candidates silent skip; blocked autoplay
 * → "Tap to play" affordance).
 */

import { useState, useCallback } from "react";
import { resolveHanzi } from "@mandarin/shared-utils";
import { useAudioItemPlayback, usePinyinCharacterMap } from "shared/hooks";
import { Button } from "shared/components";

type AudioPlayerProps = {
  /** Pinyin audio key (e.g., "bā") */
  audioKey: string;
  /** Chinese character for TTS (if available, skips API lookup) */
  character?: string | null;
  /** Custom label for the button */
  label?: string;
};

/** Audio playback button using shared per-item audio hook */
export function AudioPlayer({ audioKey, character, label = "Play Audio" }: AudioPlayerProps) {
  const [hasPlayed, setHasPlayed] = useState(false);
  const { play, isPlaying, isLoading, error, status } = useAudioItemPlayback();
  const { charMap } = usePinyinCharacterMap();

  const handlePlay = useCallback(() => {
    // Phase 1b universalization: use the Hanzi character directly when provided
    // (never depends on the charMap being loaded); otherwise resolve the pinyin
    // audio key → Hanzi before TTS. Silently skip when no glyph is available.
    const chineseText = character || resolveHanzi(audioKey, charMap);
    if (!chineseText) return;
    play(chineseText);
    setHasPlayed(true);
  }, [audioKey, character, charMap, play]);

  const isBlocked = status === "blocked";
  const buttonDisabled = isPlaying || isLoading;

  return (
    <div className="flex-center">
      <Button
        variant="primary"
        size="md"
        onClick={handlePlay}
        disabled={buttonDisabled}
        title={
          isBlocked
            ? "Tap to play audio"
            : isPlaying
              ? "Playing audio..."
              : hasPlayed
                ? "Replay audio"
                : "Play audio"
        }
        className="quiz-audio-btn hover-lift disabled:op-60"
      >
        <span className="font-xl">{isLoading ? "⏳" : "🔊"}</span>
        <span className="font-md">
          {isBlocked
            ? "Tap to play"
            : error
              ? "⚠️ Error"
              : isLoading
                ? "Loading..."
                : isPlaying
                  ? "Playing..."
                  : label}
        </span>
      </Button>
    </div>
  );
}
