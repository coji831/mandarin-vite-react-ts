/**
 * @file pages/practices/__tests__/QuizSessionPage.test.tsx
 * @description Tests for QuizSessionPage — session title is a real h1 (WCAG).
 * VisFix W4: the "📝 Quiz — <strategy>" title was a generic span; it is now an
 * <h1> so the page exposes a single top-level heading.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QuizSessionPage } from "../QuizSessionPage";
import { useQuizSessionStore } from "features/quiz";

// Stub the engine + render children so the test only exercises the header.
vi.mock("features/quiz", async (importOriginal) => {
  const actual = await importOriginal<typeof import("features/quiz")>();
  return {
    ...actual,
    useQuizEngine: vi.fn(),
    getStrategy: vi.fn(() => ({
      id: "ime-simulator",
      label: "IME Simulator",
      phase: 2,
    })),
    QuizRouter: () => <div>quiz-content</div>,
    Timer: () => <div>timer</div>,
    QuizProgressBar: () => <div>progress</div>,
  };
});

describe("QuizSessionPage", () => {
  beforeEach(() => {
    // Park the session in a non-loading phase so the header (with the h1) renders.
    useQuizSessionStore.setState({
      phase: "INPUT",
      questions: [],
      currentIndex: 0,
      score: 0,
      strategyConfig: null,
    });
  });

  it("renders the session title as an h1", () => {
    render(<QuizSessionPage strategyType="ime-simulator" />);

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent("IME Simulator");
  });
});
