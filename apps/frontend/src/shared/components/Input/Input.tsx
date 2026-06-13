/**
 * Input Component
 * Shared text input component for use across all features
 *
 * Similar to Button component pattern - provides consistent styling and behavior.
 * Uses .input-base utility class from globals.css for styling consistency.
 *
 * Usage:
 * ```tsx
 * <Input
 *   value={value}
 *   onChange={(e) => setValue(e.target.value)}
 *   placeholder="Enter text..."
 * />
 * ```
 */

import { InputHTMLAttributes, forwardRef } from "react";
import "./Input.css";

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  className?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", ...props }, ref) => {
    const inputClassName = `input-base ${className}`.trim();

    return <input ref={ref} type="text" className={inputClassName} {...props} />;
  },
);

Input.displayName = "Input";
