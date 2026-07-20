/**
 * Box Component — Generic layout container
 *
 * A thin wrapper around `<div>` (or any HTML element via `as`) that applies
 * common border/background/radius/padding patterns from the design system.
 * Replaces raw `<div>` elements with consistent visual treatments.
 *
 * @example
 * <Box variant="elevated" padding="md" as="section">
 *   <p>Content</p>
 * </Box>
 */
import React from "react";
import "./Box.css";

export type BoxVariant =
  | "dark"
  | "dark-alt"
  | "dark-accent"
  | "dark-accent-primary"
  | "surface"
  | "elevated"
  | "error"
  | "card"
  | "divider"
  | "header"
  | "dashed"
  | "chip"
  | "item"
  | "pass"
  | "fail"
  | "tone-1"
  | "tone-2"
  | "tone-3"
  | "tone-4"
  | "tone-5";

export type BoxPadding = "none" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

const VARIANT_CLASSES: Record<BoxVariant, string> = {
  dark: "box-dark",
  "dark-alt": "box-dark-alt",
  "dark-accent": "box-dark-accent",
  "dark-accent-primary": "box-dark-accent-primary",
  surface: "box-surface",
  elevated: "box-elevated",
  error: "box-error",
  card: "box-card",
  divider: "box-divider",
  header: "box-header",
  dashed: "box-dashed",
  chip: "box-chip",
  item: "box-item",
  pass: "box-pass",
  fail: "box-fail",
  "tone-1": "box-tone-1",
  "tone-2": "box-tone-2",
  "tone-3": "box-tone-3",
  "tone-4": "box-tone-4",
  "tone-5": "box-tone-5",
};

const PADDING_CLASSES: Record<BoxPadding, string> = {
  none: "",
  xs: "p-xs",
  sm: "p-sm",
  md: "p-md",
  lg: "p-lg",
  xl: "p-xl",
  "2xl": "p-2xl",
};

export type BoxProps = {
  variant?: BoxVariant;
  padding?: BoxPadding;
  as?: React.ElementType;
  className?: string;
  children?: React.ReactNode;
} & React.HTMLAttributes<HTMLElement>;

export const Box = React.forwardRef<HTMLDivElement, BoxProps>(function Box(
  { variant = "dark-alt", padding = "none", as: Element = "div", className, children, ...rest },
  ref,
) {
  const variantClass = VARIANT_CLASSES[variant];
  const paddingClass = PADDING_CLASSES[padding];
  const mergedClassName =
    `${variantClass} ${paddingClass}${className ? ` ${className}` : ""}`.trim();

  return (
    <Element ref={ref as React.Ref<HTMLDivElement>} className={mergedClassName} {...rest}>
      {children}
    </Element>
  );
});
