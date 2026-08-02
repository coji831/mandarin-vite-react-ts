/**
 * @file components/ClassificationBadge.tsx
 * @description Pill badge displaying a character's classification type (pictograph, etc.)
 * Story 21.15: Pictograph Classification Badges
 *
 * Renders nothing when classification is null/undefined.
 * Maps each classification type to an emoji + label + color.
 */

import "./ClassificationBadge.css";

export type ClassificationType =
  "pictograph" | "phono_semantic" | "compound_ideograph" | "ideograph";

export interface ClassificationBadgeProps {
  classification: string | null | undefined;
  etymology?: string | null;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

const CLASSIFICATION_MAP: Record<ClassificationType, { emoji: string; label: string }> = {
  pictograph: { emoji: "🖼️", label: "Pictograph" },
  phono_semantic: { emoji: "🔤", label: "Phono-semantic" },
  compound_ideograph: { emoji: "🧩", label: "Compound ideograph" },
  ideograph: { emoji: "⚡", label: "Simple ideograph" },
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
      <span aria-hidden="true">{info.emoji}</span>
      {showLabel && <span>{info.label}</span>}
    </span>
  );
}
