/**
 * TopNav Component — Top-level navigation bar
 *
 * Uses `<NavLink>` from react-router-dom for route-based navigation
 * between major sections. Active item uses underline indicator (`border-b-2`).
 * Legacy phase-lock props (`phaseGate` / `requiredPhase`) are orphaned and
 * unsanctioned post-A25 (BM-1 L6) — see `TopNavProps`.
 *
 * This is NOT a tab pattern (ARIA `role="tab"`) — it's a navigation landmark.
 * For content switching within a page, use `<Tabs>` instead.
 */
import { NavLink } from "react-router-dom";
import "./TopNav.css";

export type TopNavItem = {
  id: string;
  label: string;
  icon?: string;
  path: string;
  isLocked?: boolean;
};

export type TopNavProps = {
  items: TopNavItem[];
  /**
   * ORPHANED lock props (Story 25-3 / A25 tripwire) — no consumer passes these;
   * `TopNav` itself is orphaned (Learn tabs moved to the SideNav Learn group,
   * Story 22.4). Phase-driven nav locks are NOT a sanctioned pattern post-A25
   * (BM-1 L6: "signals, not walls"), so these props must not be wired up or
   * copied into a live surface. Behaviour is unchanged; removal is deferred to
   * the epic-26 copy pass (recorded in the 25-3 impl doc).
   */
  /** Current user phase for lock logic. Items with requiredPhase > this are locked. */
  phaseGate?: number;
  /** Maps an item id to the phase required to unlock it. */
  requiredPhase?: (id: string) => number;
  /** Accessible label for the nav landmark */
  "aria-label"?: string;
  /** Alignment of nav items: "start" (left) | "center" | "end" (right) */
  align?: "start" | "center" | "end";
};

export function TopNav({
  items,
  phaseGate = Infinity,
  requiredPhase,
  "aria-label": ariaLabel = "Main navigation",
  align = "start",
}: TopNavProps) {
  return (
    <nav
      className="top-nav gap-xs p-xs"
      role="navigation"
      aria-label={ariaLabel}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: align === "center" ? "center" : align === "end" ? "flex-end" : "flex-start",
        overflowX: "auto",
        scrollbarWidth: "none",
      }}
    >
      {items.map((item) => {
        const required = requiredPhase?.(item.id) ?? 1;
        const isLocked = item.isLocked ?? required > phaseGate;
        const effectivePath = isLocked ? "#" : item.path;

        return (
          <NavLink
            key={item.id}
            to={effectivePath}
            className={({ isActive }) =>
              [
                "flex-center gap-sm font-sm whitespace-nowrap p-xs transition-all top-nav__link",
                isActive && !isLocked
                  ? "text-primary border-primary"
                  : "text-muted border-transparent",
                isLocked ? "op-40 cursor-not-allowed" : "",
              ]
                .filter(Boolean)
                .join(" ")
            }
            onClick={(e) => {
              if (isLocked) {
                e.preventDefault();
              }
            }}
            aria-disabled={isLocked || undefined}
            title={isLocked ? `Complete Phase ${required} to unlock` : item.label}
          >
            {item.icon && <span aria-hidden="true">{item.icon}</span>}
            <span>{item.label}</span>
            {isLocked && (
              <span className="font-xs" aria-label="locked">
                🔒
              </span>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}
