/**
 * @file components/PinyinCell.tsx
 * @description Shared pinyin cell component for initials and finals grids
 * Story 18.2: Pinyin System Guide
 *
 * Renders a compact flex-row button with primary text (pinyin) and optional
 * secondary text (IPA). Used by both InitialsGrid and FinalsGrid to reduce
 * duplicate markup. Content-sized width via flex: 0 0 auto.
 */

import React from "react";
import "./PinyinCell.css";

export interface PinyinCellProps {
  id: string;
  label: string;
  secondary?: string;
  isSelected: boolean;
  ariaLabel: string;
  onSelect: (id: string) => void;
}

function PinyinCellComponent({
  id,
  label,
  secondary,
  isSelected,
  ariaLabel,
  onSelect,
}: PinyinCellProps) {
  return (
    <button
      className={`pinyin-cell-button bg-surface-dark border-default radius-md text-primary flex cursor-pointer ${isSelected ? "pinyin-cell--selected fw-600" : ""}`}
      onClick={() => onSelect(id)}
      aria-label={ariaLabel}
      aria-pressed={isSelected}
      title={ariaLabel}
    >
      <span className="pinyin-cell-pinyin font-md fw-500">{label}</span>
      {secondary && (
        <span className="pinyin-cell-ipa font-xs font-italic text-tertiary">{secondary}</span>
      )}
    </button>
  );
}

export const PinyinCell = React.memo(PinyinCellComponent);
