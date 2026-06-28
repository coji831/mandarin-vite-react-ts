/**
 * @file apps/backend/src/modules/quiz/strategies/__tests__/RadicalSplitterStrategy.test.js
 * Unit tests for RadicalSplitterStrategy
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock contentUtils before importing the strategy
const mockReadContentFiles = vi.fn();
vi.mock("../../../../shared/utils/contentUtils.js", () => ({
  readContentFiles: mockReadContentFiles,
  shuffleArray: (arr) => [...arr].sort(() => Math.random() - 0.5),
}));

const { radicalSplitterStrategy } = await import("../RadicalSplitterStrategy.js");

describe("RadicalSplitterStrategy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("has correct type and metadata", () => {
    expect(radicalSplitterStrategy.type).toBe("radical-splitter");
    expect(radicalSplitterStrategy.questionCount).toBe(20);
    expect(radicalSplitterStrategy.passThreshold).toBe(0.7);
    expect(radicalSplitterStrategy.timeLimitMinutes).toBe(10);
  });

  it("generates questions from radical content files", async () => {
    mockReadContentFiles.mockResolvedValue([
      {
        id: "rad_0018",
        glyph: "口",
        meaning: "mouth",
        metadata: {
          hsk_characters: [
            { glyph: "吃", pinyin: "chī", meaning: "eat" },
            { glyph: "喝", pinyin: "hē", meaning: "drink" },
          ],
        },
      },
      {
        id: "rad_0008",
        glyph: "氵",
        meaning: "water",
        metadata: {
          hsk_characters: [
            { glyph: "河", pinyin: "hé", meaning: "river" },
            { glyph: "海", pinyin: "hǎi", meaning: "sea" },
          ],
        },
      },
      {
        id: "rad_0061",
        glyph: "心",
        meaning: "heart",
        metadata: {
          hsk_characters: [{ glyph: "想", pinyin: "xiǎng", meaning: "think" }],
        },
      },
    ]);

    const questions = await radicalSplitterStrategy.generateQuestions();

    expect(questions.length).toBeGreaterThan(0);
    expect(questions.length).toBeLessThanOrEqual(20);

    // Each question should have the required structure
    for (const q of questions) {
      expect(q).toHaveProperty("id");
      expect(q).toHaveProperty("category", "radical-splitter");
      expect(q).toHaveProperty("character");
      expect(q).toHaveProperty("options");
      expect(q.options.length).toBe(3); // 1 correct + 2 distractors
      expect(q).toHaveProperty("correctPinyin");
    }
  });

  it("throws error when no radical files found", async () => {
    mockReadContentFiles.mockResolvedValue([]);
    await expect(radicalSplitterStrategy.generateQuestions()).rejects.toThrow(
      "Failed to load radical content files",
    );
  });

  it("validateAnswer returns correct=true for matching option", () => {
    const question = {
      correctPinyin: "rad_0018",
      options: [
        { glyph: "口", meaning: "mouth", id: "rad_0018" },
        { glyph: "氵", meaning: "water", id: "rad_0008" },
        { glyph: "心", meaning: "heart", id: "rad_0061" },
      ],
      character: "吃",
      displayPinyin: "chī",
    };

    const result = radicalSplitterStrategy.validateAnswer(question, { pinyin: "rad_0018" });
    expect(result.correct).toBe(true);
    expect(result.feedback).toContain("Correct!");
  });

  it("validateAnswer returns correct=false for wrong option", () => {
    const question = {
      correctPinyin: "rad_0018",
      options: [
        { glyph: "口", meaning: "mouth", id: "rad_0018" },
        { glyph: "氵", meaning: "water", id: "rad_0008" },
        { glyph: "心", meaning: "heart", id: "rad_0061" },
      ],
      character: "吃",
      displayPinyin: "chī",
    };

    const result = radicalSplitterStrategy.validateAnswer(question, { pinyin: "rad_0008" });
    expect(result.correct).toBe(false);
    expect(result.feedback).toContain("Not quite");
  });
});
