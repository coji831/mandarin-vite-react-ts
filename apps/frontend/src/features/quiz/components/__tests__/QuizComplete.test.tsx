/**
 * Tests for QuizComplete component
 * Story 15.6: Quiz Container & State Management
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QuizComplete } from "../QuizComplete";
import { QuizAnswer } from "../../types/QuizTypes";

describe("QuizComplete", () => {
  const mockAnswers: QuizAnswer[] = [
    {
      wordId: "1",
      questionType: "multiple_choice",
      userAnswer: "hello",
      correct: true,
      timestamp: new Date(),
    },
    {
      wordId: "2",
      questionType: "type_pinyin",
      userAnswer: "xièxie",
      correct: false,
      timestamp: new Date(),
    },
    {
      wordId: "3",
      questionType: "type_character",
      userAnswer: "再见",
      correct: true,
      timestamp: new Date(),
    },
  ];

  it("renders completion message", () => {
    render(<QuizComplete answers={mockAnswers} />);
    expect(screen.getByText(/Quiz Complete!/i)).toBeInTheDocument();
  });

  it("displays correct count and total", () => {
    render(<QuizComplete answers={mockAnswers} />);
    expect(screen.getByText(/Correct: 2 \/ 3/i)).toBeInTheDocument();
  });

  it("calculates and displays accuracy percentage", () => {
    render(<QuizComplete answers={mockAnswers} />);
    expect(screen.getByText(/Accuracy: 67%/i)).toBeInTheDocument();
  });

  it("renders retry button", () => {
    render(<QuizComplete answers={mockAnswers} />);
    const retryButton = screen.getByRole("button", { name: /Retry Quiz/i });
    expect(retryButton).toBeInTheDocument();
  });

  it("handles empty answers array", () => {
    render(<QuizComplete answers={[]} />);
    expect(screen.getByText(/Correct: 0 \/ 0/i)).toBeInTheDocument();
    expect(screen.getByText(/Accuracy: 0%/i)).toBeInTheDocument();
  });

  it("handles all correct answers", () => {
    const allCorrect: QuizAnswer[] = [
      {
        wordId: "1",
        questionType: "multiple_choice",
        userAnswer: "hello",
        correct: true,
        timestamp: new Date(),
      },
      {
        wordId: "2",
        questionType: "type_pinyin",
        userAnswer: "xièxie",
        correct: true,
        timestamp: new Date(),
      },
    ];
    render(<QuizComplete answers={allCorrect} />);
    expect(screen.getByText(/Correct: 2 \/ 2/i)).toBeInTheDocument();
    expect(screen.getByText(/Accuracy: 100%/i)).toBeInTheDocument();
  });
});
