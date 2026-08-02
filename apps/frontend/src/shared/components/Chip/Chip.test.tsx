/**
 * Chip Component Tests
 * Tests for the shared Chip component
 * Chip-1: chip-extraction refactor (additive)
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Chip } from "./Chip";

describe("Chip Component", () => {
  it("renders a button when interactive and fires onClick", () => {
    const handleClick = vi.fn();
    render(<Chip label="Radical" interactive onClick={handleClick} />);

    const chip = screen.getByRole("button", { name: "Radical" });
    expect(chip).toBeInTheDocument();
    expect(chip.tagName).toBe("BUTTON");

    fireEvent.click(chip);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("renders a span when non-interactive and does not fire onClick", () => {
    const handleClick = vi.fn();
    const { container } = render(<Chip label="HSK 3" onClick={handleClick} interactive={false} />);

    const chip = container.querySelector(".chip");
    expect(chip).not.toBeNull();
    expect(chip!.tagName).toBe("SPAN");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();

    fireEvent.click(chip!);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("sets aria-pressed when active on an interactive chip", () => {
    render(<Chip label="Mastered" interactive active onClick={() => {}} />);

    const chip = screen.getByRole("button", { name: "Mastered" });
    expect(chip).toHaveAttribute("aria-pressed", "true");
  });

  it("defaults to interactive when onClick is provided", () => {
    const handleClick = vi.fn();
    render(<Chip label="Character" onClick={handleClick} />);

    const chip = screen.getByRole("button", { name: "Character" });
    expect(chip.tagName).toBe("BUTTON");
  });

  it("composes glyph, pinyin, label, and count slots", () => {
    render(<Chip glyph="口" pinyin="kǒu" label="mouth" count="5" />);

    expect(screen.getByText("口")).toBeInTheDocument();
    expect(screen.getByText("kǒu")).toBeInTheDocument();
    expect(screen.getByText("mouth")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("does not apply motion CSS classes to non-interactive chips", () => {
    const { container } = render(<Chip label="Static" />);

    const chip = container.querySelector(".chip");
    expect(chip).not.toBeNull();
    expect(chip!.className).not.toContain("transition-colors");
    expect(chip!.className).not.toContain("transition-all");
    expect(chip!.className).not.toContain("chip--interactive");
  });
});
