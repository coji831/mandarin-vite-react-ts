/**
 * @file apps/backend/src/modules/quiz/strategies/__tests__/ListeningDictationStrategy.test.ts
 * Unit tests for the Epic 26 Q9 `listening-dictation` generator.
 *
 * Contract (§26.3.4, §26.4.2): character-level only; the TTS target is the
 * glyph (never printed — `promptGlyph: "hide"`), the answer is the character's
 * PRIMARY reading in tone-marked pinyin, `category` = `dictation`, the pool is
 * deterministic, duplicate-free and fails open on an empty corpus.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const mockCharacterFindMany = vi.fn();

vi.mock("../../../../shared/infrastructure/database/client.js", () => ({
  prisma: { character: { findMany: mockCharacterFindMany } },
}));

const { listeningDictationStrategy } = await import("../ListeningDictationStrategy.js");

type Pool = Awaited<ReturnType<typeof listeningDictationStrategy.generateQuestions>>;

function character(
  id: string,
  glyph: string,
  readings: Array<{ pinyin: string; tone: number; type: string }>,
  hskLevel: number | null = 1,
  frequencyRank: number | null = 100,
) {
  return { id, glyph, definition: `meaning of ${glyph}`, readings, hskLevel, frequencyRank };
}

describe("ListeningDictationStrategy (Epic 26 Q9)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCharacterFindMany.mockReset();
  });

  it("is deterministic for a fixed corpus order", async () => {
    mockCharacterFindMany.mockResolvedValue([
      character("ch_1001", "好", [
        { pinyin: "hǎo", tone: 3, type: "primary" },
        { pinyin: "hào", tone: 4, type: "secondary" },
      ]),
    ]);

    expect(await listeningDictationStrategy.generateQuestions()).toEqual(
      await listeningDictationStrategy.generateQuestions(),
    );
  });

  it("answers with the primary reading in tone-marked pinyin and hides the glyph", async () => {
    mockCharacterFindMany.mockResolvedValue([
      character("ch_1001", "好", [
        { pinyin: "hào", tone: 4, type: "secondary" },
        { pinyin: "hǎo", tone: 3, type: "primary" },
      ]),
    ]);

    const [question] = (await listeningDictationStrategy.generateQuestions()) as Pool;

    expect(question.id).toBe("dct-ch_1001");
    expect(question.audioKey).toBe("好");
    expect(question.character).toBe("好");
    expect(question.promptGlyph).toBe("hide");
    expect(question.displayPinyin).toBe("hǎo");
    expect(question.correctPinyin).toBe("hǎo");
    expect(question.correctTone).toBe(0);
    expect(question.category).toBe("dictation");
    expect(question.meaning).toBe("meaning of 好");
  });

  it("skips characters without a reading and caps the pool at questionCount", async () => {
    mockCharacterFindMany.mockResolvedValue([
      character("ch_1", "一", []),
      character("ch_2", "二", [{ pinyin: "èr", tone: 4, type: "primary" }]),
      character("ch_3", "三", [{ pinyin: "sān", tone: 1, type: "primary" }]),
      character("ch_4", "四", [{ pinyin: "sì", tone: 4, type: "primary" }]),
      character("ch_5", "五", [{ pinyin: "wǔ", tone: 3, type: "primary" }]),
      character("ch_6", "六", [{ pinyin: "liù", tone: 4, type: "primary" }]),
      character("ch_7", "七", [{ pinyin: "qī", tone: 1, type: "primary" }]),
    ]);

    const pool = (await listeningDictationStrategy.generateQuestions()) as Pool;

    expect(pool).toHaveLength(listeningDictationStrategy.questionCount);
    expect(pool.map((question) => question.character)).not.toContain("一");
    expect(new Set(pool.map((question) => question.id)).size).toBe(pool.length);
  });

  it("asks the DB for a familiar-first, deterministic pool", async () => {
    mockCharacterFindMany.mockResolvedValue([]);

    await listeningDictationStrategy.generateQuestions();

    const args = mockCharacterFindMany.mock.calls[0][0];
    expect(args.where).toEqual({
      metadata: { path: ["quizFormats"], array_contains: [{ format: "listening-dictation" }] },
    });
    expect(args.orderBy).toEqual([
      { hskLevel: { sort: "asc", nulls: "last" } },
      { frequencyRank: { sort: "asc", nulls: "last" } },
      { id: "asc" },
    ]);
  });

  it("falls back to the unfiltered corpus when the bank is empty (§26.4.3)", async () => {
    mockCharacterFindMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        character("ch_2", "二", [{ pinyin: "èr", tone: 4, type: "primary" }]),
      ]);

    const pool = (await listeningDictationStrategy.generateQuestions()) as Pool;

    expect(pool.map((question) => question.id)).toEqual(["dct-ch_2"]);
    expect(mockCharacterFindMany).toHaveBeenCalledTimes(2);
    expect(mockCharacterFindMany.mock.calls[1][0].where).toBeUndefined();
  });

  it("fails open on an empty corpus (returns [], never throws)", async () => {
    mockCharacterFindMany.mockResolvedValue([]);

    await expect(listeningDictationStrategy.generateQuestions()).resolves.toEqual([]);
  });
});
