/**
 * @file components/ChengyuFilterBar.tsx
 * @description Chengyu filters — debounced SearchInput, theme Dropdown, and era
 * FilterChip group. Pure presentational shell (no hooks/API).
 * Story 23.3: Chengyu UI
 *
 * Filter UI rationale (see `../constants/chengyuFilters.ts`): every idiom has a
 * UNIQUE theme (55 values), so themes are exposed via the shared `Dropdown`
 * (a 55-chip FilterChip group would be unusable and each chip would select
 * exactly one idiom). Eras are compact (7) and distribute meaningfully, so they
 * render as FilterChips. Both filter server-side via `?theme=` / `?era=`.
 */
import { Dropdown, FilterChip, SearchInput } from "shared/components";
import { CHENGYU_ERAS, CHENGYU_THEMES } from "../constants";
import "./ChengyuFilterBar.css";

export interface ChengyuFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  theme: string | null;
  onThemeChange: (theme: string | null) => void;
  era: string | null;
  onEraChange: (era: string | null) => void;
}

export function ChengyuFilterBar({
  search,
  onSearchChange,
  theme,
  onThemeChange,
  era,
  onEraChange,
}: ChengyuFilterBarProps) {
  const themeOptions = [
    { value: null, label: "All themes" },
    ...CHENGYU_THEMES.map((value) => ({ value, label: value })),
  ];

  return (
    <div className="chengyu-filter-bar flex-col gap-sm">
      <SearchInput
        value={search}
        onChange={onSearchChange}
        placeholder="Search idioms by keyword, pinyin, or meaning..."
      />

      <div
        className="chengyu-filter-bar__row flex flex-wrap gap-sm items-center"
        role="group"
        aria-label="Filter by theme"
      >
        <span className="chengyu-filter-bar__label font-xs text-muted shrink-0">Theme</span>
        <Dropdown
          value={theme}
          onChange={onThemeChange}
          options={themeOptions}
          placeholder="All themes"
          ariaLabel="Filter by theme"
          id="chengyu-theme"
          className="chengyu-filter-bar__theme"
        />
      </div>

      <div
        className="chengyu-filter-bar__group flex flex-wrap gap-sm items-center"
        role="group"
        aria-label="Filter by era"
      >
        <span className="chengyu-filter-bar__label font-xs text-muted shrink-0">Era</span>
        {CHENGYU_ERAS.map((value) => (
          <FilterChip
            key={value}
            label={value}
            selected={value === era}
            onClick={() => onEraChange(value === era ? null : value)}
          />
        ))}
      </div>
    </div>
  );
}
