/**
 * QuestionView.tsx
 * Phase 1 Gate Quiz — Question display
 *
 * Renders the current question with the audio player and the answer input
 * (PinyinToneInput).
 *
 * The prompt glyph follows the active strategy's `promptGlyph` contract
 * (rework-proposal §7): "hide" means the Chinese character IS the answer for
 * that exercise, so printing it would leak it. The glyph still reaches
 * `AudioPlayer` — TTS needs it whether or not the learner may see it.
 *
 * Wireframe Section 4.6 top portion.
 */

import { useQuizSessionStore } from "../stores/quizSessionStore";
import { getStrategy } from "../engine/strategies";
import { Box } from "shared/components";
import { AudioPlayer } from "./AudioPlayer";
import { AnswerInput } from "./AnswerInput";

/** Question display with audio, optional glyph, and input */
export function QuestionView() {
  const currentIndex = useQuizSessionStore((s) => s.currentIndex);
  const questions = useQuizSessionStore((s) => s.questions);
  const strategyType = useQuizSessionStore((s) => s.strategyType);
  const question = questions[currentIndex];

  if (!question) {
    return (
      <Box variant="dark" padding="md" className="quiz-question-empty">
        No question available
      </Box>
    );
  }

  // Strategy contract, not a per-view guess: an unknown strategy falls back to
  // showing the glyph (the historical behaviour) rather than silently hiding it.
  const showGlyph = getStrategy(strategyType)?.promptGlyph !== "hide";

  return (
    <Box variant="dark" padding="md" className="flex-col gap-md quiz-question">
      {/* Audio player — always receives the glyph for TTS */}
      <AudioPlayer audioKey={question.audioKey} character={question.character} />

      {/* Glyph (only when the strategy says it is the prompt) + meaning clue */}
      {(showGlyph && question.character) || question.meaning ? (
        <div className="quiz-question__character-display flex-col-center gap-xs text-center">
          {showGlyph && question.character && (
            <span className="quiz-question__character font-3xl fw-700">{question.character}</span>
          )}
          {question.meaning && (
            <span className="quiz-question__meaning text-secondary font-md">
              ({question.meaning})
            </span>
          )}
        </div>
      ) : null}

      {/* Listen prompt */}
      <p className="text-tertiary text-center font-sm">Listen to the audio, then:</p>

      {/* Answer input */}
      <AnswerInput />
    </Box>
  );
}
