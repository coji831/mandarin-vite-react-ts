/**
 * @file apps/backend/src/modules/quiz/strategies/__tests__/ImeSimulatorStrategy.test.ts
 * Unit tests for ImeSimulatorStrategy.
 *
 * G3: `correctPinyin` must hold the character glyph so the generic
 *     `QuizService.submitAnswer` comparison (input glyph === correctPinyin)
 *     grades IME answers correctly.
 * G4: generated questions must never emit an empty `meaning` clue, and should
 *     prefer familiar/common characters (HSK 1–3, lower frequency rank).
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Prisma mock ─────────────────────────────────────────────────────────────
const mockRadicalFindMany = vi.fn();

vi.mock("../../../../shared/infrastructure/database/client.js", () => ({
  prisma: {
    radical: {
      findMany: mockRadicalFindMany,
    },
  },
}));

// Deterministic order — familiar-pool selection is verified without shuffle noise.
vi.mock("../../../../shared/utils/contentUtils.js", () => ({
  shuffleArray: <T>(arr: T[]): T[] => arr,
}));

const { imeSimulatorStrategy } = await import("../ImeSimulatorStrategy.js");

// ── Fixtures ────────────────────────────────────────────────────────────────

function makeRadical(id: string, chars: Array<Record<string, unknown>>) {
  return {
    id,
    isRecommended: true,
    characterRadicals: chars.map((c) => ({
      character: {
        glyph: c.glyph,
        definition: c.definition,
        readings: c.readings,
        hskLevel: c.hskLevel ?? null,
        frequencyRank: c.frequencyRank ?? null,
      },
    })),
  };
}

const FAMILIAR_POOL = [
  { glyph: "人", definition: "person", readings: [{ pinyin: "ren" }], hskLevel: 1, frequencyRank: 2 },
  { glyph: "好", definition: "good", readings: [{ pinyin: "hao" }], hskLevel: 1, frequencyRank: 26 },
  { glyph: "山", definition: "mountain", readings: [{ pinyin: "shan" }], hskLevel: 1, frequencyRank: 90 },
  // Obscure characters WITHOUT a meaning clue must be excluded (G4)
  { glyph: "圾", definition: "", readings: [{ pinyin: "ji" }], hskLevel: 6, frequencyRank: 9999 },
  // Obscure character WITH a meaning but high HSK / poor frequency — ranked last
  { glyph: "婿", definition: "son-in-law", readings: [{ pinyin: "xu" }], hskLevel: 6, frequencyRank: 5000 },
];

describe("ImeSimulatorStrategy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRadicalFindMany.mockReset();
  });

  describe("generateQuestions (G3 + G4)", () => {
    it("returns only characters with a non-empty meaning clue", async () => {
      mockRadicalFindMany.mockResolvedValue([makeRadical("rad_0001", FAMILIAR_POOL)]);

      const questions = (await imeSimulatorStrategy.generateQuestions()) as Array<{
        meaning?: string;
        character: string;
        correctPinyin?: string;
      }>;

      expect(questions.length).toBe(4); // 圾 (empty meaning) excluded
      expect(questions.some((q) => q.character === "圾")).toBe(false);
      for (const q of questions) {
        expect(q.meaning?.trim().length ?? 0).toBeGreaterThan(0);
      }
    });

    it("sets correctPinyin to the character glyph (IME input comparison target)", async () => {
      mockRadicalFindMany.mockResolvedValue([makeRadical("rad_0001", FAMILIAR_POOL)]);

      const questions = (await imeSimulatorStrategy.generateQuestions()) as Array<{
        character: string;
        correctPinyin?: string;
      }>;

      expect(questions.length).toBeGreaterThan(0);
      for (const q of questions) {
        expect(q.correctPinyin).toBe(q.character);
      }
    });

    it("prefers familiar HSK 1-3 characters over obscure ones", async () => {
      mockRadicalFindMany.mockResolvedValue([makeRadical("rad_0001", FAMILIAR_POOL)]);

      const questions = (await imeSimulatorStrategy.generateQuestions()) as Array<{
        character: string;
      }>;

      const glyphs = questions.map((q) => q.character);
      // HSK-1 familiar chars come first (人, 好, 山), obscure 婿 ranked last
      expect(glyphs[0]).toBe("人");
      expect(glyphs[1]).toBe("好");
      expect(glyphs[2]).toBe("山");
      expect(glyphs[3]).toBe("婿");
    });

    it("handles a character with null hskLevel/frequencyRank (ranked last, still included)", async () => {
      mockRadicalFindMany.mockResolvedValue([
        makeRadical("rad_0001", [
          { glyph: "人", definition: "person", readings: [{ pinyin: "ren" }], hskLevel: 1, frequencyRank: 2 },
          { glyph: "佘", definition: "surname She", readings: [{ pinyin: "she" }], hskLevel: null, frequencyRank: null },
        ]),
      ]);

      const questions = (await imeSimulatorStrategy.generateQuestions()) as Array<{
        character: string;
        meaning?: string;
      }>;

      expect(questions).toHaveLength(2);
      expect(questions[0].character).toBe("人"); // familiar first
      expect(questions[1].character).toBe("佘");
      expect(questions[1].meaning).toBe("surname She");
    });
  });

  describe("validateAnswer (G3)", () => {
    const question = {
      character: "好",
      displayPinyin: "hǎo",
      correctPinyin: "好",
      meaning: "good",
    };

    it("accepts the correct character glyph (NFKC-normalized)", () => {
      const result = imeSimulatorStrategy.validateAnswer(question, { pinyin: "好" });
      expect(result.correct).toBe(true);
      expect(result.feedback).toContain("Correct");
    });

    it("rejects a wrong character glyph", () => {
      const result = imeSimulatorStrategy.validateAnswer(question, { pinyin: "人" });
      expect(result.correct).toBe(false);
      expect(result.feedback).toContain("Incorrect");
    });
  });
});
