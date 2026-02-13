/**
 * TypeAnswerInput Component Tests
 * Story 15.5: Core Quiz UI Components
 */
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { TypeAnswerInput } from "../components/TypeAnswerInput";

describe("TypeAnswerInput", () => {
  it("renders ToneInput in pinyin mode", () => {
    const mockOnAnswer = vi.fn();
    render(
      <TypeAnswerInput placeholder="Type pinyin..." mode="type_pinyin" onAnswer={mockOnAnswer} />,
    );

    // ToneInput has specific placeholder
    expect(screen.getByPlaceholderText(/type pinyin \(e\.g\., ma3\)/i)).toBeTruthy();
  });

  it("renders regular input in character mode", () => {
    const mockOnAnswer = vi.fn();
    render(
      <TypeAnswerInput
        placeholder="Type character..."
        mode="type_character"
        onAnswer={mockOnAnswer}
      />,
    );

    expect(screen.getByPlaceholderText(/type character\.\.\./i)).toBeTruthy();
  });

  it("submit button disabled when empty", () => {
    const mockOnAnswer = vi.fn();
    render(<TypeAnswerInput placeholder="Type..." mode="type_character" onAnswer={mockOnAnswer} />);

    const submitButton = screen.getByRole("button", { name: /submit/i });
    expect(submitButton).toHaveProperty("disabled", true);
  });

  it("submit button enabled with text", () => {
    const mockOnAnswer = vi.fn();
    render(<TypeAnswerInput placeholder="Type..." mode="type_character" onAnswer={mockOnAnswer} />);

    const input = screen.getByPlaceholderText(/type\.\.\./i);
    const submitButton = screen.getByRole("button", { name: /submit/i });

    fireEvent.change(input, { target: { value: "你好" } });

    expect(submitButton).toHaveProperty("disabled", false);
  });

  it("calls onAnswer with trimmed lowercase value", () => {
    const mockOnAnswer = vi.fn();
    render(<TypeAnswerInput placeholder="Type..." mode="type_character" onAnswer={mockOnAnswer} />);

    const input = screen.getByPlaceholderText(/type\.\.\./i);
    const submitButton = screen.getByRole("button", { name: /submit/i });

    fireEvent.change(input, { target: { value: "  Hello  " } });
    fireEvent.click(submitButton);

    expect(mockOnAnswer).toHaveBeenCalledWith("hello");
  });

  it("clears input after submit", () => {
    const mockOnAnswer = vi.fn();
    render(<TypeAnswerInput placeholder="Type..." mode="type_character" onAnswer={mockOnAnswer} />);

    const input = screen.getByPlaceholderText(/type\.\.\./i) as HTMLInputElement;
    const submitButton = screen.getByRole("button", { name: /submit/i });

    fireEvent.change(input, { target: { value: "test" } });
    fireEvent.click(submitButton);

    expect(input.value).toBe("");
  });

  it("Enter key triggers submit", () => {
    const mockOnAnswer = vi.fn();
    render(<TypeAnswerInput placeholder="Type..." mode="type_character" onAnswer={mockOnAnswer} />);

    const input = screen.getByPlaceholderText(/type\.\.\./i);

    fireEvent.change(input, { target: { value: "test" } });
    fireEvent.keyPress(input, { key: "Enter", charCode: 13 });

    expect(mockOnAnswer).toHaveBeenCalledWith("test");
  });

  it("prevents empty submissions", () => {
    const mockOnAnswer = vi.fn();
    render(<TypeAnswerInput placeholder="Type..." mode="type_character" onAnswer={mockOnAnswer} />);

    const input = screen.getByPlaceholderText(/type\.\.\./i);
    const submitButton = screen.getByRole("button", { name: /submit/i });

    // Try to submit empty
    fireEvent.change(input, { target: { value: "" } });
    fireEvent.click(submitButton);

    expect(mockOnAnswer).not.toHaveBeenCalled();
  });

  it("prevents whitespace-only submissions", () => {
    const mockOnAnswer = vi.fn();
    render(<TypeAnswerInput placeholder="Type..." mode="type_character" onAnswer={mockOnAnswer} />);

    const input = screen.getByPlaceholderText(/type\.\.\./i);
    const submitButton = screen.getByRole("button", { name: /submit/i });

    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.click(submitButton);

    expect(mockOnAnswer).not.toHaveBeenCalled();
  });
});
