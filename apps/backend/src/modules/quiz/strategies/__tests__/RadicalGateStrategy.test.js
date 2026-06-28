/**
 * @file apps/backend/src/modules/quiz/strategies/__tests__/RadicalGateStrategy.test.js
 * Unit tests for RadicalGateStrategy
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock contentUtils before importing the strategy
const mockReadContentFiles = vi.fn();
vi.mock("../../../../shared/utils/contentUtils.js", () => ({
  readContentFiles: mockReadContentFiles,
  shuffleArray: (arr) => [...arr].sort(() => Math.random() - 0.5),
}));

const { radicalGateStrategy } = await import("../RadicalGateStrategy.js");

// Sample radical data for testing
const mockRadicalFiles = [
  {
    id: "rad_0001",
    glyph: "一",
    meaning: "one",
    is_recommended: true,
    name_pinyin: "yī",
    metadata: {
      hsk_characters: [
        { glyph: "一", pinyin: "yī", meaning: "one" },
        { glyph: "三", pinyin: "sān", meaning: "three" },
      ],
    },
  },
  {
    id: "rad_0008",
    glyph: "氵",
    meaning: "water",
    is_recommended: true,
    name_pinyin: "sāndiǎnshuǐ",
    metadata: {
      hsk_characters: [
        { glyph: "河", pinyin: "hé", meaning: "river" },
        { glyph: "海", pinyin: "hǎi", meaning: "sea" },
        { glyph: "江", pinyin: "jiāng", meaning: "river" },
      ],
    },
  },
  {
    id: "rad_0018",
    glyph: "口",
    meaning: "mouth",
    is_recommended: true,
    name_pinyin: "kǒu",
    metadata: {
      hsk_characters: [
        { glyph: "吃", pinyin: "chī", meaning: "eat" },
        { glyph: "喝", pinyin: "hē", meaning: "drink" },
        { glyph: "叫", pinyin: "jiào", meaning: "call" },
      ],
    },
  },
  {
    id: "rad_0061",
    glyph: "心",
    meaning: "heart",
    is_recommended: true,
    name_pinyin: "xīn",
    metadata: {
      hsk_characters: [
        { glyph: "想", pinyin: "xiǎng", meaning: "think" },
        { glyph: "思", pinyin: "sī", meaning: "think" },
      ],
    },
  },
  {
    id: "rad_0086",
    glyph: "火",
    meaning: "fire",
    is_recommended: false,
    name_pinyin: "huǒ",
    metadata: {
      hsk_characters: [{ glyph: "火", pinyin: "huǒ", meaning: "fire" }],
    },
  },
  {
    id: "rad_0096",
    glyph: "犭",
    meaning: "animal",
    is_recommended: false,
    name_pinyin: "quǎn",
    metadata: {
      hsk_characters: [{ glyph: "猫", pinyin: "māo", meaning: "cat" }],
    },
  },
];

describe("RadicalGateStrategy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("has correct type and metadata", () => {
    expect(radicalGateStrategy.type).toBe("radical-gate");
    expect(radicalGateStrategy.questionCount).toBe(20);
    expect(radicalGateStrategy.passThreshold).toBe(0.85);
    expect(radicalGateStrategy.timeLimitMinutes).toBe(15);
  });

  it("generates questions from radical content files", async () => {
    mockReadContentFiles.mockResolvedValue(mockRadicalFiles);
    const questions = await radicalGateStrategy.generateQuestions();

    expect(questions.length).toBeGreaterThanOrEqual(10);
    expect(questions.length).toBeLessThanOrEqual(20);

    // Should contain both Tier 1 and Tier 2 questions
    const tier1Questions = questions.filter((q) => q.category === "radical-core-lockdown");
    const tier2Questions = questions.filter((q) => q.category === "radical-predictor");

    expect(tier1Questions.length).toBeGreaterThanOrEqual(4);
    expect(tier2Questions.length).toBeGreaterThanOrEqual(4);
  });

  it("all questions have required structure", async () => {
    mockReadContentFiles.mockResolvedValue(mockRadicalFiles);
    const questions = await radicalGateStrategy.generateQuestions();

    for (const q of questions) {
      expect(q).toHaveProperty("id");
      expect(q).toHaveProperty("correctPinyin");
      expect(q).toHaveProperty("category");
      expect(["radical-core-lockdown", "radical-predictor"]).toContain(q.category);
      expect(q).toHaveProperty("character");
      expect(q).toHaveProperty("options");
      expect(q.options.length).toBe(4); // 1 correct + 3 distractors
    }
  });

  it("Tier 2 questions have a prompt", async () => {
    mockReadContentFiles.mockResolvedValue(mockRadicalFiles);
    const questions = await radicalGateStrategy.generateQuestions();
    const tier2 = questions.filter((q) => q.category === "radical-predictor");

    for (const q of tier2) {
      expect(q).toHaveProperty("prompt");
      expect(q.prompt.length).toBeGreaterThan(0);
    }
  });

  it("throws error when no radical files found", async () => {
    mockReadContentFiles.mockResolvedValue([]);
    await expect(radicalGateStrategy.generateQuestions()).rejects.toThrow(
      "Failed to load radical content files",
    );
  });

  describe("validateAnswer", () => {
    it("returns correct=true for matching Tier 1 option", () => {
      const question = {
        category: "radical-core-lockdown",
        correctPinyin: "rad_0008",
        character: "氵",
        options: [
          { glyph: "氵", meaning: "water", id: "rad_0008" },
          { glyph: "火", meaning: "fire", id: "rad_0086" },
        ],
      };

      const result = radicalGateStrategy.validateAnswer(question, { pinyin: "rad_0008" });
      expect(result.correct).toBe(true);
      expect(result.feedback).toContain("Correct!");
      expect(result.feedback).toContain("water");
    });

    it("returns correct=false for wrong Tier 1 option", () => {
      const question = {
        category: "radical-core-lockdown",
        correctPinyin: "rad_0008",
        character: "氵",
        options: [
          { glyph: "氵", meaning: "water", id: "rad_0008" },
          { glyph: "火", meaning: "fire", id: "rad_0086" },
        ],
      };

      const result = radicalGateStrategy.validateAnswer(question, { pinyin: "rad_0086" });
      expect(result.correct).toBe(false);
      expect(result.feedback).toContain("water");
    });

    it("returns correct=true for matching Tier 2 option", () => {
      const question = {
        category: "radical-predictor",
        correctPinyin: "rad_0096",
        character: "猫",
        displayPinyin: "māo",
        meaning: "cat",
        options: [
          { glyph: "犭", meaning: "animal", id: "rad_0096" },
          { glyph: "氵", meaning: "water", id: "rad_0008" },
        ],
      };

      const result = radicalGateStrategy.validateAnswer(question, { pinyin: "rad_0096" });
      expect(result.correct).toBe(true);
      expect(result.feedback).toContain("Correct!");
      expect(result.feedback).toContain("animal");
      expect(result.feedback).toContain("cat");
    });

    it("returns correct=false for wrong Tier 2 option", () => {
      const question = {
        category: "radical-predictor",
        correctPinyin: "rad_0096",
        character: "猫",
        displayPinyin: "māo",
        meaning: "cat",
        options: [
          { glyph: "犭", meaning: "animal", id: "rad_0096" },
          { glyph: "氵", meaning: "water", id: "rad_0008" },
        ],
      };

      const result = radicalGateStrategy.validateAnswer(question, { pinyin: "rad_0008" });
      expect(result.correct).toBe(false);
      expect(result.feedback).toContain("animal");
      expect(result.feedback).toContain("cat");
    });
  });
});
