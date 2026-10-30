/**
 * @file apps/backend/src/modules/quiz/strategies/__tests__/ToneJudgmentStrategy.test.ts
 * Unit tests for the Epic 26 Q10 `tone-judgment` generator.
 *
 * Contract (§26.3.5, §26.4.2): a WRITTEN, audio-free Phase-1 format. Sandhi
 * items come from `TonePair` (the only corpus row with a surface tone) and
 * carry the `ToneRule` that documents them; `PinyinSyllable` + mapping items are
 * the written-syllable fallback. `correctTone` is the SURFACE tone, `category`
 * = `tone-judgment`, and the pool is deterministic, duplicate-free and fails
 * open on an empty corpus.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const mockTonePairFindMany = vi.fn();
const mockToneRuleFindMany = vi.fn();
const mockPinyinSyllableFindMany = vi.fn();
const mockPinyinCharacterMappingFindMany = vi.fn();
const mockGrammarExampleFindMany = vi.fn();

vi.mock("../../../../shared/infrastructure/database/client.js", () => ({
  prisma: {
    tonePair: { findMany: mockTonePairFindMany },
    toneRule: { findMany: mockToneRuleFindMany },
    pinyinSyllable: { findMany: mockPinyinSyllableFindMany },
    pinyinCharacterMapping: { findMany: mockPinyinCharacterMappingFindMany },
    grammarExample: { findMany: mockGrammarExampleFindMany },
  },
}));

const { toneJudgmentStrategy } = await import("../ToneJudgmentStrategy.js");

type Pool = Awaited<ReturnType<typeof toneJudgmentStrategy.generateQuestions>>;

const tonePairs = [
  {
    id: "pair-1",
    chinese: "你好",
    dictionaryPinyin: "nǐ hǎo",
    spokenPinyin: "ní hǎo",
    rule: "3rd+3rd → 2nd+3rd",
  },
  {
    id: "pair-3",
    chinese: "吃饭",
    dictionaryPinyin: "chī fàn",
    spokenPinyin: "chī fàn",
    rule: "1st+4th",
  },
];

const toneRules = [
  {
    id: "rule-3rd-sandhi",
    title: "3rd Tone Sandhi",
    examples: [
      { chinese: "你好", dictionary: "nǐ hǎo", spoken: "ní hǎo" },
      { chinese: "很好", dictionary: "hěn hǎo", spoken: "hén hǎo" },
    ],
  },
];

const syllables = [
  { syllable: "ba1", syllablePretty: "bā", tone: 1 },
  { syllable: "ma5", syllablePretty: "ma", tone: 5 },
];

const mappings = [{ pinyinSyllable: { syllablePretty: "bā" }, character: { glyph: "八" } }];

function mockCorpus() {
  mockTonePairFindMany.mockResolvedValue(tonePairs);
  mockToneRuleFindMany.mockResolvedValue(toneRules);
  mockPinyinSyllableFindMany.mockResolvedValue(syllables);
  mockPinyinCharacterMappingFindMany.mockResolvedValue(mappings);
  mockGrammarExampleFindMany.mockResolvedValue([]);
}

describe("ToneJudgmentStrategy (Epic 26 Q10)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    [
      mockTonePairFindMany,
      mockToneRuleFindMany,
      mockPinyinSyllableFindMany,
      mockPinyinCharacterMappingFindMany,
      mockGrammarExampleFindMany,
    ].forEach((mock) => mock.mockReset());
  });

  it("is deterministic for a fixed corpus order", async () => {
    mockCorpus();

    expect(await toneJudgmentStrategy.generateQuestions()).toEqual(
      await toneJudgmentStrategy.generateQuestions(),
    );
  });

  it("answers the SURFACE tone of the sandhi syllable, with its ToneRule", async () => {
    mockCorpus();

    const pool = (await toneJudgmentStrategy.generateQuestions()) as Pool;
    const sandhi = pool.find((question) => question.id === "tsj-pair-pair-1")!;

    expect(sandhi.correctTone).toBe(2);
    expect(sandhi.baseTone).toBe(3);
    expect(sandhi.correctPinyin).toBe("nǐ");
    expect(sandhi.targetSyllable).toBe("nǐ");
    expect(sandhi.targetGlyph).toBe("你");
    expect(sandhi.dictionaryPinyin).toBe("nǐ hǎo");
    expect(sandhi.ruleId).toBe("rule-3rd-sandhi");
    expect(sandhi.ruleTitle).toBe("3rd Tone Sandhi");
    expect(sandhi.category).toBe("tone-judgment");
    expect(sandhi.audioKey).toBe("");
  });

  it("keeps the base tone as the answer when the rule changes nothing", async () => {
    mockCorpus();

    const pool = (await toneJudgmentStrategy.generateQuestions()) as Pool;
    const unchanged = pool.find((question) => question.id === "tsj-pair-pair-3")!;

    expect(unchanged.correctTone).toBe(unchanged.baseTone);
    expect(unchanged.ruleId).toBeNull();
  });

  it("falls back to written syllables from PinyinSyllable + mapping", async () => {
    mockCorpus();

    const pool = (await toneJudgmentStrategy.generateQuestions()) as Pool;
    const syllableItem = pool.find((question) => question.id === "tsj-syl-ba1")!;

    expect(syllableItem.chinese).toBe("八");
    expect(syllableItem.correctPinyin).toBe("bā");
    expect(syllableItem.correctTone).toBe(1);
    expect(syllableItem.ruleId).toBeNull();
    // Lexical neutral (5) → canonical 0, which is a legal tone answer.
    expect(pool.find((question) => question.id === "tsj-syl-ma5")!.correctTone).toBe(0);
  });

  it("emits duplicate-free ids with sandhi items first", async () => {
    mockCorpus();

    const pool = (await toneJudgmentStrategy.generateQuestions()) as Pool;

    expect(new Set(pool.map((question) => question.id)).size).toBe(pool.length);
    expect(pool.slice(0, 2).map((question) => question.id)).toEqual([
      "tsj-pair-pair-1",
      "tsj-pair-pair-3",
    ]);
  });

  it("fails open when both corpora are empty (returns [], never throws)", async () => {
    mockTonePairFindMany.mockResolvedValue([]);
    mockToneRuleFindMany.mockResolvedValue([]);
    mockPinyinSyllableFindMany.mockResolvedValue([]);
    mockPinyinCharacterMappingFindMany.mockResolvedValue([]);
    mockGrammarExampleFindMany.mockResolvedValue([]);

    await expect(toneJudgmentStrategy.generateQuestions()).resolves.toEqual([]);
  });

  it("derives the surface tone from a curated-bank GrammarExample anchor (§26.4.3)", async () => {
    mockCorpus();
    mockGrammarExampleFindMany.mockResolvedValue([
      {
        content_id: "gr_0001_ex1",
        chinese: "我打人。",
        pinyin: "wǒ dǎ rén",
        segments: [
          { text: "我", pinyin: "wǒ", gloss: "I" },
          { text: "打", pinyin: "dǎ", gloss: "hit" },
          { text: "人", pinyin: "rén", gloss: "person" },
        ],
        metadata: {
          quizFormats: [
            {
              id: "tsj_0001",
              format: "tone-judgment",
              exampleContentId: "gr_0001_ex1",
              targetSegmentIndex: 0,
              ruleId: "rule-3rd-sandhi",
            },
          ],
        },
      },
    ]);

    const pool = (await toneJudgmentStrategy.generateQuestions()) as Pool;

    expect(pool).toHaveLength(1);
    expect(pool[0].id).toBe("tsj-tsj_0001");
    expect(pool[0].targetGlyph).toBe("我");
    expect(pool[0].baseTone).toBe(3);
    expect(pool[0].correctTone).toBe(2);
    expect(pool[0].correctPinyin).toBe("wǒ");
    expect(pool[0].ruleId).toBe("rule-3rd-sandhi");
    expect(mockGrammarExampleFindMany.mock.calls[0][0]).toMatchObject({
      where: { metadata: { path: ["quizFormats"], array_contains: [{ format: "tone-judgment" }] } },
    });
  });

  it("ignores an out-of-range targetSegmentIndex and falls back to the generated pool", async () => {
    mockCorpus();
    mockGrammarExampleFindMany.mockResolvedValue([
      {
        content_id: "gr_0001_ex1",
        chinese: "我打人。",
        pinyin: "wǒ dǎ rén",
        segments: [{ text: "我", pinyin: "wǒ", gloss: "I" }],
        metadata: {
          quizFormats: [
            { id: "tsj_9999", format: "tone-judgment", targetSegmentIndex: 7, ruleId: null },
          ],
        },
      },
    ]);

    const pool = (await toneJudgmentStrategy.generateQuestions()) as Pool;

    expect(pool[0].id).toBe("tsj-pair-pair-1");
  });
});
