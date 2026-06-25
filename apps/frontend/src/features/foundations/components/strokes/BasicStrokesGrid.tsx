/**
 * @file components/BasicStrokesGrid.tsx
 * @description 8 basic strokes grid component
 * Story 18.4: Stroke Order Reference & Animations
 */

import type { BasicStroke } from "../../types";
import "./BasicStrokesGrid.css";

export interface BasicStrokesGridProps {
  strokes: BasicStroke[];
}

/**
 * Renders a grid of the 8 basic Chinese calligraphy strokes.
 * Each card displays the glyph, pinyin, and meaning.
 */
export function BasicStrokesGrid({ strokes }: BasicStrokesGridProps) {
  return (
    <div className="stroke-grid bg-surface-dark-alt border-default radius-md p-xs flex flex-wrap">
      {strokes.map((stroke) => (
        <div
          key={stroke.id}
          className="stroke-card bg-surface-dark-alt border-default radius-md flex-col"
        >
          <span className="stroke-glyph font-2xl lh-1 fw-600 text-primary">{stroke.glyph}</span>
          <span className="stroke-pinyin font-xs text-tertiary">{stroke.pinyin}</span>
          <span className="stroke-meaning text-muted">{stroke.meaning}</span>
        </div>
      ))}
    </div>
  );
}
