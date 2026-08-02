/**
 * @file apps/backend/src/modules/quiz/strategies/__tests__/RadicalGateStrategy.test.js
 * Unit tests for RadicalGateStrategy
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the Prisma client before importing the strategy (all-in-DB — the
// strategy now reads radicals + the CharacterRadical junction from the DB).
const mockRadicalFindMany = vi.fn();
const mockCharacterRadicalFindMany = vi.fn();
vi.mock("../../../../shared/infrastructure/database/client.js", () => ({
  prisma: {
    radical: { findMany: mockRadicalFindMany },
    characterRadical: { findMany: mockCharacterRadicalFindMany },
  },
}));

const { radicalGateStrategy } = await import("../RadicalGateStrategy.js");

// Sample radical rows — DB shape (Radical table: camelCase columns).
const mockRadicalFiles = [
  { id: "rad_0001", glyph: "一", meaning: "one", isRecommended: true, namePinyin: "yī" },
  { id: "rad_0008", glyph: "氵", meaning: "water", isRecommended: true, namePinyin: "sāndiǎnshuǐ" },
  { id: "rad_0018", glyph: "口", meaning: "mouth", isRecommended: true, namePinyin: "kǒu" },
  { id: "rad_0061", glyph: "心", meaning: "heart", isRecommended: true, namePinyin: "xīn" },
  { id: "rad_0086", glyph: "火", meaning: "fire", isRecommended: false, namePinyin: "huǒ" },
  { id: "rad_0096", glyph: "犭", meaning: "animal", isRecommended: false, namePinyin: "quǎn" },
];

// Sample CharacterRadical junction rows — the strategy derives Tier 2 HSK
// characters from these (CharacterRadical → Character).
const mockCharacterRadicals = [
  {
    characterGlyph: "一",
    radicalId: "rad_0001",
    character: {
      glyph: "一",
      definition: "one",
      characterReadings: [{ pinyin: "yī", type: "primary" }],
    },
  },
  {
    characterGlyph: "三",
    radicalId: "rad_0001",
    character: {
      glyph: "三",
      definition: "three",
      characterReadings: [{ pinyin: "sān", type: "primary" }],
    },
  },
  {
    characterGlyph: "河",
    radicalId: "rad_0008",
    character: {
      glyph: "河",
      definition: "river",
      characterReadings: [{ pinyin: "hé", type: "primary" }],
    },
  },
  {
    characterGlyph: "海",
    radicalId: "rad_0008",
    character: {
      glyph: "海",
      definition: "sea",
      characterReadings: [{ pinyin: "hǎi", type: "primary" }],
    },
  },
  {
    characterGlyph: "江",
    radicalId: "rad_0008",
    character: {
      glyph: "江",
      definition: "river",
      characterReadings: [{ pinyin: "jiāng", type: "primary" }],
    },
  },
  {
    characterGlyph: "吃",
    radicalId: "rad_0018",
    character: {
      glyph: "吃",
      definition: "eat",
      characterReadings: [{ pinyin: "chī", type: "primary" }],
    },
  },
  {
    characterGlyph: "喝",
    radicalId: "rad_0018",
    character: {
      glyph: "喝",
      definition: "drink",
      characterReadings: [{ pinyin: "hē", type: "primary" }],
    },
  },
  {
    characterGlyph: "叫",
    radicalId: "rad_0018",
    character: {
      glyph: "叫",
      definition: "call",
      characterReadings: [{ pinyin: "jiào", type: "primary" }],
    },
  },
  {
    characterGlyph: "想",
    radicalId: "rad_0061",
    character: {
      glyph: "想",
      definition: "think",
      characterReadings: [{ pinyin: "xiǎng", type: "primary" }],
    },
  },
  {
    characterGlyph: "思",
    radicalId: "rad_0061",
    character: {
      glyph: "思",
      definition: "think",
      characterReadings: [{ pinyin: "sī", type: "primary" }],
    },
  },
  {
    characterGlyph: "火",
    radicalId: "rad_0086",
    character: {
      glyph: "火",
      definition: "fire",
      characterReadings: [{ pinyin: "huǒ", type: "primary" }],
    },
  },
  {
    characterGlyph: "猫",
    radicalId: "rad_0096",
    character: {
      glyph: "猫",
      definition: "cat",
      characterReadings: [{ pinyin: "māo", type: "primary" }],
    },
  },
];

describe("RadicalGateStrategy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRadicalFindMany.mockResolvedValue(mockRadicalFiles);
    mockCharacterRadicalFindMany.mockResolvedValue(mockCharacterRadicals);
  });

  it("has correct type and metadata", () => {
    expect(radicalGateStrategy.type).toBe("radical-gate");
    expect(radicalGateStrategy.questionCount).toBe(10);
    expect(radicalGateStrategy.passThreshold).toBe(0.85);
    expect(radicalGateStrategy.timeLimitMinutes).toBe(8);
  });

  it("generates questions from the Radical + CharacterRadical DB tables", async () => {
    const questions = await radicalGateStrategy.generateQuestions();

    expect(questions.length).toBeGreaterThanOrEqual(10);
    expect(questions.length).toBeLessThanOrEqual(20);

    // Should contain both Tier 1 and Tier 2 questions
    const tier1Questions = questions.filter((q) => q.category === "radical-core-lockdown");
    const tier2Questions = questions.filter((q) => q.category === "radical-predictor");

    expect(tier1Questions.length).toBeGreaterThanOrEqual(4);
    expect(tier2Questions.length).toBeGreaterThanOrEqual(4);

    // Radicals are read from the Radical table (all-in-DB)
    expect(mockRadicalFindMany).toHaveBeenCalled();
    // Tier 2 characters come from the CharacterRadical junction
    expect(mockCharacterRadicalFindMany).toHaveBeenCalled();
  });

  it("all questions have required structure", async () => {
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
    const questions = await radicalGateStrategy.generateQuestions();
    const tier2 = questions.filter((q) => q.category === "radical-predictor");

    for (const q of tier2) {
      expect(q).toHaveProperty("prompt");
      expect(q.prompt!.length).toBeGreaterThan(0);
    }
  });

  it("throws error when no radical rows are found", async () => {
    mockRadicalFindMany.mockResolvedValue([]);
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
