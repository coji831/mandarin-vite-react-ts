/**
 * @file components/PictographMatchGame.tsx
 * @description Pictograph Match mini-game — oracle bone description to modern character matching
 * Story 21.21: Pictograph Warmup (Gallery + Mini-game)
 *
 * Standalone client-side exception to the quiz strategy pattern:
 * - Uses hardcoded character data (not API-driven)
 * - Does not extend quizStore or StrategyType
 * - Results stored locally only (no backend persistence)
 */

import { useEffect } from "react";
import { Button, ProgressBar } from "shared/components";
import { usePictographMatchStore } from "../stores/pictographMatchStore";
import "./PictographMatchGame.css";

interface PictographMatchGameProps {
  onBackToGallery?: () => void;
}

export function PictographMatchGame({ onBackToGallery }: PictographMatchGameProps) {
  const {
    questions,
    currentQuestion,
    score,
    isComplete,
    selectedAnswer,
    showResult,
    startRound,
    answerQuestion,
    nextQuestion,
    reset,
  } = usePictographMatchStore();

  // Start a round when component mounts (if none started)
  useEffect(() => {
    if (questions.length === 0 && !isComplete) {
      startRound();
    }
  }, [questions.length, isComplete, startRound]);

  // ─── End Screen ──────────────────────────────────────────────────────

  if (isComplete) {
    const total = questions.length;
    const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
    const passed = percentage >= 70;

    return (
      <div className="pictograph-match">
        <div className="pictograph-match__end-screen">
          <p className="pictograph-match__end-score">
            {score} / {total}
          </p>
          <p className="pictograph-match__end-label">Questions Correct</p>
          <p
            className={`pictograph-match__end-result ${
              passed ? "pictograph-match__end-result--pass" : "pictograph-match__end-result--fail"
            }`}
          >
            {passed ? "✅ Pictograph Master!" : "❌ Keep Practicing!"}
          </p>
          {passed && (
            <p className="text-tertiary font-sm m-0 mb-md">
              You've unlocked the Phase 2 gate requirement for pictographs!
            </p>
          )}
          {!passed && (
            <p className="text-tertiary font-sm m-0 mb-md">
              Score at least 70% to pass. Try again!
            </p>
          )}
          <Button className="pictograph-match__retry-btn" onClick={() => reset()} variant="primary">
            🔄 Play Again
          </Button>
          {onBackToGallery && (
            <Button
              style={{ marginLeft: "var(--space-sm)" }}
              onClick={onBackToGallery}
              variant="ghost"
            >
              ← Back to Gallery
            </Button>
          )}
        </div>
      </div>
    );
  }

  // ─── Empty / No Questions ────────────────────────────────────────────

  if (questions.length === 0) {
    return (
      <div className="pictograph-match">
        <div className="pictograph-match__empty">
          <p>No questions available. Please try again.</p>
          <Button onClick={() => startRound()} variant="primary">
            Start Round
          </Button>
        </div>
      </div>
    );
  }

  // ─── Active Question ─────────────────────────────────────────────────

  const question = questions[currentQuestion];
  const total = questions.length;
  const progressPercent = (currentQuestion / total) * 100;
  const isCorrect = selectedAnswer === question.correctAnswer;

  return (
    <div className="pictograph-match">
      <div className="pictograph-match__header">
        <h2 className="pictograph-match__title">🎮 Pictograph Match</h2>
        <p className="text-tertiary font-sm m-0">
          Match the oracle bone description to the correct modern character
        </p>
      </div>

      <div className="pictograph-match__progress-info">
        <span>
          Question {currentQuestion + 1} of {total}
        </span>
        <span>Score: {score}</span>
      </div>

      <ProgressBar value={progressPercent} />

      <div className="pictograph-match__question-area">
        <p className="pictograph-match__description">{question.oracleBoneDescription}</p>
        <p className="pictograph-match__prompt">Which modern character does this describe?</p>

        <div className="pictograph-match__options">
          {question.options.map((option) => {
            let optionClass = "pictograph-match__option-btn";
            if (showResult) {
              if (option === question.correctAnswer) {
                optionClass += " pictograph-match__option-btn--correct";
              } else if (option === selectedAnswer && !isCorrect) {
                optionClass += " pictograph-match__option-btn--wrong";
              }
            }

            return (
              <button
                key={option}
                className={optionClass}
                onClick={() => {
                  if (!showResult) answerQuestion(option);
                }}
                disabled={showResult}
                type="button"
                aria-label={`Select character ${option}`}
              >
                {option}
              </button>
            );
          })}
        </div>
      </div>

      {showResult && (
        <div className="pictograph-match__result-area">
          {isCorrect ? (
            <p className="pictograph-match__result-text text-success">✅ Correct!</p>
          ) : (
            <p className="pictograph-match__result-text text-error">
              ❌ The correct answer was: <strong>{question.correctAnswer}</strong>
            </p>
          )}
          <p className="pictograph-match__etymology">
            {question.oracleBoneDescription.replace(
              "In ancient oracle bone script, this character ",
              "",
            )}
          </p>
          <Button
            className="pictograph-match__next-btn"
            onClick={() => nextQuestion()}
            variant="primary"
          >
            {currentQuestion + 1 >= total ? "See Results" : "Next →"}
          </Button>
        </div>
      )}
    </div>
  );
}
