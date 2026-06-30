/**
 * @file components/CharacterListNode.test.tsx
 * @description Tests for CharacterListNode component
 * Story 19.4: Radical Trees (Phase 3)
 */

import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CharacterListNode } from "./CharacterListNode";
import type { RadicalData } from "../types";

// Mock BranchNode to avoid hook dependencies
vi.mock("./BranchNode", () => ({
  BranchNode: ({
    character,
    pinyin,
    meaning,
  }: {
    character: string;
    pinyin: string;
    meaning: string;
    showConnector?: boolean;
  }) => (
    <div
      data-testid="branch-node"
      data-character={character}
      data-pinyin={pinyin}
      data-meaning={meaning}
    >
      {character}
    </div>
  ),
}));

const mockRadical: RadicalData = {
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
    ],
  },
};

const sampleCharacters = [
  { glyph: "水", pinyin: "shuǐ", meaning: "water" },
  { glyph: "江", pinyin: "jiāng", meaning: "river" },
];

describe("CharacterListNode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders radical glyph, meaning, and pinyin in header", () => {
    render(<CharacterListNode radical={mockRadical} characters={sampleCharacters} />);

    expect(screen.getByText("氵")).toBeInTheDocument();
    expect(screen.getByText("water radical")).toBeInTheDocument();
    expect(screen.getByText("sāndiǎnshuǐ")).toBeInTheDocument();
  });

  it("shows character count", () => {
    render(<CharacterListNode radical={mockRadical} characters={sampleCharacters} />);

    expect(screen.getByText("2 characters")).toBeInTheDocument();
  });

  it("renders BranchNode for each character", () => {
    render(<CharacterListNode radical={mockRadical} characters={sampleCharacters} />);

    const nodes = screen.getAllByTestId("branch-node");
    expect(nodes).toHaveLength(2);
    expect(nodes[0]).toHaveAttribute("data-character", "水");
    expect(nodes[1]).toHaveAttribute("data-character", "江");
  });

  it("shows empty state when no characters", () => {
    render(<CharacterListNode radical={mockRadical} characters={[]} />);

    expect(screen.getByText("No characters found for this radical.")).toBeInTheDocument();
  });

  it("shows singular 'character' when count is 1", () => {
    const singleChar = [{ glyph: "水", pinyin: "shuǐ", meaning: "water" }];
    render(<CharacterListNode radical={mockRadical} characters={singleChar} />);

    expect(screen.getByText("1 character")).toBeInTheDocument();
  });
});
