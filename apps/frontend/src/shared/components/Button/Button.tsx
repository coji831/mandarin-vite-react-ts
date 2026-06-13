/**
 * Button Component
 * Story 15.10: Quiz UX Polish - Shared UI Components
 *
 * Standardized button with variants (primary/secondary), sizes, and loading states.
 * Replaces scattered button styling across quiz and other features.
 */

import React from "react";
import "./Button.css";

export type ButtonVariant = "primary" | "secondary";
export type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  type?: "button" | "submit" | "reset";
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  onClick,
  children,
  className = "",
  type = "button",
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const buttonClass = [
    "btn",
    `btn-${variant}`,
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
      disabled={isDisabled}
      aria-busy={loading}
    >
      {loading && <span className="btn-spinner" aria-hidden="true"></span>}
      <span className={loading ? "btn-content-loading" : ""}>{children}</span>
    </button>
  );
}
