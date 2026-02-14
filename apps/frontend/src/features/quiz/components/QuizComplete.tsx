/**
 * QuizComplete Component
 * Story 15.6: Quiz Container & State Management
 * Story 15.8: Added XP calculation and Review Again button
 *
 * Displays quiz results with accuracy metrics and gamification rewards.
 * Shows correct/incorrect count, overall percentage, and XP earned.
 * Provides button to review words again.
 */

import { QuizAnswer } from "../types/QuizTypes";
import "./QuizComplete.css";

export { QuizComplete };

type QuizCompleteProps = {
  answers: QuizAnswer[];
  onReviewAgain?: () => void;
};

function QuizComplete({ answers, onReviewAgain }: QuizCompleteProps) {
  const correctCount = answers.filter((a) => a.correct).length;
  const totalCount = answers.length;
  const accuracy = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

  // XP calculation: 10 XP per correct answer
  // TODO Story 15.9: Replace with actual XP from backend API response
  const xpEarned = correctCount * 10;

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
    </div>
  );
}
