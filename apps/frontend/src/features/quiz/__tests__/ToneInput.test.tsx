/**
 * ToneInput Component Tests
 * Story 15.5: Core Quiz UI Components
 */
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ToneInput } from "../components/ToneInput";

describe("ToneInput", () => {
  it("renders input element", () => {
    const mockOnChange = vi.fn();
    render(<ToneInput value="" onChange={mockOnChange} />);

    const input = screen.getByPlaceholderText(/type pinyin/i);
    expect(input).toBeTruthy();
  });

  it("converts ma3 → mǎ via onChange", () => {
    const mockOnChange = vi.fn();
    render(<ToneInput value="" onChange={mockOnChange} />);

    const input = screen.getByPlaceholderText(/type pinyin/i);
    fireEvent.change(input, { target: { value: "ma3" } });

    expect(mockOnChange).toHaveBeenCalledWith("mǎ");
  });

  it("converts hao3 → hǎo", () => {
    const mockOnChange = vi.fn();
    render(<ToneInput value="" onChange={mockOnChange} />);

    const input = screen.getByPlaceholderText(/type pinyin/i);
    fireEvent.change(input, { target: { value: "hao3" } });

    expect(mockOnChange).toHaveBeenCalledWith("hǎo");
  });

  it("converts liu2 → liú", () => {
    const mockOnChange = vi.fn();
    render(<ToneInput value="" onChange={mockOnChange} />);

    const input = screen.getByPlaceholderText(/type pinyin/i);
    fireEvent.change(input, { target: { value: "liu2" } });

    expect(mockOnChange).toHaveBeenCalledWith("liú");
  });

  it("shows preview of converted text", () => {
    const mockOnChange = vi.fn();
    render(<ToneInput value="" onChange={mockOnChange} />);

    const input = screen.getByPlaceholderText(/type pinyin/i);
    fireEvent.change(input, { target: { value: "ni3hao3" } });

    // Preview should show converted text
    expect(screen.getByText(/preview:/i)).toBeTruthy();
    expect(screen.getByText(/nǐhǎo/i)).toBeTruthy();
  });

  it("handles empty input", () => {
    const mockOnChange = vi.fn();
    render(<ToneInput value="" onChange={mockOnChange} />);

    const input = screen.getByPlaceholderText(/type pinyin/i);

    // First add a value
    fireEvent.change(input, { target: { value: "ma3" } });
    // Then clear it
    fireEvent.change(input, { target: { value: "" } });

    // Should be called twice: once for "ma3" → "mǎ", once for "" → ""
    expect(mockOnChange).toHaveBeenCalledTimes(2);
    expect(mockOnChange).toHaveBeenLastCalledWith("");
  });

  it("removes tone numbers for neutral tone", () => {
    const mockOnChange = vi.fn();
    render(<ToneInput value="" onChange={mockOnChange} />);

    const input = screen.getByPlaceholderText(/type pinyin/i);
    fireEvent.change(input, { target: { value: "ma5" } });

    // Tone 5 (neutral) removes the number
    expect(mockOnChange).toHaveBeenCalledWith("ma");
  });

  it("converts uppercase to lowercase", () => {
    const mockOnChange = vi.fn();
    render(<ToneInput value="" onChange={mockOnChange} />);

    const input = screen.getByPlaceholderText(/type pinyin/i);
    fireEvent.change(input, { target: { value: "MA3" } });

    expect(mockOnChange).toHaveBeenCalledWith("mǎ");
  });
});
