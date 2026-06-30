/**
 * @file components/RadicalChipPicker.tsx
 * @description Chip picker row — search input + chip buttons for selecting mastered radicals
 * Story 19.4: Radical Trees (Phase 3)
 */

import { useCallback } from "react";
import type { RadicalData } from "../types";
import "./RadicalChipPicker.css";

interface RadicalChipPickerProps {
  filteredChips: RadicalData[];
  activeRadicalId: string | null;
  onChipClick: (id: string) => void;
}

export function RadicalChipPicker({
  filteredChips,
  activeRadicalId,
  onChipClick,
}: RadicalChipPickerProps) {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, id: string) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onChipClick(id);
      }
    },
    [onChipClick],
  );

  return (
    <div className="radical-chip-picker" role="tablist" aria-label="Mastered radicals">
      {filteredChips.map((radical) => {
        const isSelected = activeRadicalId === radical.id;
        return (
          <button
            key={radical.id}
            className={`radical-chip-picker__chip ${isSelected ? "radical-chip-picker__chip--selected" : ""}`}
            onClick={() => onChipClick(radical.id)}
            onKeyDown={(e) => handleKeyDown(e, radical.id)}
            role="tab"
            aria-selected={isSelected}
            type="button"
          >
            <span className="font-md">{radical.glyph}</span>
            <span className="font-xs">{radical.meaning}</span>
          </button>
        );
      })}
    </div>
  );
}
