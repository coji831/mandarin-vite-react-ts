import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ProgressProvider } from "../context/ProgressContext";
import { FlashCardPage } from "./FlashCardPage";

describe("FlashCardPage", () => {
  it("shows not found state when words are not loaded", () => {
    render(
      <ProgressProvider>
        <MemoryRouter initialEntries={["/mandarin/flashcards/list-1"]}>
          <Routes>
            <Route path="/mandarin/flashcards/:listId" element={<FlashCardPage />} />
          </Routes>
        </MemoryRouter>
      </ProgressProvider>
    );
    expect(screen.getByText(/List Not Found or Empty/i)).not.toBeNull();
  });

  // Add more tests for valid list, invalid list, and deck rendering as needed
});
