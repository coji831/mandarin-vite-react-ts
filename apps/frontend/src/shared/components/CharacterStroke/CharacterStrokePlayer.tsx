/**
 * @file CharacterStrokePlayer.tsx
 * @description Shared stroke animation player composing canvas, controls, and extras
 * Story 18.4: Stroke Order Reference & Animations
 *
 * Composes AnimationCanvas + inline controls + stroke info + optional extras.
 * Owns useHanziWriter internally — consumers do not call it directly.
 *
 * Mode "full": complete experience with speed slider, stroke breakdown, rules
 * Mode "mini": compact player for embedding (e.g. Character Hub)
 *
 * Extracted from features/foundations to shared/components/CharacterStroke.
 */

import { Box, Button } from "shared/components";
import { useAudioPlayback } from "shared/hooks";
import { openHub } from "shared/store";
import { AnimationCanvas } from "./AnimationCanvas";
import "./CharacterStrokePlayer.css";
import { useHanziWriter } from "./useHanziWriter";

export type CharacterStrokeMode = "full" | "mini";

export type CharacterStrokePlayerProps = {
  /** The Chinese character to animate */
  character: string;
  /** Display variant: "full" (default) or "mini" */
  mode?: CharacterStrokeMode;
  /** Font utility class for the placeholder character (e.g. "font-3xl", "font-5xl") */
  placeholderSize?: string;
  /** Additional class names */
  className?: string;
};

export function CharacterStrokePlayer({
  character,
  mode = "full",
  placeholderSize,
  className = "",
}: CharacterStrokePlayerProps) {
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

  const { playWordAudio } = useAudioPlayback();
  // ── Mini mode: compact player for embedding ──────────────────────

  if (mode === "mini") {
    return (
      <div className={`flex-col-center gap-xs ${className}`}>
        {/* Canvas */}
        <AnimationCanvas
          canvasRef={canvasRef}
          isReady={isReady}
          error={error}
          character={character}
          onClick={() => openHub({ entityType: "character", entityId: character })}
          placeholderSize={placeholderSize ?? "font-5xl"}
        />

        {/* Stroke info */}
        <span className="font-xs text-muted">
          {isReady && totalStrokes > 0
            ? isPlaying
              ? "Animating..."
              : `Stroke ${currentStroke} of ${totalStrokes}`
            : "Loading..."}
        </span>

        {/* Controls row: step back, play/pause, step forward */}
        <div className="csp-controls-row flex items-center">
          <Button
            variant="control"
            size="sm"
            className="csp-ctrl-btn"
            onClick={handleStepBack}
            disabled={!isReady || currentStroke <= 0}
            title="Step back"
            aria-label="Step back"
          >
            ◀
          </Button>
          {isPlaying ? (
            <Button
              variant="ghost-primary"
              size="sm"
              className="csp-ctrl-btn csp-ctrl-play bg-primary-bg"
              onClick={handlePause}
              disabled={!isReady}
              title="Pause"
              aria-label="Pause"
            >
              ⏸
            </Button>
          ) : (
            <Button
              variant="ghost-primary"
              size="sm"
              className="csp-ctrl-btn csp-ctrl-play bg-primary-bg"
              onClick={handlePlay}
              disabled={!isReady}
              title="Play stroke"
              aria-label="Play stroke animation"
            >
              ▶
            </Button>
          )}
          <Button
            variant="control"
            size="sm"
            className="csp-ctrl-btn"
            onClick={handleStepForward}
            disabled={!isReady || currentStroke >= totalStrokes}
            title="Step forward"
            aria-label="Step forward"
          >
            ▶
          </Button>
        </div>
      </div>
    );
  }

  // ── Full mode: complete experience ───────────────────────────────

  return (
    <div className={`flex-col-center gap-xs ${className}`}>
      {/* Character info — above canvas */}
      <div className="flex-center gap-sm p-xs">
        <span className="font-2xl fw-700 text-primary">{character}</span>

        <Button
          variant="icon"
          onClick={() => playWordAudio({ chinese: character })}
          title={`Play ${character}`}
          aria-label={`Play pronunciation for ${character}`}
        >
          🔊
        </Button>

        <span className="font-xs font-italic text-muted">
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
        onClick={() => openHub({ entityType: "character", entityId: character })}
        placeholderSize={placeholderSize ?? "font-3xl"}
      />

      {/* Error fallback */}
      {error && (
        <Box variant="surface" padding="xs" className="font-xs text-error text-center radius-sm">
          <span>⚠️ {error}</span>
          <span className="text-muted"> — Character outline still available</span>
        </Box>
      )}

      {/* Open in Character Hub */}
      <Button
        variant="secondary"
        size="sm"
        onClick={() => openHub({ entityType: "character", entityId: character })}
        aria-label="Open in Character Detail Hub"
      >
        📖 Open in Character Hub
      </Button>

      {/* Controls */}
      <div className="flex-center gap-xs flex-wrap">
        <Button
          variant="ghost-primary"
          size="sm"
          className="anim-control-btn text-primary disabled:op-40"
          onClick={isPlaying ? handlePause : handlePlay}
          disabled={!isReady}
          title={isPlaying ? "Pause" : "Play"}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? "⏸" : "▶"}
        </Button>
        <Button
          variant="control"
          size="sm"
          className="anim-control-btn"
          onClick={handleStepBack}
          disabled={!isReady || currentStroke <= 0}
          title="Step back"
          aria-label="Step back"
        >
          ◀
        </Button>
        <Button
          variant="control"
          size="sm"
          className="anim-control-btn"
          onClick={handleStepForward}
          disabled={!isReady || currentStroke >= totalStrokes}
          title="Step forward"
          aria-label="Step forward"
        >
          ▶
        </Button>
        <span className="font-xs text-muted">
          {isReady ? `${currentStroke} / ${totalStrokes}` : "—"}
        </span>
      </div>

      {/* Speed slider */}
      <div className="flex-center gap-xs">
        <label htmlFor="stroke-speed" className="font-xs text-muted">
          Speed:
        </label>
        <input
          id="stroke-speed"
          type="range"
          min="0.25"
          max="3"
          step="0.25"
          value={speed}
          onChange={handleSpeedChange}
          className="stroke-speed-slider"
          aria-label="Animation speed"
        />
        <span className="font-xs text-muted">{speed}x</span>
      </div>

      {/* Breakdown */}
      <div className="flex-center flex-wrap gap-xs">
        {strokePaths.length > 0 &&
          strokePaths.map((_, idx) => (
            <Button
              key={idx}
              variant={idx === currentStroke - 1 ? "primary" : "control"}
              size="sm"
              className="anim-control-btn"
              onClick={() => handleStrokeSelect(idx + 1)}
              disabled={!isReady}
              title={`Stroke ${idx + 1}`}
              aria-label={`Go to stroke ${idx + 1}`}
            >
              {idx + 1}
            </Button>
          ))}
      </div>

      {/* Rules */}
      {appliedRules.length > 0 && (
        <div className="flex-center flex-wrap gap-xs p-xs">
          {appliedRules.map((rule) => (
            <span key={rule} className="font-xs text-muted">
              {rule}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
