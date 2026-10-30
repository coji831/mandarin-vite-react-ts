/**
 * SideNav component
 *
 * Reusable left sidebar navigation extracted from AppLayout.
 *
 * Story 22.4: nav-only — the account surface (login/user-info/logout) moved
 * to the AppTopBar UserMenu, so SideNav renders no auth chrome in any mode.
 * Adds:
 *   - a collapsible "Learn" group (nested `children`),
 *   - a desktop collapsed rail (`collapsed`, icons only).
 *
 * Story 25-3 / A25 — NO USER-PHASE STATE (BM-1 §3, L6):
 *   - The `phaseGate` / `requiredPhase` props are deleted (not renamed): the
 *     sidebar holds no user phase and cannot compute a lock. Every Learn child
 *     is an ordinary link for every visitor — no `preventDefault`, no
 *     `aria-disabled`, no `tabIndex={-1}`, no lock icon, no dimming.
 *   - `child.phase` is sequencing METADATA only; it surfaces as the tooltip
 *     (`"Grammar · Phase 2 of 4"`). If a wall ever comes back, it comes back
 *     here first — don't.
 *   - The collapsed rail's Learn tooltip stays phase-free
 *     (`"Learn — <active child>"`) so Focus chrome never advertises a gate.
 *
 * Story 22.5 (nav/URL sync):
 *   - Accepts a full `location` ({ pathname, search }) so it can apply the
 *     same-path guard: clicking a sidebar link for the page you're already on
 *     is a no-op that preserves the current sub-state (`?tab`, `?view`, …)
 *     instead of PUSH-ing a bare URL that drops it.
 *   - Learn child `to` = `withSearchParams(child.path, child.defaultParams)`
 *     — bare canonical today (no item defines defaultParams).
 *   - The Learn group header is split: the LABEL is the default-landing link
 *     (navigates to `/learn/foundations`) while the CHEVRON stays the
 *     accordion toggle (`aria-expanded` stays on the toggle).
 *
 * Highlights the active nav item using React Router's NavLink (isActive),
 * which is pathname-based — a sub-state change never moves the highlight.
 */
import { useState, type MouseEvent as ReactMouseEvent } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import type { LearnNavItem, SearchParamInput } from "shared/constants";
import {
  buildSearchParams,
  learn_foundations,
  LEARN_NAV_ITEMS,
  withSearchParams,
} from "shared/constants";
import { Icon } from "../Icon/Icon";
import type { IconName } from "../Icon/Icon";
import "./SideNav.css";

export { SideNav };
export type { NavItem, SideNavProps };

type NavItem = {
  path: string;
  label: string;
  /** Sanctioned icon name (ADR-010 / Q8) — rendered via the shared Icon component. */
  icon: IconName;
  exact?: boolean;
  /**
   * Nested group (the Learn section). When present, renders as an expandable
   * group. `child.phase` is sequencing metadata only — never a lock (A25).
   */
  children?: LearnNavItem[];
};

type SideNavProps = {
  navItems: NavItem[];
  currentPath: string;
  /**
   * Full location ({ pathname, search }) for URL-aware navigation. Enables
   * the same-path guard that preserves sub-state on same-page sidebar
   * clicks. Falls back to `{ pathname: currentPath, search: "" }` when
   * omitted (existing tests/stories that pass only `currentPath` keep
   * working).
   */
  location?: { pathname: string; search: string };
  /** Desktop icon-rail mode (labels + Learn children hidden). */
  collapsed?: boolean;
  /** Toggle desktop collapse (rendered in the bottom footer slot). */
  onToggleCollapse?: () => void;
};

const ACTIVE_LINK_CLASS = "fw-600 bg-primary-bg border-primary-border text-primary-light";

function SideNav({
  navItems,
  currentPath,
  location,
  collapsed = false,
  onToggleCollapse,
}: SideNavProps) {
  // Learn-group accordion state (desktop only).
  const [learnOpen, setLearnOpen] = useState(true);
  const navigate = useNavigate();

  // URL-aware current location: prefer the full `location` prop, fall back to
  // the path-only `currentPath` for callers that don't pass it.
  const resolvedLocation = location ?? { pathname: currentPath, search: "" };

  const isGroupActive = (path: string) => resolvedLocation.pathname.startsWith(path);

  /**
   * Same-path guard (Story 22.5): clicking a sidebar link whose target
   * pathname equals the current pathname would PUSH a bare URL and drop the
   * current sub-state (`?tab`/`?view`/…). Instead we no-op to preserve it.
   *
   * Today's links are bare-canonical (no `defaultParams`), so same pathname ⇒
   * same page ⇒ always a no-op. When a future item defines `defaultParams`,
   * the rule becomes: no-op only if the full current URL already equals the
   * resolved `to`; otherwise replace-to-`to` (canonical landing).
   *
   * Review N2: the "has defaults" flag derives from the SERIALIZED
   * `defaultParams` (not the raw object) — an all-null/empty object
   * (e.g. `{ tab: null }`) omits every key, so `to` stays bare and a
   * same-path click is a no-op, never a replace-to-bare.
   */
  const guardSamePath = (
    e: ReactMouseEvent<HTMLAnchorElement>,
    to: string,
    defaultParams?: SearchParamInput,
  ) => {
    const toPathname = to.split("?")[0];
    if (toPathname !== resolvedLocation.pathname) return;
    e.preventDefault();
    const hasDefaultParams = buildSearchParams(new URLSearchParams(), defaultParams).size > 0;
    const currentUrl = resolvedLocation.pathname + resolvedLocation.search;
    if (hasDefaultParams && to !== currentUrl) {
      navigate(to, { replace: true });
    }
  };

  return (
    <aside
      className={`side-nav flex flex-col shrink-0 gap-xl bg-surface-dark p-md border-1 border-surface ${
        collapsed ? "side-nav--collapsed" : ""
      }`}
    >
      {/* Brand row — CJK-first identity (A3, S1′a-2): hanzi mark + name + 拼音.
          Collapse toggle lives in the footer. */}
      <div className="side-nav__brand gap-sm p-xs">
        <span className="side-nav__mark" lang="zh-Hans" aria-hidden="true">
          拼
        </span>
        <span className="side-nav__title flex-1">
          PinyinPal
          <span className="side-nav__title-zh" lang="zh-Hans">
            拼音
          </span>
        </span>
      </div>

      {/* Navigation links — always visible */}
      <nav className="side-nav__links flex flex-col" aria-label="Main navigation">
        {navItems.map((item) => {
          // Active Learn child (for the collapsed rail's title) — only
          // meaningful when a child path matches; guards the title against a
          // dangling em-dash when currentPath is the group root with no child.
          const activeChild = item.children?.find((ch) =>
            resolvedLocation.pathname.startsWith(ch.path),
          );

          // Learn group default landing (Review N3): derive from
          // LEARN_NAV_ITEMS — the single source of truth — instead of a
          // hardcoded path, so the label target stays in sync with nav data.
          const foundationsItem = LEARN_NAV_ITEMS.find((i) => i.id === "foundations");
          const foundationsTo = withSearchParams(
            foundationsItem?.path ?? learn_foundations,
            foundationsItem?.defaultParams,
          );

          return item.children && item.children.length > 0 ? (
            <div key={item.path} className="side-nav__group flex flex-col">
              {/* Group header (parent): label link + chevron toggle (expanded),
                  or a single keyboard-reachable label link to the default
                  landing (collapsed rail — icon + tooltip only). */}
              {collapsed ? (
                <Link
                  to={foundationsTo}
                  onClick={(e) => guardSamePath(e, foundationsTo, foundationsItem?.defaultParams)}
                  aria-label={item.label}
                  aria-current={isGroupActive(item.path) ? "page" : undefined}
                  title={
                    isGroupActive(item.path)
                      ? activeChild
                        ? `${item.label} — ${activeChild.label}`
                        : item.label
                      : item.label
                  }
                  className={`side-nav__group-header gap-sm radius-sm text-secondary font-sm fw-600 p-sm transition-all border-1 border-transparent bg-transparent ${
                    isGroupActive(item.path) ? ACTIVE_LINK_CLASS : ""
                  }`}
                >
                  <span className="side-nav__icon font-md text-center shrink-0" aria-hidden="true">
                    <Icon name={item.icon} size={16} />
                  </span>
                  <span className="side-nav__label whitespace-nowrap overflow-hidden">
                    {item.label}
                  </span>
                </Link>
              ) : (
                <div
                  className={`side-nav__group-header gap-sm radius-sm text-secondary font-sm fw-600 p-sm transition-all border-1 border-transparent bg-transparent ${
                    isGroupActive(item.path) ? ACTIVE_LINK_CLASS : ""
                  }`}
                >
                  {/* Label = default landing link (Story 22.5): navigates to
                      the Learn group's default child (Foundations) while the
                      chevron toggles the accordion. `aria-current` stays
                      pathname-based (group active when any child is active).
                      Same-path guard preserves sub-state on a no-op click. */}
                  <Link
                    to={foundationsTo}
                    onClick={(e) => guardSamePath(e, foundationsTo, foundationsItem?.defaultParams)}
                    aria-current={isGroupActive(item.path) ? "page" : undefined}
                    title={item.label}
                    className="side-nav__group-label flex flex-1 items-center gap-sm"
                  >
                    <span
                      className="side-nav__icon font-md text-center shrink-0"
                      aria-hidden="true"
                    >
                      <Icon name={item.icon} size={16} />
                    </span>
                    <span className="side-nav__label whitespace-nowrap overflow-hidden">
                      {item.label}
                    </span>
                  </Link>
                  <button
                    type="button"
                    className="side-nav__group-chevron-btn"
                    onClick={() => setLearnOpen((prev) => !prev)}
                    aria-expanded={learnOpen}
                    aria-controls={`side-nav-group-${item.label.toLowerCase()}`}
                    aria-label={
                      learnOpen ? `Collapse ${item.label} section` : `Expand ${item.label} section`
                    }
                  >
                    <span
                      className={`side-nav__group-chevron text-muted lh-1 ${
                        learnOpen ? "side-nav__group-chevron--open" : ""
                      }`}
                      aria-hidden="true"
                    >
                      <Icon name="chevron-down" size={16} />
                    </span>
                  </button>
                </div>
              )}

              {/* Group children — hidden in the collapsed rail */}
              {!collapsed && learnOpen && (
                <div
                  id={`side-nav-group-${item.label.toLowerCase()}`}
                  className="side-nav__group-children flex flex-col"
                >
                  {item.children.map((child) => {
                    // Canonical landing URL: bare path + any (future) default
                    // params. Today every item lands bare.
                    const childTo = withSearchParams(child.path, child.defaultParams);
                    return (
                      <NavLink
                        key={child.id}
                        to={childTo}
                        aria-label={child.label}
                        // Same-path guard: preserve sub-state on a same-page
                        // click (fixes the PUSH-drop bug). A25: every item
                        // navigates — there is no lock branch to short-circuit.
                        onClick={(e) => guardSamePath(e, childTo, child.defaultParams)}
                        // Phase is metadata, not permission (A25): the tooltip
                        // names the recommended study order only.
                        title={`${child.label} · Phase ${child.phase} of 4`}
                        className={({ isActive }) =>
                          `side-nav__child gap-sm radius-sm text-tertiary font-xs p-sm transition-all border-1 border-transparent ${
                            isActive ? ACTIVE_LINK_CLASS : ""
                          }`
                        }
                      >
                        <span
                          className="side-nav__child-icon font-md text-center shrink-0"
                          aria-hidden="true"
                        >
                          <Icon name={child.icon} size={16} />
                        </span>
                        <span className="side-nav__label whitespace-nowrap overflow-hidden">
                          {child.label}
                        </span>
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
              aria-label={item.label}
              className={({ isActive }) =>
                `side-nav__link gap-sm radius-sm text-tertiary font-sm p-sm transition-all border-1 border-transparent ${
                  isActive ? ACTIVE_LINK_CLASS : ""
                }`
              }
            >
              <span className="side-nav__icon font-md text-center shrink-0" aria-hidden="true">
                <Icon name={item.icon} size={16} />
              </span>
              <span className="side-nav__label whitespace-nowrap overflow-hidden">
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom footer slot — desktop collapse toggle pinned to the rail bottom.
          Icon + "Collapse" label when expanded, icon-only centered when collapsed.
          Hidden on the ≤768px forced mobile icon rail (collapse is desktop-only). */}
      {onToggleCollapse && (
        <div className="side-nav__footer">
          <button
            type="button"
            className="side-nav__collapse-toggle flex-center bg-surface-light-5 radius-sm"
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <span aria-hidden="true">
              <Icon name={collapsed ? "chevron-right" : "chevron-left"} size={16} />
            </span>
            <span className="side-nav__footer-label font-xs text-secondary">
              {collapsed ? "" : "Collapse"}
            </span>
          </button>
        </div>
      )}
    </aside>
  );
}
