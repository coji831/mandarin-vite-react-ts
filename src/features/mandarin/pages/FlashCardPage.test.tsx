import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import { ProgressStateContext } from "../context";
import { UserState as AppUserState } from "../reducers";
import { ExposedProgressState, ProgressState as ListsProgressState } from "../types";
import { FlashCardPage } from "./FlashCardPage";

// Mock the useProgressActions hook to provide setSelectedList and setSelectedWords
jest.mock("../hooks/useProgressActions", () => ({
  useProgressActions: () => ({
    setSelectedList: () => {},
    setSelectedWords: () => {},
  }),
}));

describe("FlashCardPage", () => {
  it("shows not found state when words are not loaded", () => {
    const mockState: ExposedProgressState = {
      lists: {} as unknown as ListsProgressState,
      user: {} as unknown as AppUserState,
      ui: {
        selectedList: null,
        selectedWords: [],
        masteredProgress: {},
        isLoading: false,
        error: "",
      },
      selectedList: null,
      selectedWords: [],
      masteredProgress: {},
      loading: false,
      error: "",
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
