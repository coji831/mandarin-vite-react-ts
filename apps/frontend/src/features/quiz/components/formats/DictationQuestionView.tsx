/**
 * DictationQuestionView — Q9 `listening-dictation` (Epic 26 §26.3.4).
 *
 * Audio plays on demand (never autoplay), the learner types the transcription,
 * Enter submits. Every part of this surface is an existing primitive: the replay
 * control is a `Button` + `Icon`, the field is `Input`. The glyph is never
 * printed (§26.4.1 `promptGlyph: hide`), so the view has no character slot at
 * all — that absence is the format.
 *
 * Visual shell only (Step 1): the component never touches audio. `playing`,
 * `replayCount` and `onReplay` are the host's, so a story can render any state.
 *
 * Accessibility contract:
 *  - the replay control is `aria-disabled` while audio is playing, never
 *    `disabled` (the control that was just activated keeps focus);
 *  - a failed playback is an INLINE error with a Replay retry — the question
 *    survives, so it is not a page-level `ErrorScreen`;
 *  - Enter is guarded against IME composition: a Mandarin learner typing pinyin
 *    with an IME must not submit the half-composed string;
 *  - the heading is the focus target after a swap; no live region lives here.
 */
import { type KeyboardEvent, type Ref, useId } from "react";
import { Box, Button, EmptyState, ErrorScreen, Icon, Input } from "shared/components";
import { isComposingKey } from "./keyGuard";
import "../Quiz.css";
import "./DictationQuestionView.css";

export type DictationOutcome = {
  correct: boolean;
  /** Expected transcription, tone-marked. */
  expected: string;
  /** Pinyin line the host renders from the corpus. */
  displayPinyin?: string;
};

export type DictationQuestionViewProps = {
  /** Instruction line, e.g. "Type the pinyin you hear, tone numbers are fine." */
  instruction: string;
  /** Visible label of the answer field. */
  fieldLabel: string;
  answer: string;
  onAnswerChange?: (value: string) => void;
  onSubmit?: () => void;
  /** Replay control state. */
  playing?: boolean;
  replayCount?: number;
  onReplay?: () => void;
  submitting?: boolean;
  locked?: boolean;
  outcome?: DictationOutcome | null;
  /** Playback/TTS failure — inline, retryable. */
  audioError?: string | null;
  /** No dictation items for this phase. */
  empty?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onExit?: () => void;
  headingRef?: Ref<HTMLHeadingElement>;
  className?: string;
};

const VIEW_LABEL = "Listening dictation";
const NOOP = () => {};

export function DictationQuestionView({
  instruction,
  fieldLabel,
  answer,
  onAnswerChange,
  onSubmit,
  playing = false,
  replayCount = 0,
  onReplay,
  submitting = false,
  locked = false,
  outcome = null,
  audioError = null,
  empty = false,
  error = null,
  onRetry,
  onExit,
  headingRef,
  className,
}: DictationQuestionViewProps) {
  const fieldId = useId();
  const isLocked = locked || submitting;
  const canCommit = answer.trim().length > 0 && !isLocked;

  const commit = () => {
    if (!canCommit) return;
    onSubmit?.();
  };

  const handleFieldKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter" || isComposingKey(event)) return;
    event.preventDefault();
    commit();
  };

  if (empty) {
    return (
      <Box variant="dark" padding="lg" className="quiz-dictation flex-col gap-md">
        <EmptyState
          icon="quiz"
          title="No dictation questions yet"
          description="This phase has no audio items available right now."
          action={
            <Button variant="secondary" onClick={onExit ?? NOOP}>
              Back to Practices
            </Button>
          }
        />
      </Box>
    );
  }

  if (error) {
    return (
      <Box variant="dark" padding="lg" className="quiz-dictation flex-col gap-md">
        <ErrorScreen error={error} onRetry={onRetry ?? NOOP} />
      </Box>
    );
  }

  return (
    <Box
      variant="dark"
      padding="lg"
      role="group"
      aria-label={VIEW_LABEL}
      aria-disabled={isLocked || undefined}
      aria-busy={submitting || undefined}
      className={["quiz-dictation flex-col gap-md", className].filter(Boolean).join(" ")}
    >
      <h2 ref={headingRef} tabIndex={-1} className="font-lg fw-600 text-primary m-0">
        Type what you hear
      </h2>

      <p className="font-sm text-secondary m-0 lh-normal">{instruction}</p>

      <div className="flex-align-center gap-sm flex-wrap">
        <Button
          variant="ghost"
          aria-disabled={playing}
          onClick={() => {
            if (playing) return;
            onReplay?.();
          }}
        >
          <Icon name="audio" size={20} aria-hidden />
          {playing ? "Playing..." : replayCount > 0 ? `Replay (${replayCount})` : "Play"}
        </Button>
        {audioError && <p className="font-sm text-error m-0">{audioError}</p>}
      </div>

      <div className="flex-col gap-xs">
        <label className="font-sm fw-600 text-secondary" htmlFor={fieldId}>
          {fieldLabel}
        </label>
        <Input
          id={fieldId}
          value={answer}
          onChange={(event) => {
            if (isLocked) return;
            onAnswerChange?.(event.target.value);
          }}
          onKeyDown={handleFieldKeyDown}
          placeholder="e.g. ma3"
          autoComplete="off"
          className="w-full"
          aria-disabled={isLocked || undefined}
        />
      </div>

      <p className="font-sm text-muted m-0">
        {isLocked
          ? "Checking your answer..."
          : answer.trim()
            ? "Press Enter or Check to submit."
            : "Type what you hear, then press Enter."}
      </p>

      <div className="flex-align-center gap-sm flex-wrap">
        <Button variant="primary" aria-disabled={!canCommit} onClick={commit}>
          {submitting ? "Checking..." : "Check"}
        </Button>
      </div>

      {outcome && (
        <Box variant={outcome.correct ? "pass" : "fail"} padding="md" className="flex-col gap-xs">
          <p className="flex-align-center gap-xs font-md fw-600 text-primary m-0">
            <Icon name={outcome.correct ? "check" : "cross"} size={16} aria-hidden />
            {outcome.correct ? "Correct" : `Incorrect. It was ${outcome.expected}.`}
          </p>
          {outcome.displayPinyin && (
            <p className="font-sm text-secondary m-0 lh-normal">{outcome.displayPinyin}</p>
          )}
          <p className="font-sm text-muted m-0 lh-normal">
            You typed: {answer.trim() || "(nothing)"}
          </p>
        </Box>
      )}
    </Box>
  );
}
