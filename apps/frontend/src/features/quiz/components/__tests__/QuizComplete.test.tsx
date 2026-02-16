/**
 * Tests for QuizComplete component
 * Story 15.6: Quiz Container & State Management
 * Story 15.8: Updated tests for stats grid and XP display
 * Story 15.9: Added tests for gamification rewards (mystery box, badges, freeze)
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QuizComplete } from "../QuizComplete";
import { QuizAnswer } from "../../types/QuizTypes";
import type { MysteryBox } from "../../hooks/useQuizAPI";
import type { Badge } from "../../../gamification/types/GamificationTypes";

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

  // ========================================
  // Story 15.9: Gamification Rewards Tests
  // ========================================

  describe("Gamification Rewards", () => {
    it("displays backend-sourced XP when provided", () => {
      render(<QuizComplete answers={mockAnswers} totalXP={25} />);
      expect(screen.getByText("+25")).toBeInTheDocument();
    });

    it("falls back to calculated XP when totalXP not provided", () => {
      render(<QuizComplete answers={mockAnswers} />);
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

      render(<QuizComplete answers={mockAnswers} newBadges={newBadges} />);

      expect(screen.getByText(/New Badges Earned/i)).toBeInTheDocument();
      expect(screen.getByText("Bronze Flame")).toBeInTheDocument();
      expect(screen.getByText("🔥")).toBeInTheDocument();
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

      render(<QuizComplete answers={mockAnswers} newBadges={newBadges} />);

      expect(screen.getByText("Bronze Flame")).toBeInTheDocument();
      expect(screen.getByText("Silver Flame")).toBeInTheDocument();
    });

    it("does not display badges section when no badges earned", () => {
      render(<QuizComplete answers={mockAnswers} />);
      expect(screen.queryByText(/New Badges Earned/i)).not.toBeInTheDocument();
    });

    it("displays freeze awarded notification", () => {
      render(<QuizComplete answers={mockAnswers} freezeAwarded={true} />);
      expect(screen.getByText(/You earned 1 Streak Freeze/i)).toBeInTheDocument();
      expect(screen.getByText("❄️")).toBeInTheDocument();
    });

    it("does not display freeze notification when not awarded", () => {
      render(<QuizComplete answers={mockAnswers} />);
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

      render(<QuizComplete answers={mockAnswers} mysteryBox={mysteryBox} />);
      expect(screen.getByText(/Mystery Box/i)).toBeInTheDocument();
    });

    it("does not display mystery box modal when not provided", () => {
      render(<QuizComplete answers={mockAnswers} />);
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

      render(
        <QuizComplete
          answers={mockAnswers}
          totalXP={25}
          newBadges={newBadges}
          freezeAwarded={true}
          mysteryBox={mysteryBox}
        />,
      );

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

      render(<QuizComplete answers={answersWithLeeches} />);
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

      render(<QuizComplete answers={answersWithoutLeeches} />);
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

      render(<QuizComplete answers={mockAnswers} newBadges={newBadges} />);
      expect(screen.getByText("Maintain a 7-day streak")).toBeInTheDocument();
    });
  });
});
