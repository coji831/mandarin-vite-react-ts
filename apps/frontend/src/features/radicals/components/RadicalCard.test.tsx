/**
 * @file components/RadicalCard.test.tsx
 * @description Smoke tests for RadicalCard component
 * Story 19.1: Radicals Browser Structure
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { RadicalCard } from "./RadicalCard";
import type { RadicalData } from "../types";

const mockRadical: RadicalData = {
  id: "rad_0001",
  glyph: "一",
  alternate_glyphs: [],
  name_pinyin: "yī",
  name_chinese: "一",
  meaning: "one",
  stroke_count: 1,
  is_recommended: true,
  kangxi_index: 1,
  metadata: {},
};

describe("RadicalCard", () => {
  it("renders glyph, pinyin, meaning, and stroke count", () => {
    render(<RadicalCard radical={mockRadical} />);

    expect(screen.getByText("一")).toBeInTheDocument();
    expect(screen.getByText("yī")).toBeInTheDocument();
    expect(screen.getByText("one")).toBeInTheDocument();
    expect(screen.getByText("1 stroke")).toBeInTheDocument();
  });

  it("shows the ★ badge for recommended radicals", () => {
    render(<RadicalCard radical={mockRadical} />);
    expect(screen.getByLabelText("Recommended radical")).toBeInTheDocument();
  });

  it("does not show the ★ badge for non-recommended radicals", () => {
    const nonRec = { ...mockRadical, is_recommended: false };
    render(<RadicalCard radical={nonRec} />);
    expect(screen.queryByLabelText("Recommended radical")).not.toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    const handleClick = vi.fn();
    render(<RadicalCard radical={mockRadical} onClick={handleClick} />);

    fireEvent.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledWith(mockRadical);
  });

  it("displays correct plural stroke text for multiple strokes", () => {
    const multiStroke = { ...mockRadical, stroke_count: 3 };
    render(<RadicalCard radical={multiStroke} />);
    expect(screen.getByText("3 strokes")).toBeInTheDocument();
  });
});
