/**
 * @file components/BasicStrokesGrid.tsx
 * @description 8 basic strokes grid component
 * Story 18.4: Stroke Order Reference & Animations
 */

import { Box } from "shared/components";
import type { BasicStroke } from "../../types";
import "./BasicStrokesGrid.css";

export interface BasicStrokesGridProps {
  strokes: BasicStroke[];
}

/** Distinct accent colors for each stroke, keyed by stroke id. */
const STROKE_COLORS: Record<string, string> = {
  dot: "var(--stroke-demo-1)",
  horizontal: "var(--stroke-demo-2)",
  vertical: "var(--stroke-demo-3)",
  "left-falling": "var(--stroke-demo-4)",
  "right-falling": "var(--stroke-demo-5)",
  rise: "var(--stroke-demo-6)",
  bend: "var(--stroke-demo-7)",
  hook: "var(--stroke-demo-8)",
};

/**
 * Renders a grid of the 8 basic Chinese calligraphy strokes.
 * Each card displays the glyph, pinyin, and meaning with a distinct accent color.
 */
export function BasicStrokesGrid({ strokes }: BasicStrokesGridProps) {
  return (
    <Box variant="dark-alt" padding="xs" className="stroke-grid flex flex-wrap">
      {strokes.map((stroke) => {
        const accentColor = STROKE_COLORS[stroke.id] || "var(--text-primary)";
        return (
          <Box
            key={stroke.id}
            variant="card"
            padding="sm"
            className="stroke-card flex-col gap-xs"
            style={{ "--accent-color": accentColor } as React.CSSProperties}
          >
            <span
              className="stroke-glyph font-3xl lh-1 fw-600 transition-transform"
              style={{ color: accentColor }}
            >
              {/* inline: dynamic accent color — per-stroke color from data */}
              {stroke.glyph}
            </span>
            <span className="stroke-pinyin font-xs text-tertiary">{stroke.pinyin}</span>
            <span className="stroke-meaning font-xs text-muted">{stroke.meaning}</span>
          </Box>
        );
      })}
    </Box>
  );
}
