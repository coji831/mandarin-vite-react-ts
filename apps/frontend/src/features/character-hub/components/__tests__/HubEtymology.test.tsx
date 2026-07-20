/**
 * @file HubEtymology.test.tsx
 * @description Tests for HubEtymology component
 * Story 18.5: Character Detail Hub (Phase 1 Minimal)
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { HubEtymology } from "../HubEtymology";

vi.mock("shared/components", () => ({
  Skeleton: ({ variant, height, width }: { variant: string; height?: string; width?: string }) => (
    <div data-testid="skeleton" data-variant={variant} style={{ height, width }} />
  ),
}));

describe("HubEtymology", () => {
  it("renders loading skeleton when loading is true", () => {
    render(<HubEtymology loading={true} />);

    const skeletons = screen.getAllByTestId("skeleton");
    expect(skeletons.length).toBeGreaterThan(0);
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByLabelText("Loading etymology")).toBeInTheDocument();
  });

  it("renders null when etymology is undefined", () => {
    const { container } = render(<HubEtymology />);
    expect(container.innerHTML).toBe("");
  });

  it("renders etymology text", () => {
    render(<HubEtymology etymology="A pictograph of a woman" />);
    expect(screen.getByText("A pictograph of a woman")).toBeInTheDocument();
  });

  it("renders info line with traditional, HSK level, and stroke count", () => {
    render(<HubEtymology etymology="Good" traditional="好" hskLevel={1} strokeCount={6} />);

    const infoText = screen.getByText(/传统.*好/);
    expect(infoText).toBeInTheDocument();
    expect(screen.getByText(/HSK 1/)).toBeInTheDocument();
    expect(screen.getByText(/6 strokes/)).toBeInTheDocument();
  });
});
