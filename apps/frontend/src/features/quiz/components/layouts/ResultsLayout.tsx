/**
 * ResultsLayout Component
 * Component Reorganization: Renamed from CompletionLayout (Epic 19: State Refactor)
 * Story 15.6: Quiz Container & State Management
 * Story 15.8: Added XP calculation and Review Again button
 * Story 15.9: Integrated backend XP, mystery box, and badge rewards
 * Story 15.10: UI polish - relative time, updated wording, red borders for incorrect
 * Epic 19: State Refactor - Reads from context (zero props)
 * Story 15.11: Added daily quiz complete view with countdown timer;
 *   banner-only initial view with View Results toggle to avoid CLS
 *
 * Layout orchestrator for quiz completion phase.
 * Displays quiz results with accuracy metrics and gamification rewards.
 * All state read from QuizContext - zero props drilling.
 * Composes multiple result subcomponents:
 * - Stats grid (accuracy, XP, correct count)
 * - Badges section (newly earned badges)
 * - Leech alert (struggling words warning)
 * - Results table (detailed word-by-word breakdown)
 * - Mystery box modal (7-day streak rewards)
 * - Countdown timer (daily quiz complete only)
 * Provides button to review words again.
 */

import { useState, useEffect } from "react";
import { useQuizState, useQuizActions } from "../../contexts";
import { MysteryBoxModal } from "../../../gamification/components/MysteryBoxModal";
import { BadgeCelebrationModal } from "../../../gamification/components/BadgeCelebrationModal";
import { StatsGrid, ResultsTable, DailyCompleteBanner } from "../results";
import "./ResultsLayout.css";

export { ResultsLayout };

function ResultsLayout() {
  // Read all state from context
  const { quizSessionSummary, expiresAt, isFreshCompletion } = useQuizState();
  const { handleRetry } = useQuizActions();

  // Story 15.9: Mystery box modal state
  const [showMysteryBox, setShowMysteryBox] = useState(!!quizSessionSummary?.mysteryBox);

  // Story 15.11 Flow 2.6: Badge celebration modal state
  const [showBadgeCelebration, setShowBadgeCelebration] = useState(false);

  // Story 15.11 Flow 2.6: Auto-open badge celebration modal only on fresh completion
  useEffect(() => {
    if (
      isFreshCompletion &&
      quizSessionSummary?.newBadges &&
      quizSessionSummary.newBadges.length > 0
    ) {
      setShowBadgeCelebration(true);
    }
  }, [isFreshCompletion, quizSessionSummary]);

  // Guard: summary guaranteed non-null when phase === RESULTS, but TypeScript doesn't know that
  if (!quizSessionSummary) return null;

  const { mysteryBox, newBadges } = quizSessionSummary;

  const statsProps = {
    correctCount: quizSessionSummary.correctCount,
    totalCount: quizSessionSummary.totalQuestions,
    accuracy: quizSessionSummary.accuracyRate,
    xpEarned: quizSessionSummary.xpEarned,
    leechCount: quizSessionSummary.leechWords?.length ?? 0,
  };

  // Story 15.11: Handler for New Quiz button
  const handleNewQuiz = () => {
    handleRetry(); // This already reloads due words
  };

  // Story 15.11 Flow 2.6: Handler for badge celebration modal close
  const handleCloseBadgeCelebration = () => {
    setShowBadgeCelebration(false);
  };

  return (
    <div className="quizCompleteContainer flex-col-center text-center">
      {/* Countdown banner when session has an expiry */}
      {expiresAt && (
        <DailyCompleteBanner
          expiresAt={expiresAt}
          onExpire={() => {}}
          onStartNewQuiz={handleNewQuiz}
        />
      )}

      <h2 className="completeTitle">Quiz Complete! 🎉</h2>

      <StatsGrid {...statsProps} />

      {/* Story 15.9: Freeze Awarded Notification */}
      {quizSessionSummary.freezeAwarded && (
        <div className="freezeAlert">❄️ You earned 1 Streak Freeze!</div>
      )}

      {/* Detailed Results Table (Story 15.10: Removed Status column, added red borders) */}
      <ResultsTable answers={quizSessionSummary.allAnswers} />

      {/* Story 15.9: Mystery Box Modal */}
      {mysteryBox && (
        <MysteryBoxModal
          mysteryBox={mysteryBox}
          isOpen={showMysteryBox}
          onClose={() => setShowMysteryBox(false)}
        />
      )}

      {/* Story 15.11 Flow 2.6: Badge Celebration Modal */}
      {newBadges && newBadges.length > 0 && (
        <BadgeCelebrationModal
          badges={newBadges}
          isOpen={showBadgeCelebration}
          onClose={handleCloseBadgeCelebration}
        />
      )}
    </div>
  );
}
