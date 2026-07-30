/**
 * @file AudioControlBar.tsx
 * @description Playback control bar for per-sentence audio.
 * Phase 2: Reads audio state from audioStore directly.
 *   Receives transport callbacks (onTogglePlay, onStop, onSpeedChange) from parent
 *   to avoid creating a second useAudioPlayer instance with empty sentenceTexts.
 *
 * States: Idle, Loading, Playing, Paused, Complete, Error.
 */
import { Button } from "shared/components";
import { PLAYBACK_SPEEDS } from "../../constants/audio";
import { useAudioStore } from "../../stores";
import type { PlaybackSpeed } from "../../constants/audio";
import "./AudioControlBar.css";

export type AudioControlBarProps = {
  /** Number of sentences in the passage (needed for progress display). */
  totalSentences?: number;
  /** Play/pause callback from the main useAudioPlayer instance. */
  onTogglePlay?: () => void;
  /** Stop callback from the main useAudioPlayer instance. */
  onStop?: () => void;
  /** Speed change callback from the main useAudioPlayer instance. */
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
  const speed = useAudioStore((s) => s.speed);
  const error = useAudioStore((s) => s.error);

  const isPlaying = status === "playing";
  const isLoading = status === "loading";
  const hasCompleted = status === "completed";
  const hasError = error !== null;
  const hasStarted = currentIndex !== null || isPlaying || isLoading;
  const isComplete = hasCompleted && !isPlaying && !isLoading;

  // Progress display
  const currentDisplay = currentIndex !== null ? currentIndex + 1 : isComplete ? totalSentences : 0;
  const progressLabel = `${currentDisplay} / ${totalSentences}`;

  // Play/pause button icon
  const playIcon = isLoading ? "⏳" : isPlaying ? "⏸" : "▶";

  return (
    <div className="audio-control-bar" role="toolbar" aria-label="Audio playback controls">
      {/* Transport buttons */}
      <div className="audio-control-bar__transport">
        <Button
          variant={isPlaying ? "control-active" : "control"}
          size="sm"
          onClick={onTogglePlay}
          disabled={isLoading || totalSentences === 0}
          aria-label={isPlaying ? "Pause audio" : "Play audio"}
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
          ⏹
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
            variant={speed === opt ? "tag-active" : "tag"}
            size="sm"
            onClick={() => onSpeedChange?.(opt as PlaybackSpeed)}
            aria-label={`Playback speed ${opt}x`}
            aria-pressed={speed === opt}
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
