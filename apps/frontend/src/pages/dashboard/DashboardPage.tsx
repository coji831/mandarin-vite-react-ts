/**
 * DashboardPage
 *
 * Main landing page for authenticated users (Wireframe Sections 8.3/8.5).
 * Thin container: fetches phase gate state, owns the page anatomy (PageShell
 * hub-launcher measure), and delegates rendering to feature components that
 * own their own PageStack rhythm and PageGrid card homes.
 *
 * Phase variants:
 * - Phase 1: DashboardWelcome
 * - Phase 2+: DashboardSections (CurrentPhase + QuickAccess + RecentActivity)
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePhaseGate } from "shared/hooks";
import { PageGrid, PageShell, PageStack, Skeleton } from "shared/components";
import type { IconName } from "shared/components";
import { learn_page } from "shared/constants";
import { DashboardWelcome, DashboardSections } from "features/dashboard";
import { DashboardGuest } from "features/dashboard";
import { useAuth } from "features/auth";

export { DashboardPage };

type ActivityItem = {
  icon: IconName;
  text: string;
};

/** Phase titles, keyed by the 1-based phase number the API returns. */
const PHASE_TITLES: Record<number, string> = {
  1: "The Blueprint",
  2: "The Core 300",
  3: "The Network",
  4: "Advanced Fluidity",
};

const PHASE_PCT: Record<number, number> = {
  1: 0,
  2: 45,
  3: 0,
  4: 100,
};

const PHASE_NEXT: Record<number, string> = {
  1: "Master Pinyin, tones, and basic strokes",
  2: "Learn radicals: 氵, 亻, 口 recommended",
  3: "Explore phonetic clusters and graded readers",
  4: "All content available — explore freely!",
};

/** Fallback title for a phase number outside the 4-phase course. */
const PHASE_FALLBACK_TITLE = "Self-Directed Study";

function DashboardPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { phaseGate, isLoading: phaseLoading } = usePhaseGate();
  const [streakDays] = useState(0);
  const [activities] = useState<ActivityItem[]>([]);

  const currentPhase = phaseGate?.currentPhase ?? 1;
  const phaseTitle = PHASE_TITLES[currentPhase] ?? PHASE_FALLBACK_TITLE;
  const phasePct = currentPhase < 4 ? (PHASE_PCT[currentPhase] ?? 0) : 100;
  const nextStep =
    currentPhase < 4 ? (PHASE_NEXT[currentPhase] ?? "") : "You've completed all phases!";

  if (phaseLoading || authLoading) {
    // Loading skeleton — dims equal final content (D.8: no CLS).
    // A11y: keep exactly one <h1> per page even while loading (axe
    // page-has-heading-one) via the visually-hidden title; the region is
    // aria-busy with a descriptive label (Skeletons below stay aria-hidden
    // placeholders / role=status live regions).
    return (
      <PageShell
        archetype="hub-launcher"
        as="div"
        role="region"
        aria-busy="true"
        aria-label="Loading dashboard"
      >
        <PageStack size="default">
          <h1 className="sr-only">Dashboard</h1>
          <Skeleton variant="custom" width="100%" height="88px" />
          <Skeleton variant="card" height="180px" />
          <section className="flex-col gap-sm">
            <Skeleton variant="line" width="160px" height="20px" />
            <PageGrid columns={4}>
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} role="listitem" className="flex min-w-0">
                  <Skeleton variant="card" height="150px" className="flex-1" />
                </div>
              ))}
            </PageGrid>
          </section>
          <section className="flex-col gap-sm">
            <Skeleton variant="line" width="160px" height="20px" />
            <Skeleton variant="card" height="72px" />
          </section>
        </PageStack>
      </PageShell>
    );
  }

  return (
    <PageShell archetype="hub-launcher" as="div">
      {!isAuthenticated ? (
        <DashboardGuest />
      ) : currentPhase === 1 ? (
        <DashboardWelcome streakDays={streakDays} onStartLearning={() => navigate(learn_page)} />
      ) : (
        <DashboardSections
          phaseNumber={currentPhase}
          phaseTitle={phaseTitle}
          phasePct={phasePct}
          nextStep={nextStep}
          streakDays={streakDays}
          activities={activities}
          onContinueLearning={() => navigate(learn_page)}
        />
      )}
    </PageShell>
  );
}
