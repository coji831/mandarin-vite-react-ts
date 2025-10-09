import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Sidebar } from "./Sidebar";
import { ProgressContextType } from "../types";
import { ProgressContext } from "../context/ProgressContext";
import { Card } from "../types/Card";

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
    // Mock context with mastered words for test list
    const mockContext: ProgressContextType = {
      selectedList: mockListId,
      setSelectedList: () => {},
      selectedWords: [],
      setSelectedWords: () => {},
      masteredProgress: { [mockListId]: masteredWordIds },
      setMasteredProgress: () => {},
      error: "",
      setError: () => {},
      loading: false,
      setLoading: () => {},
      markWordLearned: () => {},
      calculateListProgress: () => ({ mastered: 2, percent: 66 }),
    };
    render(
      <ProgressContext.Provider value={mockContext}>
        <Sidebar
          currentCardIndex={0}
          search=""
          setSearch={() => {}}
          filteredWords={words}
          handleSidebarClick={() => {}}
          onBackToList={() => {}}
        />
      </ProgressContext.Provider>
    );
    expect(screen.getByText("你")).toBeInTheDocument();
    expect(screen.getByText("好")).toBeInTheDocument();
    expect(screen.getByText("吗")).toBeInTheDocument();
    expect(screen.getAllByTitle("Mastered").length).toBe(2);
  });

  it("focuses flashcard deck on sidebar item click", () => {
    const handleSidebarClick = jest.fn();
    render(
      <ProgressContext.Provider
        value={{
          selectedList: mockListId,
          setSelectedList: () => {},
          selectedWords: [],
          setSelectedWords: () => {},
          masteredProgress: { [mockListId]: masteredWordIds },
          setMasteredProgress: () => {},
          error: "",
          setError: () => {},
          loading: false,
          setLoading: () => {},
          markWordLearned: () => {},
          calculateListProgress: () => ({ mastered: 2, percent: 66 }),
        }}
      >
        <Sidebar
          currentCardIndex={0}
          search=""
          setSearch={() => {}}
          filteredWords={words}
          handleSidebarClick={handleSidebarClick}
          onBackToList={() => {}}
        />
      </ProgressContext.Provider>
    );
    fireEvent.click(screen.getByText("好"));
    expect(handleSidebarClick).toHaveBeenCalled();
  });
});
