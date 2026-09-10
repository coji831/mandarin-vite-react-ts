/**
 * DashboardSections
 *
 * Phase 2+ dashboard body (hub-launcher archetype). Owns the page's section
 * rhythm via PageStack; the page container owns the PageShell measure.
 *
 * Order: PageHeader (eyebrow = phase, title, CTA top-right) → Current Phase
 * focal card → Quick Access tiles → Recent Activity. Preview/reward split
 * (D.2): cards preview only; detail lives in the Focus surface.
 */
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  EmptyState,
  Icon,
  PageGrid,
  PageHeader,
  PageStack,
  ProgressBar,
} from "shared/components";
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

/** Course length — the focal card's "Phase n of 4" meta. */
const PHASE_COUNT = 4;

/** Section head — h2 + optional meta on a baseline row (blueprint .section-head). */
function SectionHead({ id, title, meta }: { id: string; title: string; meta?: string }) {
  return (
    <div className="dashboard-section-head flex justify-between gap-md">
      <h2 id={id} className="font-lg fw-600 text-primary m-0">
        {title}
      </h2>
      {meta && <span className="font-sm text-muted">{meta}</span>}
    </div>
  );
}

type QuickTile = {
  icon: IconName;
  label: string;
  /** Static descriptor — never a metric (data wiring is a later epic). */
  sub: string;
  onSelect: () => void;
};

export interface DashboardSectionsProps {
  /** 1-based phase number — drives the eyebrow and the "Phase n of 4" meta. */
  phaseNumber: number;
  /** Phase title without its number, e.g. "The Core 300". */
  phaseTitle: string;
  phasePct: number;
  nextStep: string;
  streakDays: number;
  activities: ActivityItem[];
  onContinueLearning?: () => void;
}

export function DashboardSections({
  phaseNumber,
  phaseTitle,
  phasePct,
  nextStep,
  streakDays,
  activities,
  onContinueLearning,
}: DashboardSectionsProps) {
  const navigate = useNavigate();

  const quickTiles: QuickTile[] = [
    {
      icon: "review",
      label: "Review Characters",
      sub: "Spaced repetition review",
      onSelect: () => navigate(withSearchParams(practices_review, { type: "character" })),
    },
    {
      icon: "quiz",
      label: "Take Phase Quiz",
      sub: "Audio to pinyin + tone",
      onSelect: () => navigate(withSearchParams(practices_quiz, { type: "audio-to-pinyin-tone" })),
    },
    {
      icon: "radicals",
      label: "Study Radicals",
      sub: "Radicals and components",
      onSelect: () => navigate(learn_radicals),
    },
    {
      icon: "progress",
      label: "View Progress",
      sub: "Accuracy, streak, and mastery",
      onSelect: () => navigate(progress_page),
    },
  ];

  return (
    <PageStack size="default">
      <PageHeader
        eyebrow={`Phase ${phaseNumber}: ${phaseTitle}`}
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

      {/* Current Phase — preview only; the % is section meta, not card chrome */}
      <section aria-labelledby="dashboard-phase-title">
        <SectionHead
          id="dashboard-phase-title"
          title="Current Phase"
          meta={`${phasePct}% complete`}
        />
        <Box variant="card" className="dashboard-card flex-col gap-md">
          <div className="flex-between items-center gap-sm">
            <span className="font-sm text-muted">
              Phase {phaseNumber} of {PHASE_COUNT}
            </span>
            <span className="font-sm text-muted">{phaseTitle}</span>
          </div>
          <ProgressBar value={phasePct} aria-label="Current phase progress" />
          <p className="font-sm text-secondary m-0">Next: {nextStep}</p>
        </Box>
      </section>

      {/* Quick Access — PageGrid is the only card home (page-anatomy law) */}
      <section aria-labelledby="dashboard-quick-title">
        <SectionHead id="dashboard-quick-title" title="Quick Access" />
        <PageGrid columns={4} aria-label="Quick access">
          {quickTiles.map((tile) => (
            <div key={tile.label} role="listitem" className="flex min-w-0">
              <Button
                variant="tag"
                className="dashboard-tile hover-lift flex-col flex-1 gap-sm text-left"
                onClick={tile.onSelect}
              >
                <span
                  className="dashboard-tile__icon flex-center radius-md bg-primary-bg text-primary-light"
                  aria-hidden="true"
                >
                  <Icon name={tile.icon} size={20} />
                </span>
                <span className="font-sm fw-600 text-primary">{tile.label}</span>
                <span className="font-xs text-muted">{tile.sub}</span>
              </Button>
            </div>
          ))}
        </PageGrid>
      </section>

      {/* Recent Activity — empty branch (D.8: real data wiring is a later epic) */}
      <section aria-labelledby="dashboard-activity-title">
        <SectionHead id="dashboard-activity-title" title="Recent Activity" />
        {activities.length > 0 ? (
          <Box variant="card" className="dashboard-card flex-col gap-sm">
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
          <Box variant="dashed" padding="2xl" className="dashboard-empty-card">
            <EmptyState
              icon="activity"
              title="No recent activity yet"
              description="Start learning to see your progress here!"
            />
          </Box>
        )}
      </section>
    </PageStack>
  );
}
