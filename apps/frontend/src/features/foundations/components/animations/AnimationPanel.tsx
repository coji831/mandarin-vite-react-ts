/**
 * @file components/AnimationPanel.tsx
 * @description Hanzi Writer animation panel with canvas, controls, stroke breakdown, and rules
 * Story 18.4: Stroke Order Reference & Animations
 *
 * Controlled component pattern — receives the character to animate via props.
 * Manages all hanzi-writer lifecycle, playback, and display internally.
 */

import { useHanziWriter } from "features/foundations/hooks";
import { AnimationCanvas } from "./AnimationCanvas";
import { AnimationControls } from "./AnimationControls";
import { StrokeBreakdown } from "../strokes/StrokeBreakdown";
import { StrokeRulesDisplay } from "../strokes/StrokeRulesDisplay";

type AnimationPanelProps = {
  character: string;
  onCharacterClick?: (character: string) => void;
};

export function AnimationPanel({ character, onCharacterClick }: AnimationPanelProps) {
  const {
    canvasRef,
    isReady,
    error,
    currentStroke,
    totalStrokes,
    isPlaying,
    speed,
    strokePaths,
    appliedRules,
    handlePlay,
    handlePause,
    handleStepBack,
    handleStepForward,
    handleSpeedChange,
    handleStrokeSelect,
  } = useHanziWriter(character);

  return (
    <section className="flex-col">
      <div className="stroke-anim-card p-sm bg-surface-dark-alt border-default radius-md flex-col-center gap-xs">
        {/* Character info */}
        <div className="stroke-anim-header flex-center">
          <span className="stroke-anim-character font-xl fw-700 text-primary">{character}</span>
          <span className="stroke-anim-info font-xs font-italic text-muted">
            {isReady && totalStrokes > 0
              ? isPlaying
                ? "Animating..."
                : `Stroke ${currentStroke} of ${totalStrokes}`
              : "Loading..."}
          </span>
        </div>

        {/* Canvas */}
        <AnimationCanvas
          canvasRef={canvasRef}
          isReady={isReady}
          error={error}
          character={character}
          onClick={() => onCharacterClick?.(character)}
        />

        {/* Controls */}
        <AnimationControls
          isReady={isReady}
          isPlaying={isPlaying}
          currentStroke={currentStroke}
          totalStrokes={totalStrokes}
          speed={speed}
          onPlay={handlePlay}
          onPause={handlePause}
          onStepBack={handleStepBack}
          onStepForward={handleStepForward}
          onSpeedChange={handleSpeedChange}
        />

        {/* Breakdown */}
        <StrokeBreakdown
          totalStrokes={totalStrokes}
          strokePaths={strokePaths}
          currentStroke={currentStroke}
          onStrokeSelect={handleStrokeSelect}
        />

        {/* Rules */}
        <StrokeRulesDisplay appliedRules={appliedRules} />
      </div>
    </section>
  );
}
