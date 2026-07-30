/**
 * @file components/RadicalDetailCard.test.tsx
 * @description Tests for RadicalDetailCard component
 * Story 19.2: Radical Detail Card
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { RadicalDetailCard } from "./RadicalDetailCard";
import type { RadicalData } from "../types";

// Mock ExampleCharGrid to avoid hook dependencies
vi.mock("./ExampleCharGrid", () => ({
  ExampleCharGrid: ({
    characters,
  }: {
    characters: Array<{
      glyph: string;
      pinyin: string;
      meaning: string;
      classification?: string | null;
      etymology?: string | null;
    }>;
  }) => {
    const classifications = characters
      .filter((c) => c.classification)
      .map((c) => c.classification)
      .join(",");
    return (
      <div
        data-testid="example-char-grid"
        data-count={characters.length}
        data-classifications={classifications}
      >
        ExampleCharGrid
      </div>
    );
  },
}));

// Mock radicalsService
const mockGetRadicalCharacters = vi.hoisted(() => vi.fn());
vi.mock("../services/radicalsService", () => ({
  radicalsService: {
    getRadicalCharacters: mockGetRadicalCharacters,
  },
}));

const mockCharacters = [
  { glyph: "水", pinyin: "shuǐ", meaning: "water" },
  { glyph: "江", pinyin: "jiāng", meaning: "river" },
  { glyph: "河", pinyin: "hé", meaning: "river" },
  { glyph: "湖", pinyin: "hú", meaning: "lake" },
  { glyph: "海", pinyin: "hǎi", meaning: "sea" },
  { glyph: "洗", pinyin: "xǐ", meaning: "to wash" },
  { glyph: "活", pinyin: "huó", meaning: "to live" },
  { glyph: "法", pinyin: "fǎ", meaning: "law" },
  { glyph: "清", pinyin: "qīng", meaning: "clear" },
  { glyph: "汉", pinyin: "hàn", meaning: "Han dynasty" },
  { glyph: "汁", pinyin: "zhī", meaning: "juice" },
  { glyph: "汗", pinyin: "hàn", meaning: "sweat" },
];

const mockRadicalWithChars: RadicalData = {
  id: "rad_0008",
  glyph: "氵",
  alternate_glyphs: ["⺡", "氺"],
  name_pinyin: "sāndiǎnshuǐ",
  meaning: "water radical",
  stroke_count: 3,
  is_recommended: true,
  kangxi_index: 8,
  metadata: {},
};

const mockRadicalWithoutChars: RadicalData = {
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

describe("RadicalDetailCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders hero section with glyph, pinyin, and meaning", () => {
    render(<RadicalDetailCard radical={mockRadicalWithChars} onClose={vi.fn()} />);

    expect(screen.getByText("氵")).toBeInTheDocument();
    expect(screen.getByText("sāndiǎnshuǐ")).toBeInTheDocument();
    expect(screen.getByText("water radical")).toBeInTheDocument();
  });

  it("renders metadata section with stroke count and kangxi index", () => {
    render(<RadicalDetailCard radical={mockRadicalWithChars} onClose={vi.fn()} />);

    expect(screen.getByText((c) => c.includes("3") && c.includes("strokes"))).toBeInTheDocument();
    expect(screen.getByText((c) => c.includes("Kangxi") && c.includes("8"))).toBeInTheDocument();
  });

  it("renders alternate glyph chips when present", () => {
    render(<RadicalDetailCard radical={mockRadicalWithChars} onClose={vi.fn()} />);

    expect(screen.getByText("⺡")).toBeInTheDocument();
    expect(screen.getByText("氺")).toBeInTheDocument();
  });

  it("renders example character grid when characters are loaded from API", async () => {
    mockGetRadicalCharacters.mockResolvedValue({
      radicalId: "rad_0008",
      characters: mockCharacters,
    });

    render(<RadicalDetailCard radical={mockRadicalWithChars} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId("example-char-grid")).toBeInTheDocument();
    });
    expect(screen.getByTestId("example-char-grid")).toHaveAttribute("data-count", "12");
  });

  it("shows empty state when API returns no characters", async () => {
    mockGetRadicalCharacters.mockResolvedValue({
      radicalId: "rad_0001",
      characters: [],
    });

    render(<RadicalDetailCard radical={mockRadicalWithoutChars} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("No example characters found for this radical.")).toBeInTheDocument();
    });
  });

  it("shows error state when API call fails", async () => {
    mockGetRadicalCharacters.mockRejectedValue(new Error("API error"));

    render(<RadicalDetailCard radical={mockRadicalWithChars} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(
        screen.getByText("Failed to load example characters for this radical."),
      ).toBeInTheDocument();
    });
  });

  it("shows retry button on error and retries", async () => {
    mockGetRadicalCharacters.mockRejectedValue(new Error("API error"));

    render(<RadicalDetailCard radical={mockRadicalWithChars} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Retry")).toBeInTheDocument();
    });

    mockGetRadicalCharacters.mockResolvedValue({
      radicalId: "rad_0008",
      characters: mockCharacters,
    });

    fireEvent.click(screen.getByText("Retry"));

    await waitFor(() => {
      expect(screen.getByTestId("example-char-grid")).toBeInTheDocument();
    });
  });

  it("renders notes section when metadata.notes is present", () => {
    const radicalWithNotes: RadicalData = {
      ...mockRadicalWithChars,
      metadata: {
        ...mockRadicalWithChars.metadata,
        notes: "Some additional notes about this radical.",
      },
    };
    render(<RadicalDetailCard radical={radicalWithNotes} onClose={vi.fn()} />);

    expect(screen.getByText("Notes")).toBeInTheDocument();
    expect(screen.getByText("Some additional notes about this radical.")).toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", () => {
    const handleClose = vi.fn();
    render(<RadicalDetailCard radical={mockRadicalWithChars} onClose={handleClose} />);

    fireEvent.click(screen.getByLabelText("Close dialog"));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("renders with backdrop overlay", () => {
    const handleClose = vi.fn();
    const { container } = render(
      <RadicalDetailCard radical={mockRadicalWithChars} onClose={handleClose} />,
    );

    // Detail card is now an overlay with backdrop
    const backdrop = container.querySelector(".modal-backdrop");
    expect(backdrop).toBeInTheDocument();
    // Card renders with dialog role
    expect(container.querySelector(".modal")).toBeInTheDocument();
  });

  it("calls onClose when Escape key is pressed", () => {
    const handleClose = vi.fn();
    render(<RadicalDetailCard radical={mockRadicalWithChars} onClose={handleClose} />);

    fireEvent.keyDown(document, { key: "Escape" });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("has correct aria-label on the dialog", () => {
    render(<RadicalDetailCard radical={mockRadicalWithChars} onClose={vi.fn()} />);

    expect(screen.getByRole("dialog", { name: "氵 (water radical)" })).toBeInTheDocument();
  });

  describe("classification badges", () => {
    it("passes classification data through to ExampleCharGrid", async () => {
      const charsWithClassification = mockCharacters.map((c, i) => ({
        ...c,
        classification: ["pictograph", "phono_semantic", "compound_ideograph", "ideograph"][i % 4],
        etymology: i === 0 ? "A pictograph of the sun" : undefined,
      }));

      mockGetRadicalCharacters.mockResolvedValue({
        radicalId: "rad_0008",
        characters: charsWithClassification,
      });

      render(<RadicalDetailCard radical={mockRadicalWithChars} onClose={vi.fn()} />);

      await waitFor(() => {
        const grid = screen.getByTestId("example-char-grid");
        expect(grid).toBeInTheDocument();
        expect(grid).toHaveAttribute("data-count", "12");
        expect(grid).toHaveAttribute("data-classifications");
      });
    });

    it("renders with characters that have all four classification types", async () => {
      const charsWithAllTypes = [
        { glyph: "日", pinyin: "rì", meaning: "sun", classification: "pictograph" },
        { glyph: "江", pinyin: "jiāng", meaning: "river", classification: "phono_semantic" },
        { glyph: "明", pinyin: "míng", meaning: "bright", classification: "compound_ideograph" },
        { glyph: "上", pinyin: "shàng", meaning: "above", classification: "ideograph" },
      ];

      mockGetRadicalCharacters.mockResolvedValue({
        radicalId: "rad_0008",
        characters: charsWithAllTypes,
      });

      render(<RadicalDetailCard radical={mockRadicalWithChars} onClose={vi.fn()} />);

      await waitFor(() => {
        const grid = screen.getByTestId("example-char-grid");
        expect(grid).toBeInTheDocument();
        expect(grid).toHaveAttribute(
          "data-classifications",
          "pictograph,phono_semantic,compound_ideograph,ideograph",
        );
      });
    });

    it("renders characters without classification (null values)", async () => {
      const charsWithoutClassification = mockCharacters.map((c) => ({
        ...c,
        classification: null,
        etymology: null,
      }));

      mockGetRadicalCharacters.mockResolvedValue({
        radicalId: "rad_0008",
        characters: charsWithoutClassification,
      });

      render(<RadicalDetailCard radical={mockRadicalWithChars} onClose={vi.fn()} />);

      await waitFor(() => {
        const grid = screen.getByTestId("example-char-grid");
        expect(grid).toBeInTheDocument();
        expect(grid).toHaveAttribute("data-classifications", "");
      });
    });
  });
});
