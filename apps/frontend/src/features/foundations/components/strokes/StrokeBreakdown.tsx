/**
 * @file components/StrokeBreakdown.tsx
 * @description Stroke count display with SVG path thumbnails
 * Story 18.4: Stroke Order Reference & Animations
 */

import React from "react";
import { Button } from "shared/components";
import "./StrokeBreakdown.css";

export interface StrokeBreakdownProps {
  totalStrokes: number;
  strokePaths: string[];
  currentStroke?: number;
  onStrokeSelect?: (index: number) => void;
}

/**
 * Renders the stroke count and a row of SVG path thumbnails for each stroke.
 * Each thumbnail is clickable — clicking jumps the animation to that stroke.
 * `currentStroke` is 1-based (matches the display "Stroke X of Y").
 * `onStrokeSelect` passes a 1-based index for consistency.
 */
export const StrokeBreakdown = React.memo(function StrokeBreakdown({
  totalStrokes,
  strokePaths,
  currentStroke,
  onStrokeSelect,
}: StrokeBreakdownProps) {
  return (
    <div className="stroke-anim-breakdown font-xs text-muted text-center">
      <span className="stroke-anim-breakdown-label text-muted">Stroke breakdown: </span>
      <span className="stroke-anim-breakdown-value text-tertiary">
        {totalStrokes > 0 ? `${totalStrokes} strokes` : "Loading stroke data..."}
      </span>
      {strokePaths.length > 0 && (
        <div className="flex gap-xs flex-wrap flex-center">
          {strokePaths.map((path: string, i: number) => (
            <Button
              key={i}
              variant="ghost"
              className="stroke-breakdown-svg p-0"
              onClick={() => onStrokeSelect?.(i + 1)}
              aria-label={`Stroke ${i + 1} of ${totalStrokes}`}
            >
              <svg
                className={`${currentStroke === i + 1 ? "stroke-breakdown-svg--active" : ""}`}
                viewBox="0 0 100 100"
                width="100%"
                height="100%"
              >
                <path
                  d={path}
                  fill="var(--text-muted)"
                  transform="translate(0, 112.5) scale(0.125, -0.125)"
                />
              </svg>
            </Button>
          ))}
        </div>
      )}
    </div>
  );
});
