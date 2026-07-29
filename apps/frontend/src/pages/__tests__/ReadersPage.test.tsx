/**
 * @file components/__tests__/ReadersPage.test.tsx
 * @description Tests for ReadersPage component
 * Story 21.4: Reading UI + LexicalHub Phase 1
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ReadersPage } from "../learn/readers/ReadersPage";

// Mock hooks
vi.mock("features/readers/hooks/usePassages", () => ({
  usePassages: vi.fn(),
}));

vi.mock("features/readers/hooks/usePassageDetail", () => ({
  usePassageDetail: vi.fn(),
}));

vi.mock("features/readers/hooks/useGeneratePassage", () => ({
  useGeneratePassage: vi.fn(),
}));

// Mock store
vi.mock("features/readers/stores", () => ({
  useReadingStore: Object.assign(
    (selector?: (s: Record<string, unknown>) => unknown) => {
      const state = {
        currentPassageId: null,
        mode: "library",
        popover: { glyph: null, position: null },
        openPopover: vi.fn(),
        closePopover: vi.fn(),
        setPassageId: vi.fn(),
        setMode: vi.fn(),
      };
      return selector ? selector(state) : state;
    },
    {
      getState: () => ({
        setPassageId: vi.fn(),
        setMode: vi.fn(),
        popover: { glyph: null, position: null },
      }),
    },
  ),
}));

import { usePassages, usePassageDetail, useGeneratePassage } from "features/readers";

describe("ReadersPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(usePassages).mockReturnValue({
      passages: [],
      isLoading: false,
      hasError: false,
      isEmpty: true,
      retry: vi.fn(),
    });

    vi.mocked(usePassageDetail).mockReturnValue({
      passage: null,
      isLoading: false,
      hasError: false,
      retry: vi.fn(),
    });

    vi.mocked(useGeneratePassage).mockReturnValue({
      isGenerating: false,
      generatedId: null,
      hasError: false,
      generate: vi.fn(),
      reset: vi.fn(),
    });
  });

  it("renders page title", () => {
    render(<ReadersPage mode="library" />);
    expect(screen.getByText("Graded Readers")).toBeInTheDocument();
  });

  it("renders library view in library mode", () => {
    // Mock non-empty passages so the filter chips render instead of empty state
    vi.mocked(usePassages).mockReturnValue({
      passages: [{ id: "p1", title: "Test", hskLevel: 2, knownWordRatio: 75, isBookmarked: false }],
      isLoading: false,
      hasError: false,
      isEmpty: false,
      retry: vi.fn(),
    });

    render(<ReadersPage mode="library" />);
    expect(screen.getByText("All")).toBeInTheDocument(); // HSK filter
  });

  it("renders empty library state", () => {
    render(<ReadersPage mode="library" />);
    expect(screen.getByText("No passages yet")).toBeInTheDocument();
  });

  it("renders empty library state with generate button", () => {
    render(<ReadersPage mode="library" />);
    expect(screen.getByText("Generate your first passage")).toBeInTheDocument();
  });
});
