/**
 * PageStack Component — the ONLY vertical section rhythm (page-anatomy law, A2)
 *
 * Composes page sections with --section-rhythm-* BETWEEN-section gaps
 * (outer > item gap: section rhythm must exceed the item gap inside a section).
 * Sections must be children; never apply page-level vertical spacing by hand.
 */
import type { ElementType, ReactNode } from "react";
import "./PageStack.css";

export type PageStackSize = "sm" | "default" | "lg";

export type PageStackProps = {
  /** Rhythm between sections: sm=--section-rhythm-sm, default=--section-rhythm-md, lg=--section-rhythm-lg */
  size?: PageStackSize;
  as?: ElementType;
  children?: ReactNode;
  className?: string;
};

export function PageStack({
  size = "default",
  as: Tag = "div",
  children,
  className,
}: PageStackProps) {
  const cls = ["page-stack", `page-stack--${size}`, className].filter(Boolean).join(" ");
  return <Tag className={cls}>{children}</Tag>;
}
