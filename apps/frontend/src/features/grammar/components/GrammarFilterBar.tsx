/**
 * @file components/GrammarFilterBar.tsx
 * @description Grammar filters — debounced SearchInput + HSK level + phase
 * FilterChip groups. Pure presentational shell (no hooks/API).
 * Story 22.3: Grammar UI
 */
import { FilterChip, SearchInput } from "shared/components";
import { HSK_LEVELS } from "@mandarin/shared-constants";
import { GRAMMAR_PHASES } from "../constants";
import "./GrammarFilterBar.css";

export interface GrammarFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  hskLevel: number | null;
  onHskLevelChange: (level: number | null) => void;
  phase: number | null;
  onPhaseChange: (phase: number | null) => void;
}

export function GrammarFilterBar({
  search,
  onSearchChange,
  hskLevel,
  onHskLevelChange,
  phase,
  onPhaseChange,
}: GrammarFilterBarProps) {
  return (
    <div className="grammar-filter-bar flex-col gap-sm">
      <SearchInput
        value={search}
        onChange={onSearchChange}
        placeholder="Search grammar by keyword or pattern name..."
      />

      <div
        className="grammar-filter-bar__group flex flex-wrap gap-sm items-center"
        role="group"
        aria-label="Filter by HSK level"
      >
        <span className="grammar-filter-bar__label font-xs text-muted shrink-0">HSK</span>
        {HSK_LEVELS.map((level) => (
          <FilterChip
            key={level}
            label={`HSK ${level}`}
            selected={level === hskLevel}
            onClick={() => onHskLevelChange(level === hskLevel ? null : level)}
          />
        ))}
      </div>

      <div
        className="grammar-filter-bar__group flex flex-wrap gap-sm items-center"
        role="group"
        aria-label="Filter by phase"
      >
        <span className="grammar-filter-bar__label font-xs text-muted shrink-0">Phase</span>
        {GRAMMAR_PHASES.map((p) => (
          <FilterChip
            key={p}
            label={`Phase ${p}`}
            selected={p === phase}
            onClick={() => onPhaseChange(p === phase ? null : p)}
          />
        ))}
      </div>
    </div>
  );
}
