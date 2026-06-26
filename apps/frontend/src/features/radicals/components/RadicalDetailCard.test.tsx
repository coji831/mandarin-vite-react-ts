/**
 * @file components/RadicalDetailCard.test.tsx
 * @description Tests for RadicalDetailCard component
 * Story 19.2: Radical Detail Card
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { RadicalDetailCard } from "./RadicalDetailCard";
import type { RadicalData } from "../types";

// Mock ExampleCharGrid to avoid hook dependencies
vi.mock("./ExampleCharGrid", () => ({
  ExampleCharGrid: ({
    characters,
  }: {
    characters: Array<{ glyph: string; pinyin: string; meaning: string }>;
  }) => (
    <div data-testid="example-char-grid" data-count={characters.length}>
      ExampleCharGrid
    </div>
  ),
}));

const mockRadicalWithChars: RadicalData = {
  id: "rad_0008",
  glyph: "氵",
  alternate_glyphs: ["⺡", "氺"],
  name_pinyin: "sāndiǎnshuǐ",
  meaning: "water radical",
  stroke_count: 3,
  is_recommended: true,
  kangxi_index: 8,
  metadata: {
    hsk_characters: [
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
    ],
  },
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

    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("#8")).toBeInTheDocument();
  });

  it("renders alternate glyph chips when present", () => {
    render(<RadicalDetailCard radical={mockRadicalWithChars} onClose={vi.fn()} />);

    expect(screen.getByText("⺡")).toBeInTheDocument();
    expect(screen.getByText("氺")).toBeInTheDocument();
  });

  it("renders example character grid when hsk_characters are present", () => {
    render(<RadicalDetailCard radical={mockRadicalWithChars} onClose={vi.fn()} />);

    expect(screen.getByTestId("example-char-grid")).toBeInTheDocument();
  });

  it("does not render example character grid when no hsk_characters", () => {
    render(<RadicalDetailCard radical={mockRadicalWithoutChars} onClose={vi.fn()} />);

    expect(screen.queryByTestId("example-char-grid")).not.toBeInTheDocument();
  });

  it("renders disabled mnemonic button with correct title", () => {
    render(<RadicalDetailCard radical={mockRadicalWithChars} onClose={vi.fn()} />);

    const mnemonicBtn = screen.getByText("Generate Story");
    expect(mnemonicBtn).toBeDisabled();
    expect(mnemonicBtn).toHaveAttribute("title", "Coming in Epic 20");
  });

  it("calls onClose when close button is clicked", () => {
    const handleClose = vi.fn();
    render(<RadicalDetailCard radical={mockRadicalWithChars} onClose={handleClose} />);

    fireEvent.click(screen.getByLabelText("Close detail card"));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when backdrop is clicked", () => {
    const handleClose = vi.fn();
    const { container } = render(
      <RadicalDetailCard radical={mockRadicalWithChars} onClose={handleClose} />,
    );

    const backdrop = container.querySelector(".radical-detail-card__backdrop");
    expect(backdrop).toBeInTheDocument();
    fireEvent.click(backdrop!);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when Escape key is pressed", () => {
    const handleClose = vi.fn();
    render(<RadicalDetailCard radical={mockRadicalWithChars} onClose={handleClose} />);

    fireEvent.keyDown(document, { key: "Escape" });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("has correct aria-label on the dialog", () => {
    render(<RadicalDetailCard radical={mockRadicalWithChars} onClose={vi.fn()} />);

    expect(screen.getByRole("dialog", { name: "Details for water radical" })).toBeInTheDocument();
  });
});
