/**
 * @file MeasureWordSection.tsx
 * @description Measure words (量词) section for WordHub. Displays the measure
 * words that pair with the current noun. Each measure word renders as a
 * selectable chip; selecting one reveals its meaning, example sentence, and
 * usage note.
 *
 * Story 21.8: Measure Word Foundation — frontend display
 *
 * Self-fetches via useMeasureWords(wordId). Storybook/static mode passes
 * `measureWords` directly to bypass the API call (mirrors WordHub's `word` prop).
 * Section is conditionally rendered — words with no measure words show nothing.
 */

import { useState } from "react";
import { Box, Button, Chip, Skeleton } from "shared/components";
import type { MeasureWord } from "../services";
import { useMeasureWords } from "../hooks";
import "./WordHub.css";

interface MeasureWordSectionProps {
  /** Internal word ID (e.g., "w_00284") used to fetch measure words. */
  wordId?: string | null;
  /** Pre-fetched measure words (Storybook/static mode — bypasses fetch). */
  measureWords?: MeasureWord[];
}

export function MeasureWordSection({
  wordId,
  measureWords: measureWordsProp,
}: MeasureWordSectionProps) {
  // In static mode (measureWords prop provided) we skip the self-fetch.
  const fetchWordId = measureWordsProp ? null : (wordId ?? null);
  const { data, isLoading, isError, refetch } = useMeasureWords(fetchWordId);
  const measureWords = measureWordsProp ?? data?.measureWords ?? [];

  // Selected detail; defaults to the canonical measure word (isDefault) or the first.
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected =
    (selectedId != null && measureWords.find((mw) => mw.id === selectedId)) ||
    measureWords.find((mw) => mw.isDefault) ||
    measureWords[0];

  // Nothing to fetch and nothing to show.
  if (!wordId && !measureWordsProp) return null;

  // Loading state — matches WordHub skeleton pattern.
  if (isLoading) {
    return (
      <div className="flex-col gap-sm" role="status" aria-label="Loading measure words">
        <Skeleton variant="line" width="140px" height="16px" />
        <div className="flex-row flex-wrap gap-sm">
          <Skeleton variant="custom" width="88px" height="34px" className="radius-pill" />
          <Skeleton variant="custom" width="88px" height="34px" className="radius-pill" />
        </div>
      </div>
    );
  }

  // Error state — inline with retry (functional refetch).
  if (isError) {
    return (
      <div className="flex-col gap-sm" role="alert">
        <span className="font-sm text-tertiary fw-600">Measure words</span>
        <Box variant="surface" padding="sm" className="flex-between gap-sm">
          <p className="font-sm text-secondary m-0">Failed to load measure words.</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={refetch}
            aria-label="Retry loading measure words"
          >
            Retry
          </Button>
        </Box>
      </div>
    );
  }

  // Non-noun words (or words without curated pairs) — section hidden.
  if (measureWords.length === 0) return null;

  const handleSelect = (id: string) => setSelectedId((current) => (current === id ? null : id));

  return (
    <div className="flex-col gap-sm">
      <span className="font-sm text-tertiary fw-600">Measure words</span>
      <div className="flex-row flex-wrap gap-sm">
        {measureWords.map((mw) => (
          <Chip
            key={mw.id}
            variant="surface"
            interactive
            active={selected?.id === mw.id}
            onClick={() => handleSelect(mw.id)}
            ariaLabel={`Measure word: ${mw.simplified}`}
            className="h-auto py-xs flex-col items-center bg-surface-light-5"
          >
            <span className="font-lg fw-600">{mw.simplified}</span>
            <span className="font-xs text-tertiary">{mw.pinyin}</span>
            {mw.category && <span className="font-xs text-muted">{mw.category}</span>}
          </Chip>
        ))}
      </div>

      {selected && (
        <Box variant="surface" padding="sm" className="flex-col gap-xs">
          <div className="flex-between gap-sm">
            <span className="font-md fw-600">
              {selected.simplified} {selected.pinyin}
            </span>
            {selected.isDefault && (
              <Chip interactive={false} variant="primary" size="sm" label="default" />
            )}
          </div>
          {selected.meaning && <p className="font-sm text-secondary m-0">{selected.meaning}</p>}
          {selected.exampleSentence && (
            <p className="font-sm text-tertiary m-0">
              <span className="fw-600">Example: </span>
              {selected.exampleSentence}
            </p>
          )}
          {selected.usageNote && (
            <p className="font-sm text-tertiary m-0">
              <span className="fw-600">Usage: </span>
              {selected.usageNote}
            </p>
          )}
        </Box>
      )}
    </div>
  );
}
