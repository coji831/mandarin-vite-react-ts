/**
 * @file services/__tests__/pictographGalleryService.test.ts
 * @description Tests for pictographGalleryService
 * Story 21.21: Pictograph Warmup (Gallery + Mini-game)
 *
 * Tests: generateMatchQuestions output shape, options validity, uniqueness.
 */

import { describe, it, expect } from "vitest";
import { generateMatchQuestions, PICTOGRAPH_SET } from "../pictographGalleryService";

describe("pictographGalleryService", () => {
  describe("PICTOGRAPH_SET", () => {
    it("contains 20 pictographs", () => {
      expect(PICTOGRAPH_SET.length).toBe(20);
    });

    it("each pictograph has required fields", () => {
      for (const pictograph of PICTOGRAPH_SET) {
        expect(pictograph.glyph).toBeTruthy();
        expect(pictograph.meaning).toBeTruthy();
        expect(pictograph.etymology).toBeTruthy();
      }
    });
  });

  describe("generateMatchQuestions", () => {
    it("returns 10 questions by default", () => {
      const questions = generateMatchQuestions();
      expect(questions.length).toBe(10);
    });

    it("returns requested number of questions", () => {
      const questions = generateMatchQuestions(5);
      expect(questions.length).toBe(5);
    });

    it("does not exceed the number of available pictographs", () => {
      const questions = generateMatchQuestions(100);
      expect(questions.length).toBeLessThanOrEqual(PICTOGRAPH_SET.length);
    });

    it("each question has exactly 4 options", () => {
      const questions = generateMatchQuestions();
      for (const question of questions) {
        expect(question.options.length).toBe(4);
      }
    });

    it("correct answer is included in options", () => {
      const questions = generateMatchQuestions();
      for (const question of questions) {
        expect(question.options).toContain(question.correctAnswer);
      }
    });

    it("each question has a description", () => {
      const questions = generateMatchQuestions();
      for (const question of questions) {
        expect(question.oracleBoneDescription).toBeTruthy();
        expect(question.oracleBoneDescription.length).toBeGreaterThan(0);
      }
    });

    it("all options in a question are unique", () => {
      const questions = generateMatchQuestions();
      for (const question of questions) {
        const uniqueOptions = new Set(question.options);
        expect(uniqueOptions.size).toBe(4);
      }
    });

    it("no duplicate questions (different correct answers)", () => {
      const questions = generateMatchQuestions();
      const correctAnswers = questions.map((q) => q.correctAnswer);
      const uniqueAnswers = new Set(correctAnswers);
      expect(uniqueAnswers.size).toBe(questions.length);
    });

    it("options are valid pictographs from the set", () => {
      const allGlyphs = new Set(PICTOGRAPH_SET.map((p) => p.glyph));
      const questions = generateMatchQuestions();
      for (const question of questions) {
        for (const option of question.options) {
          expect(allGlyphs.has(option)).toBe(true);
        }
      }
    });
  });
});
