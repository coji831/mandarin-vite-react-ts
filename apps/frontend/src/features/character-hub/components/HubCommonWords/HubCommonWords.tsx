/**
 * @file HubCommonWords.tsx
 * @description Character Detail Hub — South zone: common word chips
 *
 * Displays clickable word chips for common compound words containing this character.
 * Each chip navigates to word detail (future feature).
 * Supports loading skeleton state.
 * Fetches detail data independently via useCharacterDetail hook.
 */

import { Button, Skeleton } from "shared/components";
import { useCharacterDetail } from "../../hooks";

export type HubCommonWordsProps = {
  commonWords?: string[];
  loading?: boolean;
  glyph?: string;
};

export function HubCommonWords({
  commonWords: propWords,
  loading: propLoading,
  glyph,
}: HubCommonWordsProps) {
  const { data } = useCharacterDetail(glyph ?? "");

  // Use prop data if provided (Storybook), otherwise self-fetched data
  const commonWords = propWords ?? data?.commonWords ?? null;
  const loading = propLoading ?? (!propWords && glyph && !data);

  if (loading) {
    return (
      <div className="w-full items-center flex-col gap-sm" role="status" aria-label="Loading words">
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
