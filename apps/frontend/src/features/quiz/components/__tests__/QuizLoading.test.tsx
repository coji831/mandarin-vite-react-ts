/**
 * Tests for QuizLoading component
 * Story 15.6: Quiz Container & State Management
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { QuizLoading } from "../QuizLoading";

describe("QuizLoading", () => {
  it("renders loading message", () => {
    render(<QuizLoading />);
    expect(screen.getByText(/Loading quiz.../i)).toBeInTheDocument();
  });

  it("applies correct CSS classes", () => {
    const { container } = render(<QuizLoading />);
    const loadingDiv = container.querySelector(".quizLoading");
    expect(loadingDiv).toBeInTheDocument();
  });

  it("displays loading text with correct styling class", () => {
    const { container } = render(<QuizLoading />);
    const loadingText = container.querySelector(".loadingText");
    expect(loadingText).toBeInTheDocument();
    expect(loadingText).toHaveTextContent("Loading quiz...");
  });
});
