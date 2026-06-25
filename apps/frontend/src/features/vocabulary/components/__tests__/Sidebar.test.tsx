import { vi } from "vitest";

import { fireEvent, render, screen } from "@testing-library/react";

import { Card } from "features/vocabulary/types";
import { Sidebar } from "../Sidebar";

// Mock useProgressState to return controllable data
const mockUseProgressState = vi.fn();
vi.mock("../../hooks", () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useProgressState: (selector: any) => selector(mockUseProgressState()),
}));

describe("Sidebar", () => {
  const words: Card[] = [
    {
      wordId: "1",
      character: "你",
      pinyin: "nǐ",
      meaning: "you",
      mastered: true,
    },
    {
      wordId: "2",
      character: "好",
      pinyin: "hǎo",
      meaning: "good",
      mastered: false,
    },
    {
      wordId: "3",
      character: "吗",
      pinyin: "ma",
      meaning: "question particle",
      mastered: true,
    },
  ];
  const mockListId = "test-list";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows full list and highlights mastered words", () => {
    // Provide progress data with mastered words (wordId "1" and "3")
    mockUseProgressState.mockReturnValue({
      progress: {
        wordsById: {
          "1": { wordId: "1", confidence: 1 },
          "3": { wordId: "3", confidence: 1 },
        },
        wordIds: ["1", "3"],
      },
      user: { userId: null, preferences: {} },
      ui: {
        selectedList: mockListId,
        selectedWords: [],
        isLoading: false,
        error: "",
      },
    });

    render(
      <Sidebar
        currentCardIndex={0}
        search=""
        setSearch={() => {}}
        filteredWords={words}
        handleSidebarClick={() => {}}
        onBackToList={() => {}}
      />,
    );
    expect(screen.getByText("你")).toBeInTheDocument();
    expect(screen.getByText("好")).toBeInTheDocument();
    expect(screen.getByText("吗")).toBeInTheDocument();

    // Check for mastered checkmarks (2 words mastered: "你" and "吗")
    const masteredCheckmarks = screen.getAllByTitle("Mastered");
    expect(masteredCheckmarks).toHaveLength(2);
  });

  it("focuses flashcard deck on sidebar item click", () => {
    const handleSidebarClick = vi.fn();
    mockUseProgressState.mockReturnValue({
      progress: { wordsById: {}, wordIds: [] },
      user: { userId: null, preferences: {} },
      ui: {
        selectedList: mockListId,
        selectedWords: [],
        isLoading: false,
        error: "",
      },
    });

    render(
      <Sidebar
        currentCardIndex={0}
        search=""
        setSearch={() => {}}
        filteredWords={words}
        handleSidebarClick={handleSidebarClick}
        onBackToList={() => {}}
      />,
    );
    fireEvent.click(screen.getByText("好"));
    expect(handleSidebarClick).toHaveBeenCalled();
  });
});
