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
      className={"filter-chip" + (selected ? " selected" : "")}
      onClick={onClick}
      aria-pressed={selected}
    >
      {label}
    </button>
  );
}
