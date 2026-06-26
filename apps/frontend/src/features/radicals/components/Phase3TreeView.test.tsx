/**
 * @file components/Phase3TreeView.test.tsx
 * @description Unit tests for Phase3TreeView component
 * Story 19.4: Radical Trees (Phase 3)
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Phase3TreeView } from "./Phase3TreeView";
import type { RadicalData } from "../types";

// Mock child components
vi.mock("./RadicalChipPicker", () => ({
  RadicalChipPicker: vi.fn(({ filteredChips, activeRadicalId, onChipClick }) => (
    <div data-testid="mock-chip-picker">
      {filteredChips.map((r: RadicalData) => (
        <button
          key={r.id}
          data-testid={`chip-${r.id}`}
          data-selected={activeRadicalId === r.id}
          onClick={() => onChipClick(r.id)}
          type="button"
        >
          {r.glyph}
        </button>
      ))}
    </div>
  )),
}));

vi.mock("./TreeRootNode", () => ({
  TreeRootNode: vi.fn(() => <div data-testid="mock-tree-root-node" />),
}));

vi.mock("shared/components", () => ({
  Button: vi.fn(({ children, onClick, variant }) => (
    <button data-testid={`mock-button-${variant}`} onClick={onClick} type="button">
      {children}
    </button>
  )),
}));

const mockRadicals: RadicalData[] = [
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
    metadata: { hsk_characters: [{ glyph: "一", pinyin: "yī", meaning: "one" }] },
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
];

const defaultProps = {
  searchQuery: "",
  filteredChips: mockRadicals,
  masteredRadicals: mockRadicals,
  activeRadical: mockRadicals[0],
  progressError: null,
  progressLoading: false,
  onSearchChange: vi.fn(),
  onChipClick: vi.fn(),
  onRetry: vi.fn(),
  getCharactersForRadical: vi.fn(() => []),
};

describe("Phase3TreeView", () => {
  it("renders loading state with skeleton", () => {
    render(<Phase3TreeView {...defaultProps} progressLoading={true} />);
    expect(screen.getByText("Loading mastered radicals…")).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("renders error state with retry button", () => {
    const onRetry = vi.fn();
    render(
      <Phase3TreeView
        {...defaultProps}
        progressError="Failed to load"
        progressLoading={false}
        onRetry={onRetry}
      />,
    );
    expect(screen.getByText("Failed to load")).toBeInTheDocument();
    const retryButton = screen.getByText("Retry");
    expect(retryButton).toBeInTheDocument();
    fireEvent.click(retryButton);
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("renders empty state when no mastered radicals", () => {
    render(<Phase3TreeView {...defaultProps} masteredRadicals={[]} filteredChips={[]} />);
    expect(screen.getByText("No mastered radicals yet.")).toBeInTheDocument();
    expect(
      screen.getByText("Start memorizing radicals in Browse mode to build your tree."),
    ).toBeInTheDocument();
  });

  it("renders chips + tree when masteredRadicals is populated", () => {
    render(<Phase3TreeView {...defaultProps} />);
    expect(screen.getByTestId("mock-chip-picker")).toBeInTheDocument();
    expect(screen.getByTestId("mock-tree-root-node")).toBeInTheDocument();
    expect(screen.getByText(/Your known radicals/)).toBeInTheDocument();
    expect(screen.getByText(/Selected:/)).toBeInTheDocument();
  });

  it("search input fires onSearchChange callback", () => {
    const onSearchChange = vi.fn();
    render(<Phase3TreeView {...defaultProps} onSearchChange={onSearchChange} />);
    const input = screen.getByPlaceholderText("Filter radicals…");
    fireEvent.change(input, { target: { value: "一" } });
    expect(onSearchChange).toHaveBeenCalledWith("一");
  });

  it("chip click fires onChipClick callback", () => {
    const onChipClick = vi.fn();
    render(<Phase3TreeView {...defaultProps} onChipClick={onChipClick} />);
    const chip = screen.getByTestId("chip-rad_0030");
    fireEvent.click(chip);
    expect(onChipClick).toHaveBeenCalledWith("rad_0030");
  });

  it("renders tagline", () => {
    render(<Phase3TreeView {...defaultProps} />);
    expect(screen.getByText(/Learning through recognition/)).toBeInTheDocument();
  });
});
