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
import { StrokeBreakdown } from "./StrokeBreakdown";
import { StrokeRulesDisplay } from "./StrokeRulesDisplay";

export interface AnimationPanelProps {
  character: string;
}

export function AnimationPanel({ character }: AnimationPanelProps) {
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
    handleCharacterClick,
    handleStrokeSelect,
  } = useHanziWriter(character);

  return (
    <section className="stroke-anim-section">
      <div className="stroke-anim-card">
        {/* Character info */}
        <div className="stroke-anim-header">
          <span className="stroke-anim-character">{character}</span>
          <span className="stroke-anim-info">
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
          onClick={handleCharacterClick}
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
