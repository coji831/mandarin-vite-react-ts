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

  // Story 21.7: Completion + bookmark toggle

  it("shows completion checkmark when isCompleted is true", () => {
    render(<PassageCard {...defaultProps} isCompleted={true} />);
    expect(screen.getByLabelText("Completed")).toBeInTheDocument();
  });

  it("hides completion checkmark when isCompleted is false", () => {
    render(<PassageCard {...defaultProps} isCompleted={false} />);
    expect(screen.queryByLabelText("Completed")).not.toBeInTheDocument();
  });

  it("shows empty star when not bookmarked but onBookmarkToggle is provided", () => {
    render(<PassageCard {...defaultProps} isBookmarked={false} onBookmarkToggle={vi.fn()} />);
    expect(screen.getByLabelText("Add bookmark")).toBeInTheDocument();
  });

  it("does not show empty star when not bookmarked and no toggle handler", () => {
    render(<PassageCard {...defaultProps} isBookmarked={false} />);
    expect(screen.queryByLabelText("Add bookmark")).not.toBeInTheDocument();
  });

  it("calls onBookmarkToggle when bookmark icon is clicked", async () => {
    const onToggle = vi.fn();
    render(<PassageCard {...defaultProps} isBookmarked={true} onBookmarkToggle={onToggle} />);

    await userEvent.click(screen.getByLabelText("Bookmarked"));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("calls onBookmarkToggle when empty star is clicked", async () => {
    const onToggle = vi.fn();
    render(<PassageCard {...defaultProps} isBookmarked={false} onBookmarkToggle={onToggle} />);

    await userEvent.click(screen.getByLabelText("Add bookmark"));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("includes completion status in aria-label", () => {
    render(<PassageCard {...defaultProps} isCompleted={true} />);
    const card = screen.getByRole("button");
    expect(card.getAttribute("aria-label")).toContain("completed");
  });

  it("includes bookmark status in aria-label", () => {
    render(<PassageCard {...defaultProps} isBookmarked={true} />);
    const cards = screen.getAllByRole("button");
    const card = cards.find((el) => el.getAttribute("aria-label")?.startsWith("Passage:"));
    expect(card?.getAttribute("aria-label")).toContain("bookmarked");
  });
});
