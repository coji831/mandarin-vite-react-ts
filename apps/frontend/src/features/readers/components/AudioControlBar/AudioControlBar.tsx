/**
 * @file AudioControlBar.tsx
 * @description Playback control bar for per-sentence audio.
 * Phase 2: Reads audio state from audioStore directly.
 * Phase D1: Re-pointed at the SHARED presentational snapshot store
 *   (`shared/store/audioStore.ts` — status/currentIndex/rate/error/hasCompleted),
 *   migrated off the readers feature store. Transport callbacks (onTogglePlay,
 *   onStop, onSpeedChange) come from the parent's `useAudioManager` instance.
 *
 * States: Idle, Loading, Playing, Paused, Blocked ("tap to play"), Complete, Error.
 */
import { Button, Icon } from "shared/components";
import { PLAYBACK_SPEEDS } from "../../constants/audio";
import { useAudioStore } from "shared/store";
import type { PlaybackSpeed } from "../../constants/audio";
import "./AudioControlBar.css";

export type AudioControlBarProps = {
  /** Number of sentences in the passage (needed for progress display). */
  totalSentences?: number;
  /** Play/pause callback from the main useAudioManager instance. */
  onTogglePlay?: () => void;
  /** Stop callback from the main useAudioManager instance. */
  onStop?: () => void;
  /** Speed change callback from the main useAudioManager instance. */
  onSpeedChange?: (speed: PlaybackSpeed) => void;
};

export function AudioControlBar({
  totalSentences = 0,
  onTogglePlay,
  onStop,
  onSpeedChange,
}: AudioControlBarProps) {
  const status = useAudioStore((s) => s.status);
  const currentIndex = useAudioStore((s) => s.currentIndex);
  const rate = useAudioStore((s) => s.rate);
  const error = useAudioStore((s) => s.error);
  const hasCompleted = useAudioStore((s) => s.hasCompleted);

  const isPlaying = status === "playing";
  const isLoading = status === "loading";
  const isBlocked = status === "blocked";
  const hasError = error !== null;
  const hasStarted = currentIndex !== null || isPlaying || isLoading || isBlocked;
  const isComplete = hasCompleted && !isPlaying && !isLoading;

  // Progress display
  const currentDisplay = currentIndex !== null ? currentIndex + 1 : isComplete ? totalSentences : 0;
  const progressLabel = `${currentDisplay} / ${totalSentences}`;

  // Play/pause button icon (Tier-0: media glyphs → shared Icon play/pause/volume-mute)
  const playIcon = isLoading ? (
    "…"
  ) : isPlaying ? (
    <Icon name="pause" size={16} aria-hidden />
  ) : isBlocked ? (
    <Icon name="volume-mute" size={16} aria-hidden />
  ) : (
    <Icon name="play" size={16} aria-hidden />
  );

  return (
    <div className="audio-control-bar" role="toolbar" aria-label="Audio playback controls">
      {/* Transport buttons */}
      <div className="audio-control-bar__transport">
        <Button
          variant={isPlaying ? "control-active" : "control"}
          size="sm"
          onClick={onTogglePlay}
          disabled={isLoading || totalSentences === 0}
          aria-label={isPlaying ? "Pause audio" : isBlocked ? "Tap to play audio" : "Play audio"}
          className="audio-control-bar__transport-btn"
        >
          {playIcon}
        </Button>

        <Button
          variant="control"
          size="sm"
          onClick={onStop}
          disabled={!hasStarted || isLoading}
          aria-label="Stop audio"
          className="audio-control-bar__transport-btn"
        >
          <Icon name="stop" size={16} aria-hidden />
        </Button>
      </div>

      {/* Progress indicator */}
      <span className="audio-control-bar__progress" aria-live="polite">
        {progressLabel}
      </span>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Speed toggle pills */}
      <div className="audio-control-bar__speed-group">
        <span className="audio-control-bar__speed-label">Speed</span>
        {PLAYBACK_SPEEDS.map((opt) => (
          <Button
            key={opt}
            variant={rate === opt ? "tag-active" : "tag"}
            size="sm"
            onClick={() => onSpeedChange?.(opt as PlaybackSpeed)}
            aria-label={`Playback speed ${opt}x`}
            aria-pressed={rate === opt}
            className="audio-control-bar__speed-pill"
          >
            {opt}x
          </Button>
        ))}
      </div>

      {/* Error indicator */}
      {hasError && (
        <span
          className="audio-control-bar__error"
          role="alert"
          aria-label="Audio error detected"
          title="Some sentences failed to load audio"
        >
          ⚠
        </span>
      )}
    </div>
  );
}
