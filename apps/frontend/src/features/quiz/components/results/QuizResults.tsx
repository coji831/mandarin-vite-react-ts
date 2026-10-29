/**
 * QuizResults.tsx
 * Phase 1 Gate Quiz — Score/pass/fail display
 *
 * Shows the final score, pass/fail status, timer, the ONE next action (rework-
 * proposal §7: "Review what you missed" — a real review queue for the same
 * material), score visualization bar, and collapsible per-question answer review.
 *
 * Wireframe Section 4.7 (simplified).
 */

import { useNavigate } from "react-router-dom";
import { useQuizSessionStore } from "../../stores/quizSessionStore";
import { PhaseGateBadge } from "./PhaseGateBadge";
import { CategoryBreakdown } from "./CategoryBreakdown";
import { getStrategy } from "../../engine/strategies";
import { Box, Button, Icon } from "shared/components";
import { ClassificationBadge } from "shared/components";
import { useAuth } from "features/auth";
import { practices_page, register_page, withSearchParams } from "shared/constants";

/** Format seconds to M:SS */
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * Quiz strategy → the review content type that re-exercises the same material.
 * "Review what you missed" is the results screen's single next step, so it has
 * to land on a real review queue (rework-proposal §7).
 */
const REVIEW_TYPE_BY_STRATEGY: Record<string, string> = {
  "audio-to-pinyin-tone": "pinyin",
  "ime-simulator": "char-radical",
  "radical-gate": "radicals",
};

const PRACTICES_REVIEW_PATH = "/practices/review";

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

  const isGuest = !isAuthenticated;

  const scoreByType = useQuizSessionStore((s) => s.scoreByType);

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

  const handleGuestRegister = () => {
    navigate(register_page);
  };

  // ── The ONE primary action (rework-proposal §7) ──────────────────────────
  // "Review what you missed" is the next session — a real review queue for the
  // same material. A perfect score has nothing to miss, so the primary becomes
  // the way out instead of inventing a second action. Back to Practices is
  // always the ghost, and the guest's persistence ask is a ghost too: on this
  // screen the learner's next step outranks the pitch.
  const missedCount = Math.max(0, totalQuestions - correct);
  const reviewType = REVIEW_TYPE_BY_STRATEGY[strategyType] ?? "pinyin";
  const reviewHref = withSearchParams(PRACTICES_REVIEW_PATH, {
    type: reviewType,
    filter: "recent",
  });
  const primaryLabel = missedCount > 0 ? "Review what you missed" : "Back to Practices";
  const handlePrimary = () => {
    if (missedCount > 0) {
      navigate(reviewHref);
    } else {
      navigate(practices_page);
    }
  };

  return (
    <div className="flex-col-center gap-lg">
      <h2 className="quiz-results__heading flex-align-center gap-xs text-primary font-2xl">
        <Icon name="progress" size={24} aria-hidden />
        Quiz Complete
      </h2>

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
          <span className={passed ? "text-success" : "text-error"}>
            <Icon
              name={passed ? "check" : "cross"}
              size={24}
              label={passed ? "Passed" : "Not passed"}
            />
          </span>
        </div>

        {/* Pass/fail message */}
        <PhaseGateBadge passed={passed} unlockedPhase={nextPhase} isGuest={isGuest} />

        {/* Timer display */}
        <div className="quiz-results__timer text-muted font-md">
          Time: {formatTime(timer < 0 ? 0 : timer)}
        </div>

        {/* Score visualization bar */}
        <div className="quiz-results__bar-wrapper bg-surface-dark radius-pill w-full overflow-hidden h-8px">
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
      {strategyType !== "ime-simulator" && (
        <CategoryBreakdown
          answers={answers}
          categoryBreakdown={completionResult?.categoryBreakdown}
          total={totalQuestions}
        />
      )}

      {/* Score by Type (IME Simulator only — classification-based breakdown) */}
      {strategyType === "ime-simulator" && Object.keys(scoreByType).length > 0 && (
        <Box variant="dark" padding="md" className="flex-col gap-md w-full">
          <h3 className="quiz-results__score-by-type-heading flex-align-center gap-xs font-lg text-primary m-0">
            <Icon name="progress" size={16} aria-hidden />
            Score by Type
          </h3>
          {Object.entries(scoreByType).map(([type, { correct, total }]) => (
            <div key={type} className="flex-align-center gap-md">
              <ClassificationBadge classification={type} showLabel={true} size="sm" />
              <span className="font-sm text-primary">
                {correct}/{total}
              </span>
            </div>
          ))}
        </Box>
      )}

      {/* Action buttons — exactly one primary */}
      <div className="flex-center gap-md flex-wrap">
        <Button variant="primary" size="lg" onClick={handlePrimary}>
          {primaryLabel}
        </Button>
        {missedCount > 0 && (
          <Button variant="ghost" size="lg" onClick={() => navigate(practices_page)}>
            Back to Practices
          </Button>
        )}
        {isGuest && (
          <Button variant="ghost" size="lg" onClick={handleGuestRegister}>
            Create an account to keep your progress
          </Button>
        )}
      </div>

      {/* Answer review section (collapsible) */}
      <Box as="details" variant="dark" padding="md" className="quiz-results__review w-full">
        <summary className="fw-600 text-primary font-md cursor-pointer">
          Review Answers ({answers.length} questions)
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
                  <Icon
                    name={isCorrect ? "check" : "cross"}
                    size={16}
                    label={isCorrect ? "Correct" : "Incorrect"}
                  />
                </span>
              </Box>
            );
          })}
        </div>
      </Box>
    </div>
  );
}
