/**
 * ClozeQuestionView — Q6 `cloze` (Epic 26 §26.3.2).
 *
 * A sentence with one blanked segment and four tokens to choose from. Visual
 * shell only (Step 1): no store, no service, no grading. The answer channel is
 * `selected`/`onSelect` for the choice and `onSubmit` for the commit.
 *
 * Accessibility contract (the reasons, not just the rules):
 *  - Selecting NEVER grades. A radio `onChange` only reports the choice; the
 *    commit is an explicit Submit / Enter activation (WCAG 3.2.2 — a keyboard
 *    user arrowing through the group must not be graded on the way past).
 *  - The heading is the view's focus target after a swap (`tabIndex={-1}`), so
 *    QUESTION -> FEEDBACK does not drop focus to <body>.
 *  - No live region here. The verdict is visible WORDS; the session's single
 *    `role="status"` node (QuizSessionPage) does the announcing.
 *  - The option group is one tab stop with arrow-key movement (native radio
 *    fieldset) plus digits 1-4 as a shortcut.
 *  - Enter is guarded against IME composition.
 *  - The in-flight lock is `aria-disabled` + an early return, never the
 *    `disabled` attribute, so the focused control keeps focus.
 */
import { type KeyboardEvent, type Ref, useId } from "react";
import { Badge, Box, Button, EmptyState, ErrorScreen, Icon, RadioGroup } from "shared/components";
import { isComposingKey, optionIndexFromKey } from "./keyGuard";
import "../Quiz.css";
import "./ClozeQuestionView.css";

export type SelectOption = { value: string; label: string };

export type ClozeOutcome = {
  correct: boolean;
  /** Token the learner committed. */
  chosen: string;
  /** Correct token (echoed inline on fail). */
  answer: string;
  /** The pattern's authored explanation. */
  explanation?: string;
};

export type ClozeQuestionViewProps = {
  /** Pattern `name`/`structure`, shown as a one-line context badge. */
  patternName: string;
  /** English gloss of the whole sentence. */
  gloss: string;
  /** Sentence text before the blank. */
  sentenceBefore: string;
  /** Sentence text after the blank. */
  sentenceAfter: string;
  /** Four tokens; more than four is a data error, not a layout decision. */
  options: SelectOption[];
  selected?: string | null;
  onSelect?: (value: string) => void;
  onSubmit?: () => void;
  /** Optimistic answer in flight. */
  submitting?: boolean;
  /** Input locked (submitting or question advancing). */
  locked?: boolean;
  outcome?: ClozeOutcome | null;
  /** Bank has no cloze items for this phase. */
  empty?: boolean;
  /** Generation failed — page-level retry. */
  error?: string | null;
  onRetry?: () => void;
  /** Way out of the empty state. */
  onExit?: () => void;
  headingRef?: Ref<HTMLHeadingElement>;
  className?: string;
};

const VIEW_LABEL = "Cloze question";
const NOOP = () => {};

export function ClozeQuestionView({
  patternName,
  gloss,
  sentenceBefore,
  sentenceAfter,
  options,
  selected = null,
  onSelect,
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
}: ClozeQuestionViewProps) {
  const groupName = useId();
  const isLocked = locked || submitting;
  const canCommit = selected !== null && !isLocked;

  const commit = () => {
    if (!canCommit) return;
    onSubmit?.();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (isLocked || isComposingKey(event)) return;

    if (event.key === "Enter") {
      event.preventDefault();
      commit();
      return;
    }

    const index = optionIndexFromKey(event.key, 1);
    if (index !== null && options[index]) {
      event.preventDefault();
      onSelect?.(options[index].value);
    }
  };

  if (empty) {
    return (
      <Box variant="dark" padding="lg" className="quiz-cloze flex-col gap-md">
        <EmptyState
          icon="quiz"
          title="No cloze questions yet"
          description="This phase has no cloze items available right now."
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
      <Box variant="dark" padding="lg" className="quiz-cloze flex-col gap-md">
        <ErrorScreen error={error} onRetry={onRetry ?? NOOP} />
      </Box>
    );
  }

  const blankVariant = outcome ? (outcome.correct ? "pass" : "fail") : "dashed";
  const blankText = outcome ? outcome.chosen : selected;

  return (
    <Box
      variant="dark"
      padding="lg"
      role="group"
      aria-label={VIEW_LABEL}
      aria-disabled={isLocked || undefined}
      aria-busy={submitting || undefined}
      className={["quiz-cloze flex-col gap-md", className].filter(Boolean).join(" ")}
      onKeyDown={handleKeyDown}
    >
      <h2 ref={headingRef} tabIndex={-1} className="font-lg fw-600 text-primary m-0">
        Fill the blank in the sentence
      </h2>

      <div className="flex-align-center gap-sm flex-wrap">
        <Badge variant="surface">{patternName}</Badge>
      </div>

      <p className="quiz-cloze__sentence font-xl text-primary m-0">
        {sentenceBefore}
        <Box
          variant={blankVariant}
          as="span"
          padding="xs"
          className="quiz-cloze__blank inline-flex items-center justify-center"
        >
          {blankText ? (
            <span>{blankText}</span>
          ) : (
            <>
              <span aria-hidden="true" className="tracking-wide">
                ____
              </span>
              <span className="sr-only">blank to fill</span>
            </>
          )}
        </Box>
        {sentenceAfter}
      </p>

      <p className="font-sm text-secondary m-0 lh-normal">{gloss}</p>

      <div className="quiz-select__options">
        <RadioGroup
          name={groupName}
          options={options}
          value={selected}
          onChange={(value) => onSelect?.(value)}
          layout="vertical"
          label="Choose one token"
        />
      </div>

      <p className="font-sm text-muted m-0">
        {isLocked
          ? "Checking your answer..."
          : selected
            ? "Press Enter or Check to submit."
            : "Choose one option to check, or press 1 to 4."}
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
            {outcome.correct ? "Correct" : `Incorrect. The answer is ${outcome.answer}.`}
          </p>
          {outcome.explanation && (
            <p className="font-sm text-secondary m-0 lh-normal">{outcome.explanation}</p>
          )}
        </Box>
      )}
    </Box>
  );
}
