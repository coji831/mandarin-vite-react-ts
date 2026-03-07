/**
 * ResultsLayout Component
 * Component Reorganization: Renamed from CompletionLayout (Epic 19: State Refactor)
 * Story 15.6: Quiz Container & State Management
 * Story 15.8: Added XP calculation and Review Again button
 * Story 15.9: Integrated backend XP, mystery box, and badge rewards
 * Story 15.10: UI polish - relative time, updated wording, red borders for incorrect
 * Epic 19: State Refactor - Reads from context (zero props)
 * Story 15.11: Added daily quiz complete view with countdown timer
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
import { useNavigate } from "react-router-dom";
import { useQuizState, useQuizActions } from "../../contexts";
import { MysteryBoxModal } from "../../../gamification/components/MysteryBoxModal";
import { formatRelativeTime } from "../../utils/dateFormatting";
import { getLastQuizResult, clearQuizResult } from "../../utils/quizStorage";
import {
  StatsGrid,
  ResultsTable,
  BadgesDisplay,
  LeechWarning,
  NextQuizCountdown,
} from "../results";
import { Button } from "../../../../components";
import type { QuizSessionSummary } from "../../types";
import "./ResultsLayout.css";

export { ResultsLayout };

interface ResultsLayoutProps {
  isDailyComplete?: boolean;
  summary?: QuizSessionSummary | null;
  expiresAt?: string | null;
}

function ResultsLayout({
  isDailyComplete = false,
  summary: propSummary,
  expiresAt,
}: ResultsLayoutProps = {}) {
  // Read all state from context
  const {
    answers,
    totalXP,
    mysteryBox,
    newBadges,
    freezeAwarded,
    sessionSummary: contextSummary,
  } = useQuizState();
  const { handleRetry } = useQuizActions();
  const navigate = useNavigate();

  // Use prop summary for daily complete, context summary for regular complete
  const sessionSummary = isDailyComplete ? propSummary : contextSummary;

  // Story 15.11: Use backend-calculated metrics from session summary
  const correctCount = sessionSummary?.correctCount ?? answers.filter((a) => a.correct).length;
  const totalCount = sessionSummary?.totalAnswered ?? answers.length;
  const accuracy = sessionSummary?.accuracyRate ?? 0;
  const xpEarned = sessionSummary?.totalXP ?? totalXP ?? 0;
  const leeches = sessionSummary?.leechWords ?? [];

  // Story 15.9: Mystery box modal state
  const [showMysteryBox, setShowMysteryBox] = useState(!!mysteryBox);

  // Story 15.11: Get last quiz result for Review Mistakes feature
  const [lastResult, setLastResult] = useState(getLastQuizResult());

  useEffect(() => {
    // Refresh last result when component mounts
    setLastResult(getLastQuizResult());
  }, []);

  // Story 15.11: Handler for Review Mistakes button
  const handleReviewMistakes = () => {
    if (!lastResult || lastResult.incorrectWords.length === 0) return;

    const wordIds = lastResult.incorrectWords.map((w) => w.wordId).join(",");
    navigate(`/learn/quiz?wordIds=${wordIds}&mode=review`);
  };

  // Story 15.11: Handler for New Quiz button
  const handleNewQuiz = () => {
    clearQuizResult();
    handleRetry(); // This already reloads due words
  };

  const hasIncorrectWords = lastResult && lastResult.incorrectWords.length > 0;
  const [countdownExpired, setCountdownExpired] = useState(false);

  // Format date helper (Story 15.10: Now using relative time)
  const formatDate = (isoDate?: string) => {
    if (!isoDate) return "N/A";
    return formatRelativeTime(isoDate);
  };

  // Handler for countdown expiration
  const handleCountdownExpire = () => {
    setCountdownExpired(true);
  };

  return (
    <div className="quizCompleteContainer flex-col-center text-center">
      {/* Daily Complete Banner */}
      {isDailyComplete && (
        <div className="daily-complete-banner">
          <h2 className="completeTitle">Today's Quiz Complete! ✅</h2>
          <p className="daily-complete-message">
            You've finished today's quiz. Review your results below or come back tomorrow for a new
            quiz!
          </p>
          <NextQuizCountdown expiresAt={expiresAt || null} onExpire={handleCountdownExpire} />
        </div>
      )}

      {/* Regular Complete Title */}
      {!isDailyComplete && <h2 className="completeTitle">Quiz Complete! 🎉</h2>}

      <StatsGrid
        correctCount={correctCount}
        totalCount={totalCount}
        accuracy={accuracy}
        xpEarned={xpEarned}
      />

      {/* Story 15.9: New Badges Earned */}
      {newBadges && <BadgesDisplay badges={newBadges} />}

      {/* Story 15.9: Freeze Awarded Notification */}
      {freezeAwarded && <div className="freezeAlert">❄️ You earned 1 Streak Freeze!</div>}

      <LeechWarning leechCount={leeches.length} />

      {/* Detailed Results Table (Story 15.10: Removed Status column, added red borders) */}
      <ResultsTable answers={answers} formatDate={formatDate} />

      {/* Story 15.11: Action buttons for next steps */}
      <div className="quizActions flex-row-center" style={{ gap: "1rem", marginTop: "1.5rem" }}>
        {hasIncorrectWords && (
          <Button variant="secondary" onClick={handleReviewMistakes}>
            Review Mistakes ({lastResult.incorrectWords.length})
          </Button>
        )}
        {isDailyComplete ? (
          <Button variant="primary" disabled={!countdownExpired} onClick={handleNewQuiz}>
            {countdownExpired ? "New Quiz" : "Next Quiz"}
          </Button>
        ) : (
          <Button variant="primary" onClick={handleNewQuiz}>
            New Quiz
          </Button>
        )}
      </div>

      {/* Story 15.9: Mystery Box Modal */}
      {mysteryBox && (
        <MysteryBoxModal
          mysteryBox={mysteryBox}
          isOpen={showMysteryBox}
          onClose={() => setShowMysteryBox(false)}
        />
      )}
    </div>
  );
}
