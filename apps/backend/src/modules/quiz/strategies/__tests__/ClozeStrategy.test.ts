/**
 * @file apps/backend/src/modules/quiz/strategies/__tests__/ClozeStrategy.test.ts
 * Unit tests for the Epic 26 Q6 `cloze` generator.
 *
 * Contract (§26.3.2, §26.4.2): one question per `GrammarExample`, the final
 * segment blanked, three same-character-length distractors drawn from other
 * patterns' segments, `correctPinyin` = the expected token, `category` =
 * `cloze`, and a deterministic, duplicate-free pool that fails open on an empty
 * corpus.
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

const { clozeStrategy } = await import("../ClozeStrategy.js");

type ClozePool = Awaited<ReturnType<typeof clozeStrategy.generateQuestions>>;

function segment(text: string, gloss: string) {
  return { text, pinyin: text, gloss, entityType: "character", entityId: `ch_${text}` };
}

const patterns = [
  {
    content_id: "gr_0001",
    name: "SVO basic word order",
    structure: "Subject + Verb + Object",
    explanation: "Keep the subject before the verb.",
    examples: [
      {
        content_id: "gr_0001_ex1",
        chinese: "我打人。",
        pinyin: "wǒ dǎ rén",
        english: "I hit the person.",
        segments: [segment("我", "I"), segment("打", "hit"), segment("人", "person")],
      },
    ],
  },
  {
    content_id: "gr_0002",
    name: "把 disposal",
    structure: "Subj + 把 + Obj + Verb",
    explanation: "把 fronts the object.",
    examples: [
      {
        content_id: "gr_0002_ex1",
        chinese: "他喝茶。",
        pinyin: "tā hē chá",
        english: "He drinks tea.",
        segments: [segment("他", "he"), segment("喝", "drink"), segment("茶", "tea")],
      },
    ],
  },
];

describe("ClozeStrategy (Epic 26 Q6)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGrammarPatternFindMany.mockReset();
    mockGrammarExampleFindMany.mockReset();
    // No curated bank by default → the generated corpus path runs.
    mockGrammarExampleFindMany.mockResolvedValue([]);
  });

  it("is deterministic for a fixed corpus order", async () => {
    mockGrammarPatternFindMany.mockResolvedValue(patterns);

    const first = await clozeStrategy.generateQuestions();
    const second = await clozeStrategy.generateQuestions();

    expect(first).toEqual(second);
  });

  it("emits one duplicate-free question per example with a 4-option pool", async () => {
    mockGrammarPatternFindMany.mockResolvedValue(patterns);

    const pool = (await clozeStrategy.generateQuestions()) as ClozePool;

    expect(pool).toHaveLength(2);
    expect(new Set(pool.map((question) => question.id)).size).toBe(pool.length);
    for (const question of pool) {
      const glyphs = question.options.map((option) => option.glyph);
      expect(glyphs).toHaveLength(4);
      expect(new Set(glyphs).size).toBe(4);
      expect(glyphs).toContain(question.correctPinyin);
    }
  });

  it("blanks the final segment and draws same-length distractors (§26.4.2 encoding)", async () => {
    mockGrammarPatternFindMany.mockResolvedValue(patterns);

    const [first] = (await clozeStrategy.generateQuestions()) as ClozePool;

    expect(first.correctPinyin).toBe("人");
    expect(first.correctTone).toBe(0);
    expect(first.category).toBe("cloze");
    expect(first.displayPinyin).toBe("wǒ dǎ rén");
    expect(first.blankIndex).toBe(2);
    expect(first.segments.filter((entry) => entry.blank)).toHaveLength(1);
    expect(first.segments[first.blankIndex].text).toBe("人");
    // Every distractor is a single-character token, like the answer.
    for (const option of first.options) {
      expect([...option.glyph]).toHaveLength(1);
    }
  });

  it("fails open on an empty corpus (returns [], never throws)", async () => {
    mockGrammarPatternFindMany.mockResolvedValue([]);

    await expect(clozeStrategy.generateQuestions()).resolves.toEqual([]);
  });

  it("prefers curated-bank anchors and honours blankSegmentIndex (§26.4.3)", async () => {
    mockGrammarPatternFindMany.mockResolvedValue(patterns);
    mockGrammarExampleFindMany.mockResolvedValue([
      {
        content_id: "gr_0001_ex1",
        metadata: {
          quizFormats: [
            {
              id: "clz_0001",
              format: "cloze",
              exampleContentId: "gr_0001_ex1",
              blankSegmentIndex: 1,
            },
          ],
        },
      },
    ]);

    const pool = (await clozeStrategy.generateQuestions()) as ClozePool;

    // Only the pinned anchor is served, in anchor order.
    expect(pool.map((question) => question.id)).toEqual(["cloze-gr_0001_ex1"]);
    expect(pool[0].blankIndex).toBe(1);
    expect(pool[0].correctPinyin).toBe("打");
    expect(pool[0].segments[1].blank).toBe(true);
  });

  it("queries the bank by metadata.quizFormats containment", async () => {
    mockGrammarPatternFindMany.mockResolvedValue(patterns);
    mockGrammarExampleFindMany.mockResolvedValue([]);

    await clozeStrategy.generateQuestions();

    expect(mockGrammarExampleFindMany.mock.calls[0][0]).toMatchObject({
      where: { metadata: { path: ["quizFormats"], array_contains: [{ format: "cloze" }] } },
    });
  });

  it("falls back to the generated corpus when the bank is empty", async () => {
    mockGrammarPatternFindMany.mockResolvedValue(patterns);
    mockGrammarExampleFindMany.mockResolvedValue([]);

    const pool = (await clozeStrategy.generateQuestions()) as ClozePool;

    expect(pool).toHaveLength(2);
  });

  it("reuses the shared practice-format config (§26.4 — no new threshold)", () => {
    expect(clozeStrategy.type).toBe("cloze");
    expect(clozeStrategy.questionCount).toBe(5);
    expect(clozeStrategy.passThreshold).toBe(0.6);
    expect(typeof clozeStrategy.timeLimitMinutes).toBe("number");
  });
});
