/**
 * @file components/ExampleCharGrid.test.tsx
 * @description Tests for ExampleCharGrid component
 * Story 19.2: Radical Detail Card
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ExampleCharGrid } from "./ExampleCharGrid";

// Mock child component to avoid hook dependencies
vi.mock("./ExampleCharCell", () => ({
  ExampleCharCell: ({ character, pinyin, meaning }: { character: string; pinyin: string; meaning: string }) => (
    <div data-testid="example-char-cell" data-character={character} data-pinyin={pinyin} data-meaning={meaning}>
      {character}
    </div>
  ),
}));

const sampleChars = Array.from({ length: 15 }, (_, i) => ({
  glyph: `char${i + 1}`,
  pinyin: `pin${i + 1}`,
  meaning: `meaning${i + 1}`,
}));

describe("ExampleCharGrid", () => {
  it("renders up to 12 characters initially", () => {
    render(<ExampleCharGrid characters={sampleChars} />);

    const cells = screen.getAllByTestId("example-char-cell");
    expect(cells).toHaveLength(12);
  });

  it("shows 'See all (N)' button when more than 12 characters", () => {
    render(<ExampleCharGrid characters={sampleChars} />);

    expect(screen.getByText("See all (15) ▸")).toBeInTheDocument();
  });

  it("shows all characters when 'See all' is clicked", () => {
    render(<ExampleCharGrid characters={sampleChars} />);

    fireEvent.click(screen.getByText("See all (15) ▸"));

    const cells = screen.getAllByTestId("example-char-cell");
    expect(cells).toHaveLength(15);
  });

  it('shows "Show less" after expanding', () => {
    render(<ExampleCharGrid characters={sampleChars} />);

    fireEvent.click(screen.getByText("See all (15) ▸"));
    expect(screen.getByText("Show less")).toBeInTheDocument();
  });

  it('collapses back to 12 when "Show less" is clicked', () => {
    render(<ExampleCharGrid characters={sampleChars} />);

    fireEvent.click(screen.getByText("See all (15) ▸"));
    fireEvent.click(screen.getByText("Show less"));

    const cells = screen.getAllByTestId("example-char-cell");
    expect(cells).toHaveLength(12);
  });

  it("does not show toggle button when 12 or fewer characters", () => {
    render(<ExampleCharGrid characters={sampleChars.slice(0, 10)} />);

    expect(screen.queryByText(/See all|Show less/)).not.toBeInTheDocument();
  });

  it("renders section header", () => {
    render(<ExampleCharGrid characters={sampleChars.slice(0, 5)} />);

    expect(screen.getByText("Example Characters")).toBeInTheDocument();
    expect(screen.getByText("Characters containing this radical")).toBeInTheDocument();
  });
});
