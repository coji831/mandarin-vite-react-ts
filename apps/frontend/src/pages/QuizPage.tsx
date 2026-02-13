/**
 * Quiz page
 * Story 15.6: Quiz Container & State Management
 *
 * Renders daily review quiz with interleaved questions
 */
import { DailyReviewQuiz } from "../features/quiz/containers";

export { QuizPage };

function QuizPage() {
  return (
    <div
      style={{
        maxWidth: "800px",
        margin: "2rem auto",
        padding: "2rem",
        background: "#232a3a",
        border: "1px solid #38405a",
        borderRadius: "12px",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
      }}
    >
      <h1 style={{ fontSize: "2rem", marginBottom: "1.5rem", color: "rgba(255, 255, 255, 0.95)" }}>
        📝 Daily Review Quiz
      </h1>
      <DailyReviewQuiz />
    </div>
  );
}
