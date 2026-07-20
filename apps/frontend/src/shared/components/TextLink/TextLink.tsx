/**
 * TextLink Component
 * Inline text-style navigation link rendered as a <button> element.
 * Looks like an anchor tag but supports onClick callbacks — ideal for
 * form-switch actions where React Router's Link/NavLink won't work.
 */

import React from "react";
import "./TextLink.css";

export type TextLinkProps = {
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
};

export function TextLink({ onClick, disabled = false, children, className = "" }: TextLinkProps) {
  return (
    <button
      type="button"
      className={`text-link${className ? ` ${className}` : ""}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
