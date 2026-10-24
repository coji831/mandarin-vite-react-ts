/**
 * Progress page
 *
 * Shows gamification stats: streaks, badges, XP, achievements. The real data
 * wiring belongs to the epic that owns this surface (gamification); this page
 * is the settings-archetype shell those surfaces will fill.
 *
 * Anatomy (page-anatomy law): PageShell(settings measure) → PageStack →
 * PageHeader → PageGrid card home. No page-scoped layout CSS.
 */
import { Box, Icon, PageGrid, PageHeader, PageShell, PageStack } from "shared/components";
import type { IconName } from "shared/components";
import "./ProgressPage.css";

export { ProgressPage };

type ProgressSection = {
  icon: IconName;
  title: string;
  description: string;
  /** Dev/status note — removed when the owning epic lands the real surface. */
  note?: string;
};

const SECTIONS: ProgressSection[] = [
  {
    icon: "flame",
    title: "Streak",
    description: "Your current learning streak and freeze currency will be displayed here.",
    note: "Backend integration: Story 15.3 (Completed)",
  },
  {
    icon: "star",
    title: "Badges",
    description: "Milestone badges, mystery box rewards, and achievements.",
  },
  {
    icon: "zap",
    title: "Experience Points",
    description: "XP earned from quizzes, streaks, and achievements.",
  },
];

function ProgressPage() {
  return (
    <PageShell archetype="settings">
      <PageStack size="default">
        <PageHeader
          title="Your Progress"
          description="Track your learning journey with streaks, badges, and achievements."
        />

        <PageGrid columns={3} aria-label="Progress sections">
          {SECTIONS.map((section) => (
            <div key={section.title} role="listitem" className="flex min-w-0">
              <Box variant="card-elevated" className="flex-col gap-sm flex-1">
                <Icon name={section.icon} size={24} aria-hidden />
                <h2 className="font-lg fw-600 text-primary m-0">{section.title}</h2>
                <p className="font-sm text-tertiary m-0">{section.description}</p>
                {section.note && (
                  <div className="alert-warning p-md">
                    <p className="progress-page__xp-badge m-0">{section.note}</p>
                  </div>
                )}
              </Box>
            </div>
          ))}
        </PageGrid>
      </PageStack>
    </PageShell>
  );
}
