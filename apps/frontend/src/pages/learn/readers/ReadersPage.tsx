/**
 * @file ReadersPage.tsx
 * @description Page-level container for Graded Readers feature.
 * Phase 2: Audio props wiring removed — AudioControlBar rendered inside ReadingView,
 *   SentenceDisplay reads audioStore directly.
 * Phase D1: Audio migrated onto the shared AudioManager — `useAudioManager`
 *   (sequence behavior + readers-owned passage audio behavior) replaces
 *   usePassageAudio + useAudioPlayer; AudioControlBar/SentenceDisplay read the
 *   shared presentational audio store; completion uses the manager's `completed`
 *   event (hasCompleted snapshot) instead of the one-shot hasJustCompleted flag.
 * Phase 0 (TTS detachment): the passage audio behavior is imported from the
 *   readers feature barrel (the behavior now lives in features/readers/audio);
 *   the shared/audio constants deep-import was replaced by the readers barrel.
 * Phase 2 (candidates-as-data): ReadersPage builds the passage `AudioBehavior`
 *   contract via `buildPassageAudioBehavior` and passes it to `useAudioManager`
 *   — the shared manager is a pure transport (no resolver concept).
 * Post-optionalAuth: `POST /v1/readers/passages/:id/audio` is optionalAuth —
 *   guests and users share ONE fetch path (no guest short-circuit; both get
 *   real signed URLs).
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
import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { Box } from "shared/components";
import { useAudioManager } from "shared/hooks";
import type { AudioBehavior, PlayableItem } from "shared/audio";
import {
  buildPassageAudioBehavior,
  ReaderLibrary,
  ReadingView,
  SentenceDisplay,
  WordPopover,
  usePassages,
  usePassageDetail,
  useGeneratePassage,
  useReadingStore,
} from "../../../features/readers";
import type { PlaybackSpeed } from "../../../features/readers";
import { useAuth } from "../../../features/auth";

export type ReadersPageMode = "library" | "reading";

export type ReadersPageProps = {
  /** Initial mode. After mount, readingStore.setMode handles transitions. */
  mode: ReadersPageMode;
};

/** Stable empty items reference for the non-reading (library) mount. */
const EMPTY_ITEMS: PlayableItem[] = [];

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
  const {
    generate: generatePassage,
    isGenerating,
    generatedId,
    hasError: generateError,
    reset: resetGenerate,
  } = useGeneratePassage();

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

  // Audio — shared AudioManager + readers-owned passage AUDIO BEHAVIOR (Phase D1 → 2)
  // The readers surface builds an `AudioBehavior` contract (sequence strategy;
  // sources = one PlayableItem per sentence; guests + users share ONE fetch path
  // — `POST /v1/readers/passages/:id/audio` is optionalAuth, both get real URLs)
  // and the shared manager plays it as a pure transport. Transport commands
  // replace the old usePassageAudio + useAudioPlayer hooks and the
  // pendingIndex / pendingSingleIndex store signals (play(index, mode)).
  const isReading = mode === "reading" && !!currentPassageId && !!passage;

  const audioBehavior = useMemo<AudioBehavior | undefined>(() => {
    if (!isReading || !passage || !currentPassageId) return undefined;
    return buildPassageAudioBehavior({
      passageId: currentPassageId,
      sentences: passage.sentences,
    });
  }, [isReading, passage, currentPassageId]);

  const audio = useAudioManager({
    behavior: audioBehavior,
    // Library mount → clear the manager's items (bumps playId → aborts any
    // in-flight reading session). Behavior path handles the reading mount.
    items: isReading ? undefined : EMPTY_ITEMS,
  });

  // Destructure the stable snapshot + commands so callbacks keep primitive deps.
  const { status: audioStatus, currentIndex: audioIndex, hasCompleted } = audio;
  const { play, pause, restart, stop, setRate } = audio;

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

  /** Transport: play/pause toggle via the shared manager (parity with old toggle). */
  const handleTogglePlay = useCallback(() => {
    if (audioStatus === "playing") {
      pause();
    } else if (audioStatus === "paused") {
      restart();
    } else {
      play();
    }
  }, [audioStatus, pause, restart, play]);

  const handleSpeedChange = useCallback(
    (speed: PlaybackSpeed) => {
      setRate(speed);
    },
    [setRate],
  );

  /** Per-sentence 🔊 → single-sentence play through the manager (no auto-advance). */
  const handleSentencePlay = useCallback(
    (index: number) => {
      play(index, "single");
    },
    [play],
  );

  /**
   * Completion detection: the old `hasJustCompleted` one-shot React state is
   * replaced by the manager's `completed` event, mirrored into the shared
   * audioStore `hasCompleted` snapshot. Idempotent (Set-based store dedupes).
   */
  useEffect(() => {
    if (hasCompleted && currentPassageId) {
      markCompleted(currentPassageId);
    }
  }, [hasCompleted, currentPassageId, markCompleted]);

  /**
   * Popover pause/resume (parity with old useAudioPlayer): pause while the word
   * popover is open, resume from the same sentence when it closes. The manager's
   * `restart()` (exposed by the hook) restarts playback at the current index —
   * the URL/TTS backends have no position-preserving resume, matching the old
   * `play(currentIndex)` resume behavior.
   */
  const wasPlayingBeforePopover = useRef(false);
  useEffect(() => {
    if (popover.glyph) {
      if (audioStatus === "playing") {
        wasPlayingBeforePopover.current = true;
        pause();
      }
    } else if (wasPlayingBeforePopover.current) {
      wasPlayingBeforePopover.current = false;
      if (audioIndex !== null) {
        restart();
      }
    }
  }, [popover.glyph, audioStatus, pause, restart, audioIndex]);

  /** Page Visibility API (parity with old useAudioPlayer): pause when hidden. */
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && audioStatus === "playing") {
        pause();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [audioStatus, pause]);

  // VisFix W6b: Refresh the library once a new passage has been generated, then
  // clear generatedId so a subsequent generation re-triggers this effect.
  useEffect(() => {
    if (!generatedId) return;
    libRetry();
    resetGenerate();
  }, [generatedId, libRetry, resetGenerate]);

  const handlePopoverOpen = (glyph: string, rect: DOMRect) => {
    openPopover(glyph, rect);
  };

  const handleGeneratePassage = useCallback(() => {
    generatePassage(selectedLevel ?? undefined);
  }, [generatePassage, selectedLevel]);

  /** VisFix W6b: Mark completed when the final sentence is reached. Idempotent —
   *  complements the audio hasJustCompleted path (Set-based store dedupes). */
  const handleComplete = useCallback(() => {
    if (currentPassageId) {
      markCompleted(currentPassageId);
    }
  }, [currentPassageId, markCompleted]);

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
          isGenerating={isGenerating}
          generateError={generateError}
          onRetryGenerate={handleGeneratePassage}
          bookmarkFilter={bookmarkFilter}
          onBookmarkFilterChange={setBookmarkFilter}
          onBookmarkToggle={isAuthenticated ? handleBookmarkToggle : undefined}
          isGuest={!isAuthenticated}
        />
      )}

      {mode === "reading" && passage && (
        <ReadingView
          passage={passage}
          onBack={handleBack}
          isLoading={readLoading}
          hasError={readError}
          onRetry={readRetry}
          onTogglePlay={handleTogglePlay}
          onStop={stop}
          onSpeedChange={handleSpeedChange}
          onComplete={handleComplete}
        >
          {passage.sentences.flatMap((sentence) => {
            const items: React.ReactNode[] = [
              <SentenceDisplay
                key={sentence.index}
                sentence={sentence}
                onPopoverOpen={handlePopoverOpen}
                onPlay={handleSentencePlay}
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
