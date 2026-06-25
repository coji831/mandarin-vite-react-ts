/**
 * QuizResults.tsx
 * Phase 1 Gate Quiz — Score/pass/fail display
 *
 * Shows the final score, pass/fail status, timer, and action button.
 * On pass: navigates to /learn (backend already updated the phase gate
 *           during completeQuizAttempt).
 * On fail: offers try-again via store.retry().
 *
 * Wireframe Section 4.7 (simplified).
 */

import { useNavigate } from "react-router-dom";
import { useQuizSessionStore } from "../../stores/quizSessionStore";
import { PhaseGateBadge } from "./PhaseGateBadge";
import { CategoryBreakdown } from "./CategoryBreakdown";

/** Format seconds to M:SS */
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Quiz results screen */
export function QuizResults() {
  const navigate = useNavigate();
  const answers = useQuizSessionStore((s) => s.answers);
  const questions = useQuizSessionStore((s) => s.questions);
  const timer = useQuizSessionStore((s) => s.timer);
  const completionResult = useQuizSessionStore((s) => s.completionResult);
  const retry = useQuizSessionStore((s) => s.retry);

  // Use backend completion result if available, otherwise fall back to local calculation
  const totalQuestions = completionResult?.maxScore ?? questions.length;
  const correct = completionResult?.totalScore ?? answers.filter((a) => a.correct).length;
  const pct = totalQuestions > 0 ? Math.round((correct / totalQuestions) * 100) : 0;
  const passed = pct >= 90;

  const handlePass = () => {
    navigate("/learn");
  };

  return (
    <div className="flex-col-center gap-lg">
      <h2 className="quiz-results__heading text-primary font-2xl">📊 Quiz Complete</h2>

      <div className="card-dark flex-col-center gap-md quiz-results__card">
        {/* Score */}
        <div className="flex-center gap-md">
          <span className="quiz-results__score fw-800 text-primary font-3xl">
            {correct}/{totalQuestions} ({pct}%)
          </span>
          <span style={{ fontSize: "var(--font-2xl)" }}>{passed ? "✅" : "❌"}</span>
        </div>

        {/* Pass/fail message */}
        <PhaseGateBadge passed={passed} />

        {/* Timer display */}
        <div className="quiz-results__timer text-muted font-md">
          ⏱ Time: {formatTime(timer < 0 ? 0 : timer)}
        </div>
      </div>

      {/* Category breakdown */}
      <CategoryBreakdown answers={answers} />

      {/* Action button */}
      <div className="flex-center gap-md">
        {passed ? (
          <button className="btn btn-primary btn-lg" onClick={handlePass}>
            Continue to Phase 2 \u2192
          </button>
        ) : (
          <button className="btn btn-primary btn-lg" onClick={retry}>
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}
