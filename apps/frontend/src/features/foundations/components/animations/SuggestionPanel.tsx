/**
 * @file components/SuggestionPanel.tsx
 * @description Suggested characters quick-select panel
 * Story 18.4: Stroke Order Reference & Animations
 *
 * Controlled component pattern — loads its own data,
 * emits character selection via onSelect callback.
 * Highlights the currently active character.
 */

import { useEffect, useState, useRef } from "react";
import type { StrokeData } from "features/foundations/types";
import { loadStrokeData, getCachedStrokeData } from "features/foundations";
import { Button, Box } from "shared/components";
import "./SuggestedCharacters.css";

export interface SuggestionPanelProps {
  onSelect: (character: string) => void;
  currentCharacter: string;
  compact?: boolean;
}

export function SuggestionPanel({
  onSelect,
  currentCharacter,
  compact = false,
}: SuggestionPanelProps) {
  const [strokeData, setStrokeData] = useState<StrokeData | null>(getCachedStrokeData());
  const fetchAttempted = useRef(false);

  useEffect(() => {
    if (strokeData) return;
    if (fetchAttempted.current) return;
    fetchAttempted.current = true;

    const loadData = async () => {
      try {
        const json = await loadStrokeData();
        setStrokeData(json);
      } catch (err) {
        // [Foundations] Failed to load strokes data for suggestion panel
        console.error("[SuggestionPanel] Failed to load strokes data:", err);
      }
    };
    loadData();
  }, [strokeData]);

  if (compact) {
    return (
      <div className="flex-center flex-wrap gap-xs">
        {(strokeData?.suggestedCharacters ?? []).map((char) => (
          <Button
            key={char}
            variant="ghost-primary"
            size="sm"
            className={`stroke-anim-suggested-btn font-sm ${currentCharacter === char ? "stroke-anim-suggested-btn--active bg-primary-bg fw-600" : ""}`}
            onClick={() => onSelect(char)}
            aria-label={`Show stroke animation for ${char}`}
          >
            {char}
          </Button>
        ))}
      </div>
    );
  }

  return (
    <section className="flex-col">
      <p className="font-xs text-muted m-0">
        Quick Select — click any character to see its stroke animation
      </p>
      <Box variant="dark-alt" padding="xs" className="stroke-anim-suggested flex-center flex-wrap">
        <span className="stroke-anim-suggested-label font-xs text-muted shrink-0">Suggested:</span>
        <div className="flex gap-xs flex-wrap">
          {(strokeData?.suggestedCharacters ?? []).map((char) => (
            <Button
              key={char}
              variant="ghost-primary"
              size="sm"
              className={`stroke-anim-suggested-btn font-sm ${currentCharacter === char ? "stroke-anim-suggested-btn--active bg-primary-bg fw-600" : ""}`}
              onClick={() => onSelect(char)}
              aria-label={`Show stroke animation for ${char}`}
            >
              {char}
            </Button>
          ))}
        </div>
      </Box>
    </section>
  );
}
