/**
 * @file AnimationCanvas.tsx
 * @description Canvas wrapper with overlay logic for hanzi-writer stroke animation
 * Story 18.4: Stroke Order Reference & Animations
 *
 * Extracted from features/foundations to shared/components/CharacterStroke.
 */

import { Button } from "shared/components";
import type { RefObject } from "react";
import "./AnimationCanvas.css";

export interface AnimationCanvasProps {
  canvasRef: RefObject<HTMLDivElement | null>;
  isReady: boolean;
  error: string | null;
  character: string;
  onClick: () => void;
  /** Font utility class for the placeholder character (e.g. "font-3xl", "font-5xl") */
  placeholderSize?: string;
}

/**
 * Renders the hanzi-writer canvas container with loading/error overlay support.
 * The canvas div is always rendered so the ref is available; overlays hide when ready.
 * Uses a semantic <button> wrapper (via Button) for accessibility, with a plain
 * <div> inside for the canvas ref that hanzi-writer attaches to.
 */
export function AnimationCanvas({
  canvasRef,
  isReady,
  error,
  character,
  onClick,
  placeholderSize = "font-3xl",
}: AnimationCanvasProps) {
  const isInteractive = isReady && !error;

  return (
    <div className="stroke-anim-canvas-wrapper relative">
      <Button
        variant="control"
        className="stroke-anim-canvas p-0"
        onClick={onClick}
        disabled={!isInteractive}
        aria-label={`Replay stroke animation for ${character}`}
      >
        {/* Canvas div — always rendered so ref is available */}
        <div
          ref={canvasRef}
          className={`w-full h-full${isInteractive ? "" : " stroke-anim-canvas-hidden"}`}
        />

        {/* Loading overlay */}
        {!isReady && !error && (
          <div className="stroke-anim-canvas-overlay absolute flex-center w-full h-full">
            <span className={`${placeholderSize} op-60`}>{character}</span>
          </div>
        )}

        {/* Error overlay */}
        {error && (
          <div className="stroke-anim-canvas-overlay absolute flex-center w-full h-full">
            <span className="font-xs text-error p-xs text-center">{error}</span>
          </div>
        )}
      </Button>
    </div>
  );
}
