/**
 * ChineseCharacterInput Component Tests
 * Tests for Chinese character input with optional pinyin assistance
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ChineseCharacterInput } from "../../inputs/ChineseCharacterInput";

describe("ChineseCharacterInput Component", () => {
  it("renders input with placeholder", () => {
    render(<ChineseCharacterInput value="" onChange={() => {}} onSubmit={() => {}} />);

    expect(screen.getByPlaceholderText("Type Chinese character...")).toBeInTheDocument();
  });

  it("calls onChange when input changes", () => {
    const handleChange = vi.fn();
    render(<ChineseCharacterInput value="" onChange={handleChange} onSubmit={() => {}} />);

    const input = screen.getByPlaceholderText("Type Chinese character...");
    fireEvent.change(input, { target: { value: "你好" } });

    expect(handleChange).toHaveBeenCalledWith("你好");
  });

  it("shows character count when input has value", () => {
    render(<ChineseCharacterInput value="你好" onChange={() => {}} onSubmit={() => {}} />);

    expect(screen.getByText("2 字")).toBeInTheDocument();
  });

  it("does not show character count when input is empty", () => {
    render(<ChineseCharacterInput value="" onChange={() => {}} onSubmit={() => {}} />);

    expect(screen.queryByText(/字/)).not.toBeInTheDocument();
  });

  it("excludes spaces from character count", () => {
    render(<ChineseCharacterInput value="你 好 世 界" onChange={() => {}} onSubmit={() => {}} />);

    expect(screen.getByText("4 字")).toBeInTheDocument();
  });

  it("shows disabled pinyin toggle button", () => {
    render(<ChineseCharacterInput value="" onChange={() => {}} onSubmit={() => {}} />);

    const toggle = screen.getByText(/Pinyin Mode \(Coming Soon\)/);
    expect(toggle).toBeDisabled();
  });

  it("calls onSubmit when Enter is pressed with valid input", () => {
    const handleSubmit = vi.fn();
    render(<ChineseCharacterInput value="你好" onChange={() => {}} onSubmit={handleSubmit} />);

    const input = screen.getByPlaceholderText("Type Chinese character...");
    fireEvent.keyDown(input, { key: "Enter", code: "Enter", charCode: 13 });

    expect(handleSubmit).toHaveBeenCalled();
  });

  it("does not call onSubmit when Enter is pressed with empty input", () => {
    const handleSubmit = vi.fn();
    render(<ChineseCharacterInput value="" onChange={() => {}} onSubmit={handleSubmit} />);

    const input = screen.getByPlaceholderText("Type Chinese character...");
    fireEvent.keyDown(input, { key: "Enter", code: "Enter", charCode: 13 });

    expect(handleSubmit).not.toHaveBeenCalled();
  });
});
