/**
 * DashboardPage
 *
 * Main landing page for authenticated users (Wireframe Sections 8.3/8.5).
 * Thin container: fetches phase gate state and delegates rendering to
 * feature components.
 *
 * Phase variants:
 * - Phase 1: DashboardWelcome
 * - Phase 2+: DashboardSections (PhaseProgress + QuickAccess + RecentActivity)
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePhaseGate } from "shared/hooks";
import { LoadingScreen } from "shared/components";
import { learn_page } from "shared/constants";
import { DashboardWelcome, DashboardSections } from "features/dashboard";
import { DashboardGuest } from "features/dashboard";
import { useAuth } from "features/auth";
import "./DashboardPage.css";

export { DashboardPage };

type ActivityItem = {
  icon: string;
  text: string;
};

const PHASE_NAMES: Record<number, string> = {
  1: "Phase 1: The Blueprint",
  2: "Phase 2: The Core 300",
  3: "Phase 3: The Network",
  4: "Phase 4: Advanced Fluidity",
};

const PHASE_PCT: Record<number, number> = {
  1: 0,
  2: 45,
  3: 0,
  4: 100,
};

const PHASE_NEXT: Record<number, string> = {
  1: "Master Pinyin, tones, and basic strokes",
  2: "Learn radicals (★ 氵, 亻, 口 recommended)",
  3: "Explore phonetic clusters and graded readers",
  4: "All content available — explore freely!",
};

function DashboardPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { phaseGate, isLoading: phaseLoading } = usePhaseGate();
  const [streakDays] = useState(0);
  const [activities] = useState<ActivityItem[]>([]);

  const currentPhase = phaseGate?.currentPhase ?? 1;
  const phaseName = PHASE_NAMES[currentPhase] ?? "Self-Directed Study";
  const phasePct = currentPhase < 4 ? (PHASE_PCT[currentPhase] ?? 0) : 100;
  const nextStep =
    currentPhase < 4 ? (PHASE_NEXT[currentPhase] ?? "") : "You've completed all phases! 🎉";

  if (phaseLoading || authLoading) {
    return <LoadingScreen message="Loading your dashboard..." />;
  }

  if (!isAuthenticated) {
    return <DashboardGuest />;
  }

  if (currentPhase === 1) {
    return (
      <DashboardWelcome streakDays={streakDays} onStartLearning={() => navigate(learn_page)} />
    );
  }

  // Phase 2+
  return (
    <DashboardSections
      phaseName={phaseName}
      phasePct={phasePct}
      nextStep={nextStep}
      streakDays={streakDays}
      activities={activities}
      onContinueLearning={() => navigate(learn_page)}
    />
  );
}
