/**
 * @file EmptyState.tsx
 * @description Shared iconographic empty state (Tier-0 vibrancy, 2B.1 d).
 *
 * Precision-minimal: optional decorative icon, title, description, and an
 * action slot (typically one secondary Button). Presentational only — no data
 * flow. Callers wrap it in their own container (e.g. Box variant="dashed")
 * when a bordered/surface look is needed, matching the design tokens.
 */
import type { ReactNode } from "react";
import { Icon } from "../Icon/Icon";
import type { IconName } from "../Icon/Icon";
import "./EmptyState.css";

export type EmptyStateProps = {
  /** Decorative leading icon from the sanctioned Icon set (optional). */
  icon?: IconName;
  /** Short empty-state heading. */
  title: string;
  /** Supporting copy explaining the next step (optional). */
  description?: string;
  /** Action slot — typically a single secondary Button (optional). */
  action?: ReactNode;
  className?: string;
};

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={["empty-state flex-col-center gap-md text-center", className]
        .filter(Boolean)
        .join(" ")}
    >
      {icon && (
        <span className="empty-state__icon" aria-hidden="true">
          <Icon name={icon} size={24} />
        </span>
      )}
      <p className="font-lg fw-600 tracking-tight text-primary m-0">{title}</p>
      {description && <p className="font-sm text-muted m-0 max-w-480">{description}</p>}
      {action && <div className="empty-state__action">{action}</div>}
    </div>
  );
}
