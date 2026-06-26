/**
 * @file components/RadicalsPage.test.tsx
 * @description Smoke tests for RadicalsPage component
 * Story 19.1: Radicals Browser Structure
 */

import { render, screen, waitFor } from "@testing-library/react";
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
});
