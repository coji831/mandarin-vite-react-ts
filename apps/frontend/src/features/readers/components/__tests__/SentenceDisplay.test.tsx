/**
 * @file components/SentenceDisplay/__tests__/SentenceDisplay.test.tsx
 * @description Tests for SentenceDisplay component
 * Story 21.4: Reading UI + LexicalHub Phase 1
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SentenceDisplay } from "../SentenceDisplay";
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

  afterEach(() => {
    Element.prototype.getBoundingClientRect = originalGetBoundingClientRect;
  });

  it("renders Chinese text as individual word elements", () => {
    render(<SentenceDisplay sentence={SAMPLE_SENTENCE} onPopoverOpen={onPopoverOpen} />);
    // Text is rendered word-by-word, not as a single node
    expect(screen.getByText("你")).toBeInTheDocument();
    expect(screen.getByText("好")).toBeInTheDocument();
    expect(screen.getByText("。")).toBeInTheDocument();
  });

  it("renders pinyin", () => {
    render(<SentenceDisplay sentence={SAMPLE_SENTENCE} onPopoverOpen={onPopoverOpen} />);
    expect(screen.getByText("nǐ hǎo.")).toBeInTheDocument();
  });

  it("marks known words with known class", () => {
    render(<SentenceDisplay sentence={SAMPLE_SENTENCE} onPopoverOpen={onPopoverOpen} />);
    const knownWord = screen.getByText("你");
    expect(knownWord.className).toContain("sentence-word--known");
  });

  it("marks unknown words as clickable", () => {
    render(<SentenceDisplay sentence={SAMPLE_SENTENCE} onPopoverOpen={onPopoverOpen} />);
    const unknownWord = screen.getByText("好");
    expect(unknownWord.className).toContain("sentence-word--unknown");
  });

  it("opens popover on tapping unknown word", async () => {
    const onPopoverOpen = vi.fn();
    render(<SentenceDisplay sentence={SAMPLE_SENTENCE} onPopoverOpen={onPopoverOpen} />);

    // getBoundingClientRect mock
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

    // Should have called with glyph and rect
    expect(onPopoverOpen).toHaveBeenCalledWith("好", expect.any(Object));
  });

  it("renders aria label for sentence", () => {
    render(<SentenceDisplay sentence={SAMPLE_SENTENCE} onPopoverOpen={onPopoverOpen} />);
    expect(screen.getByRole("group", { name: "Sentence 1" })).toBeInTheDocument();
  });

  it("renders punctuation as plain text", () => {
    render(<SentenceDisplay sentence={SAMPLE_SENTENCE} onPopoverOpen={onPopoverOpen} />);
    const punct = screen.getByText("。");
    expect(punct.className).toContain("sentence-word--punct");
  });
});
