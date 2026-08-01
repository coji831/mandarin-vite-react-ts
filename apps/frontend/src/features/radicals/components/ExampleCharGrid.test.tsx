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
  ExampleCharCell: ({
    character,
    pinyin,
    meaning,
    classification,
  }: {
    character: string;
    pinyin: string;
    meaning: string;
    classification?: string | null;
  }) => (
    <div
      data-testid="example-char-cell"
      data-character={character}
      data-pinyin={pinyin}
      data-meaning={meaning}
      data-classification={classification ?? ""}
    >
      {character}
    </div>
  ),
}));

describe("ExampleCharGrid", () => {
  it("renders all characters", () => {
    const chars = Array.from({ length: 15 }, (_, i) => ({
      glyph: `char${i + 1}`,
      pinyin: `pin${i + 1}`,
      meaning: `meaning${i + 1}`,
    }));
    render(<ExampleCharGrid characters={chars} />);

    const cells = screen.getAllByTestId("example-char-cell");
    expect(cells).toHaveLength(15);
  });

  it("renders section header", () => {
    render(<ExampleCharGrid characters={[]} />);

    expect(screen.getByText("Example Characters")).toBeInTheDocument();
    expect(screen.getByText("Characters containing this radical")).toBeInTheDocument();
  });
});

describe("ExampleCharGrid pagination (VisFix W6a)", () => {
  const makeChars = (n: number) =>
    Array.from({ length: n }, (_, i) => ({
      glyph: `char${i + 1}`,
      pinyin: `pin${i + 1}`,
      meaning: `meaning${i + 1}`,
    }));

  it("renders all characters without a Show more button when at or below 24", () => {
    render(<ExampleCharGrid characters={makeChars(24)} />);
    expect(screen.getAllByTestId("example-char-cell")).toHaveLength(24);
    expect(screen.queryByText(/Show more/)).not.toBeInTheDocument();
  });

  it("shows only the first 24 rows with a Show more button when longer", () => {
    render(<ExampleCharGrid characters={makeChars(30)} />);
    expect(screen.getAllByTestId("example-char-cell")).toHaveLength(24);
    expect(screen.getByText("Show more (6 more)")).toBeInTheDocument();
  });

  it("reveals the remaining rows when Show more is clicked", () => {
    render(<ExampleCharGrid characters={makeChars(30)} />);
    fireEvent.click(screen.getByText("Show more (6 more)"));
    expect(screen.getAllByTestId("example-char-cell")).toHaveLength(30);
    expect(screen.queryByText(/Show more/)).not.toBeInTheDocument();
  });
});
