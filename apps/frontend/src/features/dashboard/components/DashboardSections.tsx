/**
 * DashboardSections
 *
 * Phase 2+ dashboard layout with PhaseProgress, QuickAccess, and RecentActivity sections.
 * Renders the welcome header with streak, current phase card, quick access grid,
 * and recent activity feed.
 */
import { useNavigate } from "react-router-dom";
import { Box, Button, ProgressBar } from "shared/components";
import { practices_review, practices_quiz, learn_radicals } from "shared/constants";

export type ActivityItem = {
  icon: string;
  text: string;
};

export interface DashboardSectionsProps {
  phaseName: string;
  phasePct: number;
  nextStep: string;
  streakDays: number;
  activities: ActivityItem[];
  onContinueLearning?: () => void;
}

export function DashboardSections({
  phaseName,
  phasePct,
  nextStep,
  streakDays,
  activities,
  onContinueLearning,
}: DashboardSectionsProps) {
  const navigate = useNavigate();
  return (
    <div className="dashboard mx-auto p-lg flex-col gap-lg">
      <div className="dashboard-header flex-col gap-xs">
        <h1 className="font-3xl text-primary">👋 Welcome back!</h1>
        <p className="dashboard-streak m-0 text-tertiary font-sm">🔥 {streakDays} day streak</p>
      </div>

      {/* Current Phase */}
      <Box variant="dark" padding="lg" className="flex-col gap-md">
        <div className="flex-col gap-xs">
          <h2 className="font-xl fw-700 text-primary m-0">{phaseName}</h2>
          <div className="flex-col gap-xs">
            <div className="flex-between">
              <span className="font-sm text-secondary">{phasePct}% complete</span>
            </div>
            <ProgressBar value={phasePct / 100} />
          </div>
        </div>
        <p className="font-sm text-secondary m-0">Next: {nextStep}</p>
        <Button variant="primary" onClick={onContinueLearning}>
          Continue Learning ▸
        </Button>
      </Box>

      {/* Quick Access */}
      <div className="flex-col gap-sm">
        <h3 className="font-lg fw-600 text-primary m-0">Quick Access</h3>
        <div className="dashboard-quick-grid grid gap-md">
          <Button
            variant="tag"
            className="dashboard-quick-btn flex-col gap-sm text-center"
            onClick={() => navigate(`${practices_review}?type=character`)}
          >
            <span className="font-2xl">🃏</span>
            <span className="font-sm fw-600 text-primary">Review Characters</span>
          </Button>
          <Button
            variant="tag"
            className="dashboard-quick-btn flex-col gap-sm text-center"
            onClick={() => navigate(`${practices_quiz}?type=audio-to-pinyin-tone`)}
          >
            <span className="font-2xl">📝</span>
            <span className="font-sm fw-600 text-primary">Take Phase Quiz</span>
          </Button>
          <Button
            variant="tag"
            className="dashboard-quick-btn flex-col gap-sm text-center"
            onClick={() => navigate(learn_radicals)}
          >
            <span className="font-2xl">📘</span>
            <span className="font-sm fw-600 text-primary">Study Radicals</span>
          </Button>
          <Button
            variant="tag"
            className="dashboard-quick-btn flex-col gap-sm text-center"
            onClick={() => navigate("/progress")}
          >
            <span className="font-2xl">📊</span>
            <span className="font-sm fw-600 text-primary">View Progress</span>
          </Button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="flex-col gap-sm">
        <h3 className="font-lg fw-600 text-primary m-0">Recent Activity</h3>
        {activities.length > 0 ? (
          <Box variant="dark" padding="md" className="flex-col gap-sm">
            {activities.map((item, i) => (
              <div key={i} className="flex-center gap-sm font-sm text-secondary">
                <span>{item.icon}</span>
                <span>{item.text}</span>
              </div>
            ))}
          </Box>
        ) : (
          <Box variant="dark" padding="md">
            <p className="font-sm text-muted m-0">
              No recent activity yet. Start learning to see your progress here!
            </p>
          </Box>
        )}
      </div>
    </div>
  );
}
