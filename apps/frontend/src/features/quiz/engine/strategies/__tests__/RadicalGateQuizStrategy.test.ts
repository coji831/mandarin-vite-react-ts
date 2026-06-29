import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock quizService before importing the strategy
vi.mock("../../../services/quizService", () => ({
  quizService: {
    fetchQuestions: vi.fn(),
  },
}));

import { radicalGateQuizStrategy } from "../RadicalGateQuizStrategy";
import type { QuizQuestion } from "../../../types";

const makeTier1Question = (overrides: Partial<QuizQuestion> = {}): QuizQuestion => ({
  id: "rad-gate-t1-0",
  audioKey: "sāndiǎnshuǐ",
  correctPinyin: "rad_0008",
  correctTone: 0,
  category: "radical-core-lockdown",
  character: "氵",
  meaning: "water radical",
  displayPinyin: "sāndiǎnshuǐ",
  options: [
    { glyph: "氵", meaning: "water", id: "rad_0008" },
    { glyph: "火", meaning: "fire", id: "rad_0086" },
    { glyph: "木", meaning: "tree", id: "rad_0075" },
    { glyph: "金", meaning: "metal", id: "rad_0167" },
  ],
  ...overrides,
});

const makeTier2Question = (overrides: Partial<QuizQuestion> = {}): QuizQuestion => ({
  id: "rad-gate-t2-0",
  audioKey: "māo",
  correctPinyin: "rad_0096", // 犭 = animal
  correctTone: 0,
  category: "radical-predictor",
  character: "猫",
  meaning: "cat",
  displayPinyin: "māo",
  prompt:
    "You haven't learned this character yet. Based on its radical, which category does it belong to?",
  options: [
    { glyph: "犭", meaning: "animal", id: "rad_0096" },
    { glyph: "氵", meaning: "water", id: "rad_0008" },
    { glyph: "口", meaning: "mouth", id: "rad_0018" },
    { glyph: "心", meaning: "heart", id: "rad_0061" },
  ],
  ...overrides,
});

describe("RadicalGateQuizStrategy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("has correct type and metadata", () => {
    expect(radicalGateQuizStrategy.type).toBe("radical-gate");
    expect(radicalGateQuizStrategy.label).toBe("Radical Gate Quiz");
    expect(radicalGateQuizStrategy.phase).toBe(2);
  });

  describe("Tier 1 — Core Component Lockdown", () => {
    it("evaluateAnswer returns correct=true for matching option", () => {
      const question = makeTier1Question();
      const result = radicalGateQuizStrategy.evaluateAnswer(question, "rad_0008", 0);
      expect(result.correct).toBe(true);
      expect(result.feedback).toContain("Correct!");
      expect(result.feedback).toContain("氵");
      expect(result.feedback).toContain("water");
    });

    it("evaluateAnswer returns correct=false for wrong option", () => {
      const question = makeTier1Question();
      const result = radicalGateQuizStrategy.evaluateAnswer(question, "rad_0086", 0);
      expect(result.correct).toBe(false);
      expect(result.feedback).not.toContain("Correct!");
      expect(result.feedback).toContain("water");
    });

    it("provides helpful feedback for wrong Tier 1 answers", () => {
      const question = makeTier1Question();
      const result = radicalGateQuizStrategy.evaluateAnswer(question, "rad_0167", 0);
      expect(result.feedback).toContain("means");
    });
  });

  describe("Tier 2 — Radical Predictor", () => {
    it("evaluateAnswer returns correct=true for matching category", () => {
      const question = makeTier2Question();
      const result = radicalGateQuizStrategy.evaluateAnswer(question, "rad_0096", 0);
      expect(result.correct).toBe(true);
      expect(result.feedback).toContain("Correct!");
      expect(result.feedback).toContain("猫");
      expect(result.feedback).toContain("animal");
      expect(result.feedback).toContain("cat");
    });

    it("evaluateAnswer returns correct=false for wrong category", () => {
      const question = makeTier2Question();
      const result = radicalGateQuizStrategy.evaluateAnswer(question, "rad_0008", 0);
      expect(result.correct).toBe(false);
      expect(result.feedback).toContain("animal");
      expect(result.feedback).toContain("cat");
    });

    it("includes character meaning in feedback", () => {
      const question = makeTier2Question();
      const result = radicalGateQuizStrategy.evaluateAnswer(question, "rad_0096", 0);
      expect(result.feedback).toContain("cat");
    });
  });

  it("stores selected option ID in userPinyin", () => {
    const question = makeTier1Question();
    const result = radicalGateQuizStrategy.evaluateAnswer(question, "rad_0008", 0);
    expect(result.userPinyin).toBe("rad_0008");
    expect(result.userTone).toBe(0);
  });
});
