/**
 * ContentCard Component Tests
 * Story 17.7: Content Browser Infrastructure.
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ContentCard } from "../ContentCard";
import type { ContentItem } from "../types";

describe("ContentCard", () => {
  const baseItem: ContentItem = {
    id: "test-1",
    contentType: "foundations",
    title: "你好",
    subtitle: "nǐ hǎo",
    translation: "Hello",
    hskLevel: 1,
    phase: 1,
    isLocked: false,
  };

  it("renders title, pinyin, and translation", () => {
    render(<ContentCard item={baseItem} />);

    expect(screen.getByText("你好")).toBeInTheDocument();
    expect(screen.getByText("nǐ hǎo")).toBeInTheDocument();
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("shows lock badge when locked", () => {
    render(<ContentCard item={{ ...baseItem, isLocked: true }} />);

    expect(screen.getByLabelText("Locked content")).toBeInTheDocument();
  });

  it("shows HSK level badge", () => {
    render(<ContentCard item={baseItem} />);

    expect(screen.getByText("HSK 1")).toBeInTheDocument();
  });

  it("calls onClick when not locked", () => {
    const handleClick = vi.fn();
    render(<ContentCard item={baseItem} onClick={handleClick} />);

    const card = screen.getByRole("button");
    fireEvent.click(card);

    expect(handleClick).toHaveBeenCalledWith(baseItem);
  });

  it("does not call onClick when locked", () => {
    const handleClick = vi.fn();
    render(<ContentCard item={{ ...baseItem, isLocked: true }} onClick={handleClick} />);

    const card = screen.getByRole("button");
    fireEvent.click(card);

    expect(handleClick).not.toHaveBeenCalled();
  });

  it("has role='button' and aria-label", () => {
    render(<ContentCard item={baseItem} />);

    const card = screen.getByRole("button");
    expect(card).toHaveAttribute("aria-label", "你好 - nǐ hǎo");
  });

  it("shows locked state in aria-label", () => {
    render(<ContentCard item={{ ...baseItem, isLocked: true }} />);

    const card = screen.getByRole("button");
    expect(card).toHaveAttribute("aria-label", "你好 - nǐ hǎo (locked)");
  });

  it("responds to keyboard Enter key when not locked", () => {
    const handleClick = vi.fn();
    render(<ContentCard item={baseItem} onClick={handleClick} />);

    const card = screen.getByRole("button");
    fireEvent.keyDown(card, { key: "Enter" });

    expect(handleClick).toHaveBeenCalled();
  });

  it("does not respond to keyboard when locked", () => {
    const handleClick = vi.fn();
    render(<ContentCard item={{ ...baseItem, isLocked: true }} onClick={handleClick} />);

    const card = screen.getByRole("button");
    fireEvent.keyDown(card, { key: "Enter" });

    expect(handleClick).not.toHaveBeenCalled();
  });
});
