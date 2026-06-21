/**
 * @file components/InitialsGrid.tsx
 * @description 21-cell clickable grid of pinyin initials (声母)
 * Story 18.2: Pinyin System Guide
 *
 * Renders all 21 pinyin initials in a responsive flex-wrap grid.
 * Clicking a cell selects it. Uses shared PinyinCell component.
 */

import { type PinyinInitial } from "../../types";
import { PinyinCell } from "./PinyinCell";

export interface InitialsGridProps {
  initials: PinyinInitial[];
  selected: string | null;
  onSelect: (id: string) => void;
}

export function InitialsGrid({ initials, selected, onSelect }: InitialsGridProps) {
  return (
    <div className="flex gap-xs flex-wrap">
      {initials.map((init) => (
        <PinyinCell
          key={init.id}
          id={init.id}
          label={init.pinyin}
          secondary={init.ipa}
          isSelected={selected === init.id}
          ariaLabel={`Initial ${init.pinyin}: ${init.description}`}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
