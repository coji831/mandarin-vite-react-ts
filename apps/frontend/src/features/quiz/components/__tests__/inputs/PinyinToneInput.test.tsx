/**
 * PinyinToneInput Component Tests
 * Tests for pinyin input with tone conversion
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { PinyinToneInput } from "../../inputs/PinyinToneInput";

describe("PinyinToneInput Component", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  it("renders input with placeholder", () => {
    render(<PinyinToneInput value="" onChange={() => {}} onSubmit={() => {}} />);

    expect(screen.getByPlaceholderText("Type pinyin (e.g., ma3)")).toBeInTheDocument();
  });

  it("shows tooltip on first render", () => {
    render(<PinyinToneInput value="" onChange={() => {}} onSubmit={() => {}} />);

    expect(screen.getByText(/Tone Input Guide/i)).toBeInTheDocument();
  });

  it("hides tooltip when dismissed", () => {
    render(<PinyinToneInput value="" onChange={() => {}} onSubmit={() => {}} />);

    const closeButton = screen.getByLabelText("Close tooltip");
    fireEvent.click(closeButton);

    expect(screen.queryByText(/Tone Input Guide/i)).not.toBeInTheDocument();
  });

  it("stores tooltip dismissal in localStorage", () => {
    render(<PinyinToneInput value="" onChange={() => {}} onSubmit={() => {}} />);

    const closeButton = screen.getByLabelText("Close tooltip");
    fireEvent.click(closeButton);

    expect(localStorage.getItem("tone_tooltip_seen")).toBe("true");
  });

  it("converts pinyin and calls onChange", () => {
    const handleChange = vi.fn();
    render(<PinyinToneInput value="" onChange={handleChange} onSubmit={() => {}} />);

    const input = screen.getByPlaceholderText("Type pinyin (e.g., ma3)");
    fireEvent.change(input, { target: { value: "ma3" } });

    // Should call onChange with converted value
    expect(handleChange).toHaveBeenCalledWith("mǎ");
  });

  it("shows live preview of converted pinyin", () => {
    render(<PinyinToneInput value="" onChange={() => {}} onSubmit={() => {}} />);

    const input = screen.getByPlaceholderText("Type pinyin (e.g., ma3)");
    fireEvent.change(input, { target: { value: "ni3hao3" } });

    expect(screen.getByText(/Preview:/)).toBeInTheDocument();
    expect(screen.getByText("nǐhǎo")).toBeInTheDocument();
  });

  it("calls onSubmit when Enter is pressed with valid input", () => {
    const handleSubmit = vi.fn();
    render(<PinyinToneInput value="mǎ" onChange={() => {}} onSubmit={handleSubmit} />);

    const input = screen.getByPlaceholderText("Type pinyin (e.g., ma3)");
    fireEvent.keyDown(input, { key: "Enter", code: "Enter", charCode: 13 });

    expect(handleSubmit).toHaveBeenCalled();
  });

  it("does not call onSubmit when Enter is pressed with empty input", () => {
    const handleSubmit = vi.fn();
    render(<PinyinToneInput value="" onChange={() => {}} onSubmit={handleSubmit} />);

    const input = screen.getByPlaceholderText("Type pinyin (e.g., ma3)");
    fireEvent.keyDown(input, { key: "Enter", code: "Enter", charCode: 13 });

    expect(handleSubmit).not.toHaveBeenCalled();
  });
});
