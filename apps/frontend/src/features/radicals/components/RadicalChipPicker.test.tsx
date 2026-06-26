/**
 * @file components/RadicalChipPicker.test.tsx
 * @description Unit tests for RadicalChipPicker component
 * Story 19.4: Radical Trees (Phase 3)
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { RadicalChipPicker } from "./RadicalChipPicker";
import type { RadicalData } from "../types";

const mockChips: RadicalData[] = [
  {
    id: "rad_0001",
    glyph: "一",
    name_pinyin: "yī",
    name_chinese: "一",
    meaning: "one",
    stroke_count: 1,
    is_recommended: true,
    kangxi_index: 1,
    alternate_glyphs: [],
    metadata: {},
  },
  {
    id: "rad_0030",
    glyph: "口",
    name_pinyin: "kǒu",
    name_chinese: "口",
    meaning: "mouth",
    stroke_count: 3,
    is_recommended: true,
    kangxi_index: 30,
    alternate_glyphs: [],
    metadata: {},
  },
  {
    id: "rad_0061",
    glyph: "心",
    name_pinyin: "xīn",
    name_chinese: "心",
    meaning: "heart",
    stroke_count: 4,
    is_recommended: true,
    kangxi_index: 61,
    alternate_glyphs: [],
    metadata: {},
  },
];

describe("RadicalChipPicker", () => {
  it("renders all chips", () => {
    render(
      <RadicalChipPicker
        filteredChips={mockChips}
        activeRadicalId={null}
        onChipClick={vi.fn()}
      />,
    );
    expect(screen.getByText("一")).toBeInTheDocument();
    expect(screen.getByText("mouth")).toBeInTheDocument();
    expect(screen.getByText("heart")).toBeInTheDocument();
    // Should have 3 chip buttons
    const chips = screen.getAllByRole("tab");
    expect(chips).toHaveLength(3);
  });

  it("selected chip has correct aria-selected and CSS class", () => {
    render(
      <RadicalChipPicker
        filteredChips={mockChips}
        activeRadicalId="rad_0030"
        onChipClick={vi.fn()}
      />,
    );
    const chips = screen.getAllByRole("tab");
    // First chip (一) - not selected
    expect(chips[0]).toHaveAttribute("aria-selected", "false");
    expect(chips[0]).not.toHaveClass("radical-chip-picker__chip--selected");
    // Second chip (口) - selected
    expect(chips[1]).toHaveAttribute("aria-selected", "true");
    expect(chips[1]).toHaveClass("radical-chip-picker__chip--selected");
    // Third chip (心) - not selected
    expect(chips[2]).toHaveAttribute("aria-selected", "false");
    expect(chips[2]).not.toHaveClass("radical-chip-picker__chip--selected");
  });

  it("chip click fires onChipClick callback with correct id", () => {
    const onChipClick = vi.fn();
    render(
      <RadicalChipPicker
        filteredChips={mockChips}
        activeRadicalId={null}
        onChipClick={onChipClick}
      />,
    );
    fireEvent.click(screen.getByText("心"));
    expect(onChipClick).toHaveBeenCalledWith("rad_0061");
  });

  it("keyboard navigation: Enter key triggers onChipClick", () => {
    const onChipClick = vi.fn();
    render(
      <RadicalChipPicker
        filteredChips={mockChips}
        activeRadicalId={null}
        onChipClick={onChipClick}
      />,
    );
    const mouthChip = screen.getByText("mouth");
    fireEvent.keyDown(mouthChip, { key: "Enter" });
    expect(onChipClick).toHaveBeenCalledWith("rad_0030");
  });

  it("keyboard navigation: Space key triggers onChipClick", () => {
    const onChipClick = vi.fn();
    render(
      <RadicalChipPicker
        filteredChips={mockChips}
        activeRadicalId={null}
        onChipClick={onChipClick}
      />,
    );
    const oneChip = screen.getByText("一");
    fireEvent.keyDown(oneChip, { key: " " });
    expect(onChipClick).toHaveBeenCalledWith("rad_0001");
  });
});
