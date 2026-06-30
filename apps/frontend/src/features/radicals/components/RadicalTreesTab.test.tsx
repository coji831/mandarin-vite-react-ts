/**
 * @file components/RadicalTreesTab.test.tsx
 * @description Tests for RadicalTreesTab component
 * Story 19.4: Radical Trees (Phase 3)
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { RadicalTreesTab } from "./RadicalTreesTab";
import type { RadicalData, RadicalFilter } from "../types";

// ─── Mocks ────────────────────────────────────────────────────────────

const mockGetRadicalProgress = vi.hoisted(() => vi.fn());
const mockUsePhaseGate = vi.hoisted(() => vi.fn());

vi.mock("../services/radicalProgressService", () => ({
  radicalProgressService: {
    getRadicalProgress: mockGetRadicalProgress,
  },
}));

vi.mock("shared/hooks", () => ({
  usePhaseGate: (...args: unknown[]) => mockUsePhaseGate(...args),
  useCharacterHub: () => ({ openHub: vi.fn() }),
}));

// Mock child components
vi.mock("./RadicalGrid", () => ({
  RadicalGrid: ({
    radicals,
    onRadicalClick,
  }: {
    radicals: RadicalData[];
    onRadicalClick?: (r: RadicalData) => void;
  }) => (
    <div data-testid="radical-grid" data-count={radicals.length}>
      {radicals.map((r) => (
        <div key={r.id} data-testid="mock-radical-card" onClick={() => onRadicalClick?.(r)}>
          {r.glyph}
        </div>
      ))}
    </div>
  ),
}));

vi.mock("./CharacterListNode", () => ({
  CharacterListNode: ({
    radical,
    characters,
  }: {
    radical: RadicalData;
    characters: Array<{ glyph: string; pinyin: string; meaning: string }>;
  }) => (
    <div
      data-testid="character-list-node"
      data-radical-id={radical.id}
      data-char-count={characters.length}
    >
      CharacterList for {radical.glyph}
    </div>
  ),
}));

vi.mock("./TreeRootNode", () => ({
  TreeRootNode: ({
    radical,
    characters,
  }: {
    radical: RadicalData;
    characters: Array<{ glyph: string; pinyin: string; meaning: string }>;
  }) => (
    <div
      data-testid="tree-root-node"
      data-radical-id={radical.id}
      data-char-count={characters.length}
    >
      TreeRoot: {radical.glyph}
    </div>
  ),
}));

// ─── Test Data ────────────────────────────────────────────────────────

const mockRadicals: RadicalData[] = [
  {
    id: "rad_0001",
    glyph: "一",
    alternate_glyphs: [],
    name_pinyin: "yī",
    meaning: "one",
    stroke_count: 1,
    is_recommended: true,
    kangxi_index: 1,
    metadata: {
      hsk_characters: [
        { glyph: "一", pinyin: "yī", meaning: "one" },
        { glyph: "七", pinyin: "qī", meaning: "seven" },
      ],
    },
  },
  {
    id: "rad_0008",
    glyph: "氵",
    alternate_glyphs: [],
    name_pinyin: "sāndiǎnshuǐ",
    meaning: "water radical",
    stroke_count: 3,
    is_recommended: true,
    kangxi_index: 8,
    metadata: {
      hsk_characters: [
        { glyph: "水", pinyin: "shuǐ", meaning: "water" },
        { glyph: "江", pinyin: "jiāng", meaning: "river" },
      ],
    },
  },
];

const defaultFilter: RadicalFilter = {
  search: "",
  strokeCount: null,
  showTop20Only: false,
  sortBy: "kangxi_index",
};

const defaultProps = {
  radicals: mockRadicals,
  filter: defaultFilter,
  setFilter: vi.fn(),
  resetFilter: vi.fn(),
  isLoading: false,
  error: null as string | null,
  refetch: vi.fn(),
};

describe("RadicalTreesTab — Phase 2 (currentPhase < 3)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePhaseGate.mockReturnValue({ phaseGate: { currentPhase: 2 }, isLoading: false });
  });

  it("shows locked teaser instead of browse grid", () => {
    render(<RadicalTreesTab {...defaultProps} />);

    expect(screen.getByText("🔒")).toBeInTheDocument();
    expect(screen.getByText("Radical Trees")).toBeInTheDocument();
    expect(
      screen.getByText("Master radicals and pass the Phase 2 quiz to unlock tree visualization."),
    ).toBeInTheDocument();
  });

  it("does not show browse content for Phase 2 users in Trees tab", () => {
    render(<RadicalTreesTab {...defaultProps} />);

    expect(
      screen.queryByText("Select a radical to see characters containing it."),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("radical-grid")).not.toBeInTheDocument();
  });

  it("shows loading state", () => {
    render(<RadicalTreesTab {...defaultProps} isLoading={true} />);

    expect(screen.getByText("Loading…")).toBeInTheDocument();
  });
});

describe("RadicalTreesTab — Phase 3 (currentPhase >= 3)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePhaseGate.mockReturnValue({ phaseGate: { currentPhase: 3 }, isLoading: false });
  });

  it("shows search bar and chip picker when mastered radicals load", async () => {
    mockGetRadicalProgress.mockResolvedValue([
      {
        id: "p1",
        userId: "u1",
        radicalId: "rad_0001",
        memorized: true,
        recognitionLevel: 3,
        reviewedAt: null,
        createdAt: "",
        updatedAt: "",
      },
    ]);

    render(<RadicalTreesTab {...defaultProps} />);

    // Should show search bar immediately
    expect(screen.getByPlaceholderText("Filter radicals…")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("tree-root-node")).toBeInTheDocument();
    });

    // Should show the chip for the mastered radical
    expect(screen.getByText("one")).toBeInTheDocument();

    // Should show separator
    expect(screen.getByText("─── Your known radicals (★ mastered) ───")).toBeInTheDocument();

    // Should show selected indicator
    expect(screen.getByText(/Selected:/)).toBeInTheDocument();

    // Should show tagline
    expect(
      screen.getByText("✨ Learning through recognition — no testing. Browse freely."),
    ).toBeInTheDocument();
  });

  it("selects first mastered radical by default", async () => {
    mockGetRadicalProgress.mockResolvedValue([
      {
        id: "p1",
        userId: "u1",
        radicalId: "rad_0001",
        memorized: true,
        recognitionLevel: 3,
        reviewedAt: null,
        createdAt: "",
        updatedAt: "",
      },
    ]);

    render(<RadicalTreesTab {...defaultProps} />);

    await waitFor(() => {
      // TreeRootNode should be rendered for the first mastered radical
      expect(screen.getByTestId("tree-root-node")).toHaveAttribute("data-radical-id", "rad_0001");
    });
  });

  it("shows multiple chips for multiple mastered radicals", async () => {
    mockGetRadicalProgress.mockResolvedValue([
      {
        id: "p1",
        userId: "u1",
        radicalId: "rad_0001",
        memorized: true,
        recognitionLevel: 3,
        reviewedAt: null,
        createdAt: "",
        updatedAt: "",
      },
      {
        id: "p2",
        userId: "u1",
        radicalId: "rad_0008",
        memorized: true,
        recognitionLevel: 3,
        reviewedAt: null,
        createdAt: "",
        updatedAt: "",
      },
    ]);

    render(<RadicalTreesTab {...defaultProps} />);

    await waitFor(() => {
      // Both chips should be present
      expect(screen.getByText("one")).toBeInTheDocument();
      expect(screen.getByText("water radical")).toBeInTheDocument();
    });
  });

  it("switches tree when a different chip is clicked", async () => {
    mockGetRadicalProgress.mockResolvedValue([
      {
        id: "p1",
        userId: "u1",
        radicalId: "rad_0001",
        memorized: true,
        recognitionLevel: 3,
        reviewedAt: null,
        createdAt: "",
        updatedAt: "",
      },
      {
        id: "p2",
        userId: "u1",
        radicalId: "rad_0008",
        memorized: true,
        recognitionLevel: 3,
        reviewedAt: null,
        createdAt: "",
        updatedAt: "",
      },
    ]);

    render(<RadicalTreesTab {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId("tree-root-node")).toBeInTheDocument();
    });

    // Click the second chip (water radical)
    fireEvent.click(screen.getByText("water radical"));

    await waitFor(() => {
      const treeNodes = screen.getAllByTestId("tree-root-node");
      expect(treeNodes).toHaveLength(1);
      expect(treeNodes[0]).toHaveAttribute("data-radical-id", "rad_0008");
    });
  });

  it("filters chips by search query", async () => {
    mockGetRadicalProgress.mockResolvedValue([
      {
        id: "p1",
        userId: "u1",
        radicalId: "rad_0001",
        memorized: true,
        recognitionLevel: 3,
        reviewedAt: null,
        createdAt: "",
        updatedAt: "",
      },
      {
        id: "p2",
        userId: "u1",
        radicalId: "rad_0008",
        memorized: true,
        recognitionLevel: 3,
        reviewedAt: null,
        createdAt: "",
        updatedAt: "",
      },
    ]);

    render(<RadicalTreesTab {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId("tree-root-node")).toBeInTheDocument();
    });

    // Type in search — should filter chips and deselect
    const searchInput = screen.getByPlaceholderText("Filter radicals…");
    fireEvent.change(searchInput, { target: { value: "water" } });

    // "water radical" chip should be visible (filtered), "one" chip hidden
    expect(screen.getByText("water radical")).toBeInTheDocument();
    // The selected tree should still show since there's a match
    expect(screen.getByTestId("tree-root-node")).toBeInTheDocument();
  });

  it("shows loading state while fetching progress", async () => {
    mockGetRadicalProgress.mockReturnValue(new Promise(() => {}));

    render(<RadicalTreesTab {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("Loading mastered radicals…")).toBeInTheDocument();
    });
  });

  it("shows error state when progress fetch fails", async () => {
    mockGetRadicalProgress.mockRejectedValue(new Error("API error"));

    render(<RadicalTreesTab {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("API error")).toBeInTheDocument();
    });
  });

  it("shows empty state when no radicals are mastered", async () => {
    mockGetRadicalProgress.mockResolvedValue([]);

    render(<RadicalTreesTab {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("No mastered radicals yet.")).toBeInTheDocument();
    });
  });
});
