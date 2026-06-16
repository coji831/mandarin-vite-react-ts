/**
 * SearchBar Component Tests
 * Story 17.7: Content Browser Infrastructure.
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

// Must import after vi but before other imports
// We use fake timers for debounce testing
import { SearchBar } from "../SearchBar";

describe("SearchBar", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the search input", () => {
    render(<SearchBar value="" onChange={() => {}} placeholder="Search..." />);

    const input = screen.getByPlaceholderText("Search...");
    expect(input).toBeInTheDocument();
  });

  it("shows the initial value", () => {
    render(<SearchBar value="你好" onChange={() => {}} />);

    const input = screen.getByRole("searchbox");
    expect(input).toHaveValue("你好");
  });

  it("debounces onChange calls by 300ms", () => {
    const handleChange = vi.fn();
    render(<SearchBar value="" onChange={handleChange} />);

    const input = screen.getByRole("searchbox");
    fireEvent.change(input, { target: { value: "hello" } });

    // Should not be called immediately
    expect(handleChange).not.toHaveBeenCalled();

    // After 300ms it should be called
    vi.advanceTimersByTime(300);
    expect(handleChange).toHaveBeenCalledWith("hello");
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it("cancels previous debounce on rapid typing", () => {
    const handleChange = vi.fn();
    render(<SearchBar value="" onChange={handleChange} />);

    const input = screen.getByRole("searchbox");
    fireEvent.change(input, { target: { value: "h" } });
    vi.advanceTimersByTime(100);

    fireEvent.change(input, { target: { value: "he" } });
    vi.advanceTimersByTime(100);

    fireEvent.change(input, { target: { value: "hel" } });
    vi.advanceTimersByTime(100);

    // Only "h" timer should have fired (but would have "h" value which is overridden)
    // After 300ms from the last change, "hel" should fire
    vi.advanceTimersByTime(200);
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith("hel");
  });

  it("has accessible aria-label", () => {
    render(<SearchBar value="" onChange={() => {}} placeholder="Search items..." />);

    const input = screen.getByLabelText("Search items...");
    expect(input).toBeInTheDocument();
  });
});
