/**
 * @file ReadersPage.tsx
 * @description Page-level container for Graded Readers feature.
 * Phase 2: Audio props wiring removed — AudioControlBar rendered inside ReadingView,
 *   SentenceDisplay reads audioStore directly, useAudioPlayer orchestrator replaces
 *   useSentenceAudio + useAudioAutoAdvance + useAudioEngine + useBrowserTTS.
 * Story 21.7: Reading Progress — integrates readingStore progress state with
 *   ReaderLibrary and ReadingView.
 *
 * Uses a single code path: always fetches data via hooks, always writes to
 * readingStore. Storybook stories use MSW handlers + withReadingStore decorator
 * instead of prop overrides.
 *
 * Decision: The `mode` prop sets initial mode; after that, readingStore.setMode
 * handles transitions (library ↔ reading). The prop is kept for SSR/mount parity.
 */
import { useState, useCallback, useEffect } from "react";
import { Box } from "shared/components";
import {
  ReaderLibrary,
  ReadingView,
  SentenceDisplay,
  WordPopover,
  usePassages,
  usePassageDetail,
  useGeneratePassage,
  usePassageAudio,
  useAudioPlayer,
  useReadingStore,
} from "../../../features/readers";
import { useAuth } from "../../../features/auth";

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

  // Story 21.7: Progress selectors
  const completedPassages = useReadingStore((s) => s.completedPassages);
  const bookmarkedPassages = useReadingStore((s) => s.bookmarkedPassages);
  const setCurrentSentence = useReadingStore((s) => s.setCurrentSentence);
  const markCompleted = useReadingStore((s) => s.markCompleted);
  const fetchBookmarks = useReadingStore((s) => s.fetchBookmarks);
  const toggleBookmark = useReadingStore((s) => s.toggleBookmark);
  const setIsAuthenticated = useReadingStore((s) => s.setIsAuthenticated);

  // Auth context
  const { isAuthenticated } = useAuth();

  // Internal state — HSK level filter (local, not session state)
  const [internalLevel, setInternalLevel] = useState<number | null>(null);
  // Story 21.7: Bookmark filter state
  const [bookmarkFilter, setBookmarkFilter] = useState<"all" | "bookmarked">("all");

  // Sync auth state to readingStore
  useEffect(() => {
    setIsAuthenticated(isAuthenticated);
  }, [isAuthenticated, setIsAuthenticated]);

  // Fetch bookmarks on library mount (authenticated only)
  useEffect(() => {
    if (isAuthenticated) {
      fetchBookmarks();
    }
  }, [isAuthenticated, fetchBookmarks]);

  // Production-only: passage generation hook
  const { generate: generatePassage } = useGeneratePassage();

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

  // Audio — fetch URLs + flattened orchestrator
  usePassageAudio(mode === "reading" ? currentPassageId : null);
  const { hasJustCompleted, toggle, stop, setSpeed } = useAudioPlayer({
    sentenceCount: passage?.sentences.length ?? 0,
    sentenceTexts: passage?.sentences.map((s) => s.text) ?? [],
  });

  // Merge store progress state into passage summaries
  const passagesWithProgress = passages.map((p) => ({
    ...p,
    isCompleted: completedPassages.has(p.id),
    isBookmarked: bookmarkedPassages.has(p.id),
  }));

  // Handlers
  const handleLevelChange = (level: number | null) => {
    setInternalLevel(level);
  };

  const handleSelectPassage = (id: string) => {
    setPassageId(id);
    setMode("reading");
  };

  const handleBack = () => {
    setCurrentSentence(0);
    setPassageId(null);
    setMode("library");
  };

  /** Phase 2: Completion detection from audio hasJustCompleted signal. */
  useEffect(() => {
    if (hasJustCompleted && currentPassageId) {
      markCompleted(currentPassageId);
    }
  }, [hasJustCompleted, currentPassageId, markCompleted]);

  const handlePopoverOpen = (glyph: string, rect: DOMRect) => {
    openPopover(glyph, rect);
  };

  const handleGeneratePassage = useCallback(() => {
    generatePassage(selectedLevel ?? undefined);
  }, [generatePassage, selectedLevel]);

  /** Story 21.7: Bookmark toggle handler. */
  const handleBookmarkToggle = useCallback(
    (passageId: string) => {
      toggleBookmark(passageId);
    },
    [toggleBookmark],
  );

  return (
    <Box variant="dark" padding="md" className="readers-page flex-col gap-md">
      {/* Page title */}
      <h2 className="font-2xl fw-700 text-primary m-0">Graded Readers</h2>

      {mode === "library" && (
        <ReaderLibrary
          passages={passagesWithProgress}
          selectedLevel={selectedLevel}
          onLevelChange={handleLevelChange}
          onSelectPassage={handleSelectPassage}
          isLoading={libLoading}
          isEmpty={libEmpty}
          hasError={libError}
          onRetry={libRetry}
          onGeneratePassage={handleGeneratePassage}
          bookmarkFilter={bookmarkFilter}
          onBookmarkFilterChange={setBookmarkFilter}
          onBookmarkToggle={isAuthenticated ? handleBookmarkToggle : undefined}
        />
      )}

      {mode === "reading" && passage && (
        <ReadingView
          passage={passage}
          onBack={handleBack}
          isLoading={readLoading}
          hasError={readError}
          onRetry={readRetry}
          onTogglePlay={toggle}
          onStop={stop}
          onSpeedChange={setSpeed}
          // No onComplete prop — completion handled via hasJustCompleted effect
        >
          {passage.sentences.flatMap((sentence) => {
            const items: React.ReactNode[] = [
              <SentenceDisplay
                key={sentence.index}
                sentence={sentence}
                onPopoverOpen={handlePopoverOpen}
                // No currentAudioIndex or onSentenceTap — reads audioStore directly
              />,
            ];
            if (sentence.index < passage.sentences.length - 1) {
              items.push(<Box key={`divider-${sentence.index}`} variant="divider" />);
            }
            return items;
          })}
        </ReadingView>
      )}

      {/* WordPopover — reads glyph and position from readingStore */}
      {popover.glyph && <WordPopover />}
    </Box>
  );
}
