/**
 * PageShell Component — content region for a page (page-anatomy law, A2)
 *
 * The ONLY content measure+pad primitive — and the one place a page's surface
 * register is declared (ADR-011 decision 4 / ADR-012). Centers content at the
 * archetype's measure token with --page-pad gutters. The archetype prop speaks
 * spine's generic page vocabulary and maps one-to-one onto its measure token
 * (overview -> --page-measure-overview, list -> --page-measure-list, detail ->
 * --page-measure-detail, ...). That mapping lives in PageShell.css only.
 * Pages must compose as: AppShell/SideNav chrome -> PageShell -> (PageHeader)
 * -> PageStack -> (PageGrid). NO page-scoped layout CSS / hardcoded max-width.
 *
 * Contract: consuming the per-archetype measure is PageShell's job — pages
 * must NOT set their own max-width/margin (design-audit rule
 * page-scoped-layout-css). Surface styling is otherwise NOT applied here
 * (PageShell is layout-only; surface lives on the child cards / chrome per
 * elevation rules) — the ONE exception is the register in ADR-011/ADR-012: a page
 * that declares `surface="paper"` gets the paper (reading) surface painted here,
 * because a register belongs to the page region, not to a page's own CSS.
 */
import type { ElementType, ReactNode } from "react";
import "./PageShell.css";

export type PageArchetype =
  | "overview"
  | "list"
  | "detail"
  | "create-edit"
  | "settings"
  | "auth"
  | "search"
  | "profile"
  | "notifications"
  | "reports"
  | "empty"
  | "not-found"
  | "wizard";

export type PageSurface = "instrument" | "paper";

export type PageShellProps = {
  /** Archetype selects the measure token --page-measure-<archetype>. */
  archetype?: PageArchetype;
  /**
   * The surface register (ADR-011 decision 4: per-archetype, never global).
   * "instrument" (default) is the dark data/task surface the app shell already
   * paints. "paper" is the reading surface — paper plane + paper text tiers — and
   * it is the long-form reading page only, the case the archetype library used to
   * name `focus-media`. Spine retired that name (long-form reading is `detail`
   * with a different body), so the register cannot ride on the archetype id; the
   * reading page declares it. Never a light mode (ADR-001 stands).
   */
  surface?: PageSurface;
  /**
   * HTML element to render as. Default: div — the app shell (AppLayout) already
   * owns the <main class="app-content"> landmark, so a page shell must not nest
   * a second main (axe landmark-unique). Pass "section" when the region is
   * named, or "main" only when rendering outside the app shell.
   */
  as?: ElementType;
  children?: ReactNode;
  className?: string;
  id?: string;
  /** Region semantics — PageShell is the page's content region. */
  role?: string;
  "aria-label"?: string;
  /** True while the page's data is in flight (pages render their skeleton here). */
  "aria-busy"?: boolean | "true" | "false";
};

export function PageShell({
  archetype = "overview",
  surface = "instrument",
  as: Tag = "div",
  children,
  className,
  ...rest
}: PageShellProps) {
  const cls = [
    "page-shell",
    `page-shell--${archetype}`,
    surface === "paper" ? "page-surface--paper" : null,
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <Tag className={cls} {...rest}>
      {children}
    </Tag>
  );
}
