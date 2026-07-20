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
      className={"filter-chip btn-base p-sm" + (selected ? " selected" : "")}
      onClick={onClick}
      aria-pressed={selected}
    >
      {label}
    </button>
  );
}
