/**
 * @file components/ProgressSummaryCard.tsx
 * @description The Progress page's ONE populated card — real numbers only
 * (rework-proposal §6). Presentational: props in, markup out, no hooks.
 *
 * Renders the two metrics the app can actually count today (foundation sections
 * completed, radicals memorized) and nothing else. There is deliberately no
 * streak / XP / badge row: those numbers do not exist in the API yet, and the
 * page this replaces printed a dev receipt in their place.
 */
import { Box, ProgressBar } from "shared/components";
import type { ProgressSummary } from "../hooks/useProgressSummary";

export type ProgressSummaryCardProps = {
  summary: ProgressSummary;
};

export function ProgressSummaryCard({ summary }: ProgressSummaryCardProps) {
  const { completedSections, totalSections, masteredRadicals } = summary;
  const ratio = totalSections > 0 ? completedSections / totalSections : 0;

  return (
    <Box variant="card-elevated" className="flex-col gap-md w-full">
      <h2 className="font-lg fw-600 text-primary m-0">Foundation progress</h2>
      <div className="flex-col gap-xs">
        <div className="flex-between gap-sm">
          <span className="font-sm text-secondary">
            Sections completed ({completedSections} of {totalSections})
          </span>
          <span className="font-sm fw-600 text-primary">{Math.round(ratio * 100)}%</span>
        </div>
        <ProgressBar value={ratio} aria-label="Foundation sections completed" />
      </div>
      <div className="flex-between gap-sm">
        <span className="font-sm text-secondary">Radicals memorized</span>
        <span className="font-sm fw-600 text-primary">{masteredRadicals}</span>
      </div>
    </Box>
  );
}
