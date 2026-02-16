/**
 * QuizComplete Component
 * Story 15.6: Quiz Container & State Management
 * Story 15.8: Added XP calculation and Review Again button
 * Story 15.9: Integrated backend XP, mystery box, and badge rewards
 *
 * Displays quiz results with accuracy metrics and gamification rewards.
 * Shows correct/incorrect count, overall percentage, and XP earned.
 * Now displays mystery box rewards and newly earned badges from backend.
 * Provides button to review words again.
 */

import { useState } from "react";
import { QuizAnswer } from "../types/QuizTypes";
import type { MysteryBox } from "../hooks/useQuizAPI";
import type { Badge } from "../../gamification/types/GamificationTypes";
import { MysteryBoxModal } from "../../gamification/components/MysteryBoxModal";
import "./QuizComplete.css";

export { QuizComplete };

type QuizCompleteProps = {
  answers: QuizAnswer[];
  totalXP?: number; // Story 15.9: Backend-sourced XP (replaces client calculation)
  mysteryBox?: MysteryBox; // Story 15.9: Random reward (7-day multiples)
  newBadges?: Badge[]; // Story 15.9: Newly earned badges
  freezeAwarded?: boolean; // Story 15.9: True if freeze was awarded during quiz
  onReviewAgain?: () => void;
};

function QuizComplete({
  answers,
  totalXP,
  mysteryBox,
  newBadges,
  freezeAwarded,
  onReviewAgain,
}: QuizCompleteProps) {
  const correctCount = answers.filter((a) => a.correct).length;
  const totalCount = answers.length;
  const accuracy = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

  // Story 15.9: Use backend XP source with fallback (Option A)
  const xpEarned = totalXP !== undefined ? totalXP : correctCount * 10;

  // Story 15.9: Mystery box modal state
  const [showMysteryBox, setShowMysteryBox] = useState(!!mysteryBox);

  // Identify leeches (words with lapseCount >= 5)
  const leeches = answers.filter((a) => (a.lapseCount || 0) >= 5);

  const handleReviewAgain = () => {
    if (onReviewAgain) {
      onReviewAgain();
    } else {
      window.location.reload();
    }
  };

  // Format date helper
  const formatDate = (isoDate?: string) => {
    if (!isoDate) return "N/A";
    const date = new Date(isoDate);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  // Calculate days until review
  const getDaysUntil = (isoDate?: string) => {
    if (!isoDate) return null;
    const reviewDate = new Date(isoDate);
    const now = new Date();
    const diffTime = reviewDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="quizCompleteContainer">
      <h2 className="completeTitle">Quiz Complete! 🎉</h2>

      <div className="statsGrid">
        <div className="statCard">
          <span className="statLabel">Accuracy</span>
          <span className="statValue">{accuracy}%</span>
        </div>

        <div className="statCard">
          <span className="statLabel">XP Earned</span>
          <span className="statValue xpValue">+{xpEarned}</span>
        </div>

        <div className="statCard">
          <span className="statLabel">Correct Answers</span>
          <span className="statValue">
            {correctCount} / {totalCount}
          </span>
        </div>
      </div>

      {/* Story 15.9: New Badges Earned */}
      {newBadges && newBadges.length > 0 && (
        <div className="newBadgesSection">
          <h3 className="badgesTitle">🎉 New Badges Earned!</h3>
          <div className="badgesGrid">
            {newBadges.map((badge) => (
              <div key={badge.id} className="badgeCard">
                <span className="badgeIcon">{badge.icon}</span>
                <div className="badgeInfo">
                  <strong>{badge.name}</strong>
                  <p>{badge.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Story 15.9: Freeze Awarded Notification */}
      {freezeAwarded && <div className="freezeAlert">❄️ You earned 1 Streak Freeze!</div>}

      {leeches.length > 0 && (
        <div className="leechAlert">
          ⚠️ {leeches.length} struggling word{leeches.length > 1 ? "s" : ""} detected
        </div>
      )}

      {/* Detailed Results Table (Story 15.8: Temporary debug view) */}
      <div className="resultsTable" style={{ marginTop: "2rem" }}>
        <h3 style={{ color: "rgba(255, 255, 255, 0.9)", marginBottom: "1rem" }}>
          Detailed Results
        </h3>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.2)" }}>
              <th
                style={{ padding: "0.5rem", textAlign: "left", color: "rgba(255, 255, 255, 0.7)" }}
              >
                Word
              </th>
              <th
                style={{ padding: "0.5rem", textAlign: "left", color: "rgba(255, 255, 255, 0.7)" }}
              >
                Your Answer
              </th>
              <th
                style={{ padding: "0.5rem", textAlign: "left", color: "rgba(255, 255, 255, 0.7)" }}
              >
                Status
              </th>
              <th
                style={{ padding: "0.5rem", textAlign: "left", color: "rgba(255, 255, 255, 0.7)" }}
              >
                Next Review
              </th>
              <th
                style={{ padding: "0.5rem", textAlign: "left", color: "rgba(255, 255, 255, 0.7)" }}
              >
                Lapses
              </th>
            </tr>
          </thead>
          <tbody>
            {answers.map((answer, idx) => {
              const daysUntil = getDaysUntil(answer.nextReview);
              // Determine expected answer based on question type
              const getExpectedAnswer = () => {
                switch (answer.questionType) {
                  case "type_pinyin":
                    return answer.pinyin || "?";
                  case "type_character":
                    return answer.word || "?";
                  case "multiple_choice":
                    return answer.english || "?";
                  default:
                    return "?";
                }
              };
              const expectedAnswer = getExpectedAnswer();
              return (
                <tr key={idx} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.1)" }}>
                  <td style={{ padding: "0.5rem", color: "rgba(255, 255, 255, 0.9)" }}>
                    {answer.word || answer.wordId} ({answer.pinyin || "?"})
                    <br />
                    <span style={{ fontSize: "0.85rem", color: "rgba(255, 255, 255, 0.6)" }}>
                      {answer.english || ""}
                    </span>
                  </td>
                  <td style={{ padding: "0.5rem", color: "rgba(255, 255, 255, 0.9)" }}>
                    <div style={{ fontSize: "0.95rem" }}>{answer.userAnswer}</div>
                    {!answer.correct && (
                      <div style={{ fontSize: "0.85rem", color: "#4caf50", marginTop: "0.25rem" }}>
                        → {expectedAnswer}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: "0.5rem" }}>
                    <span
                      style={{
                        color: answer.correct ? "#4caf50" : "#f44336",
                        fontWeight: "bold",
                      }}
                    >
                      {answer.correct ? "✓" : "✗"}
                    </span>
                  </td>
                  <td style={{ padding: "0.5rem", color: "rgba(255, 255, 255, 0.8)" }}>
                    {formatDate(answer.nextReview)}
                    {daysUntil !== null && (
                      <span style={{ fontSize: "0.85rem", color: "rgba(255, 255, 255, 0.5)" }}>
                        {" "}
                        ({daysUntil} day{daysUntil !== 1 ? "s" : ""})
                      </span>
                    )}
                  </td>
                  <td
                    style={{
                      padding: "0.5rem",
                      color: (answer.lapseCount || 0) >= 5 ? "#f44336" : "rgba(255, 255, 255, 0.8)",
                    }}
                  >
                    {answer.lapseCount || 0}
                    {(answer.lapseCount || 0) >= 5 && " 🔴"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <button
        onClick={handleReviewAgain}
        className="reviewAgainButton"
        style={{ marginTop: "1.5rem" }}
      >
        Review Again
      </button>

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
