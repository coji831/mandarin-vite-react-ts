/**
 * FilterDropdown Component
 *
 * Two dropdown selectors: HSK level (1-6 + All) and Phase (1-4 + All).
 * Story 17.7: Content Browser Infrastructure.
 *
 * Usage:
 * ```tsx
 * <FilterDropdown
 *   selectedHskLevel={hskLevel}
 *   onHskLevelChange={setHskLevel}
 *   selectedPhase={phase}
 *   onPhaseChange={setPhase}
 * />
 * ```
 */

export { FilterDropdown };

function FilterDropdown({
  selectedHskLevel,
  onHskLevelChange,
  selectedPhase,
  onPhaseChange,
}: {
  selectedHskLevel: number | undefined;
  onHskLevelChange: (level: number | undefined) => void;
  selectedPhase: number | undefined;
  onPhaseChange: (phase: number | undefined) => void;
}) {
  return (
    <div className="filter-dropdown">
      <div className="filter-dropdown__group">
        <label htmlFor="hsk-level-select" className="filter-dropdown__label">
          HSK Level
        </label>
        <select
          id="hsk-level-select"
          className="filter-dropdown__select"
          value={selectedHskLevel ?? ""}
          onChange={(e) => {
            const val = e.target.value;
            onHskLevelChange(val === "" ? undefined : Number(val));
          }}
          aria-label="HSK Level filter"
        >
          <option value="">All</option>
          {[1, 2, 3, 4, 5, 6].map((level) => (
            <option key={level} value={level}>
              HSK {level}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-dropdown__group">
        <label htmlFor="phase-select" className="filter-dropdown__label">
          Phase
        </label>
        <select
          id="phase-select"
          className="filter-dropdown__select"
          value={selectedPhase ?? ""}
          onChange={(e) => {
            const val = e.target.value;
            onPhaseChange(val === "" ? undefined : Number(val));
          }}
          aria-label="Phase filter"
        >
          <option value="">All</option>
          {[1, 2, 3, 4].map((phase) => (
            <option key={phase} value={phase}>
              Phase {phase}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
