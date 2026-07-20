/**
 * @file HubCommonWords.test.tsx
 * @description Tests for HubCommonWords component
 * Story 18.5: Character Detail Hub (Phase 1 Minimal)
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { HubCommonWords } from "../HubCommonWords";

vi.mock("shared/components", () => ({
  Skeleton: ({ variant, className }: { variant: string; className: string }) => (
    <div data-testid="skeleton" data-variant={variant} className={className} />
  ),
  Button: ({ children, className, ...props }: Record<string, unknown>) => (
    <button className={className as string} {...props}>
      {children as React.ReactNode}
    </button>
  ),
}));

describe("HubCommonWords", () => {
  it("renders loading skeleton when loading is true", () => {
    render(<HubCommonWords loading={true} />);

    const skeletons = screen.getAllByTestId("skeleton");
    expect(skeletons.length).toBeGreaterThan(0);
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByLabelText("Loading words")).toBeInTheDocument();
  });

  it("renders null when commonWords is undefined", () => {
    const { container } = render(<HubCommonWords />);
    expect(container.innerHTML).toBe("");
  });

  it("renders null when commonWords is empty", () => {
    const { container } = render(<HubCommonWords commonWords={[]} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders word chips for each common word", () => {
    const words = ["你好", "好吃", "好处"];
    render(<HubCommonWords commonWords={words} />);

    expect(screen.getByText("你好")).toBeInTheDocument();
    expect(screen.getByText("好吃")).toBeInTheDocument();
    expect(screen.getByText("好处")).toBeInTheDocument();
  });
});
