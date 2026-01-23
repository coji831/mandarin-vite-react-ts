// Mock VocabularyDataService and fetchWordsForList
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import { ProgressStateContext } from "../context";
import { RootState } from "../reducers/rootReducer";
import { FlashCardPage } from "./FlashCardPage";

// Mock the VocabularyDataService to control its behavior in tests
jest.mock("../services/vocabularyDataService", () => {
  return {
    VocabularyDataService: jest.fn().mockImplementation(() => ({
      fetchWordsForList: jest.fn(() =>
        Promise.resolve([
          { wordId: "1", chinese: "你", pinyin: "nǐ", english: "you" },
          { wordId: "2", chinese: "好", pinyin: "hǎo", english: "good" },
        ])
      ), // Default: returns valid array
    })),
  };
});

// Mock the useProgressActions hook to provide setSelectedList and setSelectedWords
jest.mock("../hooks/useProgressActions", () => ({
  useProgressActions: () => ({
    setSelectedList: () => {},
    setSelectedWords: () => {},
  }),
}));

describe("FlashCardPage", () => {
  it("shows not found state when words are not loaded", () => {
    const mockState: RootState = {
      progress: { wordsById: {}, wordIds: [] },
      user: { userId: null, preferences: {} },
      ui: {
        selectedList: null,
        selectedWords: [],
        isLoading: false,
        error: "",
      },
      vocabLists: { itemsById: {}, itemIds: [] },
    };
    render(
      <ProgressStateContext.Provider value={mockState}>
        <MemoryRouter initialEntries={["/mandarin/flashcards/list-1"]}>
          <Routes>
            <Route path="/mandarin/flashcards/:listId" element={<FlashCardPage />} />
          </Routes>
        </MemoryRouter>
      </ProgressStateContext.Provider>
    );
    expect(screen.getByText(/List Not Found or Empty/i)).not.toBeNull();
  });

  // Add more tests for valid list, invalid list, and deck rendering as needed
});
