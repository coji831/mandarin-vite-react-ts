/**
 * @file components/BasicStrokesGrid.tsx
 * @description 8 basic strokes grid component
 * Story 18.4: Stroke Order Reference & Animations
 */

import type { BasicStroke } from "../types";

export interface BasicStrokesGridProps {
  strokes: BasicStroke[];
}

/**
 * Renders a grid of the 8 basic Chinese calligraphy strokes.
 * Each card displays the glyph, pinyin, and meaning.
 */
export function BasicStrokesGrid({ strokes }: BasicStrokesGridProps) {
  return (
    <div className="stroke-grid">
      {strokes.map((stroke) => (
        <div key={stroke.id} className="stroke-card">
          <span className="stroke-glyph">{stroke.glyph}</span>
          <span className="stroke-pinyin">{stroke.pinyin}</span>
          <span className="stroke-meaning">{stroke.meaning}</span>
        </div>
      ))}
    </div>
  );
}
