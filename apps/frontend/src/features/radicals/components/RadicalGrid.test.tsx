/**
 * @file components/RadicalGrid.test.tsx
 * @description Unit tests for RadicalGrid component
 * Story 19.1: Radicals Browser Structure
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { RadicalGrid } from "./RadicalGrid";
import type { RadicalData } from "../types";

// Mock RadicalCard to simplify testing
vi.mock("./RadicalCard", () => ({
  RadicalCard: ({
    radical,
    onClick,
  }: {
    radical: RadicalData;
    onClick?: (r: RadicalData) => void;
  }) => (
    <button data-testid={`radical-card-${radical.id}`} onClick={() => onClick?.(radical)}>
      {radical.glyph}
    </button>
  ),
}));

const mockRadicals: RadicalData[] = [
  {
    id: "rad_0001",
    glyph: "一",
    alternate_glyphs: [],
    name_pinyin: "yī",
    meaning: "one",
    stroke_count: 1,
    is_recommended: true,
    kangxi_index: 1,
    metadata: {},
  },
  {
    id: "rad_0002",
    glyph: "丨",
    alternate_glyphs: [],
    name_pinyin: "gǔn",
    meaning: "line",
    stroke_count: 1,
    is_recommended: true,
    kangxi_index: 2,
    metadata: {},
  },
];

describe("RadicalGrid", () => {
  it("renders loading spinner when loading", () => {
    render(<RadicalGrid radicals={[]} isLoading={true} error={null} />);

    expect(screen.getByText("Loading radicals…")).toBeInTheDocument();
    expect(screen.getByLabelText("Loading")).toBeInTheDocument();
  });

  it("renders error message with retry button when onRetry is provided", () => {
    const handleRetry = vi.fn();
    render(
      <RadicalGrid radicals={[]} isLoading={false} error="Failed to fetch" onRetry={handleRetry} />,
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("Failed to fetch")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try Again" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Try Again" }));
    expect(handleRetry).toHaveBeenCalledTimes(1);
  });

  it("renders error message without retry button when onRetry is not provided", () => {
    render(<RadicalGrid radicals={[]} isLoading={false} error="An unknown error occurred" />);

    expect(screen.getByRole("heading", { name: /something went wrong/i })).toBeInTheDocument();
    expect(screen.getByText("An unknown error occurred")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Try Again" })).not.toBeInTheDocument();
  });

  it("renders empty state message when no radicals match filters", () => {
    render(<RadicalGrid radicals={[]} isLoading={false} error={null} />);

    expect(screen.getByText("No radicals match your filters.")).toBeInTheDocument();
    expect(screen.getByText("Try adjusting your search or filter criteria.")).toBeInTheDocument();
  });

  it("renders RadicalCards for each radical in a list", () => {
    render(<RadicalGrid radicals={mockRadicals} isLoading={false} error={null} />);

    const list = screen.getByRole("list");
    expect(list).toBeInTheDocument();
    expect(list).toHaveAttribute("aria-label", "Radicals grid");

    const listItems = screen.getAllByRole("listitem");
    expect(listItems).toHaveLength(2);

    expect(screen.getByTestId("radical-card-rad_0001")).toBeInTheDocument();
    expect(screen.getByTestId("radical-card-rad_0002")).toBeInTheDocument();
  });

  it("calls onRadicalClick when a card is clicked", () => {
    const handleClick = vi.fn();
    render(
      <RadicalGrid
        radicals={mockRadicals}
        isLoading={false}
        error={null}
        onRadicalClick={handleClick}
      />,
    );

    fireEvent.click(screen.getByTestId("radical-card-rad_0001"));
    expect(handleClick).toHaveBeenCalledWith(mockRadicals[0]);

    fireEvent.click(screen.getByTestId("radical-card-rad_0002"));
    expect(handleClick).toHaveBeenCalledWith(mockRadicals[1]);
    expect(handleClick).toHaveBeenCalledTimes(2);
  });

  it("shows loading state over empty radicals array", () => {
    render(<RadicalGrid radicals={[]} isLoading={true} error={null} />);

    // Loading should take precedence over empty state
    expect(screen.getByText("Loading radicals…")).toBeInTheDocument();
    expect(screen.queryByText("No radicals match your filters.")).not.toBeInTheDocument();
  });

  it("shows loading state even when error is also present (loading checked first)", () => {
    render(<RadicalGrid radicals={[]} isLoading={true} error="Server error" />);

    // isLoading is checked before error in the component
    expect(screen.getByText("Loading radicals…")).toBeInTheDocument();
    expect(screen.queryByText("Server error")).not.toBeInTheDocument();
  });
});
