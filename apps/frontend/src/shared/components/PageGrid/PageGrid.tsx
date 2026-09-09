/**
 * PageGrid Component — the ONLY card home (page-anatomy law, A2)
 *
 * Renders a responsive card grid with canonical columns + --card-gutter-*
 * gutter per density tier. NOT a paginated list — that is `Grid`. Use for
 * card families on a page (quick-access tiles, browse cards, section cards).
 *
 * Columns default per intent: tiles=4, cards=3, wide=2. Responsive collapse:
 * 4 -> 2 -> 1, 3 -> 2 -> 1, 2 -> 1 (utility classes in CSS). No page-scoped
 * grid overrides (design-audit rule page-scoped-grid).
 */
import type { ReactNode } from "react";
import "./PageGrid.css";

export type PageGridColumns = 1 | 2 | 3 | 4;
export type PageGridGutter = "sm" | "default" | "lg";

export type PageGridProps = {
  /** Column count at desktop: tiles=4, cards=3, wide=2. */
  columns?: PageGridColumns;
  /** Gutter: sm=--card-gutter-sm, default=--card-gutter, lg=--card-gutter-lg */
  gutter?: PageGridGutter;
  children?: ReactNode;
  className?: string;
  "aria-label"?: string;
};

export function PageGrid({
  columns = 3,
  gutter = "default",
  children,
  className,
  "aria-label": ariaLabel,
}: PageGridProps) {
  const cls = ["page-grid", `page-grid--cols-${columns}`, `page-grid--gutter-${gutter}`, className]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={cls} role="list" aria-label={ariaLabel}>
      {children}
    </div>
  );
}
