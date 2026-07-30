/**
 * @file services/__tests__/sandhiDrillService.test.ts
 * @description Tests for sandhiDrillService (Story 21.17)
 *
 * Tests: calculateScore with all correct, mixed results, per-rule breakdown.
 */

import { describe, it, expect } from "vitest";
import { calculateScore } from "../sandhiDrillService";
import type { SandhiAnswer } from "../sandhiDrillService";

describe("sandhiDrillService", () => {
  describe("calculateScore", () => {
    it("returns perfect score when all answers are correct", () => {
      const answers: SandhiAnswer[] = [
        { questionId: "1", selected: "ní hǎo", correctAnswer: "ní hǎo", ruleId: "3-3-sandhi" },
        { questionId: "2", selected: "bú shì", correctAnswer: "bú shì", ruleId: "bu-before-4th" },
        { questionId: "3", selected: "yí gè", correctAnswer: "yí gè", ruleId: "yi-before-4th" },
      ];

      const result = calculateScore(answers);

      expect(result.score).toBe(3);
      expect(result.total).toBe(3);
      expect(result.ruleScores["3-3-sandhi"].correct).toBe(1);
      expect(result.ruleScores["3-3-sandhi"].total).toBe(1);
    });

    it("returns zero score when all answers are wrong", () => {
      const answers: SandhiAnswer[] = [
        { questionId: "1", selected: "nǐ hǎo", correctAnswer: "ní hǎo", ruleId: "3-3-sandhi" },
        { questionId: "2", selected: "bù shì", correctAnswer: "bú shì", ruleId: "bu-before-4th" },
      ];

      const result = calculateScore(answers);

      expect(result.score).toBe(0);
      expect(result.total).toBe(2);
    });

    it("returns mixed results correctly", () => {
      const answers: SandhiAnswer[] = [
        { questionId: "1", selected: "ní hǎo", correctAnswer: "ní hǎo", ruleId: "3-3-sandhi" },
        { questionId: "2", selected: "bù shì", correctAnswer: "bú shì", ruleId: "bu-before-4th" },
        { questionId: "3", selected: "yí gè", correctAnswer: "yí gè", ruleId: "yi-before-4th" },
        { questionId: "4", selected: "bú huì", correctAnswer: "bú huì", ruleId: "bu-before-4th" },
      ];

      const result = calculateScore(answers);

      expect(result.score).toBe(3);
      expect(result.total).toBe(4);
    });

    it("provides per-rule breakdown with multiple questions per rule", () => {
      const answers: SandhiAnswer[] = [
        { questionId: "1", selected: "ní hǎo", correctAnswer: "ní hǎo", ruleId: "3-3-sandhi" },
        { questionId: "2", selected: "hěn hǎo", correctAnswer: "hén hǎo", ruleId: "3-3-sandhi" },
        { questionId: "3", selected: "bú shì", correctAnswer: "bú shì", ruleId: "bu-before-4th" },
        { questionId: "4", selected: "bù huì", correctAnswer: "bú huì", ruleId: "bu-before-4th" },
      ];

      const result = calculateScore(answers);

      expect(result.ruleScores["3-3-sandhi"]).toEqual({ correct: 1, total: 2 });
      expect(result.ruleScores["bu-before-4th"]).toEqual({ correct: 1, total: 2 });
    });

    it("handles empty answers array", () => {
      const result = calculateScore([]);

      expect(result.score).toBe(0);
      expect(result.total).toBe(0);
      expect(result.ruleScores).toEqual({});
    });

    it("handles unknown rule IDs gracefully", () => {
      const answers: SandhiAnswer[] = [
        { questionId: "1", selected: "test", correctAnswer: "test", ruleId: "unknown-rule" },
      ];

      const result = calculateScore(answers);

      expect(result.score).toBe(1);
      expect(result.total).toBe(1);
      expect(result.ruleScores["unknown-rule"]).toEqual({ correct: 1, total: 1 });
    });
  });
});
