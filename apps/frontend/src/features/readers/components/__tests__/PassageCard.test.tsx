/**
 * @file components/PassageCard/__tests__/PassageCard.test.tsx
 * @description Tests for PassageCard component
 * Story 21.4: Reading UI + LexicalHub Phase 1
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PassageCard } from "../PassageCard";

describe("PassageCard", () => {
  const defaultProps = {
    title: "My First Passage",
    hskLevel: 2,
    knownWordRatio: 75,
    onClick: vi.fn(),
  };

  it("renders title", () => {
    render(<PassageCard {...defaultProps} />);
    expect(screen.getByText("My First Passage")).toBeInTheDocument();
  });

  it("renders HSK badge", () => {
    render(<PassageCard {...defaultProps} />);
    expect(screen.getByText("HSK 2")).toBeInTheDocument();
  });

  it("renders known word ratio", () => {
    render(<PassageCard {...defaultProps} />);
    expect(screen.getByText("75%")).toBeInTheDocument();
  });

  it("calls onClick when clicked", async () => {
    const onClick = vi.fn();
    render(<PassageCard {...defaultProps} onClick={onClick} />);

    await userEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("calls onClick on Enter key", () => {
    const onClick = vi.fn();
    render(<PassageCard {...defaultProps} onClick={onClick} />);

    const card = screen.getByRole("button");
    card.focus();
    // Use fireEvent.keyDown to avoid native button Enter behavior
    fireEvent.keyDown(card, { key: "Enter" });
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("clamps knownWordRatio to [0, 100]", () => {
    render(<PassageCard {...defaultProps} knownWordRatio={150} />);
    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("clamps negative knownWordRatio to 0", () => {
    render(<PassageCard {...defaultProps} knownWordRatio={-10} />);
    expect(screen.getByText("0%")).toBeInTheDocument();
  });

  it("shows bookmark when isBookmarked is true", () => {
    render(<PassageCard {...defaultProps} isBookmarked={true} />);
    expect(screen.getByLabelText("Bookmarked")).toBeInTheDocument();
  });

  it("hides bookmark when isBookmarked is false", () => {
    render(<PassageCard {...defaultProps} isBookmarked={false} />);
    expect(screen.queryByLabelText("Bookmarked")).not.toBeInTheDocument();
  });
});
