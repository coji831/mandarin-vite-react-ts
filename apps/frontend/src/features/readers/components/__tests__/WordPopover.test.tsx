/**
 * @file components/WordPopover/__tests__/WordPopover.test.tsx
 * @description Tests for WordPopover component
 * Story 21.4: Reading UI + LexicalHub Phase 1
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useReadingStore } from "../../stores";
import { WordPopover } from "../WordPopover";

// Mock useWordDetail
vi.mock("features/word-hub/hooks", () => ({
  useWordDetail: vi.fn(),
}));

// Mock useHubStore and openHub
vi.mock("shared/store", async () => {
  const actual = await vi.importActual("shared/store");
  return {
    ...actual,
    useHubStore: Object.assign(
      (selector?: (s: Record<string, unknown>) => unknown) => {
        const state = {
          open: vi.fn(),
          close: vi.fn(),
          back: vi.fn(),
          currentEntity: null,
          navigationStack: [],
        };
        return selector ? selector(state) : state;
      },
      { getState: () => ({ open: vi.fn(), close: vi.fn(), back: vi.fn() }) },
    ),
  };
});

import { useWordDetail } from "features/word-hub/hooks";

describe("WordPopover", () => {
  beforeEach(() => {
    useReadingStore.setState(useReadingStore.getInitialState());
    vi.clearAllMocks();
  });

  it("renders glyph from store", () => {
    useReadingStore.getState().openPopover("好", { left: 100, bottom: 200 } as DOMRect);

    vi.mocked(useWordDetail).mockReturnValue({
      data: null,
      isLoading: true,
      isError: false,
    });

    render(<WordPopover />);

    expect(screen.getByText("好")).toBeInTheDocument();
  });

  it("shows loading skeleton while fetching", () => {
    useReadingStore.getState().openPopover("好", { left: 100, bottom: 200 } as DOMRect);

    vi.mocked(useWordDetail).mockReturnValue({
      data: null,
      isLoading: true,
      isError: false,
    });

    render(<WordPopover />);

    expect(screen.getByText("好")).toBeInTheDocument();
  });

  it("shows pinyin and meaning after loading", () => {
    useReadingStore.getState().openPopover("好", { left: 100, bottom: 200 } as DOMRect);

    vi.mocked(useWordDetail).mockReturnValue({
      data: {
        glyph: "好",
        pinyin: "hǎo",
        definitions: ["good", "fine"],
        hskLevel: 1,
        constituentCharacters: [],
      },
      isLoading: false,
      isError: false,
    });

    render(<WordPopover />);

    expect(screen.getByText("hǎo")).toBeInTheDocument();
    expect(screen.getByText("good; fine")).toBeInTheDocument();
  });

  it("closes popover on backdrop click", async () => {
    useReadingStore.getState().openPopover("好", { left: 100, bottom: 200 } as DOMRect);

    vi.mocked(useWordDetail).mockReturnValue({
      data: null,
      isLoading: true,
      isError: false,
    });

    render(<WordPopover />);

    const backdrop = document.querySelector(".word-popover__backdrop");
    expect(backdrop).toBeTruthy();

    if (backdrop) {
      await userEvent.click(backdrop);
      expect(useReadingStore.getState().popover.glyph).toBeNull();
    }
  });
});
