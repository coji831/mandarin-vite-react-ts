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
import { formatRelativeTime } from "../../utils/dateFormatting";
import { StatsGrid, ResultsTable, DailyCompleteBanner } from "../results";
import { Button } from "../../../../components";
import type { QuizSessionSummary } from "../../types";
import type { QuestionMode } from "../../types";
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

  // Use prop summary for daily complete, context summary for regular complete
  const sessionSummary = isDailyComplete ? propSummary : contextSummary;

  // Use allAnswers when available (Option 2 refactor: all correct + incorrect answers)
  // Falls back to incorrectWords mapping for backward compat, then to context answers
  const displayAnswers = sessionSummary?.allAnswers?.length
    ? sessionSummary.allAnswers.map((a) => ({
        wordId: a.wordId,
        word: a.hanzi,
        pinyin: a.pinyin,
        english: a.english,
        questionType: a.questionType as QuestionMode,
        userAnswer: a.userAnswer,
        correct: a.correct,
        timestamp: new Date(sessionSummary.completedAt),
        correctAnswer: a.correctAnswer,
        lapseCount: a.lapseCount,
        isLeech: a.isLeech,
        nextReviewDate: a.nextReviewDate ?? undefined,
      }))
    : isDailyComplete && sessionSummary?.incorrectWords
      ? sessionSummary.incorrectWords.map((w) => ({
          wordId: w.wordId,
          word: w.hanzi,
          pinyin: w.pinyin,
          english: w.english,
          questionType: w.questionType,
          userAnswer: w.userAnswer,
          correct: false,
          timestamp: new Date(sessionSummary.completedAt),
          correctAnswer: w.correctAnswer,
          lapseCount: w.lapseCount,
          isLeech: w.isLeech,
        }))
      : answers;

  // Story 15.11: Use backend-calculated metrics from session summary
  const correctCount = sessionSummary?.correctCount ?? answers.filter((a) => a.correct).length;
  const totalCount = sessionSummary?.totalQuestions ?? answers.length;
  const accuracy = sessionSummary?.accuracyRate ?? 0;
  const xpEarned = sessionSummary?.xpEarned ?? totalXP ?? 0;
  const leeches = sessionSummary?.leechWords ?? [];

  // Story 15.9: Mystery box modal state
  const [showMysteryBox, setShowMysteryBox] = useState(!!mysteryBox);

  // Story 15.11 Flow 2.6: Badge celebration modal state
  const [showBadgeCelebration, setShowBadgeCelebration] = useState(false);

  // Story 15.11 Flow 2.6: Auto-open badge celebration modal when new badges earned
  useEffect(() => {
    if (newBadges && newBadges.length > 0 && !isDailyComplete) {
      setShowBadgeCelebration(true);
    }
  }, [newBadges, isDailyComplete]);

  // Story 15.11: Handler for New Quiz button
  const handleNewQuiz = () => {
    handleRetry(); // This already reloads due words
  };

  // Initialize synchronously so button label/disabled never flash on first render.
  // Expired if expiresAt is absent (no restriction) or already past.
  const [countdownExpired, setCountdownExpired] = useState<boolean>(
    () => !expiresAt || new Date(expiresAt) <= new Date(),
  );

  // Format date helper (Story 15.10: Now using relative time)
  const formatDate = (isoDate?: string) => {
    if (!isoDate) return "N/A";
    return formatRelativeTime(isoDate);
  };

  // Handler for countdown expiration
  const handleCountdownExpire = () => {
    setCountdownExpired(true);
  };

  // Story 15.11 Flow 2.6: Handler for badge celebration modal close
  const handleCloseBadgeCelebration = () => {
    // Mark badges as celebrated in localStorage to prevent Dashboard double-celebration
    if (newBadges && newBadges.length > 0) {
      const celebratedIds = JSON.parse(localStorage.getItem("last_celebrated_badges") || "[]");
      const newIds = newBadges.map((b) => b.id);
      const updatedIds = [...new Set([...celebratedIds, ...newIds])];
      localStorage.setItem("last_celebrated_badges", JSON.stringify(updatedIds));
    }
    setShowBadgeCelebration(false);
  };

  return (
    <div className="quizCompleteContainer flex-col-center text-center">
      {/* Daily complete: thin banner strip always shown above results */}
      {isDailyComplete && (
        <DailyCompleteBanner expiresAt={expiresAt} onExpire={handleCountdownExpire} />
      )}

      {/* Regular Complete Title */}
      {!isDailyComplete && <h2 className="completeTitle">Quiz Complete! 🎉</h2>}

      <StatsGrid
        correctCount={correctCount}
        totalCount={totalCount}
        accuracy={accuracy}
        xpEarned={xpEarned}
        leechCount={leeches.length}
      />

      {/* Story 15.9: Freeze Awarded Notification */}
      {freezeAwarded && <div className="freezeAlert">❄️ You earned 1 Streak Freeze!</div>}

      {/* Detailed Results Table (Story 15.10: Removed Status column, added red borders) */}
      <ResultsTable answers={displayAnswers} formatDate={formatDate} />

      {/* Action buttons */}
      <div className="quizActions flex-row-center" style={{ gap: "1rem", marginTop: "1.5rem" }}>
        <Button variant="primary" onClick={handleNewQuiz}>
          {isDailyComplete && !countdownExpired ? "Retry" : "New Quiz"}
        </Button>
      </div>

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
