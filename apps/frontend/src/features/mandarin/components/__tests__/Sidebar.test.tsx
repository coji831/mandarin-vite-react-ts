import "@testing-library/jest-dom";
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
    // Provide a minimal state shape expected by selectors used in Sidebar
    const mockState: RootState = {
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
      <ProgressStateContext.Provider value={mockState}>
        <Sidebar
          currentCardIndex={0}
          search=""
          setSearch={() => {}}
          filteredWords={words}
          handleSidebarClick={() => {}}
          onBackToList={() => {}}
        />
      </ProgressStateContext.Provider>
    );
    expect(screen.getByText("你")).toBeInTheDocument();
    expect(screen.getByText("好")).toBeInTheDocument();
    expect(screen.getByText("吗")).toBeInTheDocument();
    expect(screen.getAllByTitle("Mastered").length).toBe(2);
  });

  it("focuses flashcard deck on sidebar item click", () => {
    const handleSidebarClick = jest.fn();
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
      </ProgressStateContext.Provider>
    );
    fireEvent.click(screen.getByText("好"));
    expect(handleSidebarClick).toHaveBeenCalled();
  });
});
