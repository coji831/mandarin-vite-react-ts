/**
 * @file components/SentenceDisplay/__tests__/SentenceDisplay.test.tsx
 * @description Tests for SentenceDisplay component
 * Phase 2: Audio props removed — reads audioStore directly.
 * Phase D1: Reads the SHARED presentational audio store; the per-sentence 🔊
 *   button invokes the `onPlay(index)` prop (parent routes `play(index, "single")`
 *   through the shared AudioManager) — no store signal fields anymore.
 * VisFix: Container is no longer a button — per-sentence play button drives audio;
 *   word taps only open the popover (never trigger audio).
 */

import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SentenceDisplay } from "../SentenceDisplay";
import { useAudioStore } from "shared/store";
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
    useAudioStore.setState(useAudioStore.getInitialState());
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

  it("renders a per-sentence play button with aria label", () => {
    render(<SentenceDisplay sentence={SAMPLE_SENTENCE} {...defaultProps} />);
    expect(screen.getByRole("button", { name: "Play sentence 1" })).toBeInTheDocument();
    // Sentence container is no longer a button — word taps must not trigger audio
    expect(screen.queryByRole("button", { name: "Sentence 1" })).not.toBeInTheDocument();
  });

  it("renders punctuation as plain text", () => {
    render(<SentenceDisplay sentence={SAMPLE_SENTENCE} {...defaultProps} />);
    const punct = screen.getByText("。");
    expect(punct.className).toContain("sentence-word--punct");
  });

  it("applies active class when sentence matches audioStore currentIndex", () => {
    useAudioStore.setState({ currentIndex: 0 });
    render(<SentenceDisplay sentence={SAMPLE_SENTENCE} {...defaultProps} />);
    const container = document.querySelector(".sentence-display");
    expect(container?.className).toContain("sentence-display--active");
  });

  it("does not apply active class when currentIndex differs", () => {
    useAudioStore.setState({ currentIndex: 1 });
    render(<SentenceDisplay sentence={SAMPLE_SENTENCE} {...defaultProps} />);
    const container = document.querySelector(".sentence-display");
    expect(container?.className).not.toContain("sentence-display--active");
  });

  it("calls onPlay with the sentence index when the play button is clicked", async () => {
    const onPlay = vi.fn();
    render(<SentenceDisplay sentence={SAMPLE_SENTENCE} {...defaultProps} onPlay={onPlay} />);

    await userEvent.click(screen.getByRole("button", { name: "Play sentence 1" }));

    expect(onPlay).toHaveBeenCalledWith(0);
  });

  it("does not trigger audio when tapping an unknown word (popover only)", async () => {
    const onPlay = vi.fn();
    render(<SentenceDisplay sentence={SAMPLE_SENTENCE} {...defaultProps} onPlay={onPlay} />);

    await userEvent.click(screen.getByText("好"));

    expect(onPlay).not.toHaveBeenCalled();
  });

  it("reflects active playing state on the audio button", () => {
    useAudioStore.setState({ currentIndex: 0, status: "playing" });
    render(<SentenceDisplay sentence={SAMPLE_SENTENCE} {...defaultProps} />);

    const playButton = screen.getByRole("button", { name: "Replay sentence 1" });
    expect(playButton).toBeInTheDocument();
    expect(playButton.className).toContain("control-active");
  });
});
