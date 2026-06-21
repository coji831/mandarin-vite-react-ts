/**
 * @file components/AnimationCanvas.tsx
 * @description Canvas wrapper with overlay logic for hanzi-writer stroke animation
 * Story 18.4: Stroke Order Reference & Animations
 */

import type { RefObject } from "react";
import "./AnimationCanvas.css";

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
        className={`stroke-anim-canvas cursor-pointer border-default radius-sm ${isReady && !error ? "stroke-anim-canvas-active" : "stroke-anim-canvas-hidden"}`}
        ref={canvasRef as React.Ref<HTMLDivElement>}
        onClick={onClick}
      />
      {!isReady && !error && (
        <div className="stroke-anim-canvas-overlay w-full cursor-pointer" onClick={onClick}>
          <span className="stroke-anim-canvas-char">{character}</span>
        </div>
      )}
      {error && (
        <div
          className="stroke-anim-canvas-overlay stroke-anim-canvas-error w-full cursor-pointer"
          onClick={onClick}
        >
          <span className="stroke-anim-error-text font-xs text-error p-xs text-center">
            {error}
          </span>
        </div>
      )}
    </div>
  );
}
