/**
 * QuizCard Component Tests
 * Story 15.5: Core Quiz UI Components
 */
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { QuizCard } from "../components/QuizCard";

describe("QuizCard", () => {
  describe("Multiple Choice Mode", () => {
    it("renders word, pinyin, and 4 options", () => {
      const mockOnAnswer = vi.fn();
      const question = { word: "你好", pinyin: "nǐhǎo", english: "hello" };
      const options = ["hello", "goodbye", "thank you", "please"];

      render(
        <QuizCard
          question={question}
          mode="multiple_choice"
          options={options}
          onAnswer={mockOnAnswer}
        />,
      );

      expect(screen.getByText("你好")).toBeTruthy();
      expect(screen.getByText(/nǐhǎo/)).toBeTruthy();
      expect(screen.getByText("hello")).toBeTruthy();
      expect(screen.getByText("goodbye")).toBeTruthy();
      expect(screen.getByText("thank you")).toBeTruthy();
      expect(screen.getByText("please")).toBeTruthy();
    });

    it("calls onAnswer with selected option", () => {
      const mockOnAnswer = vi.fn();
      const question = { word: "谢谢", pinyin: "xièxiè", english: "thank you" };
      const options = ["hello", "goodbye", "thank you", "please"];

      render(
        <QuizCard
          question={question}
          mode="multiple_choice"
          options={options}
          onAnswer={mockOnAnswer}
        />,
      );

      const thirdOption = screen.getByText("thank you");
      fireEvent.click(thirdOption);

      expect(mockOnAnswer).toHaveBeenCalledWith("thank you");
    });

    it("shows correct mode indicator", () => {
      const mockOnAnswer = vi.fn();
      const question = { word: "你好", pinyin: "nǐhǎo" };
      const options = ["hello", "goodbye", "thanks", "please"];

      render(
        <QuizCard
          question={question}
          mode="multiple_choice"
          options={options}
          onAnswer={mockOnAnswer}
        />,
      );

      expect(screen.getByText(/📝 Multiple Choice/)).toBeTruthy();
    });
  });

  describe("Type Pinyin Mode", () => {
    it("renders word only, no options", () => {
      const mockOnAnswer = vi.fn();
      const question = { word: "你好", english: "hello" };

      render(<QuizCard question={question} mode="type_pinyin" onAnswer={mockOnAnswer} />);

      expect(screen.getByText("你好")).toBeTruthy();
      expect(screen.getByText(/type the pinyin/i)).toBeTruthy();

      // Should not have option buttons
      const buttons = screen.queryAllByRole("button");
      expect(buttons.length).toBe(0);
    });

    it("shows correct mode indicator", () => {
      const mockOnAnswer = vi.fn();
      const question = { word: "你好" };

      render(<QuizCard question={question} mode="type_pinyin" onAnswer={mockOnAnswer} />);

      expect(screen.getByText(/🔤 Type Pinyin/)).toBeTruthy();
    });
  });

  describe("Type Character Mode", () => {
    it("renders pinyin and english, no options", () => {
      const mockOnAnswer = vi.fn();
      const question = { word: "你好", pinyin: "nǐhǎo", english: "hello" };

      render(<QuizCard question={question} mode="type_character" onAnswer={mockOnAnswer} />);

      expect(screen.getByText(/nǐhǎo/)).toBeTruthy();
      expect(screen.getByText("hello")).toBeTruthy();
      expect(screen.getByText(/type the chinese character/i)).toBeTruthy();

      // Should not show the word itself
      expect(screen.queryByText("你好")).toBeFalsy();

      // Should not have option buttons
      const buttons = screen.queryAllByRole("button");
      expect(buttons.length).toBe(0);
    });

    it("shows correct mode indicator", () => {
      const mockOnAnswer = vi.fn();
      const question = { word: "你好", pinyin: "nǐhǎo", english: "hello" };

      render(<QuizCard question={question} mode="type_character" onAnswer={mockOnAnswer} />);

      expect(screen.getByText(/✏️ Type Character/)).toBeTruthy();
    });
  });

  describe("Accessibility", () => {
    it("buttons have min 44px height (touch-friendly)", () => {
      const mockOnAnswer = vi.fn();
      const question = { word: "你好", pinyin: "nǐhǎo" };
      const options = ["hello", "goodbye", "thanks", "please"];

      render(
        <QuizCard
          question={question}
          mode="multiple_choice"
          options={options}
          onAnswer={mockOnAnswer}
        />,
      );

      const buttons = screen.getAllByRole("button");
      buttons.forEach((button) => {
        const styles = window.getComputedStyle(button);
        const minHeight = parseInt(styles.minHeight);
        expect(minHeight).toBeGreaterThanOrEqual(44);
      });
    });
  });
});
