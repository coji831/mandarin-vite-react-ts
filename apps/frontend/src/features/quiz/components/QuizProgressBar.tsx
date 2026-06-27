/**
 * QuizProgressBar.tsx
 * Phase 1 Gate Quiz — Score progress bar
 *
 * Shows current score vs total, progress fill, percentage,
 * and pass threshold warning line.
 */

type QuizProgressBarProps = {
  /** Current score (number of correct answers) */
  current: number;
  /** Total questions */
  total: number;
  /** Pass threshold as a fraction (0-1). Default 0.9 (90%). */
  passThreshold?: number;
};

/** Score progress bar with pass threshold */
export function QuizProgressBar({ current, total, passThreshold = 0.9 }: QuizProgressBarProps) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  const thresholdPct = Math.round(passThreshold * 100);
  const passed = pct >= thresholdPct;
  const needCorrect = Math.ceil(total * passThreshold);

  return (
    <div className="card-dark flex-col gap-sm">
      {/* Track with fill */}
      <div className="quiz-progress__track bg-surface-dark-alt radius-pill">
        <div className="quiz-progress__fill" style={{ width: `${Math.min(pct, 100)}%` }} />
        {/* Threshold line — position based on passThreshold */}
        <div
          className="quiz-progress__threshold"
          style={{ left: `${thresholdPct}%` }}
          title={`Pass threshold (${thresholdPct}%)`}
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
