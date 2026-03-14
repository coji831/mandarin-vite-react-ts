/**
 * FeedbackSection Component
 * Epic 19: State Refactor - Extracted from ExamLayout
 * Merged with FeedbackDisplay component for consolidation
 *
 * Renders feedback section after answer submission:
 * - Shows correct/incorrect status with styled message
 * - For incorrect: displays user answer (red, strikethrough) vs correct answer (green, checkmark)
 * - Displays AI-generated feedback for incorrect answers (loading state + explanation)
 * - Provides Next button to continue
 */

import { Button } from "../../../../components";
import "./FeedbackSection.css";

type FeedbackSectionProps = {
  isCorrect: boolean;
  aiFeedback: string | null;
  userAnswer: string;
  correctAnswer: string;
  onNext: () => void;
};

export function FeedbackSection({
  isCorrect,
  aiFeedback,
  userAnswer,
  correctAnswer,
  onNext,
}: FeedbackSectionProps) {
  return (
    <>
      <div className="answerContent">
        <div
          className={`feedbackContainer flex-col-center text-center ${isCorrect ? "feedbackCorrect" : "feedbackIncorrect"}`}
        >
          <p
            className={`feedbackText ${isCorrect ? "feedbackTextCorrect" : "feedbackTextIncorrect"}`}
          >
            {isCorrect ? "✓ Correct!" : "✗ Incorrect"}
          </p>

          {/* Answer comparison for incorrect answers (hidden when AI feedback is available) */}
          {!isCorrect && userAnswer && correctAnswer && !aiFeedback && (
            <div className="answerComparison flex-center text-center">
              <span className="userAnswerWrong">
                <del>{userAnswer}</del>
              </span>
              <span className="comparisonArrow"> → </span>
              <span className="correctAnswerRight">✓ {correctAnswer}</span>
            </div>
          )}

          {/* AI-generated feedback for incorrect answers */}
          {!isCorrect && (
            <div className="aiFeedbackSection w-full flex-col-center">
              {aiFeedback && (
                <div className="aiFeedbackBox">
                  <p className="aiFeedbackLabel">💡 Tip:</p>
                  <p className="aiFeedbackText">{aiFeedback}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="answerActionBar">
        <Button variant="primary" onClick={onNext}>
          Next →
        </Button>
      </div>
    </>
  );
}
