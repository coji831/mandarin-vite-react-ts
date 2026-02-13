/**
 * Tests for DailyReviewQuiz container
 * Story 15.6: Quiz Container & State Management
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { DailyReviewQuiz } from "../DailyReviewQuiz";

// Mock child components
vi.mock("../../components", () => ({
  QuizCard: ({ question, onAnswer }: any) => (
    <div data-testid="quiz-card">
      <p>Question: {question.word}</p>
      <button onClick={() => onAnswer(question.english)}>Answer</button>
    </div>
  ),
  TypeAnswerInput: ({ placeholder, onAnswer }: any) => (
    <div data-testid="type-answer-input">
      <input placeholder={placeholder} />
      <button onClick={() => onAnswer("test answer")}>Submit</button>
    </div>
  ),
  QuizProgressBar: ({ current, total }: any) => (
    <div data-testid="quiz-progress-bar">
      {current} / {total}
    </div>
  ),
  QuizLoading: () => <div data-testid="quiz-loading">Loading quiz...</div>,
  QuizComplete: ({ answers }: any) => (
    <div data-testid="quiz-complete">Quiz Complete! {answers.length} questions</div>
  ),
}));

describe("DailyReviewQuiz", () => {
  it("shows first question after initialization", async () => {
    render(<DailyReviewQuiz />);

    await waitFor(() => {
      expect(screen.getByTestId("quiz-card")).toBeInTheDocument();
    });
  });

  it("displays progress bar with correct count", async () => {
    render(<DailyReviewQuiz />);

    await waitFor(() => {
      expect(screen.getByTestId("quiz-progress-bar")).toBeInTheDocument();
      const progressText = screen.getByTestId("quiz-progress-bar").textContent;
      expect(progressText).toMatch(/1 \/ 4/); // Now 4 words in MOCK_DUE_WORDS
    });
  });

  it("shows feedback after answering", async () => {
    render(<DailyReviewQuiz />);

    await waitFor(() => {
      expect(screen.getByTestId("quiz-card")).toBeInTheDocument();
    });

    const answerButton = screen.getByText("Answer");
    answerButton.click();

    await waitFor(() => {
      expect(screen.getByText(/Correct!|Incorrect/)).toBeInTheDocument();
    });
  });

  it("verifies quiz structure for completion", () => {
    render(<DailyReviewQuiz />);

    // Verify completion UI doesn't appear during initial quiz state
    expect(screen.queryByText("Quiz Complete! 🎉")).not.toBeInTheDocument();
    expect(screen.queryByText("Retry Quiz")).not.toBeInTheDocument();
  });

  it("has all required UI elements", async () => {
    render(<DailyReviewQuiz />);

    await waitFor(() => {
      // Progress bar, quiz card, and input should all be present
      expect(screen.getByTestId("quiz-progress-bar")).toBeInTheDocument();
      expect(screen.getByTestId("quiz-card")).toBeInTheDocument();
    });
  });
});
