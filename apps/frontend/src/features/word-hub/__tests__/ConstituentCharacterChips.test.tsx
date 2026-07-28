/**
 * @file __tests__/ConstituentCharacterChips.test.tsx
 * @description Tests for ConstituentCharacterChips component
 * Story 21.4: Reading UI + LexicalHub Phase 1
 * Story 21.x: Migrated to word-hub feature
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConstituentCharacterChips } from "../components/ConstituentCharacterChips";

const SAMPLE_CHARS = [
  { glyph: "女", pinyin: "nǚ", meaning: "woman" },
  { glyph: "子", pinyin: "zǐ", meaning: "child" },
];

describe("ConstituentCharacterChips", () => {
  it("renders section heading", () => {
    render(<ConstituentCharacterChips characters={SAMPLE_CHARS} />);
    expect(screen.getByText("Characters in this word")).toBeInTheDocument();
  });

  it("renders character chips", () => {
    render(<ConstituentCharacterChips characters={SAMPLE_CHARS} />);
    expect(screen.getByText("女")).toBeInTheDocument();
    expect(screen.getByText("子")).toBeInTheDocument();
  });

  it("renders pinyin for each char", () => {
    render(<ConstituentCharacterChips characters={SAMPLE_CHARS} />);
    expect(screen.getByText("nǚ")).toBeInTheDocument();
    expect(screen.getByText("zǐ")).toBeInTheDocument();
  });

  it("renders meaning for each char", () => {
    render(<ConstituentCharacterChips characters={SAMPLE_CHARS} />);
    expect(screen.getByText("woman")).toBeInTheDocument();
    expect(screen.getByText("child")).toBeInTheDocument();
  });

  it("returns null when characters array is empty", () => {
    const { container } = render(<ConstituentCharacterChips characters={[]} />);
    expect(container.textContent).toBe("");
  });

  it("does not throw when chip clicked (uses openHub internally)", async () => {
    render(<ConstituentCharacterChips characters={SAMPLE_CHARS} />);

    await userEvent.click(screen.getByLabelText("Character: 女"));
    // No crash expected — openHub is handled internally
  });
});
