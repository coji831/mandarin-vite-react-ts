/**
 * @file ReadersPage.tsx
 * @description Page container for Graded Readers — TWO routes, two archetypes
 * (rework-proposal §2):
 *
 *   /learn/readers              → the library   (`list` / Browse)
 *   /learn/readers/:passageId   → reading one   (`detail` / Focus, PAPER register)
 *
 * The reading session used to be a mode inside the library page, which meant it
 * had no address, no Focus chrome and no end. A reading session now has a URL, a
 * collapsed rail and a recessed top bar (pageChrome's `/learn/readers/` entry),
 * and `PageShell surface="paper"` paints the reading register — the ADR-012
 * declaration that until now had no call sites.
 *
 * Data flow is unchanged: hooks fetch, `readingStore` holds progress, the shared
 * AudioManager plays (guests and users share ONE audio path — the audio route is
 * optionalAuth).
 *
 * Access: OPEN for every visitor (Story 25-3 / A25 — BM-1 §3). Phase is
 * sequencing metadata only, never a prerequisite.
 */
import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  ErrorScreen,
  LoadingScreen,
  PageHeader,
  PageShell,
  PageStack,
} from "shared/components";
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

/** Stable empty items reference for the non-reading (library) mount. */
const EMPTY_ITEMS: PlayableItem[] = [];

const LIBRARY_PATH = "/learn/readers";

export function ReadersPage() {
  const navigate = useNavigate();
  const { passageId } = useParams<{ passageId?: string }>();
  const isReadingRoute = Boolean(passageId);

  // Store selectors (reading session state)
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

  // The ROUTE is the source of truth for the session (a session is a location,
  // not a mode flag); the store mirrors it so progress and audio can read it.
  useEffect(() => {
    setPassageId(passageId ?? null);
    setMode(isReadingRoute ? "reading" : "library");
  }, [passageId, isReadingRoute, setPassageId, setMode]);

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
  } = usePassageDetail(passageId ?? null);

  // Audio — shared AudioManager + readers-owned passage AUDIO BEHAVIOR (Phase D1 → 2)
  const isReading = isReadingRoute && !!passage;

  const audioBehavior = useMemo<AudioBehavior | undefined>(() => {
    if (!isReading || !passage || !passageId) return undefined;
    return buildPassageAudioBehavior({
      passageId,
      sentences: passage.sentences,
    });
  }, [isReading, passage, passageId]);

  const audio = useAudioManager({
    behavior: audioBehavior,
    // Library mount → clear the manager's items (bumps playId → aborts any
    // in-flight reading session). The behavior path handles the reading mount.
    items: isReading ? undefined : EMPTY_ITEMS,
  });

  // Destructure the stable snapshot + commands so callbacks keep primitive deps.
  const { status: audioStatus, currentIndex: audioIndex, hasCompleted } = audio;
  const { play, pause, restart, stop, setRate } = audio;

  // Merge store progress state into passage summaries
  const passagesWithProgress = useMemo(
    () =>
      passages.map((p) => ({
        ...p,
        isCompleted: completedPassages.has(p.id),
        isBookmarked: bookmarkedPassages.has(p.id),
      })),
    [passages, completedPassages, bookmarkedPassages],
  );

  /**
   * The next passage is a real destination now that reading is a route: the
   * completion CTA moves forward inside the same filtered list instead of
   * dumping the learner back into the grid.
   */
  const nextPassage = useMemo(() => {
    if (!passageId) return null;
    const index = passagesWithProgress.findIndex((p) => p.id === passageId);
    if (index < 0) return null;
    return passagesWithProgress[index + 1] ?? null;
  }, [passageId, passagesWithProgress]);

  // Handlers
  const handleLevelChange = (level: number | null) => {
    setInternalLevel(level);
  };

  /** Opening a passage is a navigation — one URL per reading session. */
  const handleSelectPassage = (id: string) => {
    navigate(`${LIBRARY_PATH}/${id}`);
  };

  const handleBack = () => {
    setCurrentSentence(0);
    navigate(LIBRARY_PATH);
  };

  const handleNextPassage = () => {
    if (!nextPassage) return;
    setCurrentSentence(0);
    navigate(`${LIBRARY_PATH}/${nextPassage.id}`);
  };

  /** Transport: play/pause toggle via the shared manager. */
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

  /** Per-sentence audio → single-sentence play through the manager (no auto-advance). */
  const handleSentencePlay = useCallback(
    (index: number) => {
      play(index, "single");
    },
    [play],
  );

  /**
   * Completion detection: the manager's `completed` event, mirrored into the
   * shared audioStore `hasCompleted` snapshot. Idempotent (Set-based store).
   */
  useEffect(() => {
    if (hasCompleted && passageId) {
      markCompleted(passageId);
    }
  }, [hasCompleted, passageId, markCompleted]);

  /**
   * Popover pause/resume: pause while the word popover is open, resume from the
   * same sentence when it closes.
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

  /** Page Visibility API: pause when hidden. */
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

  /** Mark completed when the final sentence is reached. Idempotent. */
  const handleComplete = useCallback(() => {
    if (passageId) {
      markCompleted(passageId);
    }
  }, [passageId, markCompleted]);

  /** Story 21.7: Bookmark toggle handler. */
  const handleBookmarkToggle = useCallback(
    (id: string) => {
      toggleBookmark(id);
    },
    [toggleBookmark],
  );

  // ── Reading session: detail measure + the paper register ────────────────
  if (isReadingRoute) {
    // The paper register is the READING surface. A loading frame or an error
    // frame is not reading, and the instrument components that render them
    // (ErrorScreen / Skeleton) carry dark-register ink that fails contrast on
    // paper — so those two states stay on the instrument plane.
    const isReadingContent = Boolean(passage) && !readError;
    return (
      <PageShell archetype="detail" surface={isReadingContent ? "paper" : "instrument"}>
        <PageStack size="default">
          {readError ? (
            <ErrorScreen
              error="Failed to load this passage. Please try again."
              onRetry={readRetry}
              title="Unable to load passage"
            />
          ) : !passage ? (
            <LoadingScreen message={readLoading ? "Loading passage…" : "Passage unavailable"} />
          ) : (
            <ReadingView
              passage={passage}
              surface="paper"
              onBack={handleBack}
              isLoading={false}
              hasError={false}
              onRetry={readRetry}
              onTogglePlay={handleTogglePlay}
              onStop={stop}
              onSpeedChange={handleSpeedChange}
              onComplete={handleComplete}
              onFinish={handleComplete}
              onSentenceVisible={setCurrentSentence}
              onNextPassage={nextPassage ? handleNextPassage : undefined}
              nextPassageTitle={nextPassage?.title}
            >
              {passage.sentences.map((sentence, index) => (
                <div key={sentence.index} className="flex-col">
                  <SentenceDisplay
                    sentence={sentence}
                    onPopoverOpen={handlePopoverOpen}
                    onPlay={handleSentencePlay}
                  />
                  {/* Paper reads as prose: no hairline between sentences
                      (the sheet's own rhythm carries the break). */}
                  {index < passage.sentences.length - 1 && (
                    <span className="reading-view__sentence-rule" aria-hidden="true" />
                  )}
                </div>
              ))}
            </ReadingView>
          )}

          {/* WordPopover — reads glyph and position from readingStore */}
          {popover.glyph && <WordPopover />}
        </PageStack>
      </PageShell>
    );
  }

  // ── Library: list measure, instrument register ─────────────────────────
  return (
    <PageShell archetype="list">
      <PageStack size="default">
        <PageHeader
          title="Graded Readers"
          description="Read graded passages with sentence audio, word popovers, and saved progress."
        />

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
      </PageStack>
    </PageShell>
  );
}
