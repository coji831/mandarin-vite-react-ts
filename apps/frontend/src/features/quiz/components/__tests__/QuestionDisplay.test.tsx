/**
 * QuestionSection Component Tests
 * Component Reorganization: Renamed from QuizCard -> QuestionDisplay -> QuestionSection
 * Story 15.5: Core Quiz UI Components
 *
 * Tests the purely presentational QuestionSection component.
 * Component renders: mode icon + hint button + question content.
 * Answer options are NOT rendered here (they live in AnswerSection).
 */
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { QuestionSection } from "../exams/QuestionSection";

describe("QuestionSection", () => {
  describe("Multiple Choice Mode", () => {
    it("renders word and pinyin", () => {
      const question = { word: "你好", pinyin: "nǐhǎo", english: "hello" };

      render(
        <QuestionSection question={question} mode="multiple_choice" onToggleHint={() => {}} />,
      );

      expect(screen.getByText("你好")).toBeTruthy();
      expect(screen.getByText(/nǐhǎo/)).toBeTruthy();
      expect(screen.getByText("What does this mean?")).toBeTruthy();
    });

    it("hides pinyin when not provided", () => {
      const question = { word: "你好", english: "hello" };

      render(
        <QuestionSection question={question} mode="multiple_choice" onToggleHint={() => {}} />,
      );

      expect(screen.getByText("你好")).toBeTruthy();
      expect(screen.queryByText(/nǐhǎo/)).toBeNull();
    });

    it("shows 🎯 mode icon", () => {
      const question = { word: "你好", pinyin: "nǐhǎo" };

      render(
        <QuestionSection question={question} mode="multiple_choice" onToggleHint={() => {}} />,
      );

      expect(screen.getByText("🎯")).toBeTruthy();
    });
  });

  describe("Type Pinyin Mode", () => {
    it("renders word and prompt", () => {
      const question = { word: "你好", english: "hello" };

      render(<QuestionSection question={question} mode="type_pinyin" onToggleHint={() => {}} />);

      expect(screen.getByText("你好")).toBeTruthy();
      expect(screen.getByText(/type the pinyin/i)).toBeTruthy();
    });

    it("shows ✏️ mode icon", () => {
      const question = { word: "你好" };

      render(<QuestionSection question={question} mode="type_pinyin" onToggleHint={() => {}} />);

      expect(screen.getByText("✏️")).toBeTruthy();
    });
  });

  describe("Type Character Mode", () => {
    it("renders pinyin, english, and prompt", () => {
      const question = { word: "你好", pinyin: "nǐhǎo", english: "hello" };

      render(<QuestionSection question={question} mode="type_character" onToggleHint={() => {}} />);

      expect(screen.getByText(/nǐhǎo/)).toBeTruthy();
      expect(screen.getByText("hello")).toBeTruthy();
      expect(screen.getByText(/type the chinese character/i)).toBeTruthy();
    });

    it("does not show the word in type_character mode", () => {
      const question = { word: "你好", pinyin: "nǐhǎo", english: "hello" };

      render(<QuestionSection question={question} mode="type_character" onToggleHint={() => {}} />);

      expect(screen.queryByText("你好")).toBeFalsy();
    });

    it("shows 🖊️ mode icon", () => {
      const question = { word: "你好", pinyin: "nǐhǎo", english: "hello" };

      render(<QuestionSection question={question} mode="type_character" onToggleHint={() => {}} />);

      expect(screen.getByText("🖊️")).toBeTruthy();
    });
  });

  describe("Hint Button", () => {
    it("renders a hint button with accessible label", () => {
      const question = { word: "你好", pinyin: "nǐhǎo" };

      render(
        <QuestionSection question={question} mode="multiple_choice" onToggleHint={() => {}} />,
      );

      expect(screen.getByRole("button", { name: /toggle hint/i })).toBeTruthy();
    });

    it("calls onToggleHint when hint button clicked", () => {
      const mockToggleHint = vi.fn();
      const question = { word: "你好", pinyin: "nǐhǎo" };

      render(
        <QuestionSection
          question={question}
          mode="multiple_choice"
          onToggleHint={mockToggleHint}
        />,
      );

      fireEvent.click(screen.getByRole("button", { name: /toggle hint/i }));
      expect(mockToggleHint).toHaveBeenCalledTimes(1);
    });
  });
});
