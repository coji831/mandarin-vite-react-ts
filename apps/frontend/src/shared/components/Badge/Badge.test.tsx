/**
 * @file shared/components/Badge/Badge.test.tsx
 * @description Tests for Badge — shared token pill for inline metadata labels.
 * VisFix W3 (Epic 21): HSK badge extracted to a shared component.
 */

import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Badge } from "./Badge";

describe("Badge", () => {
  it("renders children", () => {
    render(<Badge>HSK 2</Badge>);
    expect(screen.getByText("HSK 2")).toBeInTheDocument();
  });

  it("renders as an inline span with the badge base class", () => {
    const { container } = render(<Badge>tag</Badge>);
    const el = container.querySelector("span.badge");
    expect(el).toBeInTheDocument();
  });

  it("defaults to the primary variant", () => {
    const { container } = render(<Badge>HSK 1</Badge>);
    expect(container.querySelector("span.badge--primary")).toBeInTheDocument();
  });

  it.each(["primary", "surface", "accent"] as const)("applies the %s variant class", (variant) => {
    const { container } = render(<Badge variant={variant}>HSK 3</Badge>);
    expect(container.querySelector(`span.badge--${variant}`)).toBeInTheDocument();
  });

  it("merges a custom className", () => {
    const { container } = render(<Badge className="shrink-0">HSK 4</Badge>);
    expect(container.querySelector("span.badge.shrink-0")).toBeInTheDocument();
  });

  it("forwards HTML attributes (aria-label)", () => {
    render(<Badge aria-label="HSK level 5">HSK 5</Badge>);
    expect(screen.getByLabelText("HSK level 5")).toBeInTheDocument();
  });
});
