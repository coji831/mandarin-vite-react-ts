/**
 * @file apps/backend/src/modules/quiz/strategies/__tests__/SandhiDrillService.test.ts
 * Unit tests for SandhiDrillService.
 * Story 21.17: Tone Sandhi Practice Quiz
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Prisma mock ─────────────────────────────────────────────────────────────

const mockWordFindMany = vi.fn();

vi.mock("../../../../shared/infrastructure/database/client.js", () => ({
  prisma: {
    word: {
      findMany: mockWordFindMany,
    },
  },
}));

// Need to mock contentUtils.shuffleArray for deterministic tests
vi.mock("../../../../shared/utils/contentUtils.js", () => ({
  shuffleArray: <T>(arr: T[]): T[] => [...arr].sort(() => 0), // stable sort
}));

const { SandhiDrillService } = await import("../SandhiDrillService.js");

// ── Fixtures ────────────────────────────────────────────────────────────────

function makeMockWord(
  id: string,
  simplified: string,
  pinyin: string | null,
  chars: Array<{ glyph: string; pinyin: string; tone: number }>,
) {
  return {
    id,
    simplified,
    pinyin,
    wordCharacters: chars.map((c, i) => ({
      sequenceOrder: i,
      character: {
        glyph: c.glyph,
        characterReadings: [{ pinyin: c.pinyin, tone: c.tone }],
      },
    })),
  };
}

const MOCK_WORDS = [
  // 3-3 sandhi candidates
  makeMockWord("w_001", "你好", "nǐ hǎo", [
    { glyph: "你", pinyin: "ni", tone: 3 },
    { glyph: "好", pinyin: "hao", tone: 3 },
  ]),
  makeMockWord("w_002", "水果", "shuǐ guǒ", [
    { glyph: "水", pinyin: "shui", tone: 3 },
    { glyph: "果", pinyin: "guo", tone: 3 },
  ]),
  // bu-before-4th candidates
  makeMockWord("w_003", "不是", "bù shì", [
    { glyph: "不", pinyin: "bu", tone: 4 },
    { glyph: "是", pinyin: "shi", tone: 4 },
  ]),
  makeMockWord("w_004", "不对", "bù duì", [
    { glyph: "不", pinyin: "bu", tone: 4 },
    { glyph: "对", pinyin: "dui", tone: 4 },
  ]),
  // yi-before-4th candidates
  makeMockWord("w_005", "一个", "yī gè", [
    { glyph: "一", pinyin: "yi", tone: 1 },
    { glyph: "个", pinyin: "ge", tone: 4 },
  ]),
  makeMockWord("w_006", "一半", "yī bàn", [
    { glyph: "一", pinyin: "yi", tone: 1 },
    { glyph: "半", pinyin: "ban", tone: 4 },
  ]),
  // yi-before-non4th candidates
  makeMockWord("w_007", "一天", "yī tiān", [
    { glyph: "一", pinyin: "yi", tone: 1 },
    { glyph: "天", pinyin: "tian", tone: 1 },
  ]),
  makeMockWord("w_008", "一起", "yī qǐ", [
    { glyph: "一", pinyin: "yi", tone: 1 },
    { glyph: "起", pinyin: "qi", tone: 3 },
  ]),
  // Non-sandhi word (should be excluded)
  makeMockWord("w_009", "你好吗", "nǐ hǎo ma", [
    { glyph: "你", pinyin: "ni", tone: 3 },
    { glyph: "好", pinyin: "hao", tone: 3 },
    { glyph: "吗", pinyin: "ma", tone: 0 },
  ]),
];

describe("SandhiDrillService", () => {
  let service: InstanceType<typeof SandhiDrillService>;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new SandhiDrillService();
  });

  describe("generateQuestions", () => {
    it("generates the requested number of questions within clamp range", async () => {
      mockWordFindMany.mockResolvedValue(MOCK_WORDS);

      const questions = await service.generateQuestions(4);
      expect(questions.length).toBeGreaterThanOrEqual(5); // clamped to min 5
    });

    it("clamps count to between 5 and 25", async () => {
      mockWordFindMany.mockResolvedValue(MOCK_WORDS);

      const tooFew = await service.generateQuestions(1);
      expect(tooFew.length).toBeGreaterThanOrEqual(5);

      const tooMany = await service.generateQuestions(100);
      expect(tooMany.length).toBeLessThanOrEqual(25);
    });

    it("generates valid DrillQuestion objects", async () => {
      mockWordFindMany.mockResolvedValue(MOCK_WORDS);

      const questions = await service.generateQuestions(8);
      expect(questions.length).toBeGreaterThan(0);

      for (const q of questions) {
        expect(q).toHaveProperty("id");
        expect(q).toHaveProperty("characters");
        expect(q).toHaveProperty("dictionaryPinyin");
        expect(q).toHaveProperty("correctAnswer");
        expect(q).toHaveProperty("ruleId");
        expect(q).toHaveProperty("options");
        expect(q.options).toHaveLength(4);
        expect(q.options).toContain(q.correctAnswer);
      }
    });

    it("includes questions from each sandhi rule", async () => {
      mockWordFindMany.mockResolvedValue(MOCK_WORDS);

      const questions = await service.generateQuestions(12);
      const ruleIds = new Set(questions.map((q: { ruleId: string }) => q.ruleId));

      expect(ruleIds.has("3-3-sandhi")).toBe(true);
      expect(ruleIds.has("bu-before-4th")).toBe(true);
      expect(ruleIds.has("yi-before-4th")).toBe(true);
      expect(ruleIds.has("yi-before-non4th")).toBe(true);
    });

    it("produces 4 unique options with no '???' placeholders and no duplicate keys", async () => {
      mockWordFindMany.mockResolvedValue(MOCK_WORDS);

      // Run many questions to exercise all rules (including 一-words whose
      // "both tone 1" distractor used to duplicate the dictionary form).
      const questions = await service.generateQuestions(25);

      expect(questions.length).toBeGreaterThan(0);
      for (const q of questions) {
        expect(q.options).toHaveLength(4);
        expect(new Set(q.options).size).toBe(4); // no duplicate strings → no React duplicate keys
        expect(q.options).toContain(q.correctAnswer);
        expect(q.options.some((o: string) => o.includes("???"))).toBe(false);
        // Options must never be empty/blank
        expect(q.options.every((o: string) => o.trim().length > 0)).toBe(true);
      }
    });

    it("throws when no candidates are found", async () => {
      mockWordFindMany.mockResolvedValue([]);

      await expect(service.generateQuestions(5)).rejects.toThrow(
        "Failed to load sandhi drill candidates",
      );
    });

    it("produces 4 distinct options for yī/bù words even when the primary reading is tone-marked (G1 collapse fix)", async () => {
      // DB stores BOTH plain ("yi") and tone-marked ("yī") primary readings.
      // If the tone-marked row is picked, applyToneMark must strip the mark
      // before re-applying — otherwise sandhi form == dictionary form and the
      // distractors collapse into a single option.
      const markedWords = [
        makeMockWord("w_m1", "一样", "yī yàng", [
          { glyph: "一", pinyin: "yī", tone: 1 },
          { glyph: "样", pinyin: "yàng", tone: 4 },
        ]),
        makeMockWord("w_m2", "不大", "bù dà", [
          { glyph: "不", pinyin: "bù", tone: 4 },
          { glyph: "大", pinyin: "dà", tone: 4 },
        ]),
      ];
      mockWordFindMany.mockResolvedValue(markedWords);

      const questions = await service.generateQuestions(10);
      const yiQ = questions.find((q) => q.characters === "一样");
      const buQ = questions.find((q) => q.characters === "不大");

      for (const q of [yiQ, buQ]) {
        expect(q).toBeDefined();
        expect(q!.options).toHaveLength(4);
        expect(new Set(q!.options).size).toBe(4); // no collapsed single option
        expect(q!.options).toContain(q!.correctAnswer);
        // Sandhi form must differ from the dictionary form (the collapse cause)
        expect(q!.correctAnswer).not.toBe(q!.dictionaryPinyin);
      }
    });
  });

  describe("scoreAnswer", () => {
    const sampleQuestion = {
      id: "sandhi-q-0",
      characters: "你好",
      dictionaryPinyin: "nǐ hǎo",
      correctAnswer: "ní hǎo",
      ruleId: "3-3-sandhi" as const,
      options: ["nǐ hǎo", "ní hǎo", "nì hǎo", "nī hǎo"],
    };

    it("returns correct=true for matching answer", () => {
      const result = service.scoreAnswer(sampleQuestion, "ní hǎo");
      expect(result.correct).toBe(true);
      expect(result.feedback).toContain("Correct");
    });

    it("returns correct=false for wrong answer", () => {
      const result = service.scoreAnswer(sampleQuestion, "nǐ hǎo");
      expect(result.correct).toBe(false);
      expect(result.feedback).toContain("Incorrect");
    });

    it("is whitespace-tolerant", () => {
      const result = service.scoreAnswer(sampleQuestion, "  ní hǎo  ");
      expect(result.correct).toBe(true);
    });
  });
});
