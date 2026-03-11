/**
 * Tests for ResultsLayout component
 * Component Reorganization: Renamed from QuizComplete
 * Story 15.6: Quiz Container & State Management
 * Story 15.8: Updated tests for stats grid and XP display
 * Story 15.9: Added tests for gamification rewards (mystery box, badges, freeze)
 * Epic 19: State Refactor - Updated to use context mocking (zero props)
 * Story 15.11 Flow 2.6: Added BadgeCelebrationModal mocking
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ReactNode } from "react";
import { ResultsLayout } from "../layouts/ResultsLayout";
import { QuizAnswer, Badge } from "../../types";
import type { MysteryBox } from "../../../gamification/types/GamificationTypes";

// Mock context
const mockUseQuizState = vi.fn();
const mockUseQuizActions = vi.fn();

vi.mock("../../contexts", () => ({
  useQuizState: () => mockUseQuizState(),
  useQuizActions: () => mockUseQuizActions(),
}));

// Mock BadgeCelebrationModal to avoid confetti animation in tests
vi.mock("../../../gamification/components/BadgeCelebrationModal", () => ({
  BadgeCelebrationModal: ({ badges, isOpen, onClose }: any) => {
    if (!isOpen || !badges || badges.length === 0) return null;
    return (
      <div data-testid="badge-celebration-modal">
        <div>Badge Celebration Modal</div>
        <div>{badges[0].name}</div>
        <button onClick={onClose}>Close</button>
      </div>
    );
  },
}));

describe("ResultsLayout", () => {
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

  const mockHandleRetry = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock state
    mockUseQuizState.mockReturnValue({
      answers: mockAnswers,
      totalXP: undefined,
      mysteryBox: undefined,
      newBadges: [],
      freezeAwarded: false,
    });
    mockUseQuizActions.mockReturnValue({
      handleRetry: mockHandleRetry,
    });
  });

  it("renders completion message", () => {
    render(<ResultsLayout />);
    expect(screen.getByText(/Quiz Complete!/i)).toBeInTheDocument();
  });

  it("displays correct count and total", () => {
    render(<ResultsLayout />);
    // New structure splits text across elements, so use more flexible query
    expect(screen.getByText("Correct Answers")).toBeInTheDocument();
    expect(screen.getByText("2 / 3")).toBeInTheDocument();
  });

  it("calculates and displays accuracy percentage", () => {
    render(<ResultsLayout />);
    expect(screen.getByText("Accuracy")).toBeInTheDocument();
    expect(screen.getByText("67%")).toBeInTheDocument();
  });

  it("displays XP earned", () => {
    render(<ResultsLayout />);
    expect(screen.getByText("XP Earned")).toBeInTheDocument();
    expect(screen.getByText("+20")).toBeInTheDocument(); // 2 correct * 10 XP
  });

  it("renders review again button", () => {
    render(<ResultsLayout />);
    const reviewButton = screen.getByRole("button", { name: /Review Again/i });
    expect(reviewButton).toBeInTheDocument();
  });

  it("calls handleRetry callback when button clicked", () => {
    render(<ResultsLayout />);

    const reviewButton = screen.getByRole("button", { name: /Review Again/i });
    fireEvent.click(reviewButton);

    expect(mockHandleRetry).toHaveBeenCalledTimes(1);
  });

  it("handles empty answers array", () => {
    mockUseQuizState.mockReturnValue({
      answers: [],
      totalXP: undefined,
      mysteryBox: undefined,
      newBadges: [],
      freezeAwarded: false,
    });

    render(<ResultsLayout />);
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

    mockUseQuizState.mockReturnValue({
      answers: allCorrect,
      totalXP: undefined,
      mysteryBox: undefined,
      newBadges: [],
      freezeAwarded: false,
    });

    render(<ResultsLayout />);
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

    mockUseQuizState.mockReturnValue({
      answers: allIncorrect,
      totalXP: undefined,
      mysteryBox: undefined,
      newBadges: [],
      freezeAwarded: false,
    });

    render(<ResultsLayout />);
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

    mockUseQuizState.mockReturnValue({
      answers: fiveCorrect,
      totalXP: undefined,
      mysteryBox: undefined,
      newBadges: [],
      freezeAwarded: false,
    });

    render(<ResultsLayout />);
    expect(screen.getByText("+50")).toBeInTheDocument(); // 5 correct * 10 XP
  });

  // ========================================
  // Story 15.9: Gamification Rewards Tests
  // ========================================

  describe("Gamification Rewards", () => {
    it("displays backend-sourced XP when provided", () => {
      mockUseQuizState.mockReturnValue({
        answers: mockAnswers,
        totalXP: 25,
        mysteryBox: undefined,
        newBadges: [],
        freezeAwarded: false,
      });

      render(<ResultsLayout />);
      expect(screen.getByText("+25")).toBeInTheDocument();
    });

    it("falls back to calculated XP when totalXP not provided", () => {
      mockUseQuizState.mockReturnValue({
        answers: mockAnswers,
        totalXP: undefined,
        mysteryBox: undefined,
        newBadges: [],
        freezeAwarded: false,
      });

      render(<ResultsLayout />);
      expect(screen.getByText("+20")).toBeInTheDocument(); // 2 correct * 10 XP
    });

    it("displays new badges section when badges earned", () => {
      const newBadges: Badge[] = [
        {
          id: "bronze_flame",
          name: "Bronze Flame",
          description: "Maintain a 7-day streak",
          icon: "🔥",
        },
      ];

      mockUseQuizState.mockReturnValue({
        answers: mockAnswers,
        totalXP: undefined,
        mysteryBox: undefined,
        newBadges,
        freezeAwarded: false,
      });

      render(<ResultsLayout />);

      // Story 15.11 Flow 2.6: Badge celebration modal should open
      expect(screen.getByTestId("badge-celebration-modal")).toBeInTheDocument();
      expect(screen.getByText("Bronze Flame")).toBeInTheDocument();
    });

    it("displays multiple new badges", () => {
      const newBadges: Badge[] = [
        {
          id: "bronze_flame",
          name: "Bronze Flame",
          description: "Maintain a 7-day streak",
          icon: "🔥",
        },
        {
          id: "silver_flame",
          name: "Silver Flame",
          description: "Maintain a 30-day streak",
          icon: "🔥",
        },
      ];

      mockUseQuizState.mockReturnValue({
        answers: mockAnswers,
        totalXP: undefined,
        mysteryBox: undefined,
        newBadges,
        freezeAwarded: false,
      });

      render(<ResultsLayout />);

      // Story 15.11 Flow 2.6: Modal displays first badge
      expect(screen.getByTestId("badge-celebration-modal")).toBeInTheDocument();
      expect(screen.getByText("Bronze Flame")).toBeInTheDocument();
    });

    it("does not display badges section when no badges earned", () => {
      mockUseQuizState.mockReturnValue({
        answers: mockAnswers,
        totalXP: undefined,
        mysteryBox: undefined,
        newBadges: [],
        freezeAwarded: false,
      });

      render(<ResultsLayout />);
      expect(screen.queryByTestId("badge-celebration-modal")).not.toBeInTheDocument();
    });

    it("displays freeze awarded notification", () => {
      mockUseQuizState.mockReturnValue({
        answers: mockAnswers,
        totalXP: undefined,
        mysteryBox: undefined,
        newBadges: [],
        freezeAwarded: true,
      });

      render(<ResultsLayout />);
      expect(screen.getByText(/You earned 1 Streak Freeze/i)).toBeInTheDocument();
    });

    it("does not display freeze notification when not awarded", () => {
      mockUseQuizState.mockReturnValue({
        answers: mockAnswers,
        totalXP: undefined,
        mysteryBox: undefined,
        newBadges: [],
        freezeAwarded: false,
      });

      render(<ResultsLayout />);
      expect(screen.queryByText(/You earned 1 Streak Freeze/i)).not.toBeInTheDocument();
    });

    it("displays mystery box modal when mysteryBox provided", () => {
      const mysteryBox: MysteryBox = {
        type: "xp",
        amount: 50,
        name: "Bonus XP",
        icon: "⭐",
        droppedAt: "2026-02-15T10:00:00.000Z",
        milestone: 7,
      };

      mockUseQuizState.mockReturnValue({
        answers: mockAnswers,
        totalXP: undefined,
        mysteryBox,
        newBadges: [],
        freezeAwarded: false,
      });

      render(<ResultsLayout />);
      expect(screen.getByText(/Mystery Box/i)).toBeInTheDocument();
    });

    it("does not display mystery box modal when not provided", () => {
      mockUseQuizState.mockReturnValue({
        answers: mockAnswers,
        totalXP: undefined,
        mysteryBox: undefined,
        newBadges: [],
        freezeAwarded: false,
      });

      render(<ResultsLayout />);
      expect(screen.queryByText(/Mystery Box/i)).not.toBeInTheDocument();
    });

    it("displays all gamification rewards together", () => {
      const newBadges: Badge[] = [
        {
          id: "bronze_flame",
          name: "Bronze Flame",
          description: "Maintain a 7-day streak",
          icon: "🔥",
        },
      ];

      const mysteryBox: MysteryBox = {
        type: "xp",
        amount: 50,
        name: "Bonus XP",
        icon: "⭐",
        droppedAt: "2026-02-15T10:00:00.000Z",
        milestone: 7,
      };

      mockUseQuizState.mockReturnValue({
        answers: mockAnswers,
        totalXP: 25,
        mysteryBox,
        newBadges,
        freezeAwarded: true,
      });

      render(<ResultsLayout />);

      // All rewards should be displayed
      expect(screen.getByText("+25")).toBeInTheDocument(); // XP
      expect(screen.getByText(/New Badges Earned/i)).toBeInTheDocument(); // Badge section
      expect(screen.getByText(/You earned 1 Streak Freeze/i)).toBeInTheDocument(); // Freeze
      expect(screen.getByText(/Mystery Box/i)).toBeInTheDocument(); // Mystery box
    });

    it("handles leeches display (lapseCount >= 5)", () => {
      const answersWithLeeches: QuizAnswer[] = [
        {
          wordId: "1",
          questionType: "multiple_choice",
          userAnswer: "hello",
          correct: true,
          timestamp: new Date(),
          lapseCount: 7,
        },
        {
          wordId: "2",
          questionType: "type_pinyin",
          userAnswer: "xièxie",
          correct: false,
          timestamp: new Date(),
          lapseCount: 5,
        },
      ];

      mockUseQuizState.mockReturnValue({
        answers: answersWithLeeches,
        totalXP: undefined,
        mysteryBox: undefined,
        newBadges: [],
        freezeAwarded: false,
      });

      render(<ResultsLayout />);
      expect(screen.getByText(/2 words need attention/i)).toBeInTheDocument();
    });

    it("does not display leech alert when no leeches", () => {
      const answersWithoutLeeches: QuizAnswer[] = [
        {
          wordId: "1",
          questionType: "multiple_choice",
          userAnswer: "hello",
          correct: true,
          timestamp: new Date(),
          lapseCount: 2,
        },
      ];

      mockUseQuizState.mockReturnValue({
        answers: answersWithoutLeeches,
        totalXP: undefined,
        mysteryBox: undefined,
        newBadges: [],
        freezeAwarded: false,
      });

      render(<ResultsLayout />);
      expect(screen.queryByText(/words need attention/i)).not.toBeInTheDocument();
    });

    it("displays badge descriptions in new badges section", () => {
      const newBadges: Badge[] = [
        {
          id: "bronze_flame",
          name: "Bronze Flame",
          description: "Maintain a 7-day streak",
          icon: "🔥",
        },
      ];

      mockUseQuizState.mockReturnValue({
        answers: mockAnswers,
        totalXP: undefined,
        mysteryBox: undefined,
        newBadges,
        freezeAwarded: false,
      });

      render(<ResultsLayout />);
      expect(screen.getByText("Maintain a 7-day streak")).toBeInTheDocument();
    });
  });
});
