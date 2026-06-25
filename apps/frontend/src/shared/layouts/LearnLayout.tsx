/**
 * LearnLayout component
 *
 * Layout for the Learn section (/learn/* routes).
 * Phase-gated tab bar navigates to content type pages.
 * Locked tabs show 🔒 with tooltip "Complete Phase N to unlock".
 *
 * Story 18.1: Restored as route navigation tab bar.
 * ContentBrowser lives at /library for freeroam browsing.
 */
import { Link, Outlet, useLocation } from "react-router-dom";
import { usePhaseGate } from "../hooks/usePhaseGate";
import "./LearnLayout.css";

export function LearnLayout() {
  const location = useLocation();
  const { phaseGate } = usePhaseGate();

  const currentPhase = phaseGate?.currentPhase ?? 1;

  const LEARN_TABS = [
    {
      id: "foundations",
      label: "Foundations",
      icon: "🔤",
      path: "/learn/foundations",
      requiredPhase: 1,
    },
    { id: "radicals", label: "Radicals", icon: "📘", path: "/learn/radicals", requiredPhase: 2 },
    { id: "grammar", label: "Grammar", icon: "📕", path: "/learn/grammar", requiredPhase: 2 },
    {
      id: "phonetic",
      label: "Phonetic",
      icon: "🔊",
      path: "/learn/phonetic-clusters",
      requiredPhase: 3,
    },
    { id: "readers", label: "Readers", icon: "📖", path: "/learn/readers", requiredPhase: 3 },
    { id: "chengyu", label: "Chengyu", icon: "🏮", path: "/learn/chengyu", requiredPhase: 4 },
  ] as const;

  return (
    <div className="learn-layout">
      <nav className="learn-phase-nav" role="tablist" aria-label="Learn section tabs">
        {LEARN_TABS.map((tab) => {
          const isLocked = tab.requiredPhase > currentPhase;
          const isActive = location.pathname === tab.path;

          return (
            <Link
              key={tab.id}
              to={isLocked ? "#" : tab.path}
              role="tab"
              aria-selected={isActive}
              className={`learn-phase-tab ${isActive ? "learn-phase-tab--active" : ""} ${isLocked ? "learn-phase-tab--locked" : ""}`}
              onClick={(e) => {
                if (isLocked) e.preventDefault();
              }}
              title={isLocked ? `Complete Phase ${tab.requiredPhase} to unlock` : tab.label}
            >
              <span aria-hidden="true">{tab.icon}</span>
              <span>{tab.label}</span>
              {isLocked && (
                <span className="tab-bar__lock-icon" aria-label="locked">
                  🔒
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="learn-content">
        <Outlet />
      </div>
    </div>
  );
}
