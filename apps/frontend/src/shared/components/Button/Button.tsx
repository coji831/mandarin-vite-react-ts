/**
 * Button Component
 * Story 15.10: Quiz UX Polish - Shared UI Components
 *
 * Standardized button with variants (primary/secondary), sizes, and loading states.
 * Replaces scattered button styling across quiz and other features.
 */

import React from "react";
import "./Button.css";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "icon"
  | "ghost"
  | "control"
  | "control-active"
  | "circle"
  | "tag"
  | "tag-active"
  | "primary-active"
  | "tab"
  | "tab-active"
  | "tone-1"
  | "tone-2"
  | "tone-3"
  | "tone-4"
  | "tone-5"
  | "ghost-primary"
  | "rating-again"
  | "rating-good"
  | "rating-easy"
  | "inline-text";
export type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  width?: number;
  height?: number;
  loading?: boolean;
  disabled?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLButtonElement>) => void;
  onKeyUp?: (e: React.KeyboardEvent<HTMLButtonElement>) => void;
  children: React.ReactNode;
  className?: string;
  type?: "button" | "submit" | "reset";
  style?: React.CSSProperties;
  title?: string;
  "aria-label"?: string;
  "aria-selected"?: boolean;
  "aria-expanded"?: boolean;
  role?: string;
  id?: string;
  "aria-controls"?: string;
  "data-rating"?: string;
};

export function Button({
  variant = "primary",
  size = "md",
  width,
  height,
  loading = false,
  disabled = false,
  onClick,
  onKeyDown,
  onKeyUp,
  children,
  className = "",
  type = "button",
  style,
  title,
  "aria-label": ariaLabel,
  "aria-selected": ariaSelected,
  "aria-expanded": ariaExpanded,
  role,
  id,
  "aria-controls": ariaControls,
  "data-rating": dataRating,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const VARIANT_CLASSES: Record<string, string> = {
    primary: "btn-primary",
    secondary: "btn-secondary",
    ghost: "btn-ghost",
    icon: "btn-icon",
    control: "btn-control",
    "control-active": "btn-control-active",
    circle: "btn-circle",
    tag: "btn-tag",
    "tag-active": "btn-tag-active",
    "primary-active": "btn-primary-active",
    tab: "btn-tab",
    "tab-active": "btn-tab-active",
    "tone-1": "btn-tone-1",
    "tone-2": "btn-tone-2",
    "tone-3": "btn-tone-3",
    "tone-4": "btn-tone-4",
    "tone-5": "btn-tone-5",
    "ghost-primary": "btn-ghost-primary",
    "rating-again": "btn-rating-again",
    "rating-good": "btn-rating-good",
    "rating-easy": "btn-rating-easy",
    "inline-text": "btn-inline-text",
  };

  const buttonClass = [
    "btn",
    VARIANT_CLASSES[variant],
    `btn-${size}`,
    loading ? "btn-loading" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type={type}
      className={buttonClass}
      onClick={onClick}
      onKeyDown={onKeyDown}
      onKeyUp={onKeyUp}
      disabled={isDisabled}
      aria-busy={loading}
      aria-label={ariaLabel}
      aria-selected={ariaSelected}
      aria-expanded={ariaExpanded}
      aria-controls={ariaControls}
      data-rating={dataRating}
      title={title}
      role={role}
      id={id}
      style={{
        ...(width !== undefined ? { width } : {}),
        ...(height !== undefined ? { height } : {}),
        ...style,
      }}
    >
      {loading ? <span className="btn-content-loading op-80"></span> : children}
    </button>
  );
}
