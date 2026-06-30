/**
 * @file components/TreeRootNode.test.tsx
 * @description Tests for TreeRootNode component
 * Story 19.4: Radical Trees (Phase 3)
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TreeRootNode } from "./TreeRootNode";
import type { RadicalData } from "../types";

const mockOpenHub = vi.fn();
vi.mock("shared/hooks", () => ({
  useCharacterHub: () => ({
    openHub: mockOpenHub,
  }),
}));

// BranchNode is not mocked — it renders with useCharacterHub already mocked above.
// We use text queries to verify expand/collapse behavior.

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
  metadata: {
    hsk_characters: [
      { glyph: "一", pinyin: "yī", meaning: "one" },
      { glyph: "七", pinyin: "qī", meaning: "seven" },
      { glyph: "三", pinyin: "sān", meaning: "three" },
    ],
  },
};

const sampleCharacters = [
  { glyph: "一", pinyin: "yī", meaning: "one" },
  { glyph: "七", pinyin: "qī", meaning: "seven" },
  { glyph: "三", pinyin: "sān", meaning: "three" },
];

describe("TreeRootNode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders radical glyph, meaning, and pinyin (no stroke count in display)", () => {
    render(<TreeRootNode radical={mockRadical} characters={sampleCharacters} />);

    // Glyph appears in root header + in branch nodes (hidden)
    const glyphElements = screen.getAllByText("一");
    expect(glyphElements.length).toBeGreaterThanOrEqual(1);
    // Meaning appears in root header + branch nodes (hidden)
    expect(screen.getAllByText("one").length).toBeGreaterThanOrEqual(1);
    // Pinyin appears (root header + branch node for same glyph) but stroke count is NOT in visible text
    const pinyinElements = screen.getAllByText("yī");
    expect(pinyinElements.length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText("1 stroke")).not.toBeInTheDocument();
  });

  it("shows stroke count in title attribute (tooltip)", () => {
    render(<TreeRootNode radical={mockRadical} characters={sampleCharacters} />);

    const radicalButton = screen.getByRole("button", { name: "一 — one — 1 strokes" });
    expect(radicalButton).toHaveAttribute("title", "1 stroke");
  });

  it("shows plural stroke count in title", () => {
    const fiveStrokeRadical = { ...mockRadical, stroke_count: 5 };
    render(<TreeRootNode radical={fiveStrokeRadical} characters={sampleCharacters} />);

    const radicalButton = screen.getByRole("button", { name: "一 — one — 5 strokes" });
    expect(radicalButton).toHaveAttribute("title", "5 strokes");
  });

  it("shows character count badge", () => {
    render(<TreeRootNode radical={mockRadical} characters={sampleCharacters} />);

    expect(screen.getByText("3 characters")).toBeInTheDocument();
  });

  it("shows singular badge when count is 1", () => {
    const singleChar = [{ glyph: "一", pinyin: "yī", meaning: "one" }];
    render(<TreeRootNode radical={mockRadical} characters={singleChar} />);

    expect(screen.getByText("1 character")).toBeInTheDocument();
  });

  it("characters are hidden by default (collapsed)", () => {
    render(<TreeRootNode radical={mockRadical} characters={sampleCharacters} />);

    // Root header renders "one" meaning; branch nodes also have "one" in DOM
    const meaningElements = screen.getAllByText("one");
    expect(meaningElements.length).toBeGreaterThanOrEqual(1);
    // The toggle aria-label mentions "Expand one"
    expect(screen.getByRole("button", { name: /expand one/i })).toBeInTheDocument();
  });

  it("shows characters when expanded", () => {
    render(<TreeRootNode radical={mockRadical} characters={sampleCharacters} />);

    const toggleButton = screen.getByRole("button", { name: /expand one/i });
    fireEvent.click(toggleButton);

    // When expanded, branch node text should be rendered
    expect(screen.getByText("七")).toBeInTheDocument();
    expect(screen.getByText("三")).toBeInTheDocument();
  });

  it("shows collapse and generate stories buttons when expanded", () => {
    render(<TreeRootNode radical={mockRadical} characters={sampleCharacters} />);

    const toggleButton = screen.getByRole("button", { name: /expand one/i });
    fireEvent.click(toggleButton);

    // Collapse button should be visible
    expect(screen.getByText("🌲 Collapse")).toBeInTheDocument();
    // Generate stories button should be visible and disabled
    const storyBtn = screen.getByText("Generate stories for all ▸");
    expect(storyBtn).toBeInTheDocument();
    expect(storyBtn.closest("button")).toBeDisabled();
    expect(storyBtn.closest("button")).toHaveAttribute("title", "Coming in Epic 20");
  });

  it("collapses tree when Collapse button is clicked", () => {
    render(<TreeRootNode radical={mockRadical} characters={sampleCharacters} />);

    const toggleButton = screen.getByRole("button", { name: /expand one/i });
    fireEvent.click(toggleButton);
    expect(screen.getByText("七")).toBeInTheDocument();

    fireEvent.click(screen.getByText("🌲 Collapse"));
    expect(toggleButton).toHaveAttribute("aria-expanded", "false");
  });

  it("calls openHub when radical glyph is clicked", () => {
    render(<TreeRootNode radical={mockRadical} characters={sampleCharacters} />);

    const radicalButton = screen.getByRole("button", { name: "一 — one — 1 strokes" });
    fireEvent.click(radicalButton);
    expect(mockOpenHub).toHaveBeenCalledWith("一", "yī");
  });

  it("shows empty message when no characters", () => {
    render(<TreeRootNode radical={mockRadical} characters={[]} />);

    const toggleButton = screen.getByRole("button", { name: /expand one/i });
    fireEvent.click(toggleButton);

    expect(screen.getByText("No characters mapped for this radical.")).toBeInTheDocument();
  });

  it("collapses when toggle is clicked via keyboard", () => {
    render(<TreeRootNode radical={mockRadical} characters={sampleCharacters} />);

    const toggleButton = screen.getByRole("button", { name: /expand one/i });
    fireEvent.keyDown(toggleButton, { key: "Enter" });
    expect(toggleButton).toHaveAttribute("aria-expanded", "true");

    fireEvent.keyDown(toggleButton, { key: " " });
    expect(toggleButton).toHaveAttribute("aria-expanded", "false");
  });

  it("has correct aria-expanded state on toggle", () => {
    render(<TreeRootNode radical={mockRadical} characters={sampleCharacters} />);

    const toggleButton = screen.getByRole("button", { name: /expand one/i });
    expect(toggleButton).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(toggleButton);
    expect(toggleButton).toHaveAttribute("aria-expanded", "true");
  });
});
