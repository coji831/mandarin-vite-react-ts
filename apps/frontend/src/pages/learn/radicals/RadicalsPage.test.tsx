/**
 * @file pages/learn/RadicalsPage.test.tsx
 * @description Smoke tests for RadicalsPage component
 * Story 19.1: Radicals Browser Structure
 * Story 19.4: Radical Trees (Phase 3)
 * Story 22.4 follow-up (Issue 4): URL seeds view/mode; `?radical=` self-clears
 * after opening the hub without re-opening.
 */

import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { RadicalsPage } from "./RadicalsPage";
import { useHubStore } from "shared/store";

function renderWithRouter(ui: ReactNode, initialRoute = "/learn/radicals") {
  return render(<MemoryRouter initialEntries={[initialRoute]}>{ui}</MemoryRouter>);
}

/** Renders the current router search so tests can assert the ?radical param clears. */
function LocationSearchProbe() {
  const location = useLocation();
  return <span data-testid="location-search">{location.search}</span>;
}

// Mock the radicalsService to avoid actual fetch calls
// Use vi.hoisted to create the mock fn before vi.mock is hoisted
const mockLoadAllRadicals = vi.hoisted(() => vi.fn());
vi.mock("../../../features/radicals/services/radicalsService", () => ({
  radicalsService: {
    loadAllRadicals: mockLoadAllRadicals,
    clearCache: vi.fn(),
  },
}));

// Mock usePhaseGate to return Phase 3 (unlocked trees) — keep the real
// useSearchParamState so URL-driven view/mode actually run.
vi.mock("shared/hooks", async () => {
  const actual = await vi.importActual<typeof import("shared/hooks")>("shared/hooks");
  return {
    ...actual,
    usePhaseGate: () => ({
      phaseGate: { currentPhase: 3 },
      isLoading: false,
    }),
  };
});

// Mock RadicalTreesTab to avoid its dependency chain (radicalProgressService, etc.)
// We test toggle behavior here, not tree content
vi.mock("../../../features/radicals/components/RadicalTreesTab", () => ({
  RadicalTreesTab: () => <div data-testid="mock-radical-trees-tab">Tree view placeholder</div>,
}));

const SAMPLE_RADICALS = [
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
];

describe("RadicalsPage", () => {
  beforeEach(() => {
    mockLoadAllRadicals.mockResolvedValue(SAMPLE_RADICALS);
  });

  it("renders the page title and description", async () => {
    renderWithRouter(<RadicalsPage />);
    expect(screen.getByText("Radicals")).toBeInTheDocument();
    expect(screen.getByText(/building blocks of Chinese characters/i)).toBeInTheDocument();
    // Wait for loading to finish to avoid act() warnings
    await waitFor(() => {
      expect(screen.queryByText(/loading radicals/i)).not.toBeInTheDocument();
    });
  });

  it("renders the filter bar with search input", async () => {
    renderWithRouter(<RadicalsPage />);
    expect(screen.getByPlaceholderText(/search by pinyin/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/stroke count/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/sort radicals/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/reset all filters/i)).toBeInTheDocument();
    // Wait for loading to finish to avoid act() warnings
    await waitFor(() => {
      expect(screen.queryByText(/loading radicals/i)).not.toBeInTheDocument();
    });
  });

  it("loads and displays radicals", async () => {
    renderWithRouter(<RadicalsPage />);

    // Should show loading initially, then radicals after data loads
    await waitFor(() => {
      expect(screen.getAllByText("一").length).toBeGreaterThan(0);
    });
    expect(screen.getAllByText("口").length).toBeGreaterThan(0);
  });

  describe("Browse/Trees toggle", () => {
    it("renders toggle buttons with correct active state", async () => {
      renderWithRouter(<RadicalsPage />);
      await waitFor(() => {
        expect(screen.queryByText(/loading radicals/i)).not.toBeInTheDocument();
      });

      const browseBtn = screen.getAllByText("📋 Browse")[0].closest("button")!;
      const treesBtn = screen.getAllByText("🌳 Trees")[0].closest("button")!;

      // Browse is active by default (shared Button primary-active variant), Trees is not
      expect(browseBtn.className).toContain("btn-primary-active");
      expect(treesBtn.className).not.toContain("btn-primary-active");
    });

    it('clicking "🌳 Trees" switches heading to "Radical Trees"', async () => {
      renderWithRouter(<RadicalsPage />);
      await waitFor(() => {
        expect(screen.queryByText(/loading radicals/i)).not.toBeInTheDocument();
      });

      const treesBtn = screen.getByText("🌳 Trees").closest("button")!;
      fireEvent.click(treesBtn);

      expect(screen.getByText("Radical Trees")).toBeInTheDocument();
      expect(screen.getByText(/Explore mastered radicals/i)).toBeInTheDocument();
    });

    it("FilterBar is hidden in Trees mode", async () => {
      renderWithRouter(<RadicalsPage />);
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
      renderWithRouter(<RadicalsPage />);
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

  describe("URL-driven view/mode (Story 22.4 follow-up)", () => {
    it("seeds trees view from ?view=trees", async () => {
      renderWithRouter(<RadicalsPage />, "/learn/radicals?view=trees");
      await waitFor(() => {
        expect(screen.queryByText(/loading radicals/i)).not.toBeInTheDocument();
      });
      expect(screen.getByText("Radical Trees")).toBeInTheDocument();
      expect(screen.getByTestId("mock-radical-trees-tab")).toBeInTheDocument();
    });

    it("seeds phonetic mode from ?view=trees&mode=phonetic", async () => {
      renderWithRouter(<RadicalsPage />, "/learn/radicals?view=trees&mode=phonetic");
      await waitFor(() => {
        expect(screen.queryByText(/loading radicals/i)).not.toBeInTheDocument();
      });
      expect(screen.getByText("Phonetic Trees")).toBeInTheDocument();
      expect(screen.getByText(/shared phonetic components/i)).toBeInTheDocument();
    });

    it("falls back to browse when ?view= is invalid", async () => {
      renderWithRouter(<RadicalsPage />, "/learn/radicals?view=bogus");
      await waitFor(() => {
        expect(screen.queryByText(/loading radicals/i)).not.toBeInTheDocument();
      });
      expect(screen.getByText("Radicals")).toBeInTheDocument();
      expect(screen.queryByTestId("mock-radical-trees-tab")).not.toBeInTheDocument();
    });
  });

  describe("?radical= deep-link", () => {
    it("opens the hub once, clears the param, and does not re-open", async () => {
      const openSpy = vi.spyOn(useHubStore.getState(), "open");
      renderWithRouter(
        <div>
          <RadicalsPage />
          <LocationSearchProbe />
        </div>,
        "/learn/radicals?radical=rad_0001",
      );

      await waitFor(() => expect(openSpy).toHaveBeenCalled());
      expect(openSpy.mock.calls[0][0]).toMatchObject({
        entityType: "radical",
        entityId: "rad_0001",
      });

      // The transient param is self-cleared with replace.
      await waitFor(() =>
        expect(screen.getByTestId("location-search")).not.toHaveTextContent("radical"),
      );

      // Trigger a re-render (view toggle) — the ref guard must NOT re-open the hub.
      const treesBtn = screen.getByText("🌳 Trees").closest("button")!;
      fireEvent.click(treesBtn);
      expect(openSpy).toHaveBeenCalledTimes(1);
    });
  });
});
