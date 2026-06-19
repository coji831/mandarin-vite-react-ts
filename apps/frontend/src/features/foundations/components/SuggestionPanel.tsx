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

let cachedStrokeData: StrokeData | null = null;

export interface SuggestionPanelProps {
  onSelect: (character: string) => void;
  currentCharacter: string;
}

export function SuggestionPanel({ onSelect, currentCharacter }: SuggestionPanelProps) {
  const [strokeData, setStrokeData] = useState<StrokeData | null>(cachedStrokeData);
  const fetchAttempted = useRef(false);

  useEffect(() => {
    if (cachedStrokeData) {
      setStrokeData(cachedStrokeData);
      return;
    }
    if (fetchAttempted.current) return;
    fetchAttempted.current = true;

    const loadData = async () => {
      try {
        const response = await fetch("/data/foundations/strokes.json");
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const json: StrokeData = await response.json();
        cachedStrokeData = json;
        setStrokeData(json);
      } catch (err) {
        console.error("Failed to load strokes data:", err);
      }
    };
    loadData();
  }, []);

  return (
    <section className="stroke-anim-section">
      <div className="stroke-anim-suggested">
        <span className="stroke-anim-suggested-label">Suggested characters:</span>
        <div className="stroke-anim-suggested-list">
          {(strokeData?.suggestedCharacters ?? []).map((char) => (
            <button
              key={char}
              className={`stroke-anim-suggested-btn ${currentCharacter === char ? "stroke-anim-suggested-btn--active" : ""}`}
              onClick={() => onSelect(char)}
              aria-label={`Show stroke animation for ${char}`}
            >
              {char}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
