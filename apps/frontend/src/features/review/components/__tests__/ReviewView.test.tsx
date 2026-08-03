/**
 * @file features/review/components/__tests__/ReviewView.test.tsx
 * @description Tests for ReviewView — session header is a real h1 (WCAG).
 * VisFix W4: the "🃏 Review · <ContentType>s · n of m" title was a generic
 * span; it is now an <h1> so the review session page exposes a heading.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ReviewView } from "../ReviewView";

vi.mock("../../hooks/useReview", () => ({
  useReview: () => ({
    step: "pinyin",
    currentItem: {
      itemId: "rad_0001",
      itemType: "radical",
      character: "大",
      front: "dà",
      meaning: "big",
      pinyinPlain: "da",
    },
    loading: false,
    error: null,
    startReview: vi.fn(),
    submitPinyin: vi.fn(),
    selectOption: vi.fn(),
    selectTone: vi.fn(),
    rateItem: vi.fn(),
    progress: { current: 1, total: 10 },
    userPinyin: "",
    userTone: 0,
    pinyinCorrect: false,
    toneCorrect: false,
    sessionResult: {
      pinyinCorrect: 0,
      pinyinTotal: 0,
      toneCorrect: 0,
      toneTotal: 0,
      ratings: { easy: 0, good: 0, again: 0 },
    },
    totalItems: 10,
    contentType: "radical",
    source: "due",
  }),
}));

vi.mock("shared/hooks", () => ({
  useAudioItemPlayback: () => ({ play: vi.fn() }),
}));

vi.mock("../ReviewCard", () => ({
  ReviewCard: () => <div>review-card</div>,
}));
vi.mock("../ReviewPicker", () => ({
  ReviewPicker: () => <div>review-picker</div>,
}));
vi.mock("../ReviewComplete", () => ({
  ReviewComplete: () => <div>review-complete</div>,
}));

describe("ReviewView", () => {
  it("renders the session header as an h1 with the content type", () => {
    render(<ReviewView onBack={vi.fn()} presetType="pinyin" presetSource="due" />);

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent("Review");
    expect(heading).toHaveTextContent("Radicals");
    expect(heading).toHaveTextContent("1 of 10");
  });
});
