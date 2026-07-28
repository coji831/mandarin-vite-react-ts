/**
 * @file ReadersPage.tsx
 * @description Page-level container for Graded Readers feature.
 * Story 21.4: Reading UI + LexicalHub Phase 1
 * Phase 4: Migrated popover state, mode, and passageId to readingStore.
 *
 * Uses a single code path: always fetches data via hooks, always writes to
 * readingStore. Storybook stories use MSW handlers + withReadingStore decorator
 * instead of prop overrides.
 *
 * Switches between ReaderLibrary (library view) and ReadingView (reading mode).
 *
 * Decision: The `mode` prop sets initial mode; after that, readingStore.setMode
 * handles transitions (library ↔ reading). The prop is kept for SSR/mount parity.
 */
import { useState, useCallback } from "react";
import { Box } from "shared/components";
import {
  ReaderLibrary,
  ReadingView,
  SentenceDisplay,
  WordPopover,
  usePassages,
  usePassageDetail,
  useGeneratePassage,
} from "../../../features/readers";
import { useReadingStore } from "../../../features/readers/stores";

export type ReadersPageMode = "library" | "reading";

export type ReadersPageProps = {
  /** Initial mode. After mount, readingStore.setMode handles transitions. */
  mode: ReadersPageMode;
};

// ─── Component ────────────────────────────────────────────────────────────

export function ReadersPage({ mode: modeProp }: ReadersPageProps) {
  // Store selectors (reading session state)
  const currentPassageId = useReadingStore((s) => s.currentPassageId);
  const storeMode = useReadingStore((s) => s.mode);
  const popover = useReadingStore((s) => s.popover);
  const openPopover = useReadingStore((s) => s.openPopover);
  const setPassageId = useReadingStore((s) => s.setPassageId);
  const setMode = useReadingStore((s) => s.setMode);

  // Internal state — HSK level filter (local, not session state)
  const [internalLevel, setInternalLevel] = useState<number | null>(null);

  // Production-only: passage generation hook
  const { isGenerating, generate: generatePassage } = useGeneratePassage();

  // Mode: store takes precedence after user action, otherwise use prop for initial mount
  const mode = storeMode === "reading" ? "reading" : modeProp;

  // Level: internal (from HSK chip click) takes precedence
  const selectedLevel = internalLevel;

  // Hooks for data fetching
  const {
    passages,
    isLoading: libLoading,
    hasError: libError,
    isEmpty: libEmpty,
    retry: libRetry,
  } = usePassages(selectedLevel ?? undefined);

  const {
    passage,
    isLoading: readLoading,
    hasError: readError,
    retry: readRetry,
  } = usePassageDetail(currentPassageId);

  // Handlers
  const handleLevelChange = (level: number | null) => {
    setInternalLevel(level);
  };

  const handleSelectPassage = (id: string) => {
    setPassageId(id);
    setMode("reading");
  };

  const handleBack = () => {
    setPassageId(null);
    setMode("library");
  };

  const handlePopoverOpen = (glyph: string, rect: DOMRect) => {
    openPopover(glyph, rect);
  };

  const handleGeneratePassage = useCallback(() => {
    generatePassage(selectedLevel ?? undefined);
  }, [generatePassage, selectedLevel]);

  return (
    <Box variant="dark" padding="md" className="readers-page flex-col gap-md">
      {/* Page title */}
      <h2 className="font-2xl fw-700 text-primary m-0">Graded Readers</h2>

      {mode === "library" && (
        <ReaderLibrary
          passages={passages}
          selectedLevel={selectedLevel}
          onLevelChange={handleLevelChange}
          onSelectPassage={handleSelectPassage}
          isLoading={libLoading}
          isEmpty={libEmpty}
          hasError={libError}
          onRetry={libRetry}
          onGeneratePassage={handleGeneratePassage}
        />
      )}

      {mode === "reading" && passage && (
        <ReadingView
          passage={passage}
          onBack={handleBack}
          isLoading={readLoading}
          hasError={readError}
          onRetry={readRetry}
        >
          {passage.sentences.flatMap((sentence, idx) => [
            <SentenceDisplay
              key={sentence.index}
              sentence={sentence}
              onPopoverOpen={handlePopoverOpen}
            />,
            ...(idx < passage.sentences.length - 1
              ? [<Box key={`divider-${sentence.index}`} variant="divider" />]
              : []),
          ])}
        </ReadingView>
      )}

      {/* WordPopover — reads glyph and position from readingStore */}
      {popover.glyph && <WordPopover />}
    </Box>
  );
}
