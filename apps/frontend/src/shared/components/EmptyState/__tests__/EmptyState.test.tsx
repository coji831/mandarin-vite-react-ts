/**
 * Unit tests for EmptyState
 *
 * Verifies the iconographic empty-state contract: optional icon, title,
 * description, and action slot.
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EmptyState } from "../EmptyState";

describe("EmptyState", () => {
  it("renders the title and description", () => {
    render(
      <EmptyState
        title="No recent activity yet"
        description="Start learning to see your progress."
      />,
    );
    expect(screen.getByText("No recent activity yet")).toBeInTheDocument();
    expect(screen.getByText("Start learning to see your progress.")).toBeInTheDocument();
  });

  it("renders a decorative icon when provided", () => {
    const { container } = render(<EmptyState icon="search-x" title="No content found" />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("aria-hidden", "true");
  });

  it("omits the icon when not provided", () => {
    const { container } = render(<EmptyState title="Empty" />);
    expect(container.querySelector("svg")).not.toBeInTheDocument();
  });

  it("renders the action slot when provided", () => {
    render(<EmptyState title="Empty" action={<button type="button">Clear all filters</button>} />);
    expect(screen.getByRole("button", { name: "Clear all filters" })).toBeInTheDocument();
  });

  it("omits the action slot when not provided", () => {
    render(<EmptyState title="Empty" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
