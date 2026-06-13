/**
 * Input Component Tests
 * Tests for shared Input component
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Input } from "../Input";

describe("Input Component", () => {
  it("renders with value and placeholder", () => {
    render(<Input value="test value" onChange={() => {}} placeholder="Enter text" />);

    const input = screen.getByPlaceholderText("Enter text");
    expect(input).toHaveValue("test value");
  });

  it("calls onChange when input changes", () => {
    const handleChange = vi.fn();
    render(<Input value="" onChange={handleChange} placeholder="Enter text" />);

    const input = screen.getByPlaceholderText("Enter text");
    fireEvent.change(input, { target: { value: "new value" } });

    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it("calls onKeyDown on Enter key", () => {
    const handleKeyDown = vi.fn();
    render(
      <Input value="test" onChange={() => {}} onKeyDown={handleKeyDown} placeholder="Enter text" />,
    );

    const input = screen.getByPlaceholderText("Enter text");
    fireEvent.keyDown(input, { key: "Enter", code: "Enter", charCode: 13 });

    expect(handleKeyDown).toHaveBeenCalled();
  });

  it("applies input-base class", () => {
    render(<Input value="" onChange={() => {}} placeholder="Enter text" />);

    const input = screen.getByPlaceholderText("Enter text");
    expect(input).toHaveClass("input-base");
  });

  it("forwards custom className prop", () => {
    render(
      <Input value="" onChange={() => {}} placeholder="Enter text" className="custom-class" />,
    );

    const input = screen.getByPlaceholderText("Enter text");
    expect(input).toHaveClass("input-base");
    expect(input).toHaveClass("custom-class");
  });

  it("handles disabled state", () => {
    render(<Input value="" onChange={() => {}} placeholder="Enter text" disabled />);

    const input = screen.getByPlaceholderText("Enter text");
    expect(input).toBeDisabled();
  });

  it("forwards standard input attributes", () => {
    render(
      <Input
        value=""
        onChange={() => {}}
        placeholder="Enter text"
        autoComplete="off"
        spellCheck={false}
        autoCorrect="off"
      />,
    );

    const input = screen.getByPlaceholderText("Enter text");
    expect(input).toHaveAttribute("autocomplete", "off");
    expect(input).toHaveAttribute("spellcheck", "false");
  });
});
