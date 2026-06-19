/**
 * @file components/AnimationControls.tsx
 * @description Play/pause/step/speed controls for hanzi-writer stroke animation
 * Story 18.4: Stroke Order Reference & Animations
 */

export interface AnimationControlsProps {
  isReady: boolean;
  isPlaying: boolean;
  currentStroke: number;
  totalStrokes: number;
  speed: number;
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
  onPlay,
  onPause,
  onStepBack,
  onStepForward,
  onSpeedChange,
}: AnimationControlsProps) {
  return (
    <div className="stroke-anim-controls">
      <button
        className="anim-control-btn"
        onClick={onPlay}
        disabled={!isReady}
        title="Play"
        aria-label="Play"
      >
        ▶
      </button>
      <button
        className="anim-control-btn"
        onClick={onPause}
        disabled={!isReady}
        title="Pause"
        aria-label="Pause"
      >
        ⏸
      </button>
      <button
        className="anim-control-btn"
        onClick={onStepBack}
        disabled={!isReady || currentStroke <= 0}
        title="Step back"
        aria-label="Step back one stroke"
      >
        ⏪
      </button>
      <button
        className="anim-control-btn"
        onClick={onStepForward}
        disabled={!isReady || currentStroke >= totalStrokes}
        title="Step forward"
        aria-label="Step forward one stroke"
      >
        ⏩
      </button>
      <div className="anim-speed-control">
        <label className="anim-speed-label" htmlFor="anim-speed-slider">
          Speed:
        </label>
        <input
          id="anim-speed-slider"
          type="range"
          className="anim-speed-slider"
          min={0.5}
          max={3}
          step={0.5}
          value={speed}
          onChange={onSpeedChange}
          disabled={!isReady}
        />
        <span className="anim-speed-value">{speed}x</span>
      </div>
    </div>
  );
}
