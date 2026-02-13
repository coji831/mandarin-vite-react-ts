/**
 * QuizComplete Component
 * Story 15.6: Quiz Container & State Management
 *
 * Displays quiz results with accuracy metrics.
 * Shows correct/incorrect count and overall percentage.
 * Provides retry button to restart quiz.
 */

import { QuizAnswer } from "../types/QuizTypes";
import "./QuizComplete.css";

export { QuizComplete };

type QuizCompleteProps = {
  answers: QuizAnswer[];
};

function QuizComplete({ answers }: QuizCompleteProps) {
  const correctCount = answers.filter((a) => a.correct).length;
  const accuracy = answers.length > 0 ? Math.round((correctCount / answers.length) * 100) : 0;

  return (
    <div className="quizCompleteContainer">
      <h2 className="completeTitle">Quiz Complete! 🎉</h2>
      <div className="resultsCard">
        <p className="resultText">
          Correct: {correctCount} / {answers.length}
        </p>
        <p className="accuracyText">Accuracy: {accuracy}%</p>
      </div>
      <button onClick={() => window.location.reload()} className="retryButton">
        Retry Quiz
      </button>
    </div>
  );
}
