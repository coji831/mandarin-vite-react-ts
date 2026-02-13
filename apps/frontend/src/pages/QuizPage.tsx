/**
 * Quiz page placeholder
 *
 * Temporary placeholder for Quiz feature.
 * Will be replaced with full quiz implementation in Story 15.5-15.8.
 */
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
      <h1 style={{ fontSize: "2rem", marginBottom: "1rem", color: "rgba(255, 255, 255, 0.95)" }}>
        📝 Quiz
      </h1>
      <p style={{ color: "rgba(255, 255, 255, 0.6)", marginBottom: "1.5rem" }}>
        Test your knowledge with interactive quizzes.
      </p>
      <div
        style={{
          padding: "1.5rem",
          background: "rgba(102, 126, 234, 0.15)",
          borderRadius: "8px",
          border: "1px solid rgba(102, 126, 234, 0.3)",
        }}
      >
        <p style={{ margin: 0, color: "#a5b4fc" }}>🚧 Quiz feature coming soon (Story 15.5-15.8)</p>
      </div>
    </div>
  );
}
