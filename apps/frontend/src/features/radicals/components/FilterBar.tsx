/**
 * @file components/FilterBar.tsx
 * @description Filter controls for the radicals browser (search, stroke count, top 20 toggle, sort)
 * Story 19.1: Radicals Browser Structure
 */

import { Dropdown } from "shared/components";
import type { RadicalFilter } from "../types";

interface FilterBarProps {
  filter: RadicalFilter;
  onFilterChange: (partial: Partial<RadicalFilter>) => void;
  onReset: () => void;
}

const STROKE_COUNT_OPTIONS = Array.from({ length: 17 }, (_, i) => i + 1);
const SORT_OPTIONS: { value: RadicalFilter["sortBy"]; label: string }[] = [
  { value: "kangxi_index", label: "Kangxi Index" },
  { value: "stroke_count_asc", label: "Stroke Count ↑" },
  { value: "stroke_count_desc", label: "Stroke Count ↓" },
  { value: "meaning", label: "Meaning (A–Z)" },
];

export function FilterBar({ filter, onFilterChange, onReset }: FilterBarProps) {
  return (
    <div className="radicals-filter-bar">
      {/* Stroke count dropdown — first per wireframe */}
      <div className="radicals-filter-bar__group">
        <Dropdown
          value={filter.strokeCount}
          onChange={(val) => onFilterChange({ strokeCount: val as number | null })}
          options={[
            { value: null, label: "All strokes" },
            ...STROKE_COUNT_OPTIONS.map((n) => ({
              value: n,
              label: `${n} ${n === 17 ? "+" : `stroke${n > 1 ? "s" : ""}`}`,
            })),
          ]}
          label="Stroke count"
          id="radicals-stroke-count"
        />
      </div>

      {/* Search input — second per wireframe */}
      <div className="radicals-filter-bar__group">
        <label htmlFor="radicals-search" className="radicals-filter-bar__label">
          Search
        </label>
        <input
          id="radicals-search"
          className="input-base radicals-filter-bar__input"
          type="text"
          placeholder="Search by pinyin, meaning, or glyph…"
          value={filter.search}
          onChange={(e) => onFilterChange({ search: e.target.value })}
        />
      </div>

      {/* Top 20 toggle */}
      <div
        className="radicals-filter-bar__group radicals-filter-bar__toggle-group"
        title="Show top 20 recommended radicals (covers 70% of common Chinese characters)"
      >
        <label htmlFor="radicals-top20" className="radicals-filter-bar__toggle-label">
          Show top 20 only
          <span className="font-xs radicals-filter-bar__toggle-subtle">
            {" "}
            (covers 70% of common chars)
          </span>
        </label>
        <div
          id="radicals-top20"
          className={`radicals-filter-bar__toggle ${filter.showTop20Only ? "radicals-filter-bar__toggle--active" : ""}`}
          onClick={() => onFilterChange({ showTop20Only: !filter.showTop20Only })}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onFilterChange({ showTop20Only: !filter.showTop20Only });
            }
          }}
          role="switch"
          aria-checked={filter.showTop20Only}
          aria-label="Show only top 20 recommended radicals"
          tabIndex={0}
        >
          <div className="radicals-filter-bar__toggle-knob" />
        </div>
      </div>

      {/* Sort dropdown */}
      <div className="radicals-filter-bar__group">
        <Dropdown
          value={filter.sortBy}
          onChange={(val) => onFilterChange({ sortBy: val as RadicalFilter["sortBy"] })}
          options={SORT_OPTIONS}
          label="Sort by"
          id="radicals-sort"
        />
      </div>

      {/* Reset button */}
      <button
        className="radicals-filter-bar__reset"
        onClick={onReset}
        type="button"
        aria-label="Reset all filters"
      >
        Reset
      </button>
    </div>
  );
}
