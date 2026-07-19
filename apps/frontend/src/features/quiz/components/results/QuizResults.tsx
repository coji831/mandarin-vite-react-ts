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
import { Box, Button } from "shared/components";
import { useAuth } from "features/auth";
import { register_page } from "shared/constants";

/** Format seconds to M:SS */
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Quiz results screen */
export function QuizResults() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const answers = useQuizSessionStore((s) => s.answers);
  const questions = useQuizSessionStore((s) => s.questions);
  const score = useQuizSessionStore((s) => s.score);
  const timer = useQuizSessionStore((s) => s.timer);
  const completionResult = useQuizSessionStore((s) => s.completionResult);
  const strategyType = useQuizSessionStore((s) => s.strategyType);
  const retry = useQuizSessionStore((s) => s.retry);

  const isGuest = !isAuthenticated;

  const strategy = getStrategy(strategyType);
  const strategyConfig = useQuizSessionStore((s) => s.strategyConfig);
  // passThreshold comes from backend via strategyConfig (fetched at session init)
  // At RESULTS phase, strategyConfig must be populated — no hardcoded fallback
  const passThreshold = strategyConfig?.passThreshold;
  const strategyPhase = strategy?.phase;
  const isGateQuiz = strategyPhase != null && strategyPhase > 0;
  const nextPhase = isGateQuiz ? strategyPhase + 1 : 2;

  // Use backend completion result if available, otherwise fall back to local store's score
  const totalQuestions = completionResult?.maxScore ?? questions.length;
  const correct = completionResult?.totalScore ?? score;
  const pct = totalQuestions > 0 ? Math.round((correct / totalQuestions) * 100) : 0;
  const passed =
    completionResult?.passed ?? (passThreshold != null ? pct >= passThreshold * 100 : false);

  const PHASE_ROUTES: Record<number, string> = { 2: "/learn/radicals" };
  const handlePass = () => {
    const targetRoute = PHASE_ROUTES[nextPhase] ?? "/learn";
    navigate(targetRoute);
  };

  const handleGuestRegister = () => {
    navigate(register_page);
  };

  return (
    <div className="flex-col-center gap-lg">
      <h2 className="quiz-results__heading text-primary font-2xl">📊 Quiz Complete</h2>

      <Box
        variant={passed ? "pass" : "fail"}
        padding="md"
        className="quiz-results__card flex-col-center gap-md"
      >
        {/* Score */}
        <div className="flex-center gap-md">
          <span className="quiz-results__score fw-800 text-primary font-3xl">
            {correct}/{totalQuestions} ({pct}%)
          </span>
          <span className="font-2xl">{passed ? "✅" : "❌"}</span>
        </div>

        {/* Pass/fail message */}
        <PhaseGateBadge passed={passed} unlockedPhase={nextPhase} isGuest={isGuest} />

        {/* Timer display */}
        <div className="quiz-results__timer text-muted font-md">
          ⏱ Time: {formatTime(timer < 0 ? 0 : timer)}
        </div>

        {/* Score visualization bar */}
        <div
          className="quiz-results__bar-wrapper bg-surface-dark radius-pill"
          style={{
            width: "100%",
            height: 8,
            overflow: "hidden",
          }}
        >
          <div
            className={`quiz-results__bar-fill radius-pill transition-width ${passed ? "bg-success" : "bg-error"}`}
            style={{
              width: `${pct}%`,
              height: "100%",
            }}
          />
        </div>
      </Box>

      {/* Category breakdown (only applicable to pinyin/tone quizzes, not IME simulator) */}
      {strategyType !== "ime-simulator" && <CategoryBreakdown answers={answers} />}

      {/* Action button */}
      <div className="flex-center gap-md">
        {isGuest && passed ? (
          <Button variant="primary" size="lg" onClick={handleGuestRegister}>
            📝 Register to save your progress
          </Button>
        ) : passed ? (
          <Button variant="primary" size="lg" onClick={handlePass}>
            Continue to Phase {nextPhase} \u2192
          </Button>
        ) : (
          <Button variant="primary" size="lg" onClick={retry}>
            Try Again
          </Button>
        )}
      </div>
      {isGuest && !passed && (
        <p className="font-sm text-secondary m-0">Register to track your scores across sessions.</p>
      )}

      {/* Answer review section (collapsible) */}
      <Box as="details" variant="dark" padding="md" className="quiz-results__review w-full">
        <summary className="fw-600 text-primary font-md" style={{ cursor: "pointer" }}>
          📋 Review Answers ({answers.length} questions)
        </summary>
        <div className="flex-col gap-xs mt-md">
          {questions.map((q, i) => {
            const answer = answers[i];
            const isCorrect = answer?.correct ?? false;
            return (
              <Box
                key={q.id}
                variant={isCorrect ? "pass" : "fail"}
                className="flex-between gap-md p-xs"
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
              </Box>
            );
          })}
        </div>
      </Box>
    </div>
  );
}
