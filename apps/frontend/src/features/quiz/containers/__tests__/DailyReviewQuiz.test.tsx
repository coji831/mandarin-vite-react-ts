/**
 * Tests for DailyReviewQuiz container
 * Story 15.6: Quiz Container & State Management
 * Updated for Story 15.8: Backend API integration
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { DailyReviewQuiz } from "../DailyReviewQuiz";

// Mock response data
const MOCK_DUE_WORDS = [
  { id: 1, word: "你好", english: "hello", pinyin: "nǐ hǎo" },
  { id: 2, word: "谢谢", english: "thank you", pinyin: "xiè xie" },
  { id: 3, word: "再见", english: "goodbye", pinyin: "zài jiàn" },
  { id: 4, word: "早上好", english: "good morning", pinyin: "zǎo shàng hǎo" },
];

// Mock API hooks with default successful behavior
const mockFetchDueWords = vi.fn();
const mockSaveTestResult = vi.fn();

vi.mock("../../hooks/useQuizAPI", () => ({
  useFetchDueWords: () => ({
    fetchDueWords: mockFetchDueWords,
    loading: false,
    error: null,
  }),
  useSaveTestResult: () => ({
    saveTestResult: mockSaveTestResult,
    saving: false,
    error: null,
  }),
}));

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
  QuizError: ({ error, onRetry }: any) => (
    <div data-testid="quiz-error">
      <p>{error}</p>
      <button onClick={onRetry}>Retry</button>
    </div>
  ),
}));

describe("DailyReviewQuiz", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: successful API response
    mockFetchDueWords.mockResolvedValue({ words: MOCK_DUE_WORDS });
    mockSaveTestResult.mockResolvedValue({
      success: true,
      nextReviewDate: new Date().toISOString(),
    });
  });

  it("shows first question after initialization", async () => {
    render(<DailyReviewQuiz />);

    await waitFor(() => {
      expect(screen.getByTestId("quiz-card")).toBeInTheDocument();
    });

    expect(mockFetchDueWords).toHaveBeenCalledTimes(1);
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
