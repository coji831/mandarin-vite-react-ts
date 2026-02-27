/**
 * LeechWarning Component
 * Component Reorganization: Renamed from QuizLeechAlert
 * Story 15.10: Quiz UX Polish - Component Reorganization
 *
 * Displays warning banner for struggling words (leeches - 5+ consecutive failures).
 * Pure presentational component, only renders when leeches exist.
 * Uses .alert-warning utility from globals.css
 */

type LeechWarningProps = {
  leechCount: number;
};

export function LeechWarning({ leechCount }: LeechWarningProps) {
  if (leechCount === 0) return null;

  return (
    <div
      className="alert-warning text-center"
      style={{ marginTop: "var(--space-md)", fontSize: "var(--font-sm)" }}
    >
      ⚠️ {leechCount} struggling word{leechCount > 1 ? "s" : ""} detected
    </div>
  );
}
