/**
 * DashboardSections
 *
 * Phase 2+ dashboard layout (hub-launcher): PageHeader (eyebrow = phase name,
 * title = "Welcome back", CTA top-right) → current-phase focal card →
 * Quick Access → Recent Activity. Preview/reward split (D.2): cards show
 * previews only; detail lives in the Focus surface.
 */
import { useNavigate } from "react-router-dom";
import { Box, Button, EmptyState, Icon, PageHeader, ProgressBar } from "shared/components";
import type { IconName } from "shared/components";
import {
  practices_review,
  practices_quiz,
  learn_radicals,
  progress_page,
  withSearchParams,
} from "shared/constants";

export type ActivityItem = {
  icon: IconName;
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
    <div className="dashboard flex-col gap-lg">
      <PageHeader
        eyebrow={phaseName}
        title="Welcome back"
        description={
          <span className="flex-center gap-xs">
            <Icon name="flame" size={16} aria-hidden />
            {streakDays} day streak
          </span>
        }
      >
        <Button variant="primary" onClick={onContinueLearning}>
          Continue Learning ▸
        </Button>
      </PageHeader>

      {/* Current Phase — focal card (D.6: surface-dark + hairline + elevated-1 + radius-lg) */}
      <section className="flex-col gap-sm">
        <h2 className="font-lg fw-600 text-primary m-0">Current Phase</h2>
        <Box
          variant="dark"
          padding="lg"
          className="dashboard-focal-card dashboard-card flex-col gap-md"
        >
          <div className="flex-between items-center gap-sm">
            <span className="font-sm text-muted">Current progress</span>
            <span className="font-sm text-muted">{phasePct}% complete</span>
          </div>
          <ProgressBar value={phasePct} aria-label="Current phase progress" />
          <p className="font-sm text-secondary m-0">Next: {nextStep}</p>
        </Box>
      </section>

      {/* Quick Access */}
      <section className="flex-col gap-sm">
        <h2 className="font-lg fw-600 text-primary m-0">Quick Access</h2>
        <div className="dashboard-quick-grid grid gap-md">
          <Button
            variant="tag"
            className="dashboard-quick-btn hover-lift flex-col gap-sm text-center"
            onClick={() => navigate(withSearchParams(practices_review, { type: "character" }))}
          >
            <Icon name="review" size={24} aria-hidden />
            <span className="font-sm fw-600 text-primary">Review Characters</span>
          </Button>
          <Button
            variant="tag"
            className="dashboard-quick-btn hover-lift flex-col gap-sm text-center"
            onClick={() =>
              navigate(withSearchParams(practices_quiz, { type: "audio-to-pinyin-tone" }))
            }
          >
            <Icon name="quiz" size={24} aria-hidden />
            <span className="font-sm fw-600 text-primary">Take Phase Quiz</span>
          </Button>
          <Button
            variant="tag"
            className="dashboard-quick-btn hover-lift flex-col gap-sm text-center"
            onClick={() => navigate(learn_radicals)}
          >
            <Icon name="radicals" size={24} aria-hidden />
            <span className="font-sm fw-600 text-primary">Study Radicals</span>
          </Button>
          <Button
            variant="tag"
            className="dashboard-quick-btn hover-lift flex-col gap-sm text-center"
            onClick={() => navigate(progress_page)}
          >
            <Icon name="progress" size={24} aria-hidden />
            <span className="font-sm fw-600 text-primary">View Progress</span>
          </Button>
        </div>
      </section>

      {/* Recent Activity — existing empty branch (D.8: real data wiring is Phase B) */}
      <section className="flex-col gap-sm">
        <h2 className="font-lg fw-600 text-primary m-0">Recent Activity</h2>
        {activities.length > 0 ? (
          <Box variant="dark" padding="md" className="dashboard-card flex-col gap-sm">
            {activities.map((item, i) => (
              <div key={i} className="flex-center gap-sm font-sm text-secondary">
                <span aria-hidden="true">
                  <Icon name={item.icon} size={16} />
                </span>
                <span>{item.text}</span>
              </div>
            ))}
          </Box>
        ) : (
          <Box variant="dark" padding="lg" className="dashboard-card">
            <EmptyState
              icon="activity"
              title="No recent activity yet"
              description="Start learning to see your progress here!"
            />
          </Box>
        )}
      </section>
    </div>
  );
}
