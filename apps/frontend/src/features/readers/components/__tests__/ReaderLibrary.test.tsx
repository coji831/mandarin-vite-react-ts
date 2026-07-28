/**
 * @file components/ReaderLibrary/__tests__/ReaderLibrary.test.tsx
 * @description Tests for ReaderLibrary component
 * Story 21.4: Reading UI + LexicalHub Phase 1
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReaderLibrary } from "../ReaderLibrary";
import type { PassageSummary } from "../ReaderLibrary";

const SAMPLE_PASSAGES: PassageSummary[] = [
  { id: "p1", title: "Passage 1", hskLevel: 2, knownWordRatio: 75, isBookmarked: false },
  { id: "p2", title: "Passage 2", hskLevel: 3, knownWordRatio: 60, isBookmarked: true },
  { id: "p3", title: "Passage 3", hskLevel: 2, knownWordRatio: 90, isBookmarked: false },
];

describe("ReaderLibrary", () => {
  const defaultProps = {
    passages: SAMPLE_PASSAGES,
    selectedLevel: null,
    onLevelChange: vi.fn(),
    onSelectPassage: vi.fn(),
    isLoading: false,
    isEmpty: false,
    hasError: false,
    onRetry: vi.fn(),
    onGeneratePassage: vi.fn(),
  };

  it("renders passage cards", () => {
    render(<ReaderLibrary {...defaultProps} />);
    expect(screen.getByText("Passage 1")).toBeInTheDocument();
    expect(screen.getByText("Passage 2")).toBeInTheDocument();
    expect(screen.getByText("Passage 3")).toBeInTheDocument();
  });

  it("renders HSK filter chips", () => {
    render(<ReaderLibrary {...defaultProps} />);
    expect(screen.getByText("All")).toBeInTheDocument();
    expect(screen.getByText("HSK 1")).toBeInTheDocument();
    // Use getAllByText since "HSK 2" appears both in filter and passage cards
    const hsk2Elements = screen.getAllByText("HSK 2");
    expect(hsk2Elements.length).toBeGreaterThanOrEqual(1);
  });

  it("calls onLevelChange when filter chip clicked", async () => {
    const onLevelChange = vi.fn();
    render(<ReaderLibrary {...defaultProps} onLevelChange={onLevelChange} />);

    // Target the FilterChip specifically (it's a button with aria-pressed attribute)
    const filterChips = screen.getAllByRole("button", { pressed: false });
    // Find the HSK 2 chip
    const hsk2Chip = filterChips.find((btn) => btn.textContent === "HSK 2");
    expect(hsk2Chip).toBeTruthy();
    if (hsk2Chip) await userEvent.click(hsk2Chip);
    expect(onLevelChange).toHaveBeenCalledWith(2);
  });

  it("filters passages by selected level", () => {
    render(<ReaderLibrary {...defaultProps} selectedLevel={2} />);
    expect(screen.getByText("Passage 1")).toBeInTheDocument();
    expect(screen.getByText("Passage 3")).toBeInTheDocument();
    expect(screen.queryByText("Passage 2")).not.toBeInTheDocument();
  });

  it("shows empty filter result when no passages match level", () => {
    render(<ReaderLibrary {...defaultProps} selectedLevel={5} />);
    expect(screen.getByText(/No passages found for HSK 5/)).toBeInTheDocument();
  });

  it("renders loading skeleton when isLoading", () => {
    const { container } = render(
      <ReaderLibrary {...defaultProps} isLoading={true} passages={[]} />,
    );
    expect(screen.getByLabelText("Loading passages")).toBeInTheDocument();
    // Should not render content
    expect(screen.queryByText("Passage 1")).not.toBeInTheDocument();
  });

  it("renders empty state when no passages", () => {
    render(<ReaderLibrary {...defaultProps} passages={[]} isEmpty={true} />);
    expect(screen.getByText("No passages yet")).toBeInTheDocument();
    expect(screen.getByText("Generate your first passage")).toBeInTheDocument();
  });

  it("renders error screen when hasError", () => {
    render(<ReaderLibrary {...defaultProps} hasError={true} />);
    expect(screen.getByText("Unable to load passages")).toBeInTheDocument();
    expect(screen.getByText(/Failed to load passages/)).toBeInTheDocument();
  });

  it("calls onRetry from error screen", async () => {
    const onRetry = vi.fn();
    render(<ReaderLibrary {...defaultProps} hasError={true} onRetry={onRetry} />);

    await userEvent.click(screen.getByText("Try Again"));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("calls onSelectPassage when a passage card is clicked", async () => {
    const onSelectPassage = vi.fn();
    render(<ReaderLibrary {...defaultProps} onSelectPassage={onSelectPassage} />);

    // PassageCards have role="button" and aria-label containing "Passage:"
    const passageCards = screen
      .getAllByRole("button")
      .filter((btn) => btn.getAttribute("aria-label")?.startsWith("Passage:"));
    expect(passageCards.length).toBe(3);

    await userEvent.click(passageCards[0]);
    expect(onSelectPassage).toHaveBeenCalledWith("p1");
  });
});
