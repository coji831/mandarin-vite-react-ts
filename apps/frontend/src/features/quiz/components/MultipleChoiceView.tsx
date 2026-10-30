/**
 * MultipleChoiceView.tsx
 * Phase 2 Review — Multiple choice question view
 *
 * Renders a multiple-choice question for strategies like Radical Splitter
 * and Radical Gate Quiz. Displays the character/radical, prompt, and
 * clickable option buttons.
 *
 * Phase machine: LOADING → QUESTION → INPUT → FEEDBACK → RESULTS
 */

import { useCallback, useEffect, useRef } from "react";
import { useQuizSessionStore } from "../stores/quizSessionStore";
import { Box, RadioGroup } from "shared/components";
import type { RadioOption } from "shared/components";

/** Multiple choice question view */
export function MultipleChoiceView() {
  const currentIndex = useQuizSessionStore((s) => s.currentIndex);
  const questions = useQuizSessionStore((s) => s.questions);
  const submitAnswer = useQuizSessionStore((s) => s.submitAnswer);
  const promptRef = useRef<HTMLHeadingElement>(null);
  const question = questions[currentIndex];

  // The prompt takes focus when the question changes, so the per-question swap
  // never drops focus to <body> (WCAG 2.4.3) and the first Tab lands on the
  // first option — never on an action.
  useEffect(() => {
    promptRef.current?.focus();
  }, [currentIndex]);

  const handleSelect = useCallback(
    (optionId: string) => {
      submitAnswer(optionId, 0);
    },
    [submitAnswer],
  );

  if (!question) {
    return (
      <Box variant="dark" padding="md" className="quiz-question-empty">
        No question available
      </Box>
    );
  }

  const options = question.options ?? [];

  const radioOptions: RadioOption[] = options.map((opt) => ({
    value: opt.id,
    label: `${opt.glyph} — ${opt.meaning}`,
  }));

  return (
    <Box variant="dark" padding="md" className="flex-col gap-md quiz-question">
      {/* Character + Meaning display */}
      <div className="quiz-question__character-display flex-col-center gap-xs text-center">
        {question.character && (
          <span className="quiz-question__character font-3xl fw-700">{question.character}</span>
        )}
        {question.meaning && (
          <span className="quiz-question__meaning text-secondary font-md">{question.meaning}</span>
        )}
        {question.displayPinyin && (
          <span className="quiz-question__pinyin text-tertiary font-sm">
            {question.displayPinyin}
          </span>
        )}
      </div>

      {/* Custom prompt or default */}
      <h2 ref={promptRef} tabIndex={-1} className="text-secondary text-center font-md m-0">
        {question.prompt ?? "Which radical gives this character its meaning?"}
      </h2>

      {/* Multiple choice options */}
      <div className="quiz-mc-options w-full">
        <RadioGroup
          name="mc-options"
          options={radioOptions}
          value={null}
          onChange={handleSelect}
          layout="vertical"
        />
      </div>
    </Box>
  );
}
