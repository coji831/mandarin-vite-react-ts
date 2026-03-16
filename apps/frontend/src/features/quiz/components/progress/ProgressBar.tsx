/**
 * ProgressBar Component
 * Component Reorganization: Renamed from QuizProgressBar
 * Story 15.10: CSS Cleanup - Uses progress utilities from globals.css
 *
 * Displays quiz progress: "X / Y completed" with visual bar
 */

type ProgressBarProps = {
  current: number;
  total: number;
};

export function ProgressBar({ current, total }: ProgressBarProps) {
  const percentage = (current / total) * 100;

  return (
    <div className="progress-container flex-col w-full">
      <div className="progress-text text-center">
        {current} / {total}
      </div>
      <div className="progress-bar w-full">
        <div className="progress-fill" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}
