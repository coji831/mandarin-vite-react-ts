/**
 * @file components/ReadingView/__tests__/ReadingView.test.tsx
 * @description Tests for ReadingView component
 * Story 21.4: Reading UI + LexicalHub Phase 1
 * VisFix W6b: Completion state tests — resets readingStore between tests.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReadingView } from "../ReadingView";
import type { PassageDetail } from "../ReadingView";
import { useReadingStore } from "../../stores";

const SAMPLE_PASSAGE: PassageDetail = {
  id: "p1",
  title: "Test Passage",
  hskLevel: 2,
  sentences: [
    { index: 0, text: "你好。", pinyin: "nǐ hǎo.", words: [] },
    { index: 1, text: "再见。", pinyin: "zài jiàn.", words: [] },
  ],
};

// LAST_SENTENCE_INDEX — SAMPLE_PASSAGE has 2 sentences (indices 0 and 1).
const LAST_SENTENCE_INDEX = SAMPLE_PASSAGE.sentences.length - 1;

describe("ReadingView", () => {
  const onBack = vi.fn();
  const onRetry = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the shared store so tests are deterministic (completion tests
    // advance currentSentence; restoreSession no-ops when unauthenticated).
    useReadingStore.setState({
      currentSentence: 0,
      isAuthenticated: false,
      completedPassages: new Set<string>(),
    });
  });

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

  // ── VisFix W6b: Completion state ────────────────────────────────────────

  it("does not show completion before the last sentence", () => {
    useReadingStore.setState({ currentSentence: 0 });

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

    expect(screen.queryByLabelText("Passage complete")).not.toBeInTheDocument();
  });

  it("renders the completion state at the last sentence", () => {
    useReadingStore.setState({ currentSentence: LAST_SENTENCE_INDEX });

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

    const completionBlock = screen.getByLabelText("Passage complete");
    expect(completionBlock).toBeInTheDocument();
    expect(screen.getByText("Passage complete!")).toBeInTheDocument();
    expect(screen.getByText(/You finished reading/)).toBeInTheDocument();
    expect(completionBlock).toHaveTextContent(SAMPLE_PASSAGE.title);
    expect(screen.getByText("Back to Library")).toBeInTheDocument();
    expect(screen.getByText("Completed ✓")).toBeInTheDocument();
  });

  it("fires onComplete when the final sentence is reached", () => {
    const onComplete = vi.fn();
    useReadingStore.setState({ currentSentence: LAST_SENTENCE_INDEX });

    render(
      <ReadingView
        passage={SAMPLE_PASSAGE}
        onBack={onBack}
        isLoading={false}
        hasError={false}
        onRetry={onRetry}
        onComplete={onComplete}
      >
        <div>content</div>
      </ReadingView>,
    );

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("back to library returns from the completion state", async () => {
    const onBack = vi.fn();
    useReadingStore.setState({ currentSentence: LAST_SENTENCE_INDEX });

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

    // Exact match — the header's back button has aria-label "Back to library".
    await userEvent.click(screen.getByRole("button", { name: "Back to Library" }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
