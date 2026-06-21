/**
 * QuizProgressBar.tsx
 * Phase 1 Gate Quiz — Score progress bar
 *
 * Shows current score vs total, progress fill, percentage,
 * and pass threshold warning line at 90%.
 */

interface QuizProgressBarProps {
  /** Current score (number of correct answers) */
  current: number;
  /** Total questions */
  total: number;
}

/** Score progress bar with pass threshold */
export function QuizProgressBar({ current, total }: QuizProgressBarProps) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  const threshold = 90;
  const passed = pct >= threshold;
  const needCorrect = Math.ceil(total * 0.9);

  return (
    <div className="card-dark flex-col gap-sm">
      {/* Track with fill */}
      <div className="quiz-progress__track bg-surface-dark-alt radius-pill">
        <div className="quiz-progress__fill" style={{ width: `${Math.min(pct, 100)}%` }} />
        {/* Threshold line at 90% */}
        <div
          className="quiz-progress__threshold"
          style={{ left: `${threshold}%` }}
          title="Pass threshold (90%)"
        />
      </div>

      {/* Stats row */}
      <div className="quiz-progress__stats flex-between gap-sm font-sm">
        <span className="text-secondary fw-600">
          {current}/{total} correct ({pct}%)
        </span>
        {!passed && (
          <span style={{ color: "var(--color-warning)", fontWeight: 500 }}>
            ⚠️ Need {needCorrect}/{total} to pass
          </span>
        )}
        {passed && (
          <span style={{ color: "var(--color-success)", fontWeight: 600 }}>✅ Passing</span>
        )}
      </div>
    </div>
  );
}
