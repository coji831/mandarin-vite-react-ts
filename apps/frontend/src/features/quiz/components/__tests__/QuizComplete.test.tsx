/**
 * Tests for QuizComplete component
 * Story 15.6: Quiz Container & State Management
 * Story 15.8: Updated tests for stats grid and XP display
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
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
    // New structure splits text across elements, so use more flexible query
    expect(screen.getByText("Correct Answers")).toBeInTheDocument();
    expect(screen.getByText("2 / 3")).toBeInTheDocument();
  });

  it("calculates and displays accuracy percentage", () => {
    render(<QuizComplete answers={mockAnswers} />);
    expect(screen.getByText("Accuracy")).toBeInTheDocument();
    expect(screen.getByText("67%")).toBeInTheDocument();
  });

  it("displays XP earned", () => {
    render(<QuizComplete answers={mockAnswers} />);
    expect(screen.getByText("XP Earned")).toBeInTheDocument();
    expect(screen.getByText("+20")).toBeInTheDocument(); // 2 correct * 10 XP
  });

  it("renders review again button", () => {
    render(<QuizComplete answers={mockAnswers} />);
    const reviewButton = screen.getByRole("button", { name: /Review Again/i });
    expect(reviewButton).toBeInTheDocument();
  });

  it("calls onReviewAgain callback when button clicked", () => {
    const mockCallback = vi.fn();
    render(<QuizComplete answers={mockAnswers} onReviewAgain={mockCallback} />);

    const reviewButton = screen.getByRole("button", { name: /Review Again/i });
    fireEvent.click(reviewButton);

    expect(mockCallback).toHaveBeenCalledTimes(1);
  });

  it("handles empty answers array", () => {
    render(<QuizComplete answers={[]} />);
    expect(screen.getByText("0 / 0")).toBeInTheDocument();
    expect(screen.getByText("0%")).toBeInTheDocument();
    expect(screen.getByText("+0")).toBeInTheDocument(); // 0 XP
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
    expect(screen.getByText("2 / 2")).toBeInTheDocument();
    expect(screen.getByText("100%")).toBeInTheDocument();
    expect(screen.getByText("+20")).toBeInTheDocument(); // 2 correct * 10 XP
  });

  it("handles all incorrect answers", () => {
    const allIncorrect: QuizAnswer[] = [
      {
        wordId: "1",
        questionType: "multiple_choice",
        userAnswer: "wrong",
        correct: false,
        timestamp: new Date(),
      },
      {
        wordId: "2",
        questionType: "type_pinyin",
        userAnswer: "wrong",
        correct: false,
        timestamp: new Date(),
      },
    ];
    render(<QuizComplete answers={allIncorrect} />);
    expect(screen.getByText("0 / 2")).toBeInTheDocument();
    expect(screen.getByText("0%")).toBeInTheDocument();
    expect(screen.getByText("+0")).toBeInTheDocument(); // 0 XP
  });

  it("calculates XP correctly (10 XP per correct answer)", () => {
    const fiveCorrect: QuizAnswer[] = Array(5)
      .fill(null)
      .map((_, i) => ({
        wordId: String(i),
        questionType: "multiple_choice" as const,
        userAnswer: "correct",
        correct: true,
        timestamp: new Date(),
      }));

    render(<QuizComplete answers={fiveCorrect} />);
    expect(screen.getByText("+50")).toBeInTheDocument(); // 5 correct * 10 XP
  });
});
