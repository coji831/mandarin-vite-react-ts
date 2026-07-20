/**
 * @file components/RadicalChipPicker.tsx
 * @description Chip picker row — search input + chip buttons for selecting mastered radicals
 * Story 19.4: Radical Trees (Phase 3)
 */

import { Box, Button } from "shared/components";
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
  return (
    <Box
      variant="divider"
      className="radical-chip-picker flex-wrap gap-sm"
      padding="md"
      role="tablist"
      aria-label="Mastered radicals"
    >
      {filteredChips.map((radical) => {
        const isSelected = activeRadicalId === radical.id;
        return (
          <Button
            key={radical.id}
            variant={isSelected ? "tag-active" : "ghost"}
            className="radical-chip-picker__chip text-secondary transition-all"
            onClick={() => onChipClick(radical.id)}
            aria-label={`Select ${radical.meaning} radical`}
          >
            <span className="font-md">{radical.glyph}</span>
            <span className="font-xs">{radical.meaning}</span>
          </Button>
        );
      })}
    </Box>
  );
}
