/**
 * @file components/FilterChip/FilterChip.tsx
 * @description Toggle chip for filter groups (e.g. HSK level, bookmark filter).
 * Selected state: token primary tint (.filter-chip--selected) + aria-pressed.
 * No-motion: color transitions only.
 */
import "./FilterChip.css";

export { FilterChip };

function FilterChip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={"filter-chip" + (selected ? " filter-chip--selected" : "")}
      onClick={onClick}
      aria-pressed={selected}
    >
      {label}
    </button>
  );
}
