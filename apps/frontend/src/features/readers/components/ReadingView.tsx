/**
 * @file ReadingView.tsx
 * @description Sentence-by-sentence reader for a single passage.
 *
 * Phase 2: AudioControlBar rendered internally — no audioControlBar prop.
 *   SentenceDisplay is rendered as children by the parent (ReaderPage).
 * Phase D1: AudioControlBar reads the SHARED presentational audio store; the
 *   transport callbacks (onTogglePlay/onStop/onSpeedChange) come from the
 *   parent's useAudioManager instance.
 * Story 21.7: Added restore flow — on mount calls restoreSession, scrolls to saved
 *   sentence. Uses useAutoSaveProgress for debounced auto-save.
 *
 * Rework (§2): long-form reading is the PAPER register (ADR-011) — the reader
 * declares `surface="paper"` and this view paints the reading sheet in paper
 * ink while the transport bar keeps its instrument card, so controls stay
 * legible and the chrome never paints the reading register. The passage also
 * ends properly now: `Finish reading` is the CTA at the last sentence (the exit
 * is not the accomplishment), and only after finishing do `Next passage` and
 * `Back to library` appear.
 *
 * Covers: default, loading (skeleton), error (retry), completion.
 */
import { useEffect, useRef, useState } from "react";
import { Badge, Box, Button, Skeleton, ErrorScreen } from "shared/components";
import { useReadingStore } from "../stores";
import { useAutoSaveProgress } from "../hooks";
import { AudioControlBar } from "./AudioControlBar";
import type { SentenceData } from "./SentenceDisplay";
import type { PlaybackSpeed } from "../constants/audio";
import "./ReadingView.css";

export interface PassageDetail {
  id: string;
  title: string;
  hskLevel: number;
  sentences: SentenceData[];
}

/** ADR-011 register: "instrument" is the dark task surface, "paper" the reader. */
export type ReadingSurface = "instrument" | "paper";

export type ReadingViewProps = {
  passage: PassageDetail;
  onBack: () => void;
  children?: React.ReactNode;
  isLoading: boolean;
  hasError: boolean;
  onRetry: () => void;
  /**
   * Callback fired when the passage reaches the final sentence.
   * Parent uses this to call readingStore.markCompleted(passageId).
   */
  onComplete?: () => void;
  /** `Finish reading` — the completion CTA at the last sentence. */
  onFinish?: () => void;
  /** `Next passage` — offered only once the passage is finished. */
  onNextPassage?: () => void;
  /** Title of the next passage, shown on the `Next passage` button. */
  nextPassageTitle?: string;
  /** Reading register (default instrument). */
  surface?: ReadingSurface;
  /**
   * Fired as sentences become the reader's position (the highest sentence
   * currently on screen). The passage can only end — and the `Finish reading`
   * CTA can only appear — if something reports progress, and scrolling IS
   * reading.
   */
  onSentenceVisible?: (index: number) => void;
  /** Play/pause callback from the main useAudioManager instance. */
  onTogglePlay?: () => void;
  /** Stop callback from the main useAudioManager instance. */
  onStop?: () => void;
  /** Speed change callback from the main useAudioManager instance. */
  onSpeedChange?: (speed: PlaybackSpeed) => void;
};

const SKELETON_ROW_COUNT = 5;

export function ReadingView({
  passage,
  onBack,
  children,
  isLoading,
  hasError,
  onRetry,
  onComplete,
  onFinish,
  onNextPassage,
  nextPassageTitle,
  surface = "instrument",
  onSentenceVisible,
  onTogglePlay,
  onStop,
  onSpeedChange,
}: ReadingViewProps) {
  // Story 21.7: Restore session on mount
  const restoreSession = useReadingStore((s) => s.restoreSession);
  const currentSentence = useReadingStore((s) => s.currentSentence);
  const sentencesRef = useRef<HTMLDivElement>(null);
  const lastRestoredRef = useRef<string | null>(null);
  const [hasFinished, setHasFinished] = useState(false);

  // VisFix W6b: Completion reached once the user is on/past the final sentence.
  const isComplete =
    passage.sentences.length > 0 && currentSentence >= passage.sentences.length - 1;

  // Auto-save hook (Story 21.7)
  useAutoSaveProgress();

  // Restore session and scroll to saved position on mount
  useEffect(() => {
    if (lastRestoredRef.current === passage.id) return;
    lastRestoredRef.current = passage.id;
    setHasFinished(false);
    restoreSession(passage.id);
  }, [passage.id, restoreSession]);

  // Scroll to saved sentence position after restore
  useEffect(() => {
    if (currentSentence <= 0 || !sentencesRef.current) return;

    const sentenceEl = sentencesRef.current.querySelector(
      `[data-sentence-index="${currentSentence}"]`,
    );
    if (sentenceEl) {
      sentenceEl.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [currentSentence]);

  // On final sentence — mark as completed
  useEffect(() => {
    if (passage.sentences.length > 0 && currentSentence >= passage.sentences.length - 1) {
      onComplete?.();
    }
  }, [currentSentence, passage.sentences.length, onComplete]);

  /**
   * Reading position: the highest sentence on screen is the reader's place in
   * the passage. Without this nothing advances `currentSentence`, so the
   * passage could never end (and `Finish reading` could never appear) for a
   * learner who reads by scrolling rather than by playing audio.
   */
  const onSentenceVisibleRef = useRef(onSentenceVisible);
  useEffect(() => {
    onSentenceVisibleRef.current = onSentenceVisible;
  }, [onSentenceVisible]);

  useEffect(() => {
    const root = sentencesRef.current;
    if (!root || !onSentenceVisible) return;
    const targets = root.querySelectorAll<HTMLElement>("[data-sentence-index]");
    if (targets.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .map((entry) => Number((entry.target as HTMLElement).dataset.sentenceIndex))
          .filter((index) => Number.isFinite(index));
        if (visible.length > 0) {
          onSentenceVisibleRef.current?.(Math.max(...visible));
        }
      },
      { root, threshold: 0.6 },
    );

    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, [onSentenceVisible, passage.id, passage.sentences.length]);

  const isPaper = surface === "paper";

  // Error state
  if (hasError) {
    return (
      <>
        {/* The reading route IS the page, so it owns the page's single <h1>
            even while failing (axe page-has-heading-one). */}
        <h1 className="sr-only">Unable to load passage</h1>
        <ErrorScreen
          error="Failed to load this passage. Please try again."
          onRetry={onRetry}
          title="Unable to load passage"
        />
      </>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="reading-view flex-col gap-md" role="status" aria-label="Loading passage">
        <h1 className="sr-only">Loading passage</h1>
        <div className="reading-view__header flex-align-center gap-sm">
          <Skeleton variant="custom" width="36px" height="36px" className="radius-md" />
          <Skeleton variant="line" width="200px" height="24px" />
          <Skeleton variant="custom" width="60px" height="24px" className="radius-pill" />
        </div>
        <div className="flex-col gap-md">
          {Array.from({ length: SKELETON_ROW_COUNT }, (_, i) => (
            <div key={i} className="flex-col gap-xs">
              <Skeleton variant="line" width="100%" height="20px" />
              <Skeleton variant="line" width="60%" height="14px" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const handleFinish = () => {
    setHasFinished(true);
    onFinish?.();
  };

  const body = (
    <>
      {/* Passage Header: back button + title + HSK badge */}
      <div className="reading-view__header flex-align-center gap-sm shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          aria-label="Leave this passage"
          className="reading-view__back-btn shrink-0 font-sm gap-xs"
        >
          ← Back
        </Button>
        <h1 className="reading-view__title overflow-hidden whitespace-nowrap text-ellipsis font-xl fw-600 m-0 flex-1">
          {passage.title}
        </h1>
        {/* On paper the shared Badge's dark-register surface would fail contrast,
            so the level is plain meta ink inside the sheet. */}
        {isPaper ? (
          <span className="reading-view__level font-xs fw-600 shrink-0">
            HSK {passage.hskLevel}
          </span>
        ) : (
          <Badge variant="surface" className="shrink-0">
            HSK {passage.hskLevel}
          </Badge>
        )}
      </div>

      {/* AudioControlBar — instrument card even on the paper plane: a transport
          is chrome, and its controls must clear contrast against the sheet. */}
      <AudioControlBar
        totalSentences={passage.sentences.length}
        onTogglePlay={onTogglePlay}
        onStop={onStop}
        onSpeedChange={onSpeedChange}
      />

      {/* Sentences — scrollable (rendered from parent via children) */}
      <div
        className="reading-view__sentences flex-col flex-1 overflow-y-auto min-h-0"
        ref={sentencesRef}
      >
        {children}

        {/* Completion — the CTA is the accomplishment, then the way on. */}
        {isComplete && (
          <div
            className="reading-view__completion flex-col-center gap-md p-2xl text-center shrink-0"
            role="status"
            aria-label="Passage complete"
          >
            <p className="font-sm m-0">You finished reading “{passage.title}”.</p>
            {hasFinished ? (
              <div className="flex-row gap-sm flex-wrap items-center justify-center">
                {onNextPassage && (
                  <Button variant="primary" size="md" onClick={onNextPassage}>
                    Next passage{nextPassageTitle ? `: ${nextPassageTitle}` : ""}
                  </Button>
                )}
                <Button variant="ghost" size="md" onClick={onBack}>
                  Back to library
                </Button>
              </div>
            ) : (
              <Button variant="primary" size="md" onClick={handleFinish}>
                Finish reading
              </Button>
            )}
          </div>
        )}
      </div>
    </>
  );

  if (isPaper) {
    // The sheet is the reading plane; PageShell already painted the paper plane.
    return (
      <div className="reading-view reading-view--paper w-full flex-col gap-md p-lg radius-md">
        {body}
      </div>
    );
  }

  return (
    <Box
      variant="dark-alt"
      padding="md"
      className="reading-view w-full flex-col gap-md animate-fade-in min-h-0"
    >
      {body}
    </Box>
  );
}
