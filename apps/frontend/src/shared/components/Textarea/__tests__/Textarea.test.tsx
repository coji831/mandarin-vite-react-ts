/**
 * Textarea Component Tests
 * Tests for shared Textarea component
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Textarea } from "../Textarea";

describe("Textarea Component", () => {
  it("renders with value and placeholder", () => {
    render(<Textarea value="test story" onChange={() => {}} placeholder="Enter a story..." />);

    const textarea = screen.getByPlaceholderText("Enter a story...");
    expect(textarea).toHaveValue("test story");
  });

  it("calls onChange with new value", () => {
    const handleChange = vi.fn();
    render(<Textarea value="" onChange={handleChange} placeholder="Enter a story..." />);

    const textarea = screen.getByPlaceholderText("Enter a story...");
    fireEvent.change(textarea, { target: { value: "new story" } });

    expect(handleChange).toHaveBeenCalledWith("new story");
  });

  it("applies maxLength attribute", () => {
    render(<Textarea value="" onChange={() => {}} maxLength={5000} />);

    const textarea = screen.getByRole("textbox");
    expect(textarea).toHaveAttribute("maxLength", "5000");
  });

  it("applies disabled attribute", () => {
    render(<Textarea value="" onChange={() => {}} disabled />);

    const textarea = screen.getByRole("textbox");
    expect(textarea).toBeDisabled();
  });

  it("applies aria-label", () => {
    render(<Textarea value="" onChange={() => {}} aria-label="Mnemonic story editor" />);

    const textarea = screen.getByLabelText("Mnemonic story editor");
    expect(textarea).toBeInTheDocument();
  });

  it("merges custom className", () => {
    render(<Textarea value="" onChange={() => {}} className="custom-class" />);

    const textarea = screen.getByRole("textbox");
    expect(textarea).toHaveClass("input-base");
    expect(textarea).toHaveClass("custom-class");
  });

  it("applies input-base class", () => {
    render(<Textarea value="" onChange={() => {}} />);

    const textarea = screen.getByRole("textbox");
    expect(textarea).toHaveClass("input-base");
  });

  it("forwards rows attribute", () => {
    render(<Textarea value="" onChange={() => {}} rows={4} />);

    const textarea = screen.getByRole("textbox");
    expect(textarea).toHaveAttribute("rows", "4");
  });
});
