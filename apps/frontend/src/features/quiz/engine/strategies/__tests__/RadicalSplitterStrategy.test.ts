import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock quizService before importing the strategy
vi.mock("../../../services/quizService", () => ({
  quizService: {
    fetchQuestions: vi.fn(),
  },
}));

import { radicalSplitterStrategy } from "../RadicalSplitterStrategy";
import type { QuizQuestion } from "../../../types";

const makeQuestion = (overrides: Partial<QuizQuestion> = {}): QuizQuestion => ({
  id: "rad-split-0",
  audioKey: "chī",
  correctPinyin: "rad_0018", // correct option ID
  correctTone: 0,
  category: "radical-splitter",
  character: "吃",
  meaning: "eat",
  displayPinyin: "chī",
  options: [
    { glyph: "口", meaning: "mouth", id: "rad_0018" },
    { glyph: "氵", meaning: "water", id: "rad_0008" },
    { glyph: "心", meaning: "heart", id: "rad_0061" },
  ],
  ...overrides,
});

describe("RadicalSplitterStrategy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it("has correct type and metadata", () => {
    expect(radicalSplitterStrategy.type).toBe("radical-splitter");
    expect(radicalSplitterStrategy.label).toBe("Radical Splitter");
    expect(radicalSplitterStrategy.phase).toBe(2);
    expect(radicalSplitterStrategy.questionCount).toBe(20);
    expect(radicalSplitterStrategy.passThreshold).toBe(0.7);
  });

  it("evaluateAnswer returns correct=true when selected option matches correctPinyin", () => {
    const question = makeQuestion();
    const result = radicalSplitterStrategy.evaluateAnswer(question, "rad_0018", 0);
    expect(result.correct).toBe(true);
    expect(result.feedback).toContain("Correct!");
    expect(result.feedback).toContain("吃");
    expect(result.feedback).toContain("口");
    expect(result.feedback).toContain("mouth");
  });

  it("evaluateAnswer returns correct=false when selected option is wrong", () => {
    const question = makeQuestion();
    const result = radicalSplitterStrategy.evaluateAnswer(question, "rad_0008", 0);
    expect(result.correct).toBe(false);
    expect(result.feedback).toContain("Not quite");
    expect(result.feedback).toContain("口");
    expect(result.feedback).toContain("mouth");
  });

  it("evaluateAnswer handles missing options gracefully", () => {
    const question = makeQuestion({ options: undefined });
    const result = radicalSplitterStrategy.evaluateAnswer(question, "rad_9999", 0);
    expect(result.correct).toBe(false);
    expect(result.feedback).toContain("?");
  });

  it("stores userPinyin as the selected option ID", () => {
    const question = makeQuestion();
    const result = radicalSplitterStrategy.evaluateAnswer(question, "rad_0061", 0);
    expect(result.userPinyin).toBe("rad_0061");
    expect(result.userTone).toBe(0);
    expect(result.correctPinyin).toBe("rad_0018");
  });
});
