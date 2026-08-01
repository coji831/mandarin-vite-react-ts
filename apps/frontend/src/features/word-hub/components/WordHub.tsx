/**
 * @file WordHub.tsx
 * @description Word detail panel: pinyin, definitions (polysemy), HSK badge,
 * constituent characters as clickable chips.
 * Story 21.4: Reading UI + LexicalHub Phase 1
 * Story 21.7: Phase 3 — self-fetches data via useWordDetail hook
 *
 * Always self-fetches via useWordDetail(entityId) hook. Storybook stories use
 * MSW handlers to mock the API response.
 */
import { extractTone, getToneClass } from "features/character-hub";
import { Badge, Box, ErrorScreen, Skeleton } from "shared/components";
import { useWordDetail } from "../hooks";
import { ConstituentCharacterChips } from "./ConstituentCharacterChips";
import { DefinitionList } from "./DefinitionList";
import { MeasureWordSection } from "./MeasureWordSection";
import "./WordHub.css";

export type WordDetail = {
  /** Internal word ID (e.g., "w_00284") — used to look up measure words. */
  id?: string;
  glyph: string;
  pinyin: string;
  definitions: string[];
  hskLevel?: number;
  constituentCharacters: Array<{ glyph: string; pinyin: string; meaning: string }>;
};

export type WordHubProps = {
  /** Glyph to fetch. */
  entityId: string;
  /** Optional label (pinyin) for display context. */
  entityLabel?: string | null;
  /** Pre-fetched word data for Storybook mode (bypasses API call). */
  word?: WordDetail;
};

export function WordHub({ entityId, word: wordProp }: WordHubProps) {
  // When word prop is provided (Storybook mode), skip self-fetch
  const glyph = wordProp ? null : entityId;

  // Self-fetch word detail (returns null/no-op when glyph is null)
  const { data: word, isLoading, isError: hasError } = useWordDetail(glyph);

  // Use provided word prop if available, otherwise use fetched data
  const wordData = (wordProp ?? word) as WordDetail | null;

  // Error state
  if (hasError) {
    return (
      <ErrorScreen
        error="Failed to load word details. Please try again."
        onRetry={() => {}}
        title="Unable to load word"
      />
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div
        className="word-hub flex-col gap-md p-md"
        role="status"
        aria-label="Loading word details"
      >
        {/* Hero skeleton */}
        <div className="flex-col items-center gap-sm">
          <Skeleton variant="custom" width="80px" height="48px" className="radius-md" />
          <Skeleton variant="line" width="120px" height="16px" />
        </div>
        {/* HSK badge skeleton */}
        <div className="flex-center">
          <Skeleton variant="custom" width="60px" height="24px" className="radius-pill" />
        </div>
        {/* Definitions skeleton */}
        <div className="flex-col gap-xs">
          <Skeleton variant="line" width="100%" height="14px" />
          <Skeleton variant="line" width="80%" height="14px" />
          <Skeleton variant="line" width="60%" height="14px" />
        </div>
        {/* Characters skeleton */}
        <div className="flex-col gap-sm">
          <Skeleton variant="line" width="160px" height="16px" />
          <div className="flex flex-wrap gap-xs">
            <Skeleton variant="custom" width="80px" height="32px" className="radius-pill" />
            <Skeleton variant="custom" width="80px" height="32px" className="radius-pill" />
          </div>
        </div>
      </div>
    );
  }

  // No data fallback (wordData is null and not loading)
  if (!wordData) {
    return (
      <Box variant="card" padding="md" className="flex-center">
        <p className="font-sm text-tertiary m-0">No word data available.</p>
      </Box>
    );
  }

  /**
   * Render pinyin with per-syllable tone coloring.
   * Splits on space so each syllable gets its own tone class.
   */
  const renderToneColoredPinyin = (pinyin: string) => {
    const syllables = pinyin.split(" ");
    return syllables.map((syllable, idx) => {
      const tone = extractTone(syllable);
      return (
        <span key={idx} className={getToneClass(tone)}>
          {syllable}
          {idx < syllables.length - 1 && <>&nbsp;</>}
        </span>
      );
    });
  };

  return (
    <Box variant="card" padding="md" className="word-hub w-full flex-col gap-md animate-fade-in">
      {/* Hero row: glyph + pinyin + HSK badge */}
      <div className="word-hub__hero-row flex-row items-center gap-sm">
        <div className="word-hub__hero flex-row items-center gap-sm py-md">
          <span className="word-hub__glyph font-4xl fw-700 text-primary lh-1 block">
            {wordData.glyph}
          </span>
          <span className="word-hub__pinyin font-md">
            {renderToneColoredPinyin(wordData.pinyin)}
          </span>
        </div>

        {/* HSK badge — next to hero glyph/pinyin */}
        {wordData.hskLevel && (
          <Badge className="shrink-0">HSK {wordData.hskLevel}</Badge>
        )}
      </div>

      <Box variant="divider" />

      {/* Definitions (polysemy — numbered) */}
      <Box variant="surface" padding="sm" className="word-hub__definitions flex-col gap-xs">
        <h4 className="font-sm fw-600 text-secondary m-0">Definitions</h4>
        <DefinitionList definitions={wordData.definitions} />
      </Box>

      {/* Constituent characters */}
      <ConstituentCharacterChips characters={wordData.constituentCharacters} />

      {/* Measure words (量词) — Story 21.8. key remounts section on word change. */}
      <MeasureWordSection key={wordData.id ?? "word"} wordId={wordData.id} />
    </Box>
  );
}
