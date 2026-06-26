/**
 * @file pages/learn/RadicalsPage.test.tsx
 * @description Smoke tests for RadicalsPage component
 * Story 19.1: Radicals Browser Structure
 * Story 19.4: Radical Trees (Phase 3)
 */

import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { RadicalsPage } from "./RadicalsPage";

// Mock the radicalsService to avoid actual fetch calls
// Use vi.hoisted to create the mock fn before vi.mock is hoisted
const mockLoadAllRadicals = vi.hoisted(() => vi.fn());
vi.mock("../../features/radicals/services/radicalsService", () => ({
  radicalsService: {
    loadAllRadicals: mockLoadAllRadicals,
    clearCache: vi.fn(),
  },
}));

// Mock usePhaseGate to return Phase 3 (unlocked trees)
vi.mock("shared/hooks", () => ({
  usePhaseGate: () => ({
    phaseGate: { currentPhase: 3 },
    isLoading: false,
  }),
}));

// Mock RadicalTreesTab to avoid its dependency chain (radicalProgressService, etc.)
// We test toggle behavior here, not tree content
vi.mock("../../features/radicals/components/RadicalTreesTab", () => ({
  RadicalTreesTab: () => <div data-testid="mock-radical-trees-tab">Tree view placeholder</div>,
}));

describe("RadicalsPage", () => {
  beforeEach(() => {
    mockLoadAllRadicals.mockResolvedValue([
      {
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
      },
      {
        id: "rad_0030",
        glyph: "口",
        alternate_glyphs: [],
        name_pinyin: "kǒu",
        name_chinese: "口",
        meaning: "mouth",
        stroke_count: 3,
        is_recommended: true,
        kangxi_index: 30,
        metadata: {},
      },
    ]);
  });

  it("renders the page title and description", async () => {
    render(<RadicalsPage />);
    expect(screen.getByText("Radicals")).toBeInTheDocument();
    expect(
      screen.getByText(/fundamental building blocks of Chinese characters/i),
    ).toBeInTheDocument();
    // Wait for loading to finish to avoid act() warnings
    await waitFor(() => {
      expect(screen.queryByText(/loading radicals/i)).not.toBeInTheDocument();
    });
  });

  it("renders the filter bar with search input", async () => {
    render(<RadicalsPage />);
    expect(screen.getByPlaceholderText(/search by pinyin/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/stroke count/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/sort by/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/reset all filters/i)).toBeInTheDocument();
    // Wait for loading to finish to avoid act() warnings
    await waitFor(() => {
      expect(screen.queryByText(/loading radicals/i)).not.toBeInTheDocument();
    });
  });

  it("loads and displays radicals", async () => {
    render(<RadicalsPage />);

    // Should show loading initially, then radicals after data loads
    await waitFor(() => {
      expect(screen.getByText("一")).toBeInTheDocument();
    });
    expect(screen.getByText("口")).toBeInTheDocument();
  });

  describe("Browse/Trees toggle", () => {
    it("renders toggle buttons with correct aria-pressed values", async () => {
      render(<RadicalsPage />);
      await waitFor(() => {
        expect(screen.queryByText(/loading radicals/i)).not.toBeInTheDocument();
      });

      const browseBtn = screen.getByText("📋 Browse").closest("button")!;
      const treesBtn = screen.getByText("🌳 Trees").closest("button")!;

      expect(browseBtn).toHaveAttribute("aria-pressed", "true");
      expect(treesBtn).toHaveAttribute("aria-pressed", "false");
    });

    it('clicking "🌳 Trees" switches heading to "Radical Trees"', async () => {
      render(<RadicalsPage />);
      await waitFor(() => {
        expect(screen.queryByText(/loading radicals/i)).not.toBeInTheDocument();
      });

      const treesBtn = screen.getByText("🌳 Trees").closest("button")!;
      fireEvent.click(treesBtn);

      expect(screen.getByText("Radical Trees")).toBeInTheDocument();
      expect(
        screen.getByText(/Explore mastered radicals/i),
      ).toBeInTheDocument();
    });

    it("FilterBar is hidden in Trees mode", async () => {
      render(<RadicalsPage />);
      await waitFor(() => {
        expect(screen.queryByText(/loading radicals/i)).not.toBeInTheDocument();
      });

      // FilterBar visible initially
      expect(screen.getByPlaceholderText(/search by pinyin/i)).toBeInTheDocument();

      // Switch to Trees mode
      const treesBtn = screen.getByText("🌳 Trees").closest("button")!;
      fireEvent.click(treesBtn);

      // FilterBar should be hidden
      expect(screen.queryByPlaceholderText(/search by pinyin/i)).not.toBeInTheDocument();
    });

    it("RadicalTreesTab is shown when Trees is active", async () => {
      render(<RadicalsPage />);
      await waitFor(() => {
        expect(screen.queryByText(/loading radicals/i)).not.toBeInTheDocument();
      });

      // Switch to Trees mode
      const treesBtn = screen.getByText("🌳 Trees").closest("button")!;
      fireEvent.click(treesBtn);

      // RadicalTreesTab renders
      expect(screen.getByTestId("mock-radical-trees-tab")).toBeInTheDocument();
    });
  });
});
