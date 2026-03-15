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
});
