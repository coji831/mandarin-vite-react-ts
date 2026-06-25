/**
 * @file components/FoundationsProgressBar.tsx
 * @description Progress indicator for foundations sections
 * Story 18.1: Foundations Page Structure
 *
 * Displays "X of 4 sections completed" with a visual progress bar.
 * Reuses the existing shared ProgressBar component.
 */

import { ProgressBar } from "shared/components/ProgressBar/ProgressBar";
import { useFoundationsProgress } from "../../hooks/useFoundationsProgress";

export function FoundationsProgressBar() {
  const { completedCount, totalSections, isLoading } = useFoundationsProgress();

  if (isLoading) {
    return (
      <div className="foundations-progress-loading font-italic text-muted font-sm">
        Loading progress...
      </div>
    );
  }

  return (
    <div className="foundations-progress-bar bg-surface-dark radius-md flex-col p-md gap-sm">
      <div className="foundations-progress-text text-secondary font-sm">
        {completedCount} of {totalSections} sections completed
      </div>
      <ProgressBar current={completedCount} total={totalSections} />
    </div>
  );
}
