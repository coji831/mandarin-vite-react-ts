/**
 * @file components/__tests__/ReadersPage.test.tsx
 * @description Tests for ReadersPage component
 * Story 21.4: Reading UI + LexicalHub Phase 1
 */

import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "src/test-utils";
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

// Mock store — pass through real stores (audioStore etc.) and override useReadingStore
// with a controlled session state so the page renders deterministically.
vi.mock("features/readers/stores", async () => {
  const actual =
    await vi.importActual<typeof import("features/readers/stores")>("features/readers/stores");
  return {
    ...actual,
    useReadingStore: Object.assign(
      (selector?: (s: Record<string, unknown>) => unknown) => {
        const state = {
          currentPassageId: null,
          mode: "library",
          popover: { glyph: null, position: null },
          currentSentence: 0,
          completedPassages: new Set<string>(),
          bookmarkedPassages: new Set<string>(),
          isAuthenticated: false,
          openPopover: vi.fn(),
          closePopover: vi.fn(),
          setPassageId: vi.fn(),
          setMode: vi.fn(),
          setCurrentSentence: vi.fn(),
          markCompleted: vi.fn(),
          fetchBookmarks: vi.fn(),
          toggleBookmark: vi.fn(),
          setIsAuthenticated: vi.fn(),
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
  };
});

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
    renderWithProviders(<ReadersPage mode="library" />);
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

    renderWithProviders(<ReadersPage mode="library" />);
    expect(screen.getByText("All")).toBeInTheDocument(); // HSK filter
  });

  it("renders empty library state", () => {
    renderWithProviders(<ReadersPage mode="library" />);
    expect(screen.getByText("No passages yet")).toBeInTheDocument();
  });

  it("renders empty library state with generate button", () => {
    renderWithProviders(<ReadersPage mode="library" />);
    expect(screen.getByText("Generate your first passage")).toBeInTheDocument();
  });

  // ── VisFix W6b: Generate flow feedback ──────────────────────────────────

  it("disables the generate CTA while generating (loading spinner state)", () => {
    vi.mocked(useGeneratePassage).mockReturnValue({
      isGenerating: true,
      generatedId: null,
      hasError: false,
      generate: vi.fn(),
      reset: vi.fn(),
    });

    renderWithProviders(<ReadersPage mode="library" />);

    // Button loading state renders aria-busy on the disabled generate CTA.
    const generateButton = screen.getByRole("button", { busy: true });
    expect(generateButton).toBeDisabled();
  });

  it("refreshes the library when a passage is generated", () => {
    const retry = vi.fn();
    const reset = vi.fn();

    vi.mocked(usePassages).mockReturnValue({
      passages: [],
      isLoading: false,
      hasError: false,
      isEmpty: true,
      retry,
    });
    vi.mocked(useGeneratePassage).mockReturnValue({
      isGenerating: false,
      generatedId: "new-passage-id",
      hasError: false,
      generate: vi.fn(),
      reset,
    });

    renderWithProviders(<ReadersPage mode="library" />);

    // On mount the generatedId effect refreshes the library, then clears it.
    expect(retry).toHaveBeenCalled();
    expect(reset).toHaveBeenCalled();
  });

  it("renders an inline generate error with retry that re-triggers generation", async () => {
    const generate = vi.fn();
    vi.mocked(useGeneratePassage).mockReturnValue({
      isGenerating: false,
      generatedId: null,
      hasError: true,
      generate,
      reset: vi.fn(),
    });

    renderWithProviders(<ReadersPage mode="library" />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/Could not generate a passage/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(generate).toHaveBeenCalledTimes(1);
  });
});
