/**
 * DashboardPage
 *
 * Main landing page (Wireframe Sections 8.3/8.5). Thin container: fetches phase
 * gate state, owns the page anatomy (PageShell overview measure), and delegates
 * rendering to feature components that own their own PageStack rhythm.
 *
 * Phase variants:
 * - guest: DashboardGuest (the BM-2 wedge leads; registration is the outcome)
 * - Phase 1: DashboardWelcome
 * - Phase 2+: DashboardSections
 *
 * Rework (§8): every variant now carries ONE primary CTA plus the tone-demo
 * wedge. The wedge's CTA is not live yet (no grading engine), so it lands on the
 * closest real surface — the four tones step of the Blueprint.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePhaseGate } from "shared/hooks";
import { PageShell, PageStack, Skeleton } from "shared/components";
import { learn_foundations } from "shared/constants";
import { DashboardWelcome, DashboardSections } from "features/dashboard";
import { DashboardGuest } from "features/dashboard";
import { useAuth } from "features/auth";

export { DashboardPage };

type ActivityItem = {
  icon: "review" | "quiz" | "book" | "progress" | "flame" | "star" | "zap";
  text: string;
};

/** Phase titles, keyed by the 1-based phase number the API returns. */
const PHASE_TITLES: Record<number, string> = {
  1: "The Blueprint",
  2: "The Core 300",
  3: "The Network",
  4: "Advanced Fluidity",
};

const PHASE_NEXT: Record<number, string> = {
  1: "the four tones",
  2: "your first radicals",
  3: "graded readers",
  4: "whatever you like — everything is open",
};

/** Fallback title for a phase number outside the 4-phase course. */
const PHASE_FALLBACK_TITLE = "Self-Directed Study";

/** The tone drill that stands in for the (not yet live) grading demo. */
const TONE_DRILL_PATH = `${learn_foundations}/reference?tab=tones`;

function DashboardPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { phaseGate, isLoading: phaseLoading } = usePhaseGate();
  const [streakDays] = useState(0);
  const [activities] = useState<ActivityItem[]>([]);

  const currentPhase = phaseGate?.currentPhase ?? 1;
  const phaseTitle = PHASE_TITLES[currentPhase] ?? PHASE_FALLBACK_TITLE;
  const nextStep = PHASE_NEXT[currentPhase] ?? PHASE_NEXT[1];

  const openToneDrill = () => navigate(TONE_DRILL_PATH);

  if (phaseLoading || authLoading) {
    // Loading skeleton — dims equal final content (D.8: no CLS).
    // A11y: exactly one <h1> even while loading (axe page-has-heading-one).
    return (
      <PageShell
        archetype="overview"
        as="div"
        role="region"
        aria-busy="true"
        aria-label="Loading dashboard"
      >
        <PageStack size="default">
          <h1 className="sr-only">Dashboard</h1>
          <Skeleton variant="custom" width="100%" height="88px" />
          <Skeleton variant="card" height="180px" />
          <Skeleton variant="card" height="120px" />
        </PageStack>
      </PageShell>
    );
  }

  return (
    <PageShell archetype="overview" as="div">
      {!isAuthenticated ? (
        <DashboardGuest />
      ) : currentPhase === 1 ? (
        <DashboardWelcome
          streakDays={streakDays}
          onStartLearning={() => navigate(learn_foundations)}
          onTryToneDemo={openToneDrill}
        />
      ) : (
        <DashboardSections
          phaseTitle={phaseTitle}
          nextStep={nextStep}
          streakDays={streakDays}
          lastActivity={activities[0] ?? null}
          onContinueLearning={() => navigate(learn_foundations)}
          onTryToneDemo={openToneDrill}
        />
      )}
    </PageShell>
  );
}
