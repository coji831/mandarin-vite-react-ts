/**
 * @file features/quiz/components/results/__tests__/CategoryBreakdown.test.tsx
 * @description Grading-parity tests for the local fallback computation in
 * CategoryBreakdown (used when the backend breakdown is unavailable).
 *
 * Covers the Phase 1a fix: pinyin scores use `normalizePinyinForComparison`
 * (trailing-digit/mark-insensitive) and tone scores use `areTonesEquivalent`
 * (neutral 0≡5).
 */

/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CategoryBreakdown } from "../CategoryBreakdown";
import type { AnswerResult } from "../../../types";

function answer(overrides: Partial<AnswerResult> = {}): AnswerResult {
  return {
    correct: true,
    userPinyin: "ba",
    userTone: 1,
    correctPinyin: "ba1",
    correctTone: 1,
    feedback: "",
    toneDescription: "",
    ...overrides,
  };
}

describe("CategoryBreakdown — grading parity (local fallback)", () => {
  it("counts pinyin correct when only the trailing digit differs (ba vs ba1)", () => {
    render(
      <CategoryBreakdown
        answers={[answer(), answer({ userPinyin: "ni", correctPinyin: "ma4" })]}
        total={2}
      />,
    );
    // Pinyin bar: 1/2 (ni ≠ ma). Tone bar: 2/2 (both tone 1).
    expect(screen.getByText("1/2 (50%)")).toBeInTheDocument();
    expect(screen.getByText("2/2 (100%)")).toBeInTheDocument();
  });

  it("treats neutral tones 0 and 5 as equivalent in both bars", () => {
    render(<CategoryBreakdown answers={[answer({ userTone: 0, correctTone: 5 })]} total={1} />);
    // Pinyin (ba vs ba1) and tone (0 ≡ 5) both score 1/1.
    expect(screen.getAllByText("1/1 (100%)")).toHaveLength(2);
  });

  it("counts tone-marked pinyin as equal (bā vs ba1)", () => {
    render(
      <CategoryBreakdown
        answers={[answer({ userPinyin: "bā", correctPinyin: "ba1" })]}
        total={1}
      />,
    );
    expect(screen.getAllByText("1/1 (100%)")).toHaveLength(2);
  });

  it("returns null when there are no answers", () => {
    const { container } = render(<CategoryBreakdown answers={[]} total={0} />);
    expect(container.firstChild).toBeNull();
  });
});
