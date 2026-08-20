/**
 * PageHeader Component — Precision-minimal page header (hub-launcher archetype)
 *
 * Renders the page's single <h1> with an optional eyebrow, description, and a
 * top-right CTA slot (holds ≤1 primary Button). No border, no background — the
 * hairline lives on the elevated surfaces below it (precision-minimal, B.5).
 *
 * Contract: pages using PageHeader must NOT render another <h1>.
 */
import React from "react";
import "./PageHeader.css";

export type PageHeaderProps = {
  /** Renders <h1> — font-3xl fw-700 tracking-tight text-primary m-0 */
  title: string;
  /** Eyebrow / sub-label above the title — font-xs fw-500 text-muted tracking-wide */
  eyebrow?: string;
  /** Supporting line below the title — font-md text-secondary. ReactNode so
   *  callers can embed an Icon (e.g. the streak flame). */
  description?: React.ReactNode;
  /** CTA slot, top-right, flex-shrink-0 — holds ≤1 primary Button */
  children?: React.ReactNode;
};

export function PageHeader({ title, eyebrow, description, children }: PageHeaderProps) {
  return (
    <header className="page-header flex-between items-start gap-lg">
      <div className="flex-col gap-xs">
        {eyebrow && <span className="font-xs fw-500 text-muted tracking-wide">{eyebrow}</span>}
        <h1 className="font-3xl fw-700 tracking-tight text-primary m-0">{title}</h1>
        {description && <p className="font-md text-secondary m-0">{description}</p>}
      </div>
      {children && <div className="shrink-0">{children}</div>}
    </header>
  );
}
