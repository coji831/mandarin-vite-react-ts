import { vi } from "vitest";

import { fireEvent, render, screen } from "@testing-library/react";

import { ProgressStateContext } from "../../context";
import { RootState } from "../../reducers";
import { Card } from "../../types";
import { Sidebar } from "../Sidebar";

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
  const masteredWordIds = new Set(["1", "3"]);
  const mockListId = "test-list";
  it("shows full list and highlights mastered words", () => {
    // Provide progress data with mastered words (wordId "1" and "3")
    const mockState: RootState = {
      progress: {
        wordsById: {
          "1": { wordId: "1", confidence: 1, lastReviewed: new Date().toISOString() },
          "3": { wordId: "3", confidence: 1, lastReviewed: new Date().toISOString() },
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
      vocabLists: { itemsById: {}, itemIds: [] },
    };
    render(
      <ProgressStateContext.Provider value={mockState}>
        <Sidebar
          currentCardIndex={0}
          search=""
          setSearch={() => {}}
          filteredWords={words}
          handleSidebarClick={() => {}}
          onBackToList={() => {}}
        />
      </ProgressStateContext.Provider>,
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
    const mockState2: RootState = {
      progress: { wordsById: {}, wordIds: [] },
      user: { userId: null, preferences: {} },
      ui: {
        selectedList: mockListId,
        selectedWords: [],
        isLoading: false,
        error: "",
      },
      vocabLists: { itemsById: {}, itemIds: [] },
    };
    render(
      <ProgressStateContext.Provider value={mockState2}>
        <Sidebar
          currentCardIndex={0}
          search=""
          setSearch={() => {}}
          filteredWords={words}
          handleSidebarClick={handleSidebarClick}
          onBackToList={() => {}}
        />
      </ProgressStateContext.Provider>,
    );
    fireEvent.click(screen.getByText("好"));
    expect(handleSidebarClick).toHaveBeenCalled();
  });
});
