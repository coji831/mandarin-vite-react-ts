/**
 * @file components/FinalsGrid.tsx
 * @description 39-cell clickable grid of pinyin finals (韵母), grouped by type
 * Story 18.2: Pinyin System Guide
 *
 * Renders all finals grouped by type: Simple vowels, Compound finals, Nasal finals.
 * Each group has a sub-header. Clicking a cell selects the final.
 * Uses shared PinyinCell component.
 */

import { type PinyinFinal } from "../types";
import { PinyinCell } from "./PinyinCell";

export interface FinalsGridProps {
  finals: PinyinFinal[];
  selected: string | null;
  onSelect: (id: string) => void;
}

const GROUP_LABELS: Record<string, string> = {
  simple: "Simple Vowels",
  compound: "Compound Finals",
  nasal: "Nasal Finals",
};

export function FinalsGrid({ finals, selected, onSelect }: FinalsGridProps) {
  const grouped = {
    simple: finals.filter((f) => f.type === "simple"),
    compound: finals.filter((f) => f.type === "compound"),
    nasal: finals.filter((f) => f.type === "nasal"),
  };

  return (
    <div className="pinyin-finals-grid">
      {(["simple", "compound", "nasal"] as const).map((group) => {
        const items = grouped[group];
        if (items.length === 0) return null;

        return (
          <div key={group} className="pinyin-finals-group">
            <h4 className="pinyin-finals-group-label">{GROUP_LABELS[group]}</h4>
            <div className="pinyin-finals-group-grid">
              {items.map((fin) => (
                <PinyinCell
                  key={fin.id}
                  id={fin.id}
                  label={fin.pinyin}
                  isSelected={selected === fin.id}
                  ariaLabel={`Final ${fin.pinyin}: ${fin.description}`}
                  onSelect={onSelect}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
