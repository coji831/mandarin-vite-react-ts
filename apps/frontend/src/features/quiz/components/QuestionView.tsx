/**
 * QuestionView.tsx
 * Phase 1 Gate Quiz — Question display
 *
 * Renders the current question with question counter, category badge,
 * audio player, and the answer input (PinyinToneInput).
 *
 * Wireframe Section 4.6 top portion.
 */

import { useQuizSessionStore } from "../stores/quizSessionStore";
import { AudioPlayer } from "./AudioPlayer";
import { AnswerInput } from "./AnswerInput";

/** Question display with category, audio, and input */
export function QuestionView() {
  const currentIndex = useQuizSessionStore((s) => s.currentIndex);
  const questions = useQuizSessionStore((s) => s.questions);
  const question = questions[currentIndex];

  if (!question) {
    return <div className="card-dark quiz-question-empty">No question available</div>;
  }

  return (
    <div className="card-dark flex-col gap-md quiz-question">
      {/* Audio player */}
      <AudioPlayer audioKey={question.audioKey} character={question.character} />

      {/* Listen prompt */}
      <p className="quiz-question__prompt text-tertiary text-center font-sm">
        Listen to the audio, then:
      </p>

      {/* Answer input */}
      <AnswerInput />
    </div>
  );
}
