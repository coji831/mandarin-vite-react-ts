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
import { Button } from "shared/components";
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
    <Button
      variant="ghost-primary"
      className={`pinyin-cell-button box-surface p-xs ${isSelected ? "pinyin-cell--selected bg-primary-bg fw-600 " : ""}`}
      onClick={() => onSelect(id)}
      aria-label={ariaLabel}
      title={ariaLabel}
    >
      <span className="pinyin-cell-pinyin font-md fw-500">{label}</span>
      {secondary && (
        <span className="pinyin-cell-ipa font-xs font-italic text-tertiary" aria-hidden="true">
          {secondary}
        </span>
      )}
    </Button>
  );
}

export const PinyinCell = React.memo(PinyinCellComponent);
