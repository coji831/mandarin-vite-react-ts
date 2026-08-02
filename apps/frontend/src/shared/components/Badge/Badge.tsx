/**
 * @file shared/components/Badge/Badge.tsx
 * @description Shared token pill for inline metadata labels (HSK level, tags, counts).
 * VisFix W3 (Epic 21): the HSK badge pill was previously inlined with utility
 * classes across 3 features (readers, word-hub, phonetic-clusters). Extracted
 * into this shared variant component per the SHARED-ONLY-IF-CROSS-FEATURE rule.
 *
 * Variants map to the token pill styles previously inlined:
 *   primary  → bg-primary-bg / text-primary          (PassageCard, WordHub)
 *   surface  → bg-surface-hover / text-primary       (ReadingView)
 *   accent   → bg-primary-bg-medium / text-accent    (ClusterCard)
 */
import type { HTMLAttributes, ReactNode } from "react";
import "./Badge.css";

export type BadgeVariant = "primary" | "surface" | "accent";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  className?: string;
  children: ReactNode;
}

export function Badge({ variant = "primary", className, children, ...rest }: BadgeProps) {
  const mergedClassName = `badge badge--${variant}${className ? ` ${className}` : ""}`;
  return (
    <span className={mergedClassName} {...rest}>
      {children}
    </span>
  );
}
