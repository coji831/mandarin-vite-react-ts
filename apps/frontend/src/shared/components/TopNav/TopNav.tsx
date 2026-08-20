/**
 * TopNav Component — Top-level navigation bar
 *
 * Uses `<NavLink>` from react-router-dom for route-based navigation
 * between major sections. Active item uses underline indicator (`border-b-2`).
 * Supports phase-gated lock states.
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
