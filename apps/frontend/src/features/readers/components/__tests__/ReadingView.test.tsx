/**
 * @file components/ReadingView/__tests__/ReadingView.test.tsx
 * @description Tests for ReadingView component
 * Story 21.4: Reading UI + LexicalHub Phase 1
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReadingView } from "../ReadingView";
import type { PassageDetail } from "../ReadingView";

const SAMPLE_PASSAGE: PassageDetail = {
  id: "p1",
  title: "Test Passage",
  hskLevel: 2,
  sentences: [
    { index: 0, text: "你好。", pinyin: "nǐ hǎo.", words: [] },
    { index: 1, text: "再见。", pinyin: "zài jiàn.", words: [] },
  ],
};

describe("ReadingView", () => {
  const onBack = vi.fn();
  const onRetry = vi.fn();

  it("renders passage title", () => {
    render(
      <ReadingView
        passage={SAMPLE_PASSAGE}
        onBack={onBack}
        isLoading={false}
        hasError={false}
        onRetry={onRetry}
      >
        <div>content</div>
      </ReadingView>,
    );
    expect(screen.getByText("Test Passage")).toBeInTheDocument();
  });

  it("renders HSK badge", () => {
    render(
      <ReadingView
        passage={SAMPLE_PASSAGE}
        onBack={onBack}
        isLoading={false}
        hasError={false}
        onRetry={onRetry}
      >
        <div>content</div>
      </ReadingView>,
    );
    expect(screen.getByText("HSK 2")).toBeInTheDocument();
  });

  it("renders children content", () => {
    render(
      <ReadingView
        passage={SAMPLE_PASSAGE}
        onBack={onBack}
        isLoading={false}
        hasError={false}
        onRetry={onRetry}
      >
        <div>Sentence content here</div>
      </ReadingView>,
    );
    expect(screen.getByText("Sentence content here")).toBeInTheDocument();
  });

  it("calls onBack when back button clicked", async () => {
    const onBack = vi.fn();
    render(
      <ReadingView
        passage={SAMPLE_PASSAGE}
        onBack={onBack}
        isLoading={false}
        hasError={false}
        onRetry={onRetry}
      >
        <div>content</div>
      </ReadingView>,
    );

    await userEvent.click(screen.getByLabelText("Back to library"));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("renders loading skeleton when isLoading", () => {
    render(
      <ReadingView
        passage={SAMPLE_PASSAGE}
        onBack={onBack}
        isLoading={true}
        hasError={false}
        onRetry={onRetry}
      >
        <div>content</div>
      </ReadingView>,
    );

    expect(screen.getByLabelText("Loading passage")).toBeInTheDocument();
    expect(screen.queryByText("Test Passage")).not.toBeInTheDocument();
  });

  it("renders error screen when hasError", () => {
    render(
      <ReadingView
        passage={SAMPLE_PASSAGE}
        onBack={onBack}
        isLoading={false}
        hasError={true}
        onRetry={onRetry}
      >
        <div>content</div>
      </ReadingView>,
    );

    expect(screen.getByText("Unable to load passage")).toBeInTheDocument();
    expect(screen.getByText(/Failed to load this passage/)).toBeInTheDocument();
  });

  it("calls onRetry from error screen", async () => {
    const onRetry = vi.fn();
    render(
      <ReadingView
        passage={SAMPLE_PASSAGE}
        onBack={onBack}
        isLoading={false}
        hasError={true}
        onRetry={onRetry}
      >
        <div>content</div>
      </ReadingView>,
    );

    await userEvent.click(screen.getByText("Try Again"));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
