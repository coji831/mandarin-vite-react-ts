import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { FlashCardPage } from "./FlashCardPage";
import { ProgressStateContext } from "../context/ProgressContext";

// Mock the useProgressActions hook to provide setSelectedList and setSelectedWords
jest.mock("../hooks/useProgressActions", () => ({
  useProgressActions: () => ({
    setSelectedList: (_: string) => {},
    setSelectedWords: (_: any[]) => {},
  }),
}));

describe("FlashCardPage", () => {
  it("shows not found state when words are not loaded", () => {
    const mockState = { selectedWords: [], loading: false } as any;
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
