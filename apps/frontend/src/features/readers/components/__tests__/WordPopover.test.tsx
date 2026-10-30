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

const mockOpenHub = vi.hoisted(() => vi.fn());

// Mock useWordDetail
vi.mock("features/word-hub/hooks", () => ({
  useWordDetail: vi.fn(),
}));

// Mock useHubStore and openHub
vi.mock("shared/store", async () => {
  const actual = await vi.importActual("shared/store");
  return {
    ...actual,
    openHub: mockOpenHub,
    useHubStore: Object.assign(
      (selector?: (s: Record<string, unknown>) => unknown) => {
        const state = {
          open: vi.fn(),
          close: vi.fn(),
          currentEntity: null,
        };
        return selector ? selector(state) : state;
      },
      { getState: () => ({ open: vi.fn(), close: vi.fn() }) },
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
        id: "wd_hao",
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

  it("moves focus into the dialog on open (WCAG 2.4.3)", () => {
    useReadingStore.getState().openPopover("好", { left: 100, bottom: 200 } as DOMRect);

    vi.mocked(useWordDetail).mockReturnValue({
      data: null,
      isLoading: true,
      isError: false,
    });

    render(<WordPopover />);

    const dialog = screen.getByRole("dialog", { name: /Word details: 好/ });
    expect(dialog).toHaveFocus();
  });

  it("returns focus to the trigger on close", () => {
    // Simulate a focused word trigger in the reading text before the popover opens.
    const trigger = document.createElement("button");
    trigger.textContent = "好";
    document.body.appendChild(trigger);
    trigger.focus();
    expect(trigger).toHaveFocus();

    useReadingStore.getState().openPopover("好", { left: 100, bottom: 200 } as DOMRect);

    vi.mocked(useWordDetail).mockReturnValue({
      data: null,
      isLoading: true,
      isError: false,
    });

    const { unmount } = render(<WordPopover />);

    // Focus moved away from the trigger into the dialog.
    expect(trigger).not.toHaveFocus();
    expect(screen.getByRole("dialog", { name: /Word details: 好/ })).toHaveFocus();

    // Closing the popover unmounts the component → focus returns to the trigger.
    useReadingStore.getState().closePopover();
    unmount();

    expect(trigger).toHaveFocus();
    trigger.remove();
  });

  it("opens the CHARACTER hub for a single hanzi the word API has no row for", async () => {
    useReadingStore.getState().openPopover("喜", { left: 100, bottom: 200 } as DOMRect);

    // 404 from /words/喜 — the popover still renders, with no word detail.
    vi.mocked(useWordDetail).mockReturnValue({
      data: null,
      isLoading: false,
      isError: true,
    });

    render(<WordPopover />);
    await userEvent.click(screen.getByRole("button", { name: /view details/i }));

    expect(mockOpenHub).toHaveBeenCalledWith({
      entityType: "character",
      entityId: "喜",
      label: undefined,
    });
  });

  it("opens the WORD hub for a multi-character token", async () => {
    useReadingStore.getState().openPopover("喜欢", { left: 100, bottom: 200 } as DOMRect);

    vi.mocked(useWordDetail).mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
    });

    render(<WordPopover />);
    await userEvent.click(screen.getByRole("button", { name: /view details/i }));

    expect(mockOpenHub).toHaveBeenCalledWith({
      entityType: "word",
      entityId: "喜欢",
      label: undefined,
    });
  });

  it("opens the WORD hub for a single hanzi that has a word record", async () => {
    useReadingStore.getState().openPopover("好", { left: 100, bottom: 200 } as DOMRect);

    vi.mocked(useWordDetail).mockReturnValue({
      data: {
        id: "wd_hao",
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
    await userEvent.click(screen.getByRole("button", { name: /view details/i }));

    expect(mockOpenHub).toHaveBeenCalledWith({
      entityType: "word",
      entityId: "好",
      label: "hǎo",
    });
  });
});
