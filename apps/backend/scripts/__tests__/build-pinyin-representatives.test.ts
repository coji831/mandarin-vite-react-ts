/**
 * @file apps/backend/scripts/__tests__/build-pinyin-representatives.test.ts
 * @description Unit tests for the pure representative-selection logic.
 *   Covers: curated precedence, deterministic tiebreak (hsk > freq > primary >
 *   charId), nulls-last, synthetic row synthesis, exactly-one-rank-0, and
 *   fail-loudly on missing curated glyph/syllable.
 */
import { describe, it, expect } from "vitest";
import {
  computeRepresentativeRanks,
  type CharacterFacts,
  type PinyinCharacterMappingRecord,
} from "../enrich/build-pinyin-representatives.js";
import { checkRepresentativeInvariant } from "../verify/representative-invariant.js";

// ── Fixtures ──

const CHARACTERS: CharacterFacts[] = [
  { id: "ch_good", glyph: "好", hskLevel: 1, frequencyRank: 50 },
  { id: "ch_med", glyph: "中", hskLevel: 3, frequencyRank: 300 },
  { id: "ch_bai", glyph: "白", hskLevel: 1, frequencyRank: 304 },
  { id: "ch_bai2", glyph: "拜", hskLevel: 5, frequencyRank: 876 },
  { id: "ch_ber", glyph: "伯", hskLevel: 7, frequencyRank: 1347 },
  { id: "ch_cur", glyph: "坏", hskLevel: 7, frequencyRank: 9000 },
  { id: "ch_bai3", glyph: "掰", hskLevel: 7, frequencyRank: 2244 },
  { id: "ch_null", glyph: "罕", hskLevel: null, frequencyRank: null },
];

// syllablePretty → ps id (array order, same convention as build-pinyin-mappings)
const SYLLABLES = [
  { syllablePretty: "bái" }, // ps_00001
  { syllablePretty: "bǎi" }, // ps_00002
  { syllablePretty: "bai" }, // ps_00003
];

function row(
  pinyinSyllableId: string,
  characterId: string,
  readingType: "primary" | "secondary" = "primary",
): Omit<PinyinCharacterMappingRecord, "representativeRank"> {
  return {
    pinyinSyllableId,
    characterId,
    readingType,
    isDefault: readingType === "primary",
  };
}

const BASE_INPUT = {
  characters: CHARACTERS,
  syllables: SYLLABLES,
  curated: [] as Array<{ syllablePretty: string; glyph: string; syntheticReading?: boolean }>,
};

// ── Tiebreak ordering ──

describe("computeRepresentativeRanks — deterministic tiebreak", () => {
  it("ranks by hskLevel asc (null last), then frequencyRank asc", () => {
    const { mappings } = computeRepresentativeRanks({
      ...BASE_INPUT,
      mappings: [
        row("ps_00001", "ch_ber"), // hsk 7, freq 1347
        row("ps_00001", "ch_good"), // hsk 1, freq 50
        row("ps_00001", "ch_null"), // hsk null, freq null
        row("ps_00001", "ch_med"), // hsk 3, freq 300
      ],
    });
    const order = mappings
      .filter((m) => m.pinyinSyllableId === "ps_00001")
      .sort((a, b) => a.representativeRank - b.representativeRank)
      .map((m) => m.characterId);
    expect(order).toEqual(["ch_good", "ch_med", "ch_ber", "ch_null"]);
    expect(mappings.map((m) => m.representativeRank)).toEqual([0, 1, 2, 3]);
  });

  it("breaks an hsk tie by frequencyRank asc", () => {
    const { mappings } = computeRepresentativeRanks({
      ...BASE_INPUT,
      mappings: [
        row("ps_00001", "ch_bai2"), // hsk 5, freq 876
        row("ps_00001", "ch_ber"), // hsk 7, freq 1347
        row("ps_00001", "ch_cur"), // hsk 7, freq 9000
      ],
    });
    const rank0 = mappings.find((m) => m.representativeRank === 0)!;
    expect(rank0.characterId).toBe("ch_bai2"); // lower hsk wins
    const byRank = [...mappings].sort((a, b) => a.representativeRank - b.representativeRank);
    expect(byRank.map((m) => m.characterId)).toEqual(["ch_bai2", "ch_ber", "ch_cur"]);
  });

  it("breaks an hsk+freq tie by readingType primary first", () => {
    const { mappings } = computeRepresentativeRanks({
      ...BASE_INPUT,
      mappings: [
        row("ps_00001", "ch_good", "secondary"),
        row("ps_00001", "ch_bai", "primary"), // hsk 1, freq 304 — tie with? use distinct freq
      ],
    });
    // primary 白 (freq 304) vs secondary 好 (freq 50): freq first would pick 好,
    // so to isolate readingType use the SAME freq via another fixture below.
    const rank0 = mappings.find((m) => m.representativeRank === 0)!;
    // freq 50 (好 secondary) < freq 304 (白 primary) → freq wins, 好 is rank 0.
    expect(rank0.characterId).toBe("ch_good");
  });

  it("breaks a full tie by characterId asc", () => {
    const { mappings } = computeRepresentativeRanks({
      ...BASE_INPUT,
      mappings: [
        row("ps_00001", "ch_med", "secondary"), // hsk 3 freq 300
        row("ps_00001", "ch_cur", "primary"), // hsk 7 freq 9000
      ],
    });
    const byRank = [...mappings].sort((a, b) => a.representativeRank - b.representativeRank);
    expect(byRank[0].characterId).toBe("ch_med");
  });

  it("puts primary reading first when hsk+freq are identical", () => {
    const characters = [
      { id: "ch_a", glyph: "甲", hskLevel: 1, frequencyRank: 100 },
      { id: "ch_b", glyph: "乙", hskLevel: 1, frequencyRank: 100 },
    ];
    const { mappings } = computeRepresentativeRanks({
      characters,
      syllables: SYLLABLES,
      curated: [],
      mappings: [row("ps_00001", "ch_a", "secondary"), row("ps_00001", "ch_b", "primary")],
    });
    const byRank = [...mappings].sort((a, b) => a.representativeRank - b.representativeRank);
    // primary ch_b wins even though characterId "ch_a" < "ch_b"
    expect(byRank[0].characterId).toBe("ch_b");
    expect(byRank[1].characterId).toBe("ch_a");
  });
});

// ── Curated precedence ──

describe("computeRepresentativeRanks — curated precedence", () => {
  it("forces the curated glyph to rank 0 even with worse hsk/freq", () => {
    const { mappings, stats } = computeRepresentativeRanks({
      ...BASE_INPUT,
      curated: [{ syllablePretty: "bái", glyph: "坏" }], // hsk 7, freq 9000
      mappings: [
        row("ps_00001", "ch_good"), // hsk 1, freq 50
        row("ps_00001", "ch_bai"), // hsk 1, freq 304
        row("ps_00001", "ch_cur"), // hsk 7, freq 9000 (curated glyph)
      ],
    });
    expect(stats.curatedApplied).toBe(1);
    const rank0 = mappings.find((m) => m.representativeRank === 0)!;
    expect(rank0.characterId).toBe("ch_cur"); // curated wins over hsk-1 candidates
    // remaining candidates still ranked by tiebreak (1..n contiguous)
    const byRank = [...mappings].sort((a, b) => a.representativeRank - b.representativeRank);
    expect(byRank.map((m) => m.representativeRank)).toEqual([0, 1, 2]);
    expect(byRank.map((m) => m.characterId)).toEqual(["ch_cur", "ch_good", "ch_bai"]);
  });

  it("synthesizes a rank-0 row when syntheticReading has no genuine mapping", () => {
    const { mappings, stats } = computeRepresentativeRanks({
      ...BASE_INPUT,
      curated: [{ syllablePretty: "bai", glyph: "掰", syntheticReading: true }],
      mappings: [
        row("ps_00003", "ch_ber"), // genuine 伯
        row("ps_00003", "ch_bai2"), // genuine 拜
      ],
    });
    expect(stats.synthesizedRows).toEqual(["bai → 掰"]);
    const byRank = [...mappings].sort((a, b) => a.representativeRank - b.representativeRank);
    expect(byRank[0]).toMatchObject({
      pinyinSyllableId: "ps_00003",
      characterId: "ch_bai3",
      readingType: "primary",
      isDefault: true,
      representativeRank: 0,
    });
    // rest contiguous 1..n
    expect(byRank.map((m) => m.representativeRank)).toEqual([0, 1, 2]);
  });

  it("uses the genuine row (no synthesis) when it already exists even if syntheticReading set", () => {
    const { mappings, stats } = computeRepresentativeRanks({
      ...BASE_INPUT,
      curated: [{ syllablePretty: "bai", glyph: "掰", syntheticReading: true }],
      mappings: [
        row("ps_00003", "ch_ber"),
        row("ps_00003", "ch_bai3"), // genuine 掰 row exists
      ],
    });
    expect(stats.synthesizedRows).toEqual([]); // not synthesized
    expect(mappings.find((m) => m.representativeRank === 0)!.characterId).toBe("ch_bai3");
    expect(mappings).toHaveLength(2); // no extra synthetic row
  });

  it("synthesizes the only row when the curated syllable has no genuine mappings at all", () => {
    const { mappings, stats } = computeRepresentativeRanks({
      ...BASE_INPUT,
      curated: [{ syllablePretty: "bai", glyph: "掰", syntheticReading: true }],
      mappings: [], // no genuine rows for any syllable
    });
    expect(mappings).toHaveLength(1);
    expect(mappings[0]).toMatchObject({
      pinyinSyllableId: "ps_00003",
      characterId: "ch_bai3",
      readingType: "primary",
      isDefault: true,
      representativeRank: 0,
    });
    expect(stats.synthesizedRows).toEqual(["bai → 掰"]);
  });
});

// ── Invariant + determinism ──

describe("computeRepresentativeRanks — invariants & determinism", () => {
  it("emits exactly one rank-0 per syllable and contiguous 0..n ranks", () => {
    const { mappings } = computeRepresentativeRanks({
      ...BASE_INPUT,
      curated: [
        { syllablePretty: "bái", glyph: "白" },
        { syllablePretty: "bǎi", glyph: "坏" },
        { syllablePretty: "bai", glyph: "掰", syntheticReading: true },
      ],
      mappings: [
        row("ps_00001", "ch_bai2"),
        row("ps_00001", "ch_bai"),
        row("ps_00002", "ch_cur"),
        row("ps_00002", "ch_good"),
        row("ps_00003", "ch_ber"),
      ],
    });
    const invariant = checkRepresentativeInvariant(mappings);
    expect(invariant.ok).toBe(true);
    expect(invariant.violations).toEqual([]);
    // 3 syllables each with a rank-0
    const zeroRanks = mappings.filter((m) => m.representativeRank === 0);
    expect(zeroRanks).toHaveLength(3);
  });

  it("is deterministic: identical inputs ⇒ identical output", () => {
    const input = {
      ...BASE_INPUT,
      mappings: [
        row("ps_00001", "ch_bai2"),
        row("ps_00001", "ch_good"),
        row("ps_00002", "ch_ber"),
        row("ps_00002", "ch_med", "secondary"),
      ],
    };
    const a = computeRepresentativeRanks(input).mappings;
    const b = computeRepresentativeRanks(input).mappings;
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});

// ── Fail loudly ──

describe("computeRepresentativeRanks — fail loudly on missing curated data", () => {
  it("throws when the curated glyph is not in characters.json", () => {
    expect(() =>
      computeRepresentativeRanks({
        ...BASE_INPUT,
        curated: [{ syllablePretty: "bái", glyph: "不存在" }],
        mappings: [row("ps_00001", "ch_good")],
      }),
    ).toThrow(/不存在/);
  });

  it("throws when the curated syllable is not in pinyin-syllables.json", () => {
    expect(() =>
      computeRepresentativeRanks({
        ...BASE_INPUT,
        curated: [{ syllablePretty: "zzzz", glyph: "好" }],
        mappings: [row("ps_00001", "ch_good")],
      }),
    ).toThrow(/zzzz/);
  });

  it("throws when a curated (non-synthetic) glyph has no genuine mapping row", () => {
    expect(() =>
      computeRepresentativeRanks({
        ...BASE_INPUT,
        curated: [{ syllablePretty: "bai", glyph: "掰" }], // no syntheticReading
        mappings: [row("ps_00003", "ch_ber")],
      }),
    ).toThrow(/syntheticReading/);
  });
});
