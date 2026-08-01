/**
 * @file components/RadicalHub.tsx
 * @description Radical detail hub — rendered inside the shared LexicalHub dialog.
 * Story 19.2: Radical Detail Card
 * Story 21.x (visual wave): Registers `radical` in entityHubRegistry so radical
 * detail opens in the SAME dialog as other hubs (exactly one at a time).
 *
 * Always self-fetches via useRadicalById(entityId). Storybook stories pass an
 * optional `radical` prop to bypass the API call. The rendered body is the
 * shared RadicalDetailContent (same content as the standalone RadicalDetailCard).
 */

import { Box, ErrorScreen, Skeleton } from "shared/components";
import { useRadicalById } from "../hooks";
import { RadicalDetailContent } from "./RadicalDetailContent";
import type { RadicalData } from "../types";

export type RadicalHubProps = {
  /** Radical ID to fetch (e.g. "rad_0001"). */
  entityId: string;
  /** Optional label (glyph + pinyin) for display context. */
  entityLabel?: string | null;
  /** Pre-fetched radical data for Storybook mode (bypasses API call). */
  radical?: RadicalData;
};

export function RadicalHub({ entityId, radical: radicalProp }: RadicalHubProps) {
  // When radical prop is provided (Storybook mode), skip self-fetch
  const id = radicalProp ? null : entityId;

  const { data: radical, isLoading, isError: hasError } = useRadicalById(id);

  const radicalData = (radicalProp ?? radical) as RadicalData | null;

  // Error state
  if (hasError) {
    return (
      <ErrorScreen
        error="Failed to load radical details. Please try again."
        onRetry={() => {}}
        title="Unable to load radical"
      />
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div
        className="radical-hub flex-col gap-md p-md"
        role="status"
        aria-label="Loading radical details"
      >
        {/* Hero skeleton */}
        <div className="flex items-center gap-lg">
          <Skeleton variant="custom" width="72px" height="72px" className="radius-md" />
          <div className="flex-col gap-xs flex-1">
            <Skeleton variant="line" width="120px" height="16px" />
            <Skeleton variant="line" width="200px" height="18px" />
            <Skeleton variant="line" width="160px" height="14px" />
          </div>
        </div>
        {/* Info / characters skeleton */}
        <div className="flex justify-center p-md">
          <Skeleton variant="custom" height="120px" className="w-full radius-lg" />
        </div>
      </div>
    );
  }

  // No data fallback (radicalData is null and not loading)
  if (!radicalData) {
    return (
      <Box variant="card" padding="md" className="flex-center">
        <p className="font-sm text-tertiary m-0">No radical data available.</p>
      </Box>
    );
  }

  return <RadicalDetailContent radical={radicalData} />;
}
