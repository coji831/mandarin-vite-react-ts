/**
 * @file components/FilterBar.tsx
 * @description Filter controls for the radicals browser (search, stroke count, top 20 toggle, sort)
 * Story 19.1: Radicals Browser Structure
 */

import { Box, Button, Dropdown, Icon, Input, ToggleSwitch } from "shared/components";
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
  const hasActiveFilters =
    filter.search !== "" ||
    filter.strokeCount !== null ||
    filter.showTop20Only !== false ||
    filter.sortBy !== "kangxi_index";

  return (
    <Box variant="surface" className="radicals-filter-bar flex-col gap-sm">
      {/* Search row — full width */}
      <Input
        className="radicals-filter-bar__search"
        placeholder="Search by pinyin, meaning, or glyph…"
        value={filter.search}
        onChange={(e) => onFilterChange({ search: e.target.value })}
      />

      {/* Secondary controls row */}
      <div className="flex flex-wrap gap-sm items-center">
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
          ariaLabel="Filter by stroke count"
          id="radicals-stroke-count"
        />

        <Dropdown
          value={filter.sortBy}
          onChange={(val) => onFilterChange({ sortBy: val as RadicalFilter["sortBy"] })}
          options={SORT_OPTIONS}
          ariaLabel="Sort radicals"
          id="radicals-sort"
        />

        <div
          className="flex-row items-center gap-xs"
          title="Covers 70% of common Chinese characters"
        >
          <ToggleSwitch
            label="Top 20 only"
            checked={filter.showTop20Only}
            onChange={(checked) => onFilterChange({ showTop20Only: checked })}
            aria-label="Toggle show top 20 radicals only"
          />
        </div>

        <Button
          variant="ghost"
          onClick={onReset}
          disabled={!hasActiveFilters}
          aria-label="Reset all filters"
        >
          Reset
        </Button>
      </div>

      {/* Legend */}
      <div className="radicals-page__legend flex items-center gap-xs font-xs text-muted">
        <span aria-hidden="true" className="text-warning">
          <Icon name="star" size={16} />
        </span>
        <span className="font-xs">Recommended (top 20 — covers 70% of common characters)</span>
      </div>
    </Box>
  );
}
