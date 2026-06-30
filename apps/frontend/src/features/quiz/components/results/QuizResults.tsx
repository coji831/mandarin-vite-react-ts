/**
 * QuizResults.tsx
 * Phase 1 Gate Quiz — Score/pass/fail display
 *
 * Shows the final score, pass/fail status, timer, action button,
 * score visualization bar, and collapsible per-question answer review.
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
import { getStrategy } from "../../engine/strategies";

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
  const score = useQuizSessionStore((s) => s.score);
  const timer = useQuizSessionStore((s) => s.timer);
  const completionResult = useQuizSessionStore((s) => s.completionResult);
  const strategyType = useQuizSessionStore((s) => s.strategyType);
  const retry = useQuizSessionStore((s) => s.retry);

  const strategy = getStrategy(strategyType);
  const strategyConfig = useQuizSessionStore((s) => s.strategyConfig);
  // passThreshold comes from backend via strategyConfig (fetched at session init)
  // At RESULTS phase, strategyConfig must be populated — no hardcoded fallback
  const passThreshold = strategyConfig?.passThreshold;
  const nextPhase = (strategy?.phase ?? 1) + 1;

  // Use backend completion result if available, otherwise fall back to local store's score
  const totalQuestions = completionResult?.maxScore ?? questions.length;
  const correct = completionResult?.totalScore ?? score;
  const pct = totalQuestions > 0 ? Math.round((correct / totalQuestions) * 100) : 0;
  const passed =
    completionResult?.passed ?? (passThreshold != null ? pct >= passThreshold * 100 : false);

  const resultCardClass = `card-dark flex-col-center gap-md quiz-results__card ${passed ? "quiz-results__card--passed" : "quiz-results__card--failed"}`;

  const PHASE_ROUTES: Record<number, string> = { 2: "/learn/radicals" };
  const handlePass = () => {
    const targetRoute = PHASE_ROUTES[nextPhase] ?? "/learn";
    navigate(targetRoute);
  };

  return (
    <div className="flex-col-center gap-lg">
      <h2 className="quiz-results__heading text-primary font-2xl">📊 Quiz Complete</h2>

      <div className={resultCardClass}>
        {/* Score */}
        <div className="flex-center gap-md">
          <span className="quiz-results__score fw-800 text-primary font-3xl">
            {correct}/{totalQuestions} ({pct}%)
          </span>
          <span style={{ fontSize: "var(--font-2xl)" }}>{passed ? "✅" : "❌"}</span>
        </div>

        {/* Pass/fail message */}
        <PhaseGateBadge passed={passed} unlockedPhase={nextPhase} />

        {/* Timer display */}
        <div className="quiz-results__timer text-muted font-md">
          ⏱ Time: {formatTime(timer < 0 ? 0 : timer)}
        </div>

        {/* Score visualization bar */}
        <div
          className="quiz-results__bar-wrapper"
          style={{
            width: "100%",
            height: 8,
            background: "var(--surface-border, #3a3a5c)",
            borderRadius: "var(--radius-pill, 999px)",
            overflow: "hidden",
          }}
        >
          <div
            className="quiz-results__bar-fill"
            style={{
              width: `${pct}%`,
              height: "100%",
              background: passed ? "var(--color-success, #00c853)" : "var(--color-error, #ff1744)",
              borderRadius: "var(--radius-pill, 999px)",
              transition: "width 0.5s ease",
            }}
          />
        </div>
      </div>

      {/* Category breakdown (only applicable to pinyin/tone quizzes, not IME simulator) */}
      {strategyType !== "ime-simulator" && <CategoryBreakdown answers={answers} />}

      {/* Action button */}
      <div className="flex-center gap-md">
        {passed ? (
          <button className="btn btn-primary btn-lg" onClick={handlePass}>
            Continue to Phase {nextPhase} \u2192
          </button>
        ) : (
          <button className="btn btn-primary btn-lg" onClick={retry}>
            Try Again
          </button>
        )}
      </div>

      {/* Answer review section (collapsible) */}
      <details className="quiz-results__review card-dark p-md radius-md" style={{ width: "100%" }}>
        <summary className="fw-600 text-primary font-md" style={{ cursor: "pointer" }}>
          📋 Review Answers ({answers.length} questions)
        </summary>
        <div className="flex-col gap-xs" style={{ marginTop: "var(--space-md)" }}>
          {questions.map((q, i) => {
            const answer = answers[i];
            const isCorrect = answer?.correct ?? false;
            return (
              <div
                key={q.id}
                className="flex-between gap-md p-xs radius-sm"
                style={{
                  background: isCorrect
                    ? "var(--color-success-bg, rgba(0,200,83,0.08))"
                    : "var(--color-error-bg, rgba(255,23,68,0.08))",
                  borderLeft: `3px solid ${
                    isCorrect ? "var(--color-success, #00c853)" : "var(--color-error, #ff1744)"
                  }`,
                  padding: "var(--space-xs) var(--space-sm)",
                }}
              >
                <div className="flex-col gap-xs">
                  <span className="font-sm text-primary">
                    Q{i + 1}: {q.character || q.displayPinyin || q.correctPinyin}
                  </span>
                  {q.meaning && <span className="font-xs text-muted">{q.meaning}</span>}
                </div>
                <span className={`font-sm fw-600 ${isCorrect ? "text-success" : "text-error"}`}>
                  {isCorrect ? "✅" : "❌"}
                </span>
              </div>
            );
          })}
        </div>
      </details>
    </div>
  );
}
