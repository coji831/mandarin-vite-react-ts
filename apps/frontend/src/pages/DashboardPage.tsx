/**
 * DashboardPage
 *
 * Main landing page for authenticated users (Wireframe Sections 8.3/8.5).
 * Shows current phase with progress, quick access buttons, and recent activity.
 * No XP, levels, or badges — phase-focused overview.
 *
 * Phase variants:
 * - Phase 1: Welcome prompt with "Start with Pinyin Basics" CTA
 * - Phase 2+: Phase progress bar, quick access, recent activity
 */
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { usePhaseGate } from "shared/hooks";
import { LoadingScreen } from "shared/components";
import {
  learn_page,
  practices_review,
  practices_quiz,
  learn_radicals,
} from "../shared/constants/paths";
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
  const { phaseGate, isLoading: phaseLoading } = usePhaseGate();
  const [streakDays] = useState(0);
  const [activities] = useState<ActivityItem[]>([]);

  const currentPhase = phaseGate?.currentPhase ?? 1;
  const phaseName = PHASE_NAMES[currentPhase] ?? "Self-Directed Study";
  const phasePct = currentPhase < 4 ? (PHASE_PCT[currentPhase] ?? 0) : 100;
  const nextStep =
    currentPhase < 4 ? (PHASE_NEXT[currentPhase] ?? "") : "You've completed all phases! 🎉";

  // Combined loading state
  if (phaseLoading) {
    return <LoadingScreen message="Loading your dashboard..." />;
  }

  // Phase 1 empty state (Wireframe 8.5)
  if (currentPhase === 1) {
    return (
      <div className="dashboard">
        <div className="dashboard-header">
          <h1>👋 Welcome to PinyinPal!</h1>
          <p className="dashboard-streak">🔥 {streakDays} days</p>
        </div>
        <div className="dashboard-empty-state card-dark flex-col-center gap-lg p-2xl text-center">
          <span className="dashboard-empty-icon font-5xl">🎉</span>
          <h2 className="font-2xl fw-700 text-primary m-0">Let's start learning!</h2>
          <p className="font-md text-secondary m-0" style={{ maxWidth: 480 }}>
            Begin with the foundations: master Pinyin, tones, and basic strokes. No characters
            needed yet.
          </p>
          <button className="btn-primary btn-lg" onClick={() => navigate(learn_page)}>
            Start with Pinyin Basics ▸
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>👋 Welcome back!</h1>
        <p className="dashboard-streak">🔥 {streakDays} day streak</p>
      </div>

      {/* Current Phase (Wireframe 8.3) */}
      <div className="dashboard-phase card-dark p-lg flex-col gap-md">
        <div className="flex-col gap-xs">
          <h2 className="font-xl fw-700 text-primary m-0">{phaseName}</h2>
          <div className="flex-col gap-xs">
            <div className="flex-between">
              <span className="font-sm text-secondary">{phasePct}% complete</span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${phasePct}%` }}
                role="progressbar"
                aria-valuenow={phasePct}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
          </div>
        </div>
        <p className="font-sm text-secondary m-0">Next: {nextStep}</p>
        <button className="btn-primary" onClick={() => navigate(learn_page)}>
          Continue Learning ▸
        </button>
      </div>

      {/* Quick Access (Wireframe 8.3) */}
      <div className="dashboard-section">
        <h3 className="font-lg fw-600 text-primary m-0 mb-sm">Quick Access</h3>
        <div className="dashboard-quick-grid">
          <Link
            to={`${practices_review}?type=character`}
            className="dashboard-quick-btn card-dark flex-col-center gap-sm p-lg text-center"
          >
            <span className="font-2xl">🃏</span>
            <span className="font-sm fw-600 text-primary">Review Characters</span>
          </Link>
          <Link
            to={`${practices_quiz}?type=audio-to-pinyin-tone`}
            className="dashboard-quick-btn card-dark flex-col-center gap-sm p-lg text-center"
          >
            <span className="font-2xl">📝</span>
            <span className="font-sm fw-600 text-primary">Take Phase Quiz</span>
          </Link>
          <Link
            to={learn_radicals}
            className="dashboard-quick-btn card-dark flex-col-center gap-sm p-lg text-center"
          >
            <span className="font-2xl">📘</span>
            <span className="font-sm fw-600 text-primary">Study Radicals</span>
          </Link>
          <Link
            to="/progress"
            className="dashboard-quick-btn card-dark flex-col-center gap-sm p-lg text-center"
          >
            <span className="font-2xl">📊</span>
            <span className="font-sm fw-600 text-primary">View Progress</span>
          </Link>
        </div>
      </div>

      {/* Recent Activity (Wireframe 8.3) */}
      <div className="dashboard-section">
        <h3 className="font-lg fw-600 text-primary m-0 mb-sm">Recent Activity</h3>
        {activities.length > 0 ? (
          <div className="card-dark p-md flex-col gap-sm">
            {activities.map((item, i) => (
              <div key={i} className="flex-center gap-sm font-sm text-secondary">
                <span>{item.icon}</span>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="card-dark p-md">
            <p className="font-sm text-muted m-0">
              No recent activity yet. Start learning to see your progress here!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
