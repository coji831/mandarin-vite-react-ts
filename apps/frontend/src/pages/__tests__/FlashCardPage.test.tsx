import { describe, it, expect, vi } from "vitest";
// Mock VocabularyDataService and fetchWordsForList
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import { FlashCardPage } from "../FlashCardPage";

// Mock the VocabularyDataService to control its behavior in tests
vi.mock("../../features/vocabulary/services/vocabularyDataService", () => {
  return {
    VocabularyDataService: vi.fn().mockImplementation(() => ({
      fetchWordsForList: vi.fn(() =>
        Promise.resolve([
          { wordId: "1", chinese: "你", pinyin: "nǐ", english: "you" },
          { wordId: "2", chinese: "好", pinyin: "hǎo", english: "good" },
        ]),
      ), // Default: returns valid array
    })),
  };
});

// Mock the useProgressActions hook to provide setSelectedList and setSelectedWords
vi.mock("../../features/quiz/hooks/useProgressActions", () => ({
  useProgressActions: () => ({
    setSelectedList: () => {},
    setSelectedWords: () => {},
  }),
}));

// Mock useProgressState to return empty progress data
vi.mock("../../features/quiz/hooks/useProgressState", () => ({
  useProgressState: (selector: any) =>
    selector({
      progress: { wordsById: {}, wordIds: [] },
      user: { userId: null, preferences: {} },
      ui: { selectedList: null, selectedWords: [], isLoading: false, error: "" },
    }),
}));

describe("FlashCardPage", () => {
  it("shows not found state when words are not loaded", () => {
    render(
      <MemoryRouter initialEntries={["/learn/flashcards/list-1"]}>
        <Routes>
          <Route path="/learn/flashcards/:listId" element={<FlashCardPage />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText(/List Not Found or Empty/i)).not.toBeNull();
  });

  // Add more tests for valid list, invalid list, and deck rendering as needed
});
