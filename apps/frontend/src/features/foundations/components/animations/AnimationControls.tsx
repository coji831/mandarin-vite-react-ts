/**
 * @file components/AnimationControls.tsx
 * @description Play/pause/step/speed controls for hanzi-writer stroke animation
 * Story 18.4: Stroke Order Reference & Animations
 */

import { Button } from "shared/components";
import "./AnimationControls.css";

export interface AnimationControlsProps {
  isReady: boolean;
  isPlaying: boolean;
  currentStroke: number;
  totalStrokes: number;
  speed: number;
  showSpeedSlider?: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStepBack: () => void;
  onStepForward: () => void;
  onSpeedChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

/**
 * Renders playback controls for stroke animation including play/pause,
 * step forward/back, and a speed slider.
 */
export function AnimationControls({
  isReady,
  isPlaying,
  currentStroke,
  totalStrokes,
  speed,
  showSpeedSlider = true,
  onPlay,
  onPause,
  onStepBack,
  onStepForward,
  onSpeedChange,
}: AnimationControlsProps) {
  return (
    <div className="flex-center gap-xs flex-wrap">
      <Button
        variant="ghost-primary"
        size="sm"
        className="anim-control-btn text-primary disabled:op-40"
        onClick={isPlaying ? onPause : onPlay}
        disabled={!isReady}
        title={isPlaying ? "Pause" : "Play"}
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? "⏸" : "▶"}
      </Button>
      <Button
        variant="ghost-primary"
        size="sm"
        className="anim-control-btn text-primary disabled:op-40"
        onClick={onStepBack}
        disabled={!isReady || currentStroke <= 0}
        title="Step back"
        aria-label="Step back one stroke"
      >
        ⏪
      </Button>
      <Button
        variant="ghost-primary"
        size="sm"
        className="anim-control-btn text-primary disabled:op-40"
        onClick={onStepForward}
        disabled={!isReady || currentStroke >= totalStrokes}
        title="Step forward"
        aria-label="Step forward one stroke"
      >
        ⏩
      </Button>
      {showSpeedSlider && (
        <div className="flex">
          <label className="anim-speed-label font-xs text-muted" htmlFor="anim-speed-slider">
            Speed:
          </label>
          <input
            id="anim-speed-slider"
            type="range"
            className="anim-speed-slider cursor-pointer disabled:op-30"
            min={0.5}
            max={3}
            step={0.5}
            value={speed}
            onChange={onSpeedChange}
            disabled={!isReady}
          />
          <span className="anim-speed-value font-xs text-tertiary">{speed}x</span>
        </div>
      )}
    </div>
  );
}
