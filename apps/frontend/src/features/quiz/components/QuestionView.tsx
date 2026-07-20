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
import { Box } from "shared/components";
import { AudioPlayer } from "./AudioPlayer";
import { AnswerInput } from "./AnswerInput";

/** Question display with category, audio, and input */
export function QuestionView() {
  const currentIndex = useQuizSessionStore((s) => s.currentIndex);
  const questions = useQuizSessionStore((s) => s.questions);
  const question = questions[currentIndex];

  if (!question) {
    return (
      <Box variant="dark" padding="md" className="quiz-question-empty">
        No question available
      </Box>
    );
  }

  return (
    <Box variant="dark" padding="md" className="flex-col gap-md quiz-question">
      {/* Audio player */}
      <AudioPlayer audioKey={question.audioKey} character={question.character} />

      {/* Character + Meaning display */}
      {question.character && (
        <div className="quiz-question__character-display flex-col-center gap-xs text-center">
          <span className="quiz-question__character font-3xl fw-700">{question.character}</span>
          {question.meaning && (
            <span className="quiz-question__meaning text-secondary font-md">
              ({question.meaning})
            </span>
          )}
        </div>
      )}

      {/* Listen prompt */}
      <p className="text-tertiary text-center font-sm">Listen to the audio, then:</p>

      {/* Answer input */}
      <AnswerInput />
    </Box>
  );
}
