/**
 * Review page placeholder
 *
 * Temporary placeholder for spaced repetition review feature.
 * Will show words due for review based on spaced repetition schedule.
 */
export { ReviewPage };

function ReviewPage() {
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
        🔄 Review
      </h1>
      <p style={{ color: "rgba(255, 255, 255, 0.6)", marginBottom: "1.5rem" }}>
        Practice words that are due for review based on spaced repetition.
      </p>
      <div
        style={{
          padding: "1.5rem",
          background: "rgba(245, 158, 11, 0.15)",
          borderRadius: "8px",
          border: "1px solid rgba(245, 158, 11, 0.3)",
        }}
      >
        <p style={{ margin: 0, color: "#fbbf24" }}>🚧 Review feature coming soon</p>
      </div>
    </div>
  );
}
