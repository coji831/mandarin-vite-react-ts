/**
 * LearnLayout component
 *
 * Layout for the Learn section (/learn/* routes).
 * Phase-gated pill tabs navigate to content type pages.
 * Uses <TopNav> for the navigation bar.
 */
import { Outlet, useLocation } from "react-router-dom";
import { usePhaseGate } from "../hooks/usePhaseGate";
import { useAuth } from "features/auth";
import { TopNav } from "shared/components";
import type { TopNavItem } from "shared/components";
import "./LearnLayout.css";

export function LearnLayout() {
  const location = useLocation();
  const { phaseGate } = usePhaseGate();
  const { isAuthenticated } = useAuth();

  const currentPhase = phaseGate?.currentPhase ?? 1;
  const effectivePhase = isAuthenticated ? currentPhase : 4;

  const LEARN_TABS: TopNavItem[] = [
    { id: "foundations", label: "Foundations", icon: "🔤", path: "/learn/foundations" },
    { id: "radicals", label: "Radicals", icon: "📘", path: "/learn/radicals" },
    { id: "grammar", label: "Grammar", icon: "📕", path: "/learn/grammar" },
    { id: "phonetic", label: "Phonetic", icon: "🔊", path: "/learn/phonetic-clusters" },
    { id: "readers", label: "Readers", icon: "📖", path: "/learn/readers" },
    { id: "chengyu", label: "Chengyu", icon: "🏮", path: "/learn/chengyu" },
  ];

  const requiredPhase = (id: string): number => {
    const phaseMap: Record<string, number> = {
      foundations: 1,
      radicals: 2,
      grammar: 2,
      phonetic: 3,
      readers: 3,
      chengyu: 4,
    };
    return phaseMap[id] ?? 1;
  };

  return (
    <div className="learn-layout flex flex-1 flex-col">
      <div className="learn-nav-bar bg-surface-dark p-md">
        <TopNav
          items={LEARN_TABS}
          phaseGate={effectivePhase}
          requiredPhase={requiredPhase}
          aria-label="Learn section tabs"
          align="center"
        />
      </div>
      <div className="learn-content flex flex-1 bg-surface-dark-alt flex-col">
        <Outlet />
      </div>
    </div>
  );
}
