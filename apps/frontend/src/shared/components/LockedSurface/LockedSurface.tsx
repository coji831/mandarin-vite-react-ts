/**
 * @file shared/components/LockedSurface/LockedSurface.tsx
 * @description Shared locked-surface fallback for below-phase Learn route
 * access (Epic 25 Phase A, S2). Replaces the silent redirect-to-foundations
 * with a neutral, CTA-free gate screen when a user — guest or authed — lands
 * on a Learn route they haven't unlocked yet.
 *
 * Copy is deliberately neutral and non-CTA ("X unlocks in Phase N"); the
 * CTA / value-moment is epic-26's `GuestUpsell` scope (NON-GOAL here).
 * The lock-icon + muted EmptyState treatment mirrors the SideNav locked-item
 * presentation (SideNav.tsx `side-nav__child--locked` + lock icon), so
 * sidebar-locked and direct-URL-locked read as one system.
 *
 * Presentational + data-driven: callers derive `label` / `requiredPhase` from
 * `LEARN_NAV_ITEMS` / `LEARN_REQUIRED_PHASE` (no learnNav import here — this
 * shared component stays generic). Renders the EmptyState pattern already used
 * by the RadicalTreesTab Phase-2 locked-teaser so lock surfaces stay visually
 * consistent.
 */
import { EmptyState } from "../EmptyState/EmptyState";

export type LockedSurfaceProps = {
  /** Content label of the locked surface (e.g. "Grammar"). */
  label: string;
  /** Phase required to unlock the surface (from LEARN_REQUIRED_PHASE). */
  requiredPhase: number;
  className?: string;
};

export function LockedSurface({ label, requiredPhase, className = "" }: LockedSurfaceProps) {
  const rootClass = ["locked-surface flex-1 flex-col-center gap-md p-xl w-full", className]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={rootClass} data-testid="locked-surface">
      <EmptyState icon="lock" title={label} description={`Unlocks in Phase ${requiredPhase}.`} />
    </div>
  );
}
