/**
 * CategoryBreakdown.tsx
 * Phase 1 Gate Quiz — Per-category score breakdown
 *
 * Computes and displays Pinyin recognition and Tone identification
 * scores from the answers array. Renders two visual bars with
 * score, percentage, and category name.
 */

import type { AnswerResult } from "../../types/engine";

type CategoryBreakdownProps = {
  answers: AnswerResult[];
};

/** Compute per-category scores from the answers array */
function computeScores(answers: AnswerResult[]) {
  const total = answers.length;
  const pinyinCorrect = answers.filter(
    (a) => a.userPinyin.trim().toLowerCase() === a.correctPinyin.trim().toLowerCase(),
  ).length;
  const toneCorrect = answers.filter((a) => a.userTone === a.correctTone).length;
  return { pinyinCorrect, toneCorrect, total };
}

/** Single category bar */
function CategoryBar({
  label,
  correct,
  total,
  color,
}: {
  label: string;
  correct: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  return (
    <div className="flex-col gap-xs w-full">
      {/* Label row */}
      <div className="quiz-breakdown__label text-primary font-sm flex">
        <span>{label}</span>
        <span>
          {correct}/{total} ({pct}%)
        </span>
      </div>

      {/* Bar background */}
      <div className="quiz-breakdown__track bg-surface-dark-alt radius-pill w-full overflow-hidden">
        {/* Bar fill */}
        <div
          className="quiz-breakdown__fill radius-pill"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

/** Category breakdown component */
export function CategoryBreakdown({ answers }: CategoryBreakdownProps) {
  const { pinyinCorrect, toneCorrect, total } = computeScores(answers);

  if (total === 0) return null;

  return (
    <div className="card-dark flex-col gap-md p-md" style={{ minWidth: 320 }}>
      <h3 className="quiz-breakdown__heading font-lg text-primary m-0">📊 Category Breakdown</h3>

      <CategoryBar
        label="Pinyin recognition"
        correct={pinyinCorrect}
        total={total}
        color="var(--accent-primary)"
      />

      <CategoryBar
        label="Tone identification"
        correct={toneCorrect}
        total={total}
        color="var(--accent-warning)"
      />
    </div>
  );
}
