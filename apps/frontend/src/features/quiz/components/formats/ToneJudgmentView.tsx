/**
 * ToneJudgmentView — Q10 `tone-judgment` (Epic 26 §26.3.5).
 *
 * A DISTINCT format, not an `audio-to-tone` sub-mode. `audio-to-tone` is
 * perception from audio; this has **no audio at all** — the learner reads a
 * written phrase in tone-marked pinyin, sees the sandhi rule it triggers, and
 * states the SURFACE tone of one marked syllable. Different stimulus (written),
 * different corpus anchor (`ToneRule` + grammar example), different failure mode
 * (a learner who hears perfectly can still fail it).
 *
 * Visual shell only (Step 1): no store, no grading, no rule engine.
 *
 * Accessibility contract:
 *  - the target syllable is bracketed in a dashed slot AND named in the question
 *    text, so the answer is never conveyed by weight or colour alone;
 *  - the surface-tone reveal is text (`ní hǎo · 2-3`), never a hue;
 *  - selection never grades: the radio group is one tab stop with arrow-key
 *    movement, digits 0-4 select, Enter commits (WCAG 3.2.2);
 *  - the heading is the focus target after a swap; no live region here.
 */
import { type KeyboardEvent, type Ref, useId } from "react";
import { Badge, Box, Button, EmptyState, ErrorScreen, Icon, RadioGroup } from "shared/components";
import { isComposingKey, optionIndexFromKey } from "./keyGuard";
import type { SelectOption } from "./ClozeQuestionView";
import "../Quiz.css";
import "./ToneJudgmentView.css";

export type ToneSyllable = {
  /** Tone-marked pinyin of the syllable, e.g. "nǐ". */
  text: string;
  /** Dictionary (base) tone, 0-4. */
  baseTone: number;
  /** Surface tone after sandhi, revealed only in the outcome. */
  surfaceTone?: number;
  /** The syllable the learner is asked about. */
  target?: boolean;
};

export type ToneJudgmentOutcome = {
  correct: boolean;
  /** Tone the learner committed, as text ("second tone"). */
  chosenLabel: string;
  /** Correct surface tone, as text. */
  answerLabel: string;
  /** Whole-phrase surface sequence — the teaching moment, on both outcomes. */
  reveal: string;
  /** Rule title from the corpus. */
  ruleTitle?: string;
};

export type ToneJudgmentViewProps = {
  /** Rule id/label shown as a badge, e.g. `rule-3rd-sandhi`. */
  ruleName: string;
  /** The written phrase, syllable by syllable. */
  syllables: ToneSyllable[];
  /** The question — names the target syllable in words. */
  question: string;
  /** Five options: neutral 0 plus tones 1-4. */
  options: SelectOption[];
  selected?: string | null;
  onSelect?: (value: string) => void;
  onSubmit?: () => void;
  submitting?: boolean;
  locked?: boolean;
  outcome?: ToneJudgmentOutcome | null;
  /** No rule-anchored items for this phase. */
  empty?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onExit?: () => void;
  headingRef?: Ref<HTMLHeadingElement>;
  className?: string;
};

const VIEW_LABEL = "Tone judgment";
const NOOP = () => {};
const TONE_NAMES: Record<number, string> = {
  0: "neutral tone",
  1: "first tone",
  2: "second tone",
  3: "third tone",
  4: "fourth tone",
};

export function ToneJudgmentView({
  ruleName,
  syllables,
  question,
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
}: ToneJudgmentViewProps) {
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

    const index = optionIndexFromKey(event.key, 0);
    if (index !== null && options[index]) {
      event.preventDefault();
      onSelect?.(options[index].value);
    }
  };

  if (empty) {
    return (
      <Box variant="dark" padding="lg" className="quiz-tone flex-col gap-md">
        <EmptyState
          icon="quiz"
          title="No tone-judgment questions yet"
          description="This phase has no rule-anchored items available right now."
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
      <Box variant="dark" padding="lg" className="quiz-tone flex-col gap-md">
        <ErrorScreen error={error} onRetry={onRetry ?? NOOP} />
      </Box>
    );
  }

  const chosenLabel =
    selected !== null ? (TONE_NAMES[Number(selected)] ?? `tone ${selected}`) : "no tone chosen";

  return (
    <Box
      variant="dark"
      padding="lg"
      role="group"
      aria-label={VIEW_LABEL}
      aria-disabled={isLocked || undefined}
      aria-busy={submitting || undefined}
      className={["quiz-tone flex-col gap-md", className].filter(Boolean).join(" ")}
      onKeyDown={handleKeyDown}
    >
      <h2 ref={headingRef} tabIndex={-1} className="font-lg fw-600 text-primary m-0">
        {question}
      </h2>

      <div className="flex-align-center gap-sm flex-wrap">
        <Badge variant="surface">{ruleName}</Badge>
      </div>

      <div className="flex-align-center flex-wrap gap-xs">
        {syllables.map((syllable, index) =>
          syllable.target ? (
            <Box
              key={`${syllable.text}-${index}`}
              variant="dashed"
              as="span"
              padding="xs"
              className="inline-flex flex-col items-center font-xl lh-tight"
            >
              {syllable.text}
              <span className="lh-1-4 font-xs text-muted">
                base {TONE_NAMES[syllable.baseTone] ?? "tone ?"}
              </span>
            </Box>
          ) : (
            <span
              key={`${syllable.text}-${index}`}
              className="inline-flex flex-col items-center font-xl lh-tight text-primary"
            >
              {syllable.text}
              <span className="lh-1-4 font-xs text-muted">
                base {TONE_NAMES[syllable.baseTone] ?? "tone ?"}
              </span>
            </span>
          ),
        )}
      </div>

      <div className="quiz-select__options">
        <RadioGroup
          name={groupName}
          options={options}
          value={selected}
          onChange={(value) => onSelect?.(value)}
          layout="vertical"
          label="Surface tone of the target syllable"
        />
      </div>

      <p className="font-sm text-muted m-0">
        {isLocked
          ? "Checking your answer..."
          : selected
            ? `You chose ${chosenLabel}. Press Enter or Check to submit.`
            : "Choose the surface tone, or press 0 to 4."}
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
            {outcome.correct
              ? `Correct. It surfaces as ${outcome.answerLabel}.`
              : `Incorrect. It is ${outcome.answerLabel}.`}
          </p>
          <p className="font-sm text-secondary m-0 lh-normal">Surface tones: {outcome.reveal}</p>
          {outcome.ruleTitle && (
            <p className="font-sm text-muted m-0 lh-normal">{outcome.ruleTitle}</p>
          )}
        </Box>
      )}
    </Box>
  );
}
