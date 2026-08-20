/**
 * @file components/ClassificationBadge.tsx
 * @description Pill badge displaying a character's classification type (pictograph, etc.)
 * Story 21.15: Pictograph Classification Badges
 *
 * Renders nothing when classification is null/undefined.
 * Maps each classification type to an emoji + label + color.
 */

import { Icon } from "./Icon/Icon";
import type { IconName } from "./Icon/Icon";
import "./ClassificationBadge.css";

export type ClassificationType =
  "pictograph" | "phono_semantic" | "compound_ideograph" | "ideograph";

export interface ClassificationBadgeProps {
  classification: string | null | undefined;
  etymology?: string | null;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

const CLASSIFICATION_MAP: Record<ClassificationType, { icon: IconName; label: string }> = {
  pictograph: { icon: "image", label: "Pictograph" },
  phono_semantic: { icon: "letters", label: "Phono-semantic" },
  compound_ideograph: { icon: "puzzle", label: "Compound ideograph" },
  ideograph: { icon: "zap", label: "Simple ideograph" },
};

export function ClassificationBadge({
  classification,
  etymology,
  showLabel = true,
  size = "sm",
}: ClassificationBadgeProps) {
  if (!classification) {
    return null;
  }

  // Safe: unknown values fall through to the null check below
  const info = CLASSIFICATION_MAP[classification as ClassificationType];
  if (!info) {
    return null;
  }

  const titleText =
    classification === "pictograph" && etymology
      ? etymology
      : `This character is a ${info.label.toLowerCase()}`;

  // Classification values are snake_case in data (e.g. phono_semantic) but CSS
  // BEM modifiers must be kebab-case — convert so the modifier class resolves.
  const modifier = classification.replace(/_/g, "-");

  return (
    <span
      className={`classification-badge classification-badge--${size} classification-badge--${modifier}`}
      role="status"
      aria-label={`Classification: ${info.label}`}
      title={titleText}
    >
      <span aria-hidden="true">
        <Icon name={info.icon} size={16} />
      </span>
      {showLabel && <span>{info.label}</span>}
    </span>
  );
}
