/**
 * @file components/__tests__/MeasureWordSection.test.tsx
 * @description Tests for MeasureWordSection component
 * Story 21.8: Measure Word Foundation — frontend display
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MeasureWordSection } from "../MeasureWordSection";
import type { MeasureWord } from "../../services";

// Mock the hook — component only wires hook state to UI.
vi.mock("../../hooks", () => ({
  useMeasureWords: vi.fn(),
}));

import { useMeasureWords } from "../../hooks";

const DEFAULT_RESULT = {
  data: null,
  isLoading: false,
  isError: false,
  refetch: vi.fn(),
};

const MEASURE_WORDS: MeasureWord[] = [
  {
    id: "mw_001",
    simplified: "个",
    pinyin: "gè",
    meaning: "generic individual unit",
    category: "general",
    usageNote: "The most common and versatile measure word.",
    isDefault: true,
    exampleSentence: "一个朋友",
  },
  {
    id: "mw_044",
    simplified: "位",
    pinyin: "wèi",
    meaning: "polite person counter",
    category: "formal",
    usageNote: "Polite measure word for people.",
    isDefault: false,
    exampleSentence: "一位朋友",
  },
];

describe("MeasureWordSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useMeasureWords).mockReturnValue(DEFAULT_RESULT);
  });

  it("renders nothing when no wordId and no static data", () => {
    render(<MeasureWordSection />);

    expect(screen.queryByText("Measure words")).not.toBeInTheDocument();
    expect(useMeasureWords).toHaveBeenCalledWith(null);
  });

  it("renders loading skeleton when loading", () => {
    vi.mocked(useMeasureWords).mockReturnValue({
      ...DEFAULT_RESULT,
      isLoading: true,
    });

    render(<MeasureWordSection wordId="w_00001" />);

    expect(screen.getByLabelText("Loading measure words")).toBeInTheDocument();
  });

  it("renders error state with a working retry action", () => {
    const refetch = vi.fn();
    vi.mocked(useMeasureWords).mockReturnValue({
      ...DEFAULT_RESULT,
      isError: true,
      refetch,
    });

    render(<MeasureWordSection wordId="w_00001" />);

    expect(screen.getByText("Failed to load measure words.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /retry/i }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("renders nothing when the word has no measure words", () => {
    vi.mocked(useMeasureWords).mockReturnValue({
      ...DEFAULT_RESULT,
      data: { wordId: "w_00001", simplified: "因为", measureWords: [] },
    });

    const { container } = render(<MeasureWordSection wordId="w_00001" />);

    expect(container.firstChild).toBeNull();
  });

  it("renders chips + default detail from static data (Storybook mode, no fetch)", () => {
    render(<MeasureWordSection wordId="w_00001" measureWords={MEASURE_WORDS} />);

    expect(screen.getByText("Measure words")).toBeInTheDocument();
    expect(screen.getByLabelText("Measure word: 个")).toBeInTheDocument();
    expect(screen.getByLabelText("Measure word: 位")).toBeInTheDocument();

    // Default measure word detail is shown
    expect(screen.getByText("generic individual unit")).toBeInTheDocument();
    expect(screen.getByText("一个朋友")).toBeInTheDocument();
    expect(screen.getByText("The most common and versatile measure word.")).toBeInTheDocument();
    expect(screen.getByText("Example:")).toBeInTheDocument();

    // Static data bypasses the API fetch
    expect(useMeasureWords).toHaveBeenCalledWith(null);
  });

  it("switches the detail panel when a different chip is selected", () => {
    render(<MeasureWordSection wordId="w_00001" measureWords={MEASURE_WORDS} />);

    fireEvent.click(screen.getByLabelText("Measure word: 位"));

    expect(screen.getByText("polite person counter")).toBeInTheDocument();
    expect(screen.getByText("Polite measure word for people.")).toBeInTheDocument();
    expect(screen.getByText("一位朋友")).toBeInTheDocument();
  });
});
