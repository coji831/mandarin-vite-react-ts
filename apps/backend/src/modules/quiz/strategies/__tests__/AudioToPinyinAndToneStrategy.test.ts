/**
 * @file apps/backend/src/modules/quiz/strategies/__tests__/AudioToPinyinAndToneStrategy.test.ts
 * Unit tests for AudioToPinyinAndToneStrategy.
 *
 * Phase 1 (pinyin universalization): the emitted payload must be digitless —
 * `correctPinyin` strips tone marks AND the trailing tone digit ("ba1" → "ba")
 * and `correctTone` normalizes lexical neutral (5) to canonical 0 — so FE
 * local grading agrees with BE `normalizePinyinForComparison` grading and
 * pinyin never reaches TTS.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPinyinSyllableFindMany = vi.fn();
const mockPinyinCharacterMappingFindMany = vi.fn();

vi.mock("../../../../shared/infrastructure/database/client.js", () => ({
  prisma: {
    pinyinSyllable: { findMany: mockPinyinSyllableFindMany },
    pinyinCharacterMapping: { findMany: mockPinyinCharacterMappingFindMany },
  },
}));

// Deterministic order — assertion order matches query order.
vi.mock("../../../../shared/utils/contentUtils.js", () => ({
  shuffleArray: <T>(arr: T[]): T[] => arr,
}));

const { audioToPinyinAndToneStrategy } = await import("../AudioToPinyinAndToneStrategy.js");

describe("AudioToPinyinAndToneStrategy (Phase 1 — digitless payload)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPinyinSyllableFindMany.mockReset();
    mockPinyinCharacterMappingFindMany.mockReset();
  });

  it("emits digitless correctPinyin ('ba1' → 'ba')", async () => {
    mockPinyinSyllableFindMany.mockResolvedValue([
      { syllablePretty: "bā", syllable: "ba1", tone: 1 },
    ]);
    mockPinyinCharacterMappingFindMany.mockResolvedValue([]);

    const questions = (await audioToPinyinAndToneStrategy.generateQuestions()) as Array<{
      correctPinyin: string;
      correctTone: number;
    }>;

    expect(questions).toHaveLength(1);
    expect(questions[0].correctPinyin).toBe("ba"); // not "ba1"
  });

  it("normalizes lexical neutral tone (5 → 0)", async () => {
    mockPinyinSyllableFindMany.mockResolvedValue([
      { syllablePretty: "ma", syllable: "ma5", tone: 5 },
    ]);
    mockPinyinCharacterMappingFindMany.mockResolvedValue([]);

    const questions = (await audioToPinyinAndToneStrategy.generateQuestions()) as Array<{
      correctPinyin: string;
      correctTone: number;
    }>;

    expect(questions[0].correctPinyin).toBe("ma");
    expect(questions[0].correctTone).toBe(0); // normalizeTone(5)
  });

  it("keeps non-neutral tones unchanged and strips digits", async () => {
    mockPinyinSyllableFindMany.mockResolvedValue([
      { syllablePretty: "mǎ", syllable: "ma3", tone: 3 },
    ]);
    mockPinyinCharacterMappingFindMany.mockResolvedValue([]);

    const questions = (await audioToPinyinAndToneStrategy.generateQuestions()) as Array<{
      correctPinyin: string;
      correctTone: number;
    }>;

    expect(questions[0].correctPinyin).toBe("ma");
    expect(questions[0].correctTone).toBe(3); // normalizeTone(3) unchanged
  });

  it("orders mappings by representativeRank asc (nulls last) then id — no isDefault filter", async () => {
    mockPinyinSyllableFindMany.mockResolvedValue([
      { syllablePretty: "bā", syllable: "ba1", tone: 1 },
    ]);
    mockPinyinCharacterMappingFindMany.mockResolvedValue([
      { pinyinSyllable: { syllablePretty: "bā", syllable: "ba1" }, character: { glyph: "八" } },
    ]);

    await audioToPinyinAndToneStrategy.generateQuestions();

    const args = mockPinyinCharacterMappingFindMany.mock.calls[0][0];
    // Deterministic representative selection — rank asc with NULLS LAST (Postgres
    // ASC defaults to NULLS FIRST, which would pick the wrong glyph).
    expect(args.orderBy).toEqual([
      { representativeRank: { sort: "asc", nulls: "last" } },
      { id: "asc" },
    ]);
    // isDefault is per-character primary, NOT the per-syllable representative.
    expect(args.where).toBeUndefined();
  });

  it("picks the first (rank-0) mapping per syllable as the representative character", async () => {
    mockPinyinSyllableFindMany.mockResolvedValue([
      { syllablePretty: "bǎi", syllable: "bai3", tone: 3 },
    ]);
    // Rows arrive rank-0 first (orderBy representativeRank) — first-wins below.
    mockPinyinCharacterMappingFindMany.mockResolvedValue([
      { pinyinSyllable: { syllablePretty: "bǎi", syllable: "bai3" }, character: { glyph: "百" } },
      { pinyinSyllable: { syllablePretty: "bǎi", syllable: "bai3" }, character: { glyph: "摆" } },
      { pinyinSyllable: { syllablePretty: "bǎi", syllable: "bai3" }, character: { glyph: "伯" } },
    ]);

    const questions = (await audioToPinyinAndToneStrategy.generateQuestions()) as Array<{
      character: string | null;
    }>;

    expect(questions[0].character).toBe("百");
  });
});
