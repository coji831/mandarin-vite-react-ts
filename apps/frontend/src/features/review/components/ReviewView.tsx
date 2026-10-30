/**
 * ReviewView.tsx
 * Phase 1 Review — Main orchestrator component.
 * Renders header, ReviewCard (3-sided flip card), and progress bar.
 * Supports presetType/presetSource props to skip the picker via URL params.
 */
import { useCallback, useEffect } from "react";
import { useReview } from "../hooks/useReview";
import type { ReviewSource } from "../types";
import { useAudioItemPlayback } from "shared/hooks";
import { isAuthFailure } from "shared/api";
import { ReviewPicker } from "./ReviewPicker";
import { ReviewCard } from "./ReviewCard";
import { ReviewComplete } from "./ReviewComplete";
import { Button, ErrorScreen, LoadingScreen, ProgressBar, GuestUpsell } from "shared/components";
import { login_page } from "shared/constants";
import { useAuth } from "features/auth";

type ReviewViewProps = {
  onBack: () => void;
  presetType?: string | null;
  presetSource?: string | null;
};

export function ReviewView({ onBack, presetType, presetSource }: ReviewViewProps) {
  const {
    step,
    currentItem,
    loading,
    error,
    startReview,
    submitPinyin,
    selectOption,
    selectTone,
    rateItem,
    progress,
    userPinyin,
    pinyinCorrect,
    toneCorrect,
    sessionResult,
    totalItems,
    contentType,
    source,
  } = useReview();

  const { play } = useAudioItemPlayback();
  const { isAuthenticated } = useAuth();
  // BM-1: a guest can DO the review (session-local queue) — only persistence is
  // locked, so the one ask appears at completion.
  const isGuest = !isAuthenticated;

  const handlePlayAudio = useCallback(
    (text: string) => {
      play(text);
    },
    [play],
  );

  // Auto-start review when BOTH presetType AND presetSource are provided
  // (e.g., /practices/review?type=pinyin&filter=due)
  // When only presetType is provided, the picker pre-selects the type without auto-starting.
  useEffect(() => {
    if (presetType && presetSource && step === "pick") {
      startReview(presetSource as ReviewSource, presetType);
    }
  }, [presetType, presetSource, step, startReview]);

  if (loading) {
    return <LoadingScreen message="Loading review items..." />;
  }

  if (error) {
    // Bug 2: mid-page session expiry (401 / 403 INVALID_TOKEN) → sign-in upsell
    // instead of a dead-end generic error screen. Non-auth errors keep ErrorScreen.
    if (isAuthFailure(error)) {
      return (
        <div className="error-screen flex-col-center gap-lg p-2xl">
          <GuestUpsell
            icon="lock"
            title="Your session expired"
            description="Your session expired — sign in again to continue reviewing."
            ctaLabel="Sign in again ▸"
            to={login_page}
          />
        </div>
      );
    }
    return <ErrorScreen error={error.message} onRetry={() => startReview(source, contentType)} />;
  }

  if (step === "complete" && totalItems === 0 && !loading) {
    return (
      <div className="flex-col-center gap-lg p-2xl">
        <h2 className="text-secondary">No items available</h2>
        <p className="text-muted">Try a different content type or source.</p>
        <Button variant="primary" onClick={() => startReview(source, contentType)}>
          Try Again
        </Button>
      </div>
    );
  }

  switch (step) {
    case "pick":
      return <ReviewPicker onStart={startReview} />;

    case "pinyin":
    case "tone":
    case "option":
    case "result":
      return (
        <div className="flex-col gap-lg w-full min-w-0">
          {/* Session header (rework-proposal §4): the h1 is the GLYPH under test
              and lives in the card — the chrome is a ghost eyebrow + the count,
              so chrome never outranks the thing being learned. */}
          <header className="flex-between gap-lg">
            <span className="font-xs fw-500 text-muted tracking-wide">
              Review
              {contentType
                ? ` · ${contentType.charAt(0).toUpperCase() + contentType.slice(1)}s`
                : ""}
            </span>
            <span className="font-sm text-muted">
              {progress.current} of {progress.total}
            </span>
          </header>

          {/* Flip card */}
          <ReviewCard
            item={currentItem!}
            step={step}
            userPinyin={userPinyin}
            pinyinCorrect={pinyinCorrect}
            toneCorrect={toneCorrect}
            onSubmitPinyin={submitPinyin}
            onSelectTone={selectTone}
            onSelectOption={selectOption}
            onRate={rateItem}
            onPlayAudio={handlePlayAudio}
          />

          {/* Progress bar */}
          <ProgressBar value={progress.current / progress.total} aria-label="Review progress" />
        </div>
      );

    case "complete":
      return (
        <ReviewComplete
          result={sessionResult}
          totalItems={totalItems}
          onReviewAgain={() => startReview(source, contentType)}
          onBack={onBack}
          isGuest={isGuest}
        />
      );
  }
}
