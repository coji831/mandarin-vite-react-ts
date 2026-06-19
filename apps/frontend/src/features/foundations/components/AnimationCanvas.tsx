/**
 * @file components/AnimationCanvas.tsx
 * @description Canvas wrapper with overlay logic for hanzi-writer stroke animation
 * Story 18.4: Stroke Order Reference & Animations
 */

import type { RefObject } from "react";

export interface AnimationCanvasProps {
  canvasRef: RefObject<HTMLDivElement | null>;
  isReady: boolean;
  error: string | null;
  character: string;
  onClick: () => void;
}

/**
 * Renders the hanzi-writer canvas container with loading/error overlay support.
 * The canvas div is always rendered so the ref is available; overlays hide when ready.
 */
export function AnimationCanvas({
  canvasRef,
  isReady,
  error,
  character,
  onClick,
}: AnimationCanvasProps) {
  return (
    <div className="stroke-anim-canvas-wrapper">
      <div
        className={`stroke-anim-canvas ${isReady && !error ? "stroke-anim-canvas-active" : "stroke-anim-canvas-hidden"}`}
        ref={canvasRef}
        onClick={onClick}
      />
      {!isReady && !error && (
        <div className="stroke-anim-canvas-overlay" onClick={onClick}>
          <span className="stroke-anim-canvas-char">{character}</span>
        </div>
      )}
      {error && (
        <div className="stroke-anim-canvas-overlay stroke-anim-canvas-error" onClick={onClick}>
          <span className="stroke-anim-error-text">{error}</span>
        </div>
      )}
    </div>
  );
}
