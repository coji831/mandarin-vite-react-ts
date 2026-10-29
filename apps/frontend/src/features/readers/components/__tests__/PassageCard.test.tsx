/**
 * @file components/PassageCard/__tests__/PassageCard.test.tsx
 * @description Tests for PassageCard component
 * Story 21.4: Reading UI + LexicalHub Phase 1
 *
 * Rework (§2): the card no longer prints a "known words" percentage — the API's
 * ratio is a generation-time 0–1 column that cannot vary per learner, so every
 * card read the same "1%". The tests below assert the replacement contract: the
 * real word count, the explicit read affordance, and no percentage at all.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PassageCard } from "../PassageCard";

describe("PassageCard", () => {
  const defaultProps = {
    title: "My First Passage",
    hskLevel: 2,
    wordCount: 42,
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

  it("renders the real word count", () => {
    render(<PassageCard {...defaultProps} />);
    expect(screen.getByText("42 words")).toBeInTheDocument();
  });

  it("never renders a known-word percentage", () => {
    render(<PassageCard {...defaultProps} />);
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });

  it("renders an explicit read affordance", () => {
    render(<PassageCard {...defaultProps} />);
    expect(screen.getByText("Read →")).toBeInTheDocument();
  });

  it("calls onClick when clicked", async () => {
    const onClick = vi.fn();
    render(<PassageCard {...defaultProps} onClick={onClick} />);

    await userEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("calls onClick on Enter key", async () => {
    const onClick = vi.fn();
    render(<PassageCard {...defaultProps} onClick={onClick} />);

    // The card body is a real <button> — Enter is handled natively, so
    // simulate the full keyboard interaction instead of a raw keydown.
    const card = screen.getByRole("button");
    card.focus();
    await userEvent.keyboard("{Enter}");
    expect(onClick).toHaveBeenCalledTimes(1);
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
    // Decorative glyph (aria-hidden) — the completed state is also exposed via
    // the open-button's aria-label (asserted below).
    expect(screen.getByText("✓")).toBeInTheDocument();
  });

  it("hides completion checkmark when isCompleted is false", () => {
    render(<PassageCard {...defaultProps} isCompleted={false} />);
    expect(screen.queryByText("✓")).not.toBeInTheDocument();
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
    expect(card.getAttribute("aria-label")).toContain("finished");
  });

  it("includes bookmark status in aria-label", () => {
    render(<PassageCard {...defaultProps} isBookmarked={true} />);
    const cards = screen.getAllByRole("button");
    const card = cards.find((el) => el.getAttribute("aria-label")?.startsWith("Read passage:"));
    expect(card?.getAttribute("aria-label")).toContain("bookmarked");
  });
});
