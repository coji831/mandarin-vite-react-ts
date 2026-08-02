/**
 * Chip Component
 * Chip-1: chip-extraction refactor (additive — existing chips not migrated yet)
 *
 * Shared chip with two interaction modes:
 * - interactive (default when `onClick` is provided): renders <button type="button">
 *   with `aria-pressed` when active, plus hover/focus-visible affordances.
 * - non-interactive: renders <span>; `active` is applied purely visually but never
 *   exposes `aria-pressed` (a span carries no toggle semantics).
 *
 * Content: `glyph`/`pinyin`/`label`/`icon`/`count` slots compose when provided;
 * otherwise `children` renders inside the chip.
 *
 * No-motion rule: hover/focus-visible styling ONLY when interactive; transitions
 * limited to colors (`transition-colors`) — no transform, no looping animation.
 */

import type { ReactNode } from "react";
import "./Chip.css";

export type ChipVariant =
  | "outline"
  | "surface"
  | "solid"
  | "primary"
  | "tone-1"
  | "tone-2"
  | "tone-3"
  | "tone-4"
  | "tone-5";

export type ChipSize = "sm" | "md" | "lg";

export interface ChipProps {
  variant?: ChipVariant; // default "outline"
  interactive?: boolean; // true → <button>; false → <span> (defaults to !!onClick)
  active?: boolean; // selected/pressed → aria-pressed + active visual
  size?: ChipSize; // default "md"
  glyph?: ReactNode; // leading large glyph (character)
  pinyin?: ReactNode; // italic subtitle
  label?: ReactNode; // primary text
  icon?: ReactNode; // leading emoji/icon
  count?: ReactNode; // trailing count pill (e.g. "5")
  children?: ReactNode; // fallback content
  onClick?: () => void;
  ariaLabel?: string;
  title?: string;
  className?: string;
}

const VARIANT_CLASSES: Record<ChipVariant, string> = {
  outline: "chip--outline",
  surface: "chip--surface",
  solid: "chip--solid",
  primary: "chip--primary",
  "tone-1": "chip--tone-1",
  "tone-2": "chip--tone-2",
  "tone-3": "chip--tone-3",
  "tone-4": "chip--tone-4",
  "tone-5": "chip--tone-5",
};

export function Chip({
  variant = "outline",
  interactive,
  active = false,
  size = "md",
  glyph,
  pinyin,
  label,
  icon,
  count,
  children,
  onClick,
  ariaLabel,
  title,
  className = "",
}: ChipProps) {
  const isInteractive = interactive ?? Boolean(onClick);
  const hasSlots =
    glyph != null || pinyin != null || label != null || icon != null || count != null;

  const chipClass = [
    "chip",
    VARIANT_CLASSES[variant],
    `chip--${size}`,
    active ? "chip--active" : "",
    isInteractive ? "chip--interactive transition-colors" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const content = hasSlots ? (
    <>
      {icon != null && <span className="chip__icon">{icon}</span>}
      {glyph != null && <span className="chip__glyph">{glyph}</span>}
      {(label != null || pinyin != null) && (
        <span className="chip__text">
          {label != null && <span className="chip__label">{label}</span>}
          {pinyin != null && <span className="chip__pinyin">{pinyin}</span>}
        </span>
      )}
      {count != null && <span className="chip__count">{count}</span>}
    </>
  ) : (
    children
  );

  if (isInteractive) {
    return (
      <button
        type="button"
        className={chipClass}
        onClick={onClick}
        aria-pressed={active}
        aria-label={ariaLabel}
        title={title}
      >
        {content}
      </button>
    );
  }

  return (
    <span className={chipClass} aria-label={ariaLabel} title={title}>
      {content}
    </span>
  );
}
