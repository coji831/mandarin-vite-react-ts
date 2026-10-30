/**
 * SentenceBuilderView — Q7 `sentence-building` (Epic 26 §26.3.3).
 *
 * Tap-to-place, keyboard-first. **Drag is not implemented and is not a fallback
 * path**: the registry has no DragDrop/Sortable entry, and a pointer-only
 * assembly step would fail 2.1.1 / 2.5.7. Order is expressed with explicit
 * `Move left` / `Move right` / `Remove` icon buttons that carry their own
 * accessible names, and appending is a plain Enter on a bank chip.
 *
 * Visual shell only (Step 1): `bank`, `answer` and the three callbacks are the
 * whole contract. No store, no grading, no shuffle (the order is given).
 *
 * Accessibility contract:
 *  - the heading is the focus target after a swap (`tabIndex={-1}`) and the only
 *    heading in the view;
 *  - no live region here — the session's single `role="status"` node announces
 *    "Added ..., position 1 of 4" and the verdict;
 *  - placed tokens never leave the tab order silently: the bank chip keeps
 *    `aria-pressed` so the state is text, not colour;
 *  - the in-flight lock is `aria-disabled` + early return, never `disabled`.
 */
import { type Ref } from "react";
import { Box, Button, Chip, EmptyState, ErrorScreen, Icon } from "shared/components";
import "../Quiz.css";
import "./SentenceBuilderView.css";

export type SentenceToken = { id: string; text: string };

export type SentenceBuilderOutcome = {
  correct: boolean;
  /** Canonical token order, rendered under the answer row on fail. */
  canonical: string[];
};

export type SentenceBuilderViewProps = {
  /** Target meaning — never the answer sentence. */
  gloss: string;
  /** Shuffled tokens still available to place. */
  bank: SentenceToken[];
  /** Tokens already placed, in order. */
  answer: SentenceToken[];
  onAppend?: (id: string) => void;
  onRemove?: (id: string) => void;
  onMove?: (id: string, direction: "left" | "right") => void;
  onReset?: () => void;
  onSubmit?: () => void;
  submitting?: boolean;
  locked?: boolean;
  outcome?: SentenceBuilderOutcome | null;
  /** No bank items for this phase. */
  empty?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onExit?: () => void;
  headingRef?: Ref<HTMLHeadingElement>;
  className?: string;
};

const VIEW_LABEL = "Sentence building";
const NOOP = () => {};

export function SentenceBuilderView({
  gloss,
  bank,
  answer,
  onAppend,
  onRemove,
  onMove,
  onReset,
  onSubmit,
  submitting = false,
  locked = false,
  outcome = null,
  empty = false,
  error = null,
  onRetry,
  onExit,
  headingRef,
  className,
}: SentenceBuilderViewProps) {
  const isLocked = locked || submitting;
  const canCommit = answer.length > 0 && !isLocked;
  const placedIds = new Set(answer.map((token) => token.id));
  const answerBoxVariant = outcome ? (outcome.correct ? "pass" : "fail") : "dashed";

  const commit = () => {
    if (!canCommit) return;
    onSubmit?.();
  };

  if (empty) {
    return (
      <Box variant="dark" padding="lg" className="quiz-sentence flex-col gap-md">
        <EmptyState
          icon="quiz"
          title="No sentence-building questions yet"
          description="This phase has no sentences available to assemble right now."
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
      <Box variant="dark" padding="lg" className="quiz-sentence flex-col gap-md">
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
      className={["quiz-sentence flex-col gap-md", className].filter(Boolean).join(" ")}
    >
      <h2 ref={headingRef} tabIndex={-1} className="font-lg fw-600 text-primary m-0">
        Build the sentence
      </h2>

      <p className="font-md text-secondary m-0 lh-normal">{gloss}</p>

      <Box variant={answerBoxVariant} padding="sm" className="flex-col gap-sm">
        {answer.length > 0 ? (
          <ol className="quiz-sentence__answer m-0 p-0 flex-col gap-xs" aria-label="Your answer">
            {answer.map((token, index) => (
              <li
                key={token.id}
                className="quiz-sentence__answer-item flex-align-center gap-xs flex-wrap"
              >
                <Chip variant="surface" size="md">
                  {token.text}
                </Chip>
                <span className="font-xs text-muted">
                  {index + 1} of {answer.length}
                </span>
                <Button
                  variant="icon"
                  width={28}
                  height={28}
                  aria-label={`Move ${token.text} left`}
                  aria-disabled={isLocked || index === 0}
                  onClick={() => {
                    if (isLocked || index === 0) return;
                    onMove?.(token.id, "left");
                  }}
                >
                  <Icon name="chevron-left" size={16} aria-hidden />
                </Button>
                <Button
                  variant="icon"
                  width={28}
                  height={28}
                  aria-label={`Move ${token.text} right`}
                  aria-disabled={isLocked || index === answer.length - 1}
                  onClick={() => {
                    if (isLocked || index === answer.length - 1) return;
                    onMove?.(token.id, "right");
                  }}
                >
                  <Icon name="chevron-right" size={16} aria-hidden />
                </Button>
                <Button
                  variant="icon"
                  width={28}
                  height={28}
                  aria-label={`Remove ${token.text}`}
                  aria-disabled={isLocked}
                  onClick={() => {
                    if (isLocked) return;
                    onRemove?.(token.id);
                  }}
                >
                  <Icon name="cross" size={16} aria-hidden />
                </Button>
              </li>
            ))}
          </ol>
        ) : (
          <p className="font-sm text-muted m-0">
            No words placed yet. Choose a word from the bank below.
          </p>
        )}
      </Box>

      <div className="flex-col gap-xs">
        <p className="font-xs text-muted m-0">Word bank</p>
        <div className="flex flex-wrap gap-sm" role="group" aria-label="Word bank">
          {bank.map((token) => {
            const placed = placedIds.has(token.id);
            return (
              <Chip
                key={token.id}
                variant="outline"
                size="md"
                interactive
                active={placed}
                ariaLabel={placed ? `${token.text} (placed in your answer)` : token.text}
                onClick={() => {
                  if (isLocked) return;
                  onAppend?.(token.id);
                }}
              >
                {token.text}
              </Chip>
            );
          })}
        </div>
      </div>

      <div className="flex-align-center gap-sm flex-wrap">
        <Button variant="primary" aria-disabled={!canCommit} onClick={commit}>
          {submitting ? "Checking..." : "Check"}
        </Button>
        <Button
          variant="ghost"
          aria-disabled={isLocked || answer.length === 0}
          onClick={() => {
            if (isLocked || answer.length === 0) return;
            onReset?.();
          }}
        >
          Reset
        </Button>
      </div>

      {outcome && (
        <Box variant={outcome.correct ? "pass" : "fail"} padding="md" className="flex-col gap-xs">
          <p className="flex-align-center gap-xs font-md fw-600 text-primary m-0">
            <Icon name={outcome.correct ? "check" : "cross"} size={16} aria-hidden />
            {outcome.correct ? "Correct" : "Incorrect. The word order is wrong."}
          </p>
          {!outcome.correct && (
            <div className="flex-col gap-xs">
              <p className="font-sm fw-600 text-primary m-0">Correct order</p>
              <div className="flex-align-center flex-wrap gap-xs">
                {outcome.canonical.map((token, index) => (
                  <Chip key={`${token}-${index}`} variant="outline" size="md">
                    {token}
                  </Chip>
                ))}
              </div>
            </div>
          )}
        </Box>
      )}
    </Box>
  );
}
