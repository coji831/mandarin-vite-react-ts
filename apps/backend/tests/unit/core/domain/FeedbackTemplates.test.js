/**
 * Test suite for FeedbackTemplates
 * Story 15.11: Template-based feedback generation
 */

import { describe, it, expect } from "vitest";
import {
  classifyErrorType,
  generateTemplateFeedback,
  getFallbackFeedback,
} from "../../../../src/core/domain/feedback/FeedbackTemplates.js";

describe("FeedbackTemplates", () => {
  describe("classifyErrorType", () => {
    it("should classify tone error for different tone marks", () => {
      const word = { simplified: "妈", pinyin: "mā" };
      const errorType = classifyErrorType("mǎ", "mā", word, "type_pinyin");
      expect(errorType).toBe("tone");
    });

    it("should classify character error for different Chinese characters", () => {
      const word = { simplified: "妈", pinyin: "mā" };
      const errorType = classifyErrorType("马", "妈", word, "type_character");
      expect(errorType).toBe("character");
    });

    it("should classify meaning error for multiple choice mismatches", () => {
      const word = {
        simplified: "妈",
        pinyin: "mā",
        english: "mother",
      };
      const errorType = classifyErrorType("brother", "mother", word, "multiple_choice");
      expect(errorType).toBe("meaning");
    });

    it("should handle case-insensitive comparison", () => {
      const word = { simplified: "妈", pinyin: "mā" };
      const errorType = classifyErrorType("MA", "mā", word, "type_pinyin");
      // Should be either tone or meaning depending on logic
      expect(["tone", "meaning"]).toContain(errorType);
    });
  });

  describe("generateTemplateFeedback", () => {
    it("should generate tone error feedback with correct parameters", () => {
      const word = {
        simplified: "妈",
        traditional: "媽",
        pinyin: "mā",
        english: "mother",
      };
      const feedback = generateTemplateFeedback({
        errorType: "tone",
        userAnswer: "mǎ",
        correctAnswer: "mā",
        word,
      });

      expect(feedback.explanation).toBeDefined();
      expect(feedback.errorType).toBe("tone");
      expect(feedback.tip).toBeDefined();
      // Should contain word reference
      expect(feedback.explanation.toLowerCase()).toMatch(/tone|correct/);
    });

    it("should generate character error feedback", () => {
      const word = {
        simplified: "妈",
        traditional: "媽",
        pinyin: "mā",
        english: "mother",
      };
      const feedback = generateTemplateFeedback({
        errorType: "character",
        userAnswer: "马",
        correctAnswer: "妈",
        word,
      });

      expect(feedback.explanation).toBeDefined();
      expect(feedback.errorType).toBe("character");
      expect(feedback.tip).toContain("character"); // Tip should mention character focus
    });

    it("should generate pinyin error feedback", () => {
      const word = {
        simplified: "妈",
        traditional: "媽",
        pinyin: "mā",
        english: "mother",
      };
      const feedback = generateTemplateFeedback({
        errorType: "pinyin",
        userAnswer: "ba",
        correctAnswer: "ma",
        word,
      });

      expect(feedback.explanation).toBeDefined();
      expect(feedback.errorType).toBe("pinyin");
    });

    it("should generate meaning error feedback", () => {
      const word = {
        simplified: "妈",
        traditional: "媽",
        pinyin: "mā",
        english: "mother",
      };
      const feedback = generateTemplateFeedback({
        errorType: "meaning",
        userAnswer: "father",
        correctAnswer: "mother",
        word,
      });

      expect(feedback.explanation).toBeDefined();
      expect(feedback.errorType).toBe("meaning");
      expect(feedback.explanation).toContain("mother");
    });

    it("should substitute all template parameters", () => {
      const word = {
        simplified: "好",
        traditional: "好",
        pinyin: "hǎo",
        english: "good",
      };
      const feedback = generateTemplateFeedback({
        errorType: "meaning",
        userAnswer: "bad",
        correctAnswer: "good",
        word,
      });

      // Should contain substituted values
      expect(feedback.explanation).toContain("好"); // hanzi
      expect(feedback.explanation).toContain("good"); // definition
    });
  });

  describe("getFallbackFeedback", () => {
    it("should return generic fallback feedback with user answers", () => {
      const feedback = getFallbackFeedback("test", "correct");

      expect(feedback.explanation).toBeDefined();
      expect(feedback.errorType).toBe("generic");
      expect(feedback.tip).toBeDefined();
      // Should include user answers
      expect(feedback.explanation).toContain("test");
      expect(feedback.explanation).toContain("correct");
    });

    it("should include helpful tip in fallback", () => {
      const feedback = getFallbackFeedback("userTest", "correctTest");

      expect(feedback.tip).toMatch(/practice|memory/i);
    });
  });

  describe("Edge cases", () => {
    it("should handle undefined word properties gracefully", () => {
      const word = { simplified: "妈" }; // Missing some properties

      const feedback = generateTemplateFeedback({
        errorType: "tone",
        userAnswer: "mǎ",
        correctAnswer: "mā",
        word,
      });

      expect(feedback).toBeDefined();
      expect(feedback.explanation).toBeDefined();
    });

    it("should handle empty strings gracefully", () => {
      const word = {
        simplified: "妈",
        pinyin: "mā",
        english: "mother",
      };

      const feedback = generateTemplateFeedback({
        errorType: "meaning",
        userAnswer: "",
        correctAnswer: "mother",
        word,
      });

      expect(feedback).toBeDefined();
      expect(feedback.errorType).toBe("meaning");
    });

    it("should handle unknown error types", () => {
      const word = {
        simplified: "妈",
        pinyin: "mā",
        english: "mother",
      };

      // Should fall back gracefully
      const feedback = generateTemplateFeedback({
        errorType: "unknown",
        userAnswer: "test",
        correctAnswer: "mother",
        word,
      });

      expect(feedback).toBeDefined();
    });
  });
});
