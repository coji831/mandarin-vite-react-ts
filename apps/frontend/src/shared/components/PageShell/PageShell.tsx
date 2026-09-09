/**
 * PageShell Component — content region for a page (page-anatomy law, A2)
 *
 * The ONLY content measure+pad+surface primitive. Centers content at the
 * archetype's --page-measure-<archetype> token with --page-pad gutters.
 * Pages must compose as: AppShell/SideNav chrome -> PageShell -> (PageHeader)
 * -> PageStack -> (PageGrid). NO page-scoped layout CSS / hardcoded max-width.
 *
 * Contract: consuming the per-archetype measure is PageShell's job — pages
 * must NOT set their own max-width/margin (design-audit rule
 * page-scoped-layout-css). Surface styling is NOT applied here (PageShell is
 * layout-only; surface lives on the child cards / chrome per elevation rules).
 */
import type { ElementType, ReactNode } from "react";
import "./PageShell.css";

export type PageArchetype = "hub-launcher" | "browse-index" | "focus-task" | "utility" | "auth";

export type PageShellProps = {
  /** Archetype selects the measure token --page-measure-<archetype>. */
  archetype?: PageArchetype;
  /** HTML element to render as (main/div/section). Default: main. */
  as?: ElementType;
  children?: ReactNode;
  className?: string;
  id?: string;
  "aria-label"?: string;
};

export function PageShell({
  archetype = "hub-launcher",
  as: Tag = "main",
  children,
  className,
  ...rest
}: PageShellProps) {
  const cls = ["page-shell", `page-shell--${archetype}`, className].filter(Boolean).join(" ");
  return (
    <Tag className={cls} {...rest}>
      {children}
    </Tag>
  );
}
