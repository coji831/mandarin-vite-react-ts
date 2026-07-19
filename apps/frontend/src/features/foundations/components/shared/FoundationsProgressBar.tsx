/**
 * @file components/FoundationsProgressBar.tsx
 * @description Progress indicator for foundations sections
 * Story 18.1: Foundations Page Structure
 *
 * Displays "X of 4 sections completed" with a visual progress bar.
 * Reuses the existing shared ProgressBar component.
 */

import { Box, ProgressBar } from "shared/components";
import { useFoundationsProgress } from "../../hooks/useFoundationsProgress";

export function FoundationsProgressBar() {
  // Temporarily hidden — progress tracking disabled
  return null;
  const { completedCount, totalSections, isLoading } = useFoundationsProgress();

  if (isLoading) {
    return (
      <div className="foundations-progress-loading font-italic text-muted font-sm">
        Loading progress...
      </div>
    );
  }

  return (
    <Box variant="surface" padding="md" className="foundations-progress-bar flex-col gap-sm">
      <div className="foundations-progress-text text-secondary font-sm">
        {completedCount} of {totalSections} sections completed
      </div>
      <ProgressBar value={completedCount / totalSections} />
    </Box>
  );
}
