/**
 * @file components/pinyin/__tests__/SlidingPinyinGrid.test.tsx
 * @description Tests for SlidingPinyinGrid cell display.
 *
 * The visible cell text strips the trailing tone digit ("ba1" → "ba") so the
 * grid never shows raw tone numbers, while the tone color still derives from
 * the tone number via TONE_COLORS[extractToneNumber(firstTone)].
 *
 * NOTE: useDragToPan is a pure ref-based hook (no side effects on render), so
 * it renders fine in jsdom without mocking. The component is presentational.
 */

/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SlidingPinyinGrid } from "../SlidingPinyinGrid";

const baseProps = {
  initials: [{ id: "b", pinyin: "b", description: "b" }],
  finals: [
    { id: "a", pinyin: "a", description: "a" },
    { id: "ai", pinyin: "ai", description: "ai" },
  ],
  combinations: [
    { initial: "b", final: "a", tones: ["ba1", "ba2", "ba3", "ba4", "ba5"] },
    // No valid combination → cell shows the "—" placeholder.
    { initial: "b", final: "ai", tones: [null, null, null, null, null] },
  ],
};

describe("SlidingPinyinGrid", () => {
  it('shows the plain pinyin ("ba") instead of the tone number ("ba1") in a valid cell', () => {
    render(<SlidingPinyinGrid {...baseProps} />);

    // Visible text is the stripped plain form — never the raw tone-number form.
    expect(screen.getByText("ba")).toBeInTheDocument();
    expect(screen.queryByText("ba1")).not.toBeInTheDocument();
  });

  it('shows "—" for an empty combination cell', () => {
    render(<SlidingPinyinGrid {...baseProps} />);

    expect(screen.getByText("—")).toBeInTheDocument();
  });
});
