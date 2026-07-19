/**
 * FilterControls Component — Generic dropdown filter pair
 *
 * Two side-by-side dropdown selectors. Fully generic — accepts any arrays of options.
 * No business domain dependencies.
 */
import "./FilterControls.css";

export type FilterOption = { value: string | number | null; label: string };

export type FilterControlsProps = {
  filters: Array<{
    id: string;
    label: string;
    value: string | number | null | undefined;
    options: FilterOption[];
    onChange: (value: string | number | null) => void;
  }>;
};

export function FilterControls({ filters }: FilterControlsProps) {
  return (
    <div className="filter-controls flex gap-md flex-wrap">
      {filters.map((filter) => (
        <div key={filter.id} className="flex-col gap-xs">
          <label htmlFor={`filter-${filter.id}`} className="font-xs text-muted">
            {filter.label}
          </label>
          <select
            id={`filter-${filter.id}`}
            className="filter-controls__select radius-md text-secondary font-sm cursor-pointer p-xs border-1 border-surface bg-surface-dark-alt focus:border-primary"
            value={String(filter.value ?? "")}
            onChange={(e) => {
              const val = e.target.value;
              filter.onChange(val === "" ? null : val);
            }}
            aria-label={filter.label}
          >
            {filter.options.map((opt) => (
              <option key={String(opt.value)} value={String(opt.value ?? "")}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}
