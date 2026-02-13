/**
 * Tests for interleaving utilities
 * Story 15.6: Quiz Container & State Management
 */

import { describe, it, expect } from "vitest";
import { createInterleavedQuestions, generateDistractors } from "../../utils/interleaving";

const MOCK_WORDS = [
  { id: "1", chinese: "你好", pinyin: "nǐhǎo", english: "hello" },
  { id: "2", chinese: "谢谢", pinyin: "xièxie", english: "thank you" },
  { id: "3", chinese: "再见", pinyin: "zàijiàn", english: "goodbye" },
  { id: "4", chinese: "是", pinyin: "shì", english: "yes" },
];

describe("createInterleavedQuestions", () => {
  it("creates one question per word", () => {
    const questions = createInterleavedQuestions(MOCK_WORDS);
    expect(questions).toHaveLength(MOCK_WORDS.length);
  });

  it("assigns word properties correctly", () => {
    const questions = createInterleavedQuestions(MOCK_WORDS);

    questions.forEach((question, index) => {
      expect(question.wordId).toBe(MOCK_WORDS[index].id);
      expect(question.word).toBe(MOCK_WORDS[index].chinese);
      expect(question.pinyin).toBe(MOCK_WORDS[index].pinyin);
      expect(question.english).toBe(MOCK_WORDS[index].english);
    });
  });

  it("assigns random modes from available types", () => {
    const questions = createInterleavedQuestions(MOCK_WORDS);
    const validModes = ["multiple_choice", "type_pinyin", "type_character"];

    questions.forEach((question) => {
      expect(validModes).toContain(question.mode);
    });
  });

  it("includes options for multiple_choice mode", () => {
    // Run multiple times to ensure we hit multiple_choice mode
    let foundMultipleChoice = false;

    for (let i = 0; i < 20; i++) {
      const questions = createInterleavedQuestions(MOCK_WORDS);
      const mcQuestion = questions.find((q) => q.mode === "multiple_choice");

      if (mcQuestion) {
        expect(mcQuestion.options).toBeDefined();
        expect(mcQuestion.options).toHaveLength(4);
        foundMultipleChoice = true;
        break;
      }
    }

    // Should find at least one multiple choice question in 20 attempts
    expect(foundMultipleChoice).toBe(true);
  });

  it("does not include options for type modes", () => {
    // Run multiple times to ensure we hit type modes
    let foundTypeMode = false;

    for (let i = 0; i < 20; i++) {
      const questions = createInterleavedQuestions(MOCK_WORDS);
      const typeQuestion = questions.find(
        (q) => q.mode === "type_pinyin" || q.mode === "type_character",
      );

      if (typeQuestion) {
        expect(typeQuestion.options).toBeUndefined();
        foundTypeMode = true;
        break;
      }
    }

    expect(foundTypeMode).toBe(true);
  });
});

describe("generateDistractors", () => {
  it("returns 4 options", () => {
    const options = generateDistractors(MOCK_WORDS[0], MOCK_WORDS);
    expect(options).toHaveLength(4);
  });

  it("includes the correct answer", () => {
    const options = generateDistractors(MOCK_WORDS[0], MOCK_WORDS);
    expect(options).toContain(MOCK_WORDS[0].english);
  });

  it("includes 3 distractors", () => {
    const correctWord = MOCK_WORDS[0];
    const options = generateDistractors(correctWord, MOCK_WORDS);

    const distractorCount = options.filter((opt) => opt !== correctWord.english).length;
    expect(distractorCount).toBe(3);
  });

  it("shuffles options (correct answer not always in same position)", () => {
    const positions = new Set<number>();

    // Run multiple times to check randomization
    for (let i = 0; i < 10; i++) {
      const options = generateDistractors(MOCK_WORDS[0], MOCK_WORDS);
      const correctIndex = options.indexOf(MOCK_WORDS[0].english);
      positions.add(correctIndex);
    }

    // Should have correct answer in multiple positions
    expect(positions.size).toBeGreaterThan(1);
  });

  it("handles minimal word pool (4 words)", () => {
    const minimalWords = MOCK_WORDS.slice(0, 4);
    const options = generateDistractors(minimalWords[0], minimalWords);

    expect(options).toHaveLength(4);
    expect(options).toContain(minimalWords[0].english);
  });
});
