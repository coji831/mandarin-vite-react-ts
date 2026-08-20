/**
 * CategoryBreakdown.tsx
 * Phase 1 Gate Quiz — Per-category score breakdown
 *
 * Computes and displays Pinyin recognition and Tone identification
 * scores from the answers array. Renders two visual bars with
 * score, percentage, and category name.
 */

import { Box } from "shared/components";
import { normalizePinyinForComparison, areTonesEquivalent } from "@mandarin/shared-utils";
import type { AnswerResult, CategoryBreakdown as CategoryBreakdownData } from "../../types";

type CategoryBreakdownProps = {
  answers: AnswerResult[];
  /** Authoritative per-category correct counts returned by the backend on completion. */
  categoryBreakdown?: CategoryBreakdownData;
  /** Total questions — used as the denominator alongside the backend breakdown. */
  total?: number;
};

/** Compute per-category scores from the answers array (fallback when no backend breakdown). */
function computeScores(answers: AnswerResult[]) {
  const total = answers.length;
  // Grading parity: the stored correct pinyin may be digit-suffixed ("ba1") or
  // tone-marked ("bā") while the learner typed plain pinyin ("ba") — canonical
  // compare strips marks + trailing digits. Tones use equivalence (neutral 0≡5).
  const pinyinCorrect = answers.filter(
    (a) =>
      normalizePinyinForComparison(a.userPinyin) === normalizePinyinForComparison(a.correctPinyin),
  ).length;
  const toneCorrect = answers.filter((a) => areTonesEquivalent(a.userTone, a.correctTone)).length;
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
export function CategoryBreakdown({ answers, categoryBreakdown, total }: CategoryBreakdownProps) {
  // Prefer the authoritative backend breakdown (each question attributed to a
  // category; sum === totalScore). Fall back to local answers-based computation
  // when the backend result is unavailable (e.g. guest mode / no attempt).
  const useBackend = categoryBreakdown != null && (total ?? 0) > 0;

  let pinyinCorrect: number;
  let toneCorrect: number;
  let denominator: number;

  if (useBackend) {
    pinyinCorrect = categoryBreakdown.pinyin;
    toneCorrect = categoryBreakdown.tones;
    denominator = total ?? answers.length;
  } else {
    const local = computeScores(answers);
    pinyinCorrect = local.pinyinCorrect;
    toneCorrect = local.toneCorrect;
    denominator = local.total;
  }

  if (denominator === 0) return null;

  return (
    <Box variant="dark" padding="md" className="flex-col gap-md quiz-breakdown__card">
      <h3 className="quiz-breakdown__heading font-lg text-primary m-0">📊 Category Breakdown</h3>

      <CategoryBar
        label="Pinyin recognition"
        correct={pinyinCorrect}
        total={denominator}
        color="var(--color-primary-light)"
      />

      <CategoryBar
        label="Tone identification"
        correct={toneCorrect}
        total={denominator}
        color="var(--color-warning)"
      />
    </Box>
  );
}
