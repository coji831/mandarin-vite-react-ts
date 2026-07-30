/**
 * @file components/ExampleCharGrid.test.tsx
 * @description Tests for ExampleCharGrid component
 * Story 19.2: Radical Detail Card
 */

import { render, screen } from "@testing-library/react";
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
