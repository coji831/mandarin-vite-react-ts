/**
 * Progress page placeholder
 *
 * Shows gamification stats: streaks, badges, XP, achievements.
 * Will integrate with backend gamification APIs (Story 15.3).
 */
import { Box } from "shared/components";
import "./ProgressPage.css";

export { ProgressPage };

function ProgressPage() {
  return (
    <div className="progress-page mx-auto p-xl">
      <h1 className="text-primary font-4xl">📊 Your Progress</h1>
      <p className="progress-page__card-text text-tertiary mb-xl">
        Track your learning journey with streaks, badges, and achievements.
      </p>

      <div className="grid gap-lg">
        <Box variant="dark" padding="lg">
          <h2 className="text-primary font-2xl">🔥 Streak</h2>
          <p className="progress-page__card-text text-tertiary">
            Your current learning streak and freeze currency will be displayed here.
          </p>
          <div className="alert-warning p-md" style={{ marginTop: "var(--space-md)" }}>
            <p className="progress-page__xp-badge m-0">
              Backend integration: Story 15.3 (Completed)
            </p>
          </div>
        </Box>

        <Box variant="dark" padding="lg">
          <h2 className="text-primary font-2xl">🏆 Badges</h2>
          <p className="progress-page__card-text text-tertiary">
            Milestone badges, mystery box rewards, and achievements.
          </p>
        </Box>

        <Box variant="dark" padding="lg">
          <h2 className="text-primary font-2xl">⭐ Experience Points</h2>
          <p className="progress-page__card-text text-tertiary">
            XP earned from quizzes, streaks, and achievements.
          </p>
        </Box>
      </div>
    </div>
  );
}
