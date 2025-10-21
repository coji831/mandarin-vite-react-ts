import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";

import { ProgressStateContext } from "../context";
import type { UserState as AppUserState } from "../reducers";
import { Card, ExposedProgressState, ProgressState as ListsProgressState } from "../types";
import { Sidebar } from "./Sidebar";

describe("Sidebar", () => {
  const words: Card[] = [
    {
      wordId: "1",
      character: "你",
      pinyin: "nǐ",
      meaning: "you",
      sentence: "你好吗？",
      sentencePinyin: "nǐ hǎo ma?",
      sentenceMeaning: "How are you?",
      mastered: true,
    },
    {
      wordId: "2",
      character: "好",
      pinyin: "hǎo",
      meaning: "good",
      sentence: "很好。",
      sentencePinyin: "hěn hǎo.",
      sentenceMeaning: "Very good.",
      mastered: false,
    },
    {
      wordId: "3",
      character: "吗",
      pinyin: "ma",
      meaning: "question particle",
      sentence: "你好吗？",
      sentencePinyin: "nǐ hǎo ma?",
      sentenceMeaning: "How are you?",
      mastered: true,
    },
  ];
  const masteredWordIds = new Set(["1", "3"]);
  const mockListId = "test-list";
  it("shows full list and highlights mastered words", () => {
    // Provide a minimal state shape expected by selectors used in Sidebar
    const mockState: ExposedProgressState = {
      lists: {} as ListsProgressState,
      user: {} as AppUserState,
      ui: {
        selectedList: mockListId,
        selectedWords: [],
        masteredProgress: { [mockListId]: masteredWordIds },
        isLoading: false,
        error: "",
      },
      // legacy aliases
      selectedList: mockListId,
      selectedWords: [],
      masteredProgress: { [mockListId]: masteredWordIds },
      loading: false,
      error: "",
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
    const mockState2: ExposedProgressState = {
      lists: {} as ListsProgressState,
      user: {} as AppUserState,
      ui: {
        selectedList: mockListId,
        selectedWords: [],
        masteredProgress: { [mockListId]: masteredWordIds },
        isLoading: false,
        error: "",
      },
      // legacy aliases
      selectedList: mockListId,
      selectedWords: [],
      masteredProgress: { [mockListId]: masteredWordIds },
      loading: false,
      error: "",
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
