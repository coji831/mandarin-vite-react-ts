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

import { useCallback } from "react";
import { useQuizSessionStore } from "../stores/quizSessionStore";

/** Multiple choice question view */
export function MultipleChoiceView() {
  const currentIndex = useQuizSessionStore((s) => s.currentIndex);
  const questions = useQuizSessionStore((s) => s.questions);
  const submitAnswer = useQuizSessionStore((s) => s.submitAnswer);
  const question = questions[currentIndex];

  const handleSelect = useCallback(
    (optionId: string) => {
      submitAnswer(optionId, 0);
    },
    [submitAnswer],
  );

  if (!question) {
    return <div className="card-dark quiz-question-empty">No question available</div>;
  }

  const options = question.options ?? [];

  return (
    <div className="card-dark flex-col gap-md quiz-question">
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
      <p className="quiz-question__prompt text-secondary text-center font-md">
        {question.prompt ?? "Which radical gives this character its meaning?"}
      </p>

      {/* Multiple choice options */}
      <div
        className="quiz-mc-options flex flex-col gap-sm w-full"
        role="radiogroup"
        aria-label="Answer options"
      >
        {options.map((option, index) => (
          <button
            key={option.id}
            className="btn-outline quiz-mc-option quiz-mc-option__btn"
            onClick={() => handleSelect(option.id)}
            type="button"
            role="radio"
            aria-checked={false}
            aria-label={`${option.glyph} — ${option.meaning}`}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown" || e.key === "ArrowRight") {
                e.preventDefault();
                const next = e.currentTarget.parentElement?.children[
                  index + 1
                ] as HTMLElement | null;
                next?.focus();
              } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
                e.preventDefault();
                const prev = e.currentTarget.parentElement?.children[
                  index - 1
                ] as HTMLElement | null;
                prev?.focus();
              }
            }}
          >
            <span className="quiz-mc-option__glyph font-xl fw-600">{option.glyph}</span>
            <span className="quiz-mc-option__meaning text-secondary">— {option.meaning}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
