/**
 * @file HubCommonWords.tsx
 * @description Character Detail Hub — South zone: common word chips
 *
 * Displays clickable word chips for common compound words containing this character.
 * Each chip navigates to word detail (future feature).
 * Supports loading skeleton state.
 */

import { Button, Skeleton } from "shared/components";

export type HubCommonWordsProps = {
  commonWords?: string[];
  loading?: boolean;
};

export function HubCommonWords({ commonWords, loading }: HubCommonWordsProps) {
  if (loading) {
    return (
      <div className="w-full items-center flex-col gap-sm" role="status" aria-label="Loading words">
        <h3 className="font-sm text-secondary text-uppercase tracking-wide m-0">Common Words</h3>
        <div className="flex flex-wrap gap-xs">
          <Skeleton variant="custom" className="hub-word-skeleton radius-pill" aria-hidden="true" />
          <Skeleton variant="custom" className="hub-word-skeleton radius-pill" aria-hidden="true" />
          <Skeleton variant="custom" className="hub-word-skeleton radius-pill" aria-hidden="true" />
        </div>
      </div>
    );
  }

  if (!commonWords || commonWords.length === 0) return null;

  return (
    <div className="w-full items-center flex-col gap-sm">
      <h3 className="font-sm text-secondary text-uppercase tracking-wide m-0">Common Words</h3>
      <div className="flex flex-wrap gap-xs">
        {commonWords.map((word) => (
          <Button
            key={word}
            variant="tag"
            size="sm"
            className="hub-word-chip font-sm"
            title={`View details for ${word}`}
            aria-label={`View word: ${word}`}
          >
            {word}
          </Button>
        ))}
      </div>
    </div>
  );
}
