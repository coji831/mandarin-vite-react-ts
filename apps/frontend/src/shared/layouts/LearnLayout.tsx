/**
 * LearnLayout component
 *
 * Layout for the Learn section (/learn/* routes).
 *
 * Story 22.4: the phase-gated pill tab bar (TopNav) was removed — the Learn
 * tabs (Foundations/Radicals/Grammar/Phonetic/Readers/Chengyu) now live in
 * the sidebar's Learn group (IA Option A). This layout remains a scroll
 * container around the outlet to minimize story churn.
 */
import { Outlet } from "react-router-dom";
import "./LearnLayout.css";

export function LearnLayout() {
  return (
    <div className="learn-layout flex flex-1 flex-col">
      <div className="learn-content flex flex-1 bg-surface-dark-alt flex-col">
        <Outlet />
      </div>
    </div>
  );
}
