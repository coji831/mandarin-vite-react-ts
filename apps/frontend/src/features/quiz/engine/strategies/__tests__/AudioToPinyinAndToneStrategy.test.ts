/**
 * @file features/quiz/engine/strategies/__tests__/AudioToPinyinAndToneStrategy.test.ts
 * @description Grading-parity tests for the Phase 1 gate quiz strategy.
 *
 * Covers the Phase 1a fix: pinyin grading uses `normalizePinyinForComparison`
 * (so "ba" / "ba1" / "bā" all compare equal) and tone grading uses
 * `areTonesEquivalent` (neutral 0≡5). Also verifies the Phase 3 `expectedPinyin`
 * typed field is preferred over the deprecated `correctPinyin`.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../services/quizService", () => ({
  quizService: { fetchQuestions: vi.fn() },
}));

import { audioToPinyinAndToneStrategy } from "../AudioToPinyinAndToneStrategy";
import type { QuizQuestion } from "../../../types";

const makeQuestion = (overrides: Partial<QuizQuestion> = {}): QuizQuestion => ({
  id: "q1",
  audioKey: "bā",
  correctPinyin: "ba1",
  correctTone: 1,
  category: "pinyin",
  displayPinyin: "bā",
  ...overrides,
});

describe("AudioToPinyinAndToneStrategy — grading parity", () => {
  beforeEach(() => vi.clearAllMocks());

  it("accepts plain pinyin against a digit-suffixed correctPinyin (ba vs ba1)", () => {
    const result = audioToPinyinAndToneStrategy.evaluateAnswer(makeQuestion(), "ba", 1);
    expect(result.correct).toBe(true);
  });

  it("accepts a digit-suffixed user input (ba1 vs ba1)", () => {
    const result = audioToPinyinAndToneStrategy.evaluateAnswer(makeQuestion(), "ba1", 1);
    expect(result.correct).toBe(true);
  });

  it("accepts tone-marked user input (bā vs ba1)", () => {
    const result = audioToPinyinAndToneStrategy.evaluateAnswer(makeQuestion(), "bā", 1);
    expect(result.correct).toBe(true);
  });

  it("rejects a wrong pinyin (ma vs ba1)", () => {
    const result = audioToPinyinAndToneStrategy.evaluateAnswer(makeQuestion(), "ma", 1);
    expect(result.correct).toBe(false);
  });

  it("treats neutral tones 0 and 5 as equivalent", () => {
    const q = makeQuestion({ correctTone: 5, correctPinyin: "ma5" });
    const result = audioToPinyinAndToneStrategy.evaluateAnswer(q, "ma", 0);
    expect(result.correct).toBe(true);
  });

  it("prefers the Phase 3 expectedPinyin field when present", () => {
    const q = makeQuestion({ correctPinyin: "completely-different", expectedPinyin: "ba1" });
    const result = audioToPinyinAndToneStrategy.evaluateAnswer(q, "ba", 1);
    expect(result.correct).toBe(true);
  });

  it("still accepts sandhi-compliant tones", () => {
    const q = makeQuestion({
      correctTone: 3,
      correctPinyin: "ni3",
      isSandhiQuestion: true,
      sandhiRule: "3-3",
    });
    const result = audioToPinyinAndToneStrategy.evaluateAnswer(q, "ni", 2);
    expect(result.correct).toBe(true);
  });

  it("rejects a wrong tone", () => {
    const result = audioToPinyinAndToneStrategy.evaluateAnswer(makeQuestion(), "ba", 4);
    expect(result.correct).toBe(false);
  });
});
