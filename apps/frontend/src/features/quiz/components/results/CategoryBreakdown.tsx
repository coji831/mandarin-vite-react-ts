/**
 * CategoryBreakdown.tsx
 * Phase 1 Gate Quiz — Per-category score breakdown
 *
 * Computes and displays Pinyin recognition and Tone identification
 * scores from the answers array. Renders two visual bars with
 * score, percentage, and category name.
 */

import { Box } from "shared/components";
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
      <div className="quiz-breakdown__label text-primary font-sm flex-between">
        <span>{label}</span>
        <span>
          {correct}/{total} ({pct}%)
        </span>
      </div>

      {/* Bar background */}
      <div className="quiz-breakdown__track bg-surface-dark-alt radius-pill w-full overflow-hidden h-8px">
        {/* Bar fill */}
        <div
          className="quiz-breakdown__fill radius-pill h-full"
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
    <Box variant="dark" padding="md" className="flex-col gap-md" style={{ minWidth: 320 }}>
      <h3 className="quiz-breakdown__heading font-lg text-primary m-0">📊 Category Breakdown</h3>

      <CategoryBar
        label="Pinyin recognition"
        correct={pinyinCorrect}
        total={total}
        color="var(--color-primary-light)"
      />

      <CategoryBar
        label="Tone identification"
        correct={toneCorrect}
        total={total}
        color="var(--color-warning)"
      />
    </Box>
  );
}
