/**
 * @file __tests__/WordHub.test.tsx
 * @description Tests for WordHub component
 * Story 21.4: Reading UI + LexicalHub Phase 1
 * Story 21.x: Migrated to word-hub feature
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { WordHub } from "../components/WordHub";
import type { WordDetail } from "../components/WordHub";

// Mock the hooks
vi.mock("../hooks", () => ({
  useWordDetail: vi.fn(),
}));

// Mock sub-components
vi.mock("../components/DefinitionList", () => ({
  DefinitionList: ({ definitions }: { definitions: string[] }) => (
    <div data-testid="definition-list">{definitions.join(", ")}</div>
  ),
}));

vi.mock("../components/ConstituentCharacterChips", () => ({
  ConstituentCharacterChips: () => <div data-testid="char-chips">CharacterChips</div>,
}));

// Mock character-hub tone utils
vi.mock("features/character-hub", () => ({
  getToneClass: () => "tone-1",
  extractTone: () => 1,
}));

import { useWordDetail } from "../hooks";

const MOCK_WORD: WordDetail = {
  glyph: "好",
  pinyin: "hǎo",
  definitions: ["good", "fine"],
  hskLevel: 1,
  constituentCharacters: [
    { glyph: "女", pinyin: "nǚ", meaning: "woman" },
    { glyph: "子", pinyin: "zǐ", meaning: "child" },
  ],
};

describe("WordHub", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading skeleton when loading", () => {
    vi.mocked(useWordDetail).mockReturnValue({
      data: null,
      isLoading: true,
      isError: false,
    });

    render(<WordHub entityId="好" />);
    expect(screen.getByLabelText("Loading word details")).toBeInTheDocument();
  });

  it("renders word data after loading", () => {
    vi.mocked(useWordDetail).mockReturnValue({
      data: MOCK_WORD,
      isLoading: false,
      isError: false,
    });

    render(<WordHub entityId="好" />);
    expect(screen.getByText("好")).toBeInTheDocument();
    expect(screen.getByText("HSK 1")).toBeInTheDocument();
    expect(screen.getByTestId("definition-list")).toBeInTheDocument();
    expect(screen.getByTestId("char-chips")).toBeInTheDocument();
  });

  it("renders word from prop directly (Storybook mode)", () => {
    // Must provide a return value so useWordDetail destructuring doesn't fail
    vi.mocked(useWordDetail).mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
    });

    render(<WordHub entityId="" word={MOCK_WORD} />);
    expect(screen.getByText("好")).toBeInTheDocument();
    expect(screen.getByText("HSK 1")).toBeInTheDocument();
    // Should have called the hook with null (no self-fetch)
    expect(useWordDetail).toHaveBeenCalledWith(null);
  });

  it("renders error screen when hasError", () => {
    vi.mocked(useWordDetail).mockReturnValue({
      data: null,
      isLoading: false,
      isError: true,
    });

    render(<WordHub entityId="好" />);
    expect(screen.getByText("Unable to load word")).toBeInTheDocument();
  });

  it("renders no-data fallback when word is null and not loading", () => {
    vi.mocked(useWordDetail).mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
    });

    render(<WordHub entityId="好" />);
    expect(screen.getByText("No word data available.")).toBeInTheDocument();
  });
});
