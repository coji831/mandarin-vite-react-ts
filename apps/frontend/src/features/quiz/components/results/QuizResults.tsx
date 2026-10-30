/**
 * QuizResults.tsx
 * Phase 1 Gate Quiz — Score/pass/fail display
 *
 * The results column is value → slot → review (§26.2.2):
 *   1. the value — score card, pass message, timer, bar, then the breakdown;
 *   2. `CompletionSlot` — the ONE position-locked primary for this identity
 *      (§26.2.3), with ghost secondaries passed INTO the slot, never as siblings;
 *   3. the collapsible answer review — content, not an action.
 *
 * Identity decides the primary: a registered learner reviews what they missed
 * (or leaves on a perfect score); a guest's only honest next step is persistence,
 * because nothing was written server-side for their attempt (§26.4.5).
 *
 * Guest scores are session-local. The mock completion the server returns for a
 * guest attempt is `{totalScore: 0, maxScore: 0, passed: false}`, so a guest who
 * scored 9/10 must still read 9/10 (90%) — never "0/0", and never a failure
 * badge a server stub invented.
 *
 * Focus: the `<h2>` takes focus on mount (`tabIndex={-1}`) so the QUESTION →
 * FEEDBACK → RESULTS swap never drops focus to `<body>`; the first Tab from it
 * reaches the slot's primary (WCAG 2.4.3).
 */

import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuizSessionStore } from "../../stores/quizSessionStore";
import { PhaseGateBadge } from "./PhaseGateBadge";
import { CategoryBreakdown } from "./CategoryBreakdown";
import { getStrategy } from "../../engine/strategies";
import { Box, Button, CompletionSlot, Icon } from "shared/components";
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

/**
 * The guest note states the fact and nothing more: a guest attempt wrote no row,
 * so no sentence here may say the score was saved.
 */
const GUEST_NOTE =
  "This score is local to this tab and is not saved anywhere. An account saves your progress from the next session.";

/** Quiz results screen */
export function QuizResults() {
  const navigate = useNavigate();
  const headingRef = useRef<HTMLHeadingElement>(null);
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

  // The value (§26.4.5). A guest — or any attempt whose backend completion
  // reports maxScore <= 0 — reads the local session, so the mock stub the
  // server returns for a guest attempt can never turn 9/10 into "0/0 — Not passed".
  const attemptMaxScore = completionResult?.maxScore ?? 0;
  const usesLocalScore = isGuest || attemptMaxScore <= 0;
  const totalQuestions = usesLocalScore ? questions.length : attemptMaxScore;
  const correct = isGuest ? score : (completionResult?.totalScore ?? score);
  const pct = totalQuestions > 0 ? Math.round((correct / totalQuestions) * 100) : 0;
  const localPassed = passThreshold != null && pct >= passThreshold * 100;
  const passed = isGuest ? localPassed : (completionResult?.passed ?? localPassed);

  // ── Identities (§26.2.3) — the slot's contents, never sibling buttons ────
  const missedCount = Math.max(0, totalQuestions - correct);
  const reviewType = REVIEW_TYPE_BY_STRATEGY[strategyType] ?? "pinyin";
  const reviewHref = withSearchParams(PRACTICES_REVIEW_PATH, {
    type: reviewType,
    filter: "recent",
  });

  const goToPractices = () => navigate(practices_page);

  const primary = isGuest
    ? {
        label: "Create an account to save your progress",
        onClick: () => navigate(register_page),
      }
    : missedCount > 0
      ? { label: "Review what you missed", onClick: () => navigate(reviewHref) }
      : { label: "Back to Practices", onClick: goToPractices };

  // A guest keeps the way out as the single ghost; a registered perfect score has
  // nothing left to offer, and inventing a second action breaks the one-CTA law.
  const secondaryLabel = isGuest || missedCount > 0 ? "Back to Practices" : null;

  const note = isGuest
    ? GUEST_NOTE
    : missedCount > 0
      ? `${missedCount} of ${totalQuestions} answers were wrong. The review queue holds exactly those.`
      : "Perfect score. Nothing to review.";

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div className="flex-col-center gap-lg">
      <h2
        ref={headingRef}
        tabIndex={-1}
        className="quiz-results__heading flex-align-center gap-xs text-primary font-2xl"
      >
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
          // The stub breakdown is as unusable as the stub score: a local-scored
          // attempt falls back to computing the bars from its own answers.
          categoryBreakdown={usesLocalScore ? undefined : completionResult?.categoryBreakdown}
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

      {/* The slot — the ONE position-locked primary, after the value (§26.2.2) */}
      <CompletionSlot
        label="Next step"
        note={note}
        primary={
          <Button variant="primary" size="lg" onClick={primary.onClick}>
            {primary.label}
          </Button>
        }
        secondary={
          secondaryLabel ? (
            <Button variant="ghost" size="lg" onClick={goToPractices}>
              {secondaryLabel}
            </Button>
          ) : undefined
        }
      />

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
