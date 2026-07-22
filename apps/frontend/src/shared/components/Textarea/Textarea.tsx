/**
 * Textarea Component
 * Shared multiline text input component for use across all features
 *
 * Follows the Input component pattern — forwardRef and className composition
 * with .input-base from globals.css for consistent styling.
 *
 * Usage:
 * ```tsx
 * <Textarea
 *   value={story}
 *   onChange={(value) => setStory(value)}
 *   placeholder="Enter your mnemonic story..."
 *   maxLength={5000}
 *   rows={4}
 * />
 * ```
 */

import { forwardRef, TextareaHTMLAttributes } from "react";
import "./Textarea.css";

export interface TextareaProps extends Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  "onChange"
> {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = "", onChange, ...props }, ref) => {
    const textareaClassName = `input-base textarea p-sm w-full ${className}`.trim();

    return (
      <textarea
        ref={ref}
        className={textareaClassName}
        onChange={(e) => onChange(e.target.value)}
        {...props}
      />
    );
  },
);

Textarea.displayName = "Textarea";
