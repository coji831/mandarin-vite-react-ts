/**
 * SideNav component
 *
 * Reusable left sidebar navigation extracted from AppLayout.
 *
 * Story 22.4: nav-only — the account surface (login/user-info/logout) moved
 * to the AppTopBar UserMenu, so SideNav renders no auth chrome in any mode.
 * Adds:
 *   - a phase-gated "Learn" group (nested `children`, locked items show 🔒),
 *   - a desktop collapsed rail (`collapsed`, icons only).
 *
 * Highlights the active nav item using React Router's NavLink (isActive).
 */
import { useState } from "react";
import { NavLink } from "react-router-dom";
import type { LearnNavItem } from "shared/constants";
import "./SideNav.css";

export { SideNav };
export type { NavItem, SideNavProps };

type NavItem = {
  path: string;
  label: string;
  icon: string;
  exact?: boolean;
  /** Nested phase-gated group (the Learn section). When present, renders as an expandable group. */
  children?: LearnNavItem[];
};

type SideNavProps = {
  navItems: NavItem[];
  currentPath: string;
  /** Current user phase for lock logic. Items with requiredPhase > this are locked. */
  phaseGate?: number;
  /** Maps a Learn child id to the phase required to unlock it. */
  requiredPhase?: (id: string) => number;
  /** Desktop icon-rail mode (labels + Learn children hidden). */
  collapsed?: boolean;
  /** Toggle desktop collapse (rendered in the brand row). */
  onToggleCollapse?: () => void;
};

const ACTIVE_LINK_CLASS = "fw-600 bg-primary-bg border-primary-border text-primary-light";

function SideNav({
  navItems,
  currentPath,
  phaseGate = Infinity,
  requiredPhase,
  collapsed = false,
  onToggleCollapse,
}: SideNavProps) {
  // Learn-group accordion state (desktop only).
  const [learnOpen, setLearnOpen] = useState(true);

  const isGroupActive = (path: string) => currentPath.startsWith(path);

  return (
    <aside
      className={`side-nav flex flex-col shrink-0 gap-xl bg-surface-dark p-md border-1 border-surface ${
        collapsed ? "side-nav--collapsed" : ""
      }`}
    >
      {/* Brand + desktop collapse toggle */}
      <div className="side-nav__brand gap-xs font-lg fw-700 p-xs">
        <span className="side-nav__logo font-2xl" aria-hidden="true">
          🏮
        </span>
        <span className="side-nav__title text-accent flex-1">Mandarin</span>
        {onToggleCollapse && (
          <button
            type="button"
            className="side-nav__collapse-toggle flex-center bg-surface-light-5 radius-sm"
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <span aria-hidden="true">{collapsed ? "▸" : "◂"}</span>
          </button>
        )}
      </div>

      {/* Navigation links — always visible */}
      <nav className="side-nav__links flex flex-col" aria-label="Main navigation">
        {navItems.map((item) =>
          item.children && item.children.length > 0 ? (
            <div key={item.path} className="side-nav__group flex flex-col">
              {/* Group header: toggle button (desktop) or static row (collapsed rail) */}
              {collapsed ? (
                <div
                  className={`side-nav__group-header gap-sm radius-sm text-tertiary font-sm p-sm transition-all ${
                    isGroupActive(item.path) ? ACTIVE_LINK_CLASS : ""
                  }`}
                >
                  <span className="side-nav__icon font-md text-center shrink-0" aria-hidden="true">
                    {item.icon}
                  </span>
                  <span className="side-nav__label whitespace-nowrap overflow-hidden">
                    {item.label}
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  className={`side-nav__group-header gap-sm radius-sm text-tertiary font-sm p-sm transition-all ${
                    isGroupActive(item.path) ? ACTIVE_LINK_CLASS : ""
                  }`}
                  onClick={() => setLearnOpen((prev) => !prev)}
                  aria-expanded={learnOpen}
                  aria-controls={`side-nav-group-${item.label.toLowerCase()}`}
                >
                  <span className="side-nav__icon font-md text-center shrink-0" aria-hidden="true">
                    {item.icon}
                  </span>
                  <span className="side-nav__label whitespace-nowrap overflow-hidden">
                    {item.label}
                  </span>
                  <span
                    className={`side-nav__group-chevron font-xs text-muted lh-1 ${
                      learnOpen ? "side-nav__group-chevron--open" : ""
                    }`}
                    aria-hidden="true"
                  >
                    ▾
                  </span>
                </button>
              )}

              {/* Group children — hidden in the collapsed rail */}
              {!collapsed && learnOpen && (
                <div
                  id={`side-nav-group-${item.label.toLowerCase()}`}
                  className="side-nav__group-children flex flex-col"
                >
                  {item.children.map((child) => {
                    const required = requiredPhase?.(child.id) ?? child.requiredPhase;
                    const isLocked = required > phaseGate;
                    return (
                      <NavLink
                        key={child.id}
                        to={isLocked ? "#" : child.path}
                        onClick={(e) => {
                          if (isLocked) {
                            e.preventDefault();
                          }
                        }}
                        aria-disabled={isLocked || undefined}
                        title={isLocked ? `Complete Phase ${required} to unlock` : child.label}
                        className={({ isActive }) =>
                          `side-nav__child gap-sm radius-sm text-tertiary font-sm p-sm transition-all ${
                            isActive && !isLocked ? ACTIVE_LINK_CLASS : ""
                          }`
                        }
                      >
                        <span
                          className="side-nav__child-icon font-md text-center shrink-0"
                          aria-hidden="true"
                        >
                          {child.icon}
                        </span>
                        <span className="side-nav__label whitespace-nowrap overflow-hidden">
                          {child.label}
                        </span>
                        {isLocked && (
                          <span className="font-xs" aria-label="locked">
                            🔒
                          </span>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              className={({ isActive }) =>
                `side-nav__link gap-sm radius-sm text-tertiary font-sm p-sm transition-all ${
                  isActive ? ACTIVE_LINK_CLASS : ""
                }`
              }
            >
              <span className="side-nav__icon font-md text-center shrink-0" aria-hidden="true">
                {item.icon}
              </span>
              <span className="side-nav__label whitespace-nowrap overflow-hidden">
                {item.label}
              </span>
            </NavLink>
          ),
        )}
      </nav>
    </aside>
  );
}
