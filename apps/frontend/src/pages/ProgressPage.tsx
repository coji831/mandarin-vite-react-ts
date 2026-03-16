/**
 * Progress page placeholder
 *
 * Shows gamification stats: streaks, badges, XP, achievements.
 * Will integrate with backend gamification APIs (Story 15.3).
 */
export { ProgressPage };

function ProgressPage() {
  return (
    <div
      style={{
        maxWidth: "1000px",
        margin: "2rem auto",
        padding: "2rem",
      }}
    >
      <h1 style={{ fontSize: "2rem", marginBottom: "1rem", color: "rgba(255, 255, 255, 0.95)" }}>
        📊 Your Progress
      </h1>
      <p style={{ color: "rgba(255, 255, 255, 0.6)", marginBottom: "2rem" }}>
        Track your learning journey with streaks, badges, and achievements.
      </p>

      <div style={{ display: "grid", gap: "1.5rem" }}>
        <div
          style={{
            padding: "1.5rem",
            background: "#232a3a",
            border: "1px solid #38405a",
            borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
          }}
        >
          <h2
            style={{ fontSize: "1.5rem", marginBottom: "1rem", color: "rgba(255, 255, 255, 0.95)" }}
          >
            🔥 Streak
          </h2>
          <p style={{ color: "rgba(255, 255, 255, 0.6)" }}>
            Your current learning streak and freeze currency will be displayed here.
          </p>
          <div
            style={{
              marginTop: "1rem",
              padding: "1rem",
              background: "rgba(245, 158, 11, 0.15)",
              border: "1px solid rgba(245, 158, 11, 0.3)",
              borderRadius: "8px",
            }}
          >
            <p style={{ margin: 0, color: "#fbbf24" }}>
              Backend integration: Story 15.3 (Completed)
            </p>
          </div>
        </div>

        <div
          style={{
            padding: "1.5rem",
            background: "#232a3a",
            border: "1px solid #38405a",
            borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
          }}
        >
          <h2
            style={{ fontSize: "1.5rem", marginBottom: "1rem", color: "rgba(255, 255, 255, 0.95)" }}
          >
            🏆 Badges
          </h2>
          <p style={{ color: "rgba(255, 255, 255, 0.6)" }}>
            Milestone badges, mystery box rewards, and achievements.
          </p>
        </div>

        <div
          style={{
            padding: "1.5rem",
            background: "#232a3a",
            border: "1px solid #38405a",
            borderRadius: "12px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
          }}
        >
          <h2
            style={{ fontSize: "1.5rem", marginBottom: "1rem", color: "rgba(255, 255, 255, 0.95)" }}
          >
            ⭐ Experience Points
          </h2>
          <p style={{ color: "rgba(255, 255, 255, 0.6)" }}>
            XP earned from quizzes, streaks, and achievements.
          </p>
        </div>
      </div>
    </div>
  );
}
