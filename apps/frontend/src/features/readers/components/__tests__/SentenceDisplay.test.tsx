/**
 * @file components/SentenceDisplay/__tests__/SentenceDisplay.test.tsx
 * @description Tests for SentenceDisplay component
 * Phase 2: Audio props removed — reads audioStore directly.
 */

import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SentenceDisplay } from "../SentenceDisplay";
import { useAudioStore } from "../../stores";
import type { AudioStatus } from "../../stores";
import type { SentenceData } from "../SentenceDisplay";

const SAMPLE_SENTENCE: SentenceData = {
  index: 0,
  text: "你好。",
  pinyin: "nǐ hǎo.",
  words: [
    { glyph: "你", isKnown: true, hskLevel: 1, pinyin: "nǐ" },
    { glyph: "好", isKnown: false, hskLevel: 1, pinyin: "hǎo" },
    { glyph: "。", isKnown: true },
  ],
};

describe("SentenceDisplay", () => {
  const onPopoverOpen = vi.fn();
  const originalGetBoundingClientRect = Element.prototype.getBoundingClientRect;

  const defaultProps = {
    onPopoverOpen,
  };

  beforeEach(() => {
    useAudioStore.setState({
      currentIndex: null,
      pendingIndex: null,
      status: "idle" as AudioStatus,
      error: null,
      speed: 1,
      audioUrls: null,
    });
  });

  afterEach(() => {
    Element.prototype.getBoundingClientRect = originalGetBoundingClientRect;
  });

  it("renders Chinese text as individual word elements", () => {
    render(<SentenceDisplay sentence={SAMPLE_SENTENCE} {...defaultProps} />);
    expect(screen.getByText("你")).toBeInTheDocument();
    expect(screen.getByText("好")).toBeInTheDocument();
    expect(screen.getByText("。")).toBeInTheDocument();
  });

  it("renders pinyin", () => {
    render(<SentenceDisplay sentence={SAMPLE_SENTENCE} {...defaultProps} />);
    expect(screen.getByText("nǐ hǎo.")).toBeInTheDocument();
  });

  it("marks known words with known class", () => {
    render(<SentenceDisplay sentence={SAMPLE_SENTENCE} {...defaultProps} />);
    const knownWord = screen.getByText("你");
    expect(knownWord.className).toContain("sentence-word--known");
  });

  it("marks unknown words as clickable", () => {
    render(<SentenceDisplay sentence={SAMPLE_SENTENCE} {...defaultProps} />);
    const unknownWord = screen.getByText("好");
    expect(unknownWord.className).toContain("sentence-word--unknown");
  });

  it("opens popover on tapping unknown word", async () => {
    const onPopoverOpen = vi.fn();
    render(
      <SentenceDisplay
        sentence={SAMPLE_SENTENCE}
        {...defaultProps}
        onPopoverOpen={onPopoverOpen}
      />,
    );

    const mockRect = {
      left: 100,
      bottom: 200,
      top: 150,
      right: 150,
      width: 50,
      height: 50,
    } as DOMRect;
    Element.prototype.getBoundingClientRect = vi.fn(() => mockRect);

    await userEvent.click(screen.getByText("好"));

    expect(onPopoverOpen).toHaveBeenCalledWith("好", expect.any(Object));
  });

  it("renders aria label for sentence", () => {
    render(<SentenceDisplay sentence={SAMPLE_SENTENCE} {...defaultProps} />);
    expect(screen.getByRole("button", { name: "Sentence 1" })).toBeInTheDocument();
  });

  it("renders punctuation as plain text", () => {
    render(<SentenceDisplay sentence={SAMPLE_SENTENCE} {...defaultProps} />);
    const punct = screen.getByText("。");
    expect(punct.className).toContain("sentence-word--punct");
  });

  it("applies active class when sentence matches audioStore currentIndex", () => {
    useAudioStore.setState({ currentIndex: 0 });
    render(<SentenceDisplay sentence={SAMPLE_SENTENCE} {...defaultProps} />);
    const container = screen.getByRole("button", { name: "Sentence 1" });
    expect(container.className).toContain("sentence-display--active");
  });

  it("does not apply active class when currentIndex differs", () => {
    useAudioStore.setState({ currentIndex: 1 });
    render(<SentenceDisplay sentence={SAMPLE_SENTENCE} {...defaultProps} />);
    const container = screen.getByRole("button", { name: "Sentence 1" });
    expect(container.className).not.toContain("sentence-display--active");
  });

  it("sets pendingIndex in audioStore on tap", async () => {
    render(<SentenceDisplay sentence={SAMPLE_SENTENCE} {...defaultProps} />);

    await userEvent.click(screen.getByRole("button", { name: "Sentence 1" }));

    expect(useAudioStore.getState().pendingIndex).toBe(0);
  });
});
