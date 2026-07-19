/**
 * Tests for ReviewPromptCard component
 *
 * Verifies guest-facing upsell card rendering:
 * - Lock icon heading
 * - Description text
 * - Sign-up CTA button
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { ReviewPromptCard } from "../ReviewPromptCard";

const renderWithRouter = () =>
  render(
    <BrowserRouter>
      <ReviewPromptCard />
    </BrowserRouter>,
  );

describe("ReviewPromptCard", () => {
  it("renders lock icon heading", () => {
    renderWithRouter();
    expect(screen.getByText(/Spaced Repetition Review/i)).toBeInTheDocument();
  });

  it("renders description text", () => {
    renderWithRouter();
    expect(
      screen.getByText(/Master characters long-term with smart flashcards/i),
    ).toBeInTheDocument();
  });

  it("renders sign-up CTA button", () => {
    renderWithRouter();
    expect(screen.getByText(/Create an account to unlock/i)).toBeInTheDocument();
  });
});
