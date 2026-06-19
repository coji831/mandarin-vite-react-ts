/**
 * @file components/StrokeBreakdown.tsx
 * @description Stroke count display with SVG path thumbnails
 * Story 18.4: Stroke Order Reference & Animations
 */

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
export function StrokeBreakdown({
  totalStrokes,
  strokePaths,
  currentStroke,
  onStrokeSelect,
}: StrokeBreakdownProps) {
  return (
    <div className="stroke-anim-breakdown">
      <span className="stroke-anim-breakdown-label">Stroke breakdown: </span>
      <span className="stroke-anim-breakdown-value">
        {totalStrokes > 0 ? `${totalStrokes} strokes` : "Loading stroke data..."}
      </span>
      {strokePaths.length > 0 && (
        <div className="stroke-breakdown-paths">
          {strokePaths.map((path: string, i: number) => (
            <svg
              key={i}
              className={`stroke-breakdown-svg ${currentStroke === i + 1 ? "stroke-breakdown-svg--active" : ""}`}
              viewBox="0 0 100 100"
              onClick={() => onStrokeSelect?.(i + 1)}
              role="button"
              tabIndex={0}
              aria-label={`Stroke ${i + 1} of ${totalStrokes}`}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") onStrokeSelect?.(i + 1);
              }}
            >
              <path d={path} fill="#aaa" transform="translate(0, 112.5) scale(0.125, -0.125)" />
            </svg>
          ))}
        </div>
      )}
    </div>
  );
}
