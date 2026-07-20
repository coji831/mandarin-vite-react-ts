/**
 * Spinner Component
 *
 * Reusable loading spinner with size variants.
 * Consolidates 5+ duplicate spinner implementations.
 */

import "./Spinner.css";

export type SpinnerSize = "xs" | "sm" | "md" | "lg";

export type SpinnerColor = "primary" | "white";

export type SpinnerProps = {
  size?: SpinnerSize;
  color?: SpinnerColor;
  className?: string;
  hidden?: boolean;
};

const SIZE_MAP: Record<SpinnerSize, string> = {
  xs: "spinner--xs",
  sm: "spinner--sm",
  md: "spinner--md",
  lg: "spinner--lg",
};

const COLOR_MAP: Record<SpinnerColor, string> = {
  primary: "spinner--color-primary",
  white: "spinner--color-white",
};

export function Spinner({
  size = "md",
  color = "primary",
  className = "",
  hidden = false,
}: SpinnerProps) {
  const sizeClass = SIZE_MAP[size];
  const colorClass = COLOR_MAP[color];
  return (
    <span
      className={`spinner radius-full ${sizeClass} ${colorClass}${className ? ` ${className}` : ""}`}
      aria-label={hidden ? undefined : "Loading"}
      aria-hidden={hidden || undefined}
    />
  );
}
