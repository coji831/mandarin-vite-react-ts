/**
 * Card Component — Generic UI card
 *
 * A reusable card container with title, subtitle, optional supporting text,
 * icon, badge, and locked state. No business domain dependencies.
 */
import { Box } from "shared/components";
import "./Card.css";

export type CardProps = {
  title: string;
  subtitle?: string;
  supportingText?: string;
  icon?: string;
  badge?: string;
  isLocked?: boolean;
  onClick?: () => void;
};

export function Card({
  title,
  subtitle,
  supportingText,
  icon,
  badge,
  isLocked = false,
  onClick,
}: CardProps) {
  return (
    <Box
      variant="card"
      padding="lg"
      className={`card flex-col gap-xs cursor-pointer ${isLocked ? "card--locked op-60 cursor-not-allowed" : "card--unlocked hover:border-primary"}`}
      role={onClick ? "button" : undefined}
      tabIndex={onClick && !isLocked ? 0 : -1}
      aria-disabled={isLocked}
      onClick={isLocked ? undefined : onClick}
      onKeyDown={
        onClick && !isLocked
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      {icon && (
        <span className="card__icon font-2xl lh-1" aria-hidden="true">
          {icon}
        </span>
      )}
      {badge && <span className="card__badge bg-primary-bg font-xs radius-pill p-xs">{badge}</span>}
      {isLocked && (
        <span className="card__lock-badge font-md" aria-label="Locked">
          🔒
        </span>
      )}
      <div className="card__body flex-col gap-4px">
        <h3 className="font-lg fw-600 text-secondary m-0">{title}</h3>
        {subtitle && <p className="font-sm text-tertiary m-0">{subtitle}</p>}
        {supportingText && <p className="font-xs text-muted m-0">{supportingText}</p>}
      </div>
    </Box>
  );
}
