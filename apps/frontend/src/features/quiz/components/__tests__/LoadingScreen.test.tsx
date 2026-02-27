/**
 * Tests for LoadingScreen component
 * Component Reorganization: Renamed from QuizLoading
 * Story 15.6: Quiz Container & State Management
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LoadingScreen } from "../states/LoadingScreen";

describe("LoadingScreen", () => {
  it("renders loading message", () => {
    render(<LoadingScreen />);
    expect(screen.getByText(/Loading quiz.../i)).toBeInTheDocument();
  });

  it("applies correct CSS classes", () => {
    const { container } = render(<LoadingScreen />);
    const loadingDiv = container.querySelector(".quizLoading");
    expect(loadingDiv).toBeInTheDocument();
  });

  it("displays loading text with correct styling class", () => {
    const { container } = render(<LoadingScreen />);
    const loadingText = container.querySelector(".loadingText");
    expect(loadingText).toBeInTheDocument();
    expect(loadingText).toHaveTextContent("Loading quiz...");
  });
});
