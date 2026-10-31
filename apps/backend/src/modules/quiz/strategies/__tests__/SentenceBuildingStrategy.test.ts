/**
 * @file apps/backend/src/modules/quiz/strategies/__tests__/SentenceBuildingStrategy.test.ts
 * Unit tests for the Epic 26 Q7 `sentence-building` generator.
 *
 * Contract (§26.3.3, §26.4.2): the word bank is the example's segments in a
 * deterministic order, the canonical answer is those segments joined by a
 * SINGLE ASCII space, `category` = `sentence-building`, and the pool is
 * deterministic, duplicate-free and fails open on an empty corpus.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGrammarPatternFindMany = vi.fn();
const mockGrammarExampleFindMany = vi.fn();

vi.mock("../../../../shared/infrastructure/database/client.js", () => ({
  prisma: {
    grammarPattern: { findMany: mockGrammarPatternFindMany },
    grammarExample: { findMany: mockGrammarExampleFindMany },
  },
}));

const { sentenceBuildingStrategy } = await import("../SentenceBuildingStrategy.js");

type Pool = Awaited<ReturnType<typeof sentenceBuildingStrategy.generateQuestions>>;

function segment(text: string) {
  return { text, pinyin: text, gloss: text, entityType: "character", entityId: `ch_${text}` };
}

const patterns = [
  {
    content_id: "gr_0001",
    name: "SVO basic word order",
    examples: [
      {
        content_id: "gr_0001_ex1",
        english: "I hit the person.",
        segments: [segment("我"), segment("打"), segment("人")],
      },
      {
        content_id: "gr_0001_ex2",
        english: "He drinks tea.",
        segments: [segment("他"), segment("喝"), segment("茶")],
      },
    ],
  },
];

describe("SentenceBuildingStrategy (Epic 26 Q7)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGrammarPatternFindMany.mockReset();
    mockGrammarExampleFindMany.mockReset();
    // No curated bank by default → the generated corpus path runs.
    mockGrammarExampleFindMany.mockResolvedValue([]);
  });

  it("serves only the curated-bank anchors when a bank exists (§26.4.3)", async () => {
    mockGrammarPatternFindMany.mockResolvedValue(patterns);
    mockGrammarExampleFindMany.mockResolvedValue([{ content_id: "gr_0001_ex2" }]);

    const pool = (await sentenceBuildingStrategy.generateQuestions()) as Pool;

    expect(pool.map((question) => question.id)).toEqual(["sbo-gr_0001_ex2"]);
    expect(pool[0].correctPinyin).toBe("他 喝 茶");
    expect(mockGrammarExampleFindMany.mock.calls[0][0]).toMatchObject({
      where: {
        metadata: { path: ["quizFormats"], array_contains: [{ format: "sentence-building" }] },
      },
    });
  });

  it("is deterministic for a fixed corpus order", async () => {
    mockGrammarPatternFindMany.mockResolvedValue(patterns);

    expect(await sentenceBuildingStrategy.generateQuestions()).toEqual(
      await sentenceBuildingStrategy.generateQuestions(),
    );
  });

  it("joins the canonical order with a single ASCII space (§26.4.2)", async () => {
    mockGrammarPatternFindMany.mockResolvedValue(patterns);

    const pool = (await sentenceBuildingStrategy.generateQuestions()) as Pool;

    expect(pool).toHaveLength(2);
    expect(pool[0].correctPinyin).toBe("我 打 人");
    expect(pool[0].correctPinyin).not.toContain("  ");
    expect(pool[0].correctTone).toBe(0);
    expect(pool[0].category).toBe("sentence-building");
    expect(pool[0].english).toBe("I hit the person.");
  });

  it("returns a shuffled word bank that is a permutation and not the answer order", async () => {
    mockGrammarPatternFindMany.mockResolvedValue(patterns);

    const pool = (await sentenceBuildingStrategy.generateQuestions()) as Pool;

    for (const question of pool) {
      const answer = question.correctPinyin.split(" ");
      expect([...question.tokens].sort()).toEqual([...answer].sort());
      expect(question.tokens).not.toEqual(answer);
      expect(question.answerLength).toBe(answer.length);
    }
    expect(new Set(pool.map((question) => question.id)).size).toBe(pool.length);
  });

  it("never leaks the answer sentence or its ordered pinyin", async () => {
    mockGrammarPatternFindMany.mockResolvedValue(patterns);

    const [question] = (await sentenceBuildingStrategy.generateQuestions()) as Pool;

    expect(question).not.toHaveProperty("chinese");
    expect(question).not.toHaveProperty("pinyin");
    expect(question).not.toHaveProperty("displayPinyin");
  });

  it("fails open on an empty corpus (returns [], never throws)", async () => {
    mockGrammarPatternFindMany.mockResolvedValue([]);

    await expect(sentenceBuildingStrategy.generateQuestions()).resolves.toEqual([]);
  });

  it("skips single-token examples (nothing to assemble)", async () => {
    mockGrammarPatternFindMany.mockResolvedValue([
      {
        content_id: "gr_0009",
        name: "single",
        examples: [{ content_id: "gr_0009_ex1", english: "Good.", segments: [segment("好")] }],
      },
    ]);

    await expect(sentenceBuildingStrategy.generateQuestions()).resolves.toEqual([]);
  });
});
