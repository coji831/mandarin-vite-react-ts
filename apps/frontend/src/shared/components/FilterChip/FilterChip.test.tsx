/**
 * @file components/FilterChip/FilterChip.test.tsx
 * @description Tests for the shared FilterChip component.
 * Verifies the toggle semantics (aria-pressed) and the selected visual class.
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { FilterChip } from "./FilterChip";

describe("FilterChip", () => {
  it("renders as a button with base class and unselected state", () => {
    render(<FilterChip label="HSK 2" selected={false} onClick={() => {}} />);

    const chip = screen.getByRole("button", { name: "HSK 2" });
    expect(chip).toBeInTheDocument();
    expect(chip).toHaveClass("filter-chip");
    expect(chip).not.toHaveClass("filter-chip--selected");
    expect(chip).toHaveAttribute("aria-pressed", "false");
  });

  it("applies the selected visual class and aria-pressed when selected", () => {
    render(<FilterChip label="All" selected onClick={() => {}} />);

    const chip = screen.getByRole("button", { name: "All" });
    expect(chip).toHaveAttribute("aria-pressed", "true");
    expect(chip).toHaveClass("filter-chip--selected");
  });

  it("fires onClick", () => {
    const handleClick = vi.fn();
    render(<FilterChip label="Radicals" selected={false} onClick={handleClick} />);

    fireEvent.click(screen.getByRole("button", { name: "Radicals" }));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
