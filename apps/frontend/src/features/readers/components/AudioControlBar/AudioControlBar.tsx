/**
 * @file AudioControlBar.tsx
 * @description Playback control bar for per-sentence audio.
 * Story 21.5: Audio Sync — Phase 4a
 *
 * Props-only — no logic, no hooks, no API calls.
 * States: Idle, Loading, Playing, Paused, Complete, Error.
 */
import { Button } from "shared/components";
import { PLAYBACK_SPEEDS } from "../../constants/audio";
import "./AudioControlBar.css";

export interface AudioControlBarProps {
  currentIndex: number | null;
  isPlaying: boolean;
  isLoading: boolean;
  hasCompleted: boolean;
  hasError?: boolean;
  totalSentences: number;
  speed: number;
  onTogglePlay: () => void;
  onStop: () => void;
  onSpeedChange: (speed: number) => void;
}

export function AudioControlBar({
  currentIndex,
  isPlaying,
  isLoading,
  hasCompleted,
  hasError = false,
  totalSentences,
  speed,
  onTogglePlay,
  onStop,
  onSpeedChange,
}: AudioControlBarProps) {
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
            onClick={() => onSpeedChange(opt)}
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
