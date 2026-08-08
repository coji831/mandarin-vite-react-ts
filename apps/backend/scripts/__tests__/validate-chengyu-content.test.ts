/**
 * @file apps/backend/scripts/__tests__/validate-chengyu-content.test.ts
 * @description Unit tests for the pure validation helpers in the repo-root
 * authoring-time validator (scripts/validate-chengyu-content.ts, Epic 23 —
 * Story 23.1).
 *
 * The repo-root scripts/ tree has no vitest config of its own, so these tests
 * live under apps/backend/scripts/__tests__/ — the backend vitest config's
 * `scripts/__tests__/**` include — and import the helpers directly from the
 * repo-root script. The script's CLI runner is guarded by an isMain check so
 * importing it for tests has no side effects.
 */

import { describe, it, expect } from "vitest";
import {
  isValidChengyuId,
  isValidChengyuExampleId,
  isExactly4Cjk,
  isValidRelationType,
  isValidStorySource,
  stripToneMarks,
  normalizePinyinSyllable,
  isValidPinyin,
  validateSegments,
  validateChengyuExample,
  validateChengyuIdiom,
  validateChengyuRelation,
  KNOWN_WORKS,
} from "../../../../scripts/validate-chengyu-content.js";

const emptyMap = new Map<string, string>();
const emptySet = new Set<string>();

const baseCtx = {
  glyphToId: emptyMap,
  knownSyllables: emptySet,
  validEntityIds: emptySet,
};

describe("isValidChengyuId (cy_XXXX regex)", () => {
  it("accepts a well-formed cy_XXXX content_id", () => {
    expect(isValidChengyuId("cy_0001")).toBe(true);
    expect(isValidChengyuId("cy_0055")).toBe(true);
  });

  it("rejects malformed content_ids", () => {
    expect(isValidChengyuId("cy_1")).toBe(false);
    expect(isValidChengyuId("cy_00001")).toBe(false);
    expect(isValidChengyuId("gr_0001")).toBe(false);
    expect(isValidChengyuId("ch_25105")).toBe(false);
    expect(isValidChengyuId(null)).toBe(false);
  });
});

describe("isValidChengyuExampleId (cy_XXXX_exN regex)", () => {
  it("accepts well-formed example ids", () => {
    expect(isValidChengyuExampleId("cy_0001_ex1")).toBe(true);
    expect(isValidChengyuExampleId("cy_0042_ex2")).toBe(true);
  });

  it("rejects malformed example ids", () => {
    expect(isValidChengyuExampleId("cy_0001")).toBe(false);
    expect(isValidChengyuExampleId("cy_0001_ex")).toBe(false);
    expect(isValidChengyuExampleId("cy_0001_ex01")).toBe(false);
  });
});

describe("isExactly4Cjk", () => {
  it("accepts exactly 4 CJK chars", () => {
    expect(isExactly4Cjk("破釜沉舟")).toBe(true);
  });

  it("rejects non-4-char or non-CJK input", () => {
    expect(isExactly4Cjk("破釜沉舟的")).toBe(false);
    expect(isExactly4Cjk("成语")).toBe(false);
    expect(isExactly4Cjk("abcd")).toBe(false);
  });
});

describe("isValidRelationType", () => {
  it("accepts the three allowed relation types", () => {
    expect(isValidRelationType("RELATED")).toBe(true);
    expect(isValidRelationType("CONTRASTS_WITH")).toBe(true);
    expect(isValidRelationType("PREREQUISITE")).toBe(true);
  });

  it("rejects unknown relation types", () => {
    expect(isValidRelationType("DEPENDS_ON")).toBe(false);
    expect(isValidRelationType("")).toBe(false);
  });
});

describe("isValidStorySource (KNOWN_WORKS prefix)", () => {
  it("accepts a canonical 《work·juan·chapter》 citation", () => {
    expect(isValidStorySource("《史记·卷七·项羽本纪》(zh.wikisource.org/wiki/史記/卷007)")).toBe(
      true,
    );
    expect(isValidStorySource("《战国策·齐策二》(zh.wikisource.org/wiki/戰國策/卷九)")).toBe(true);
  });

  it("accepts an expanded KNOWN_WORKS work (乐府诗集 / 新序 / 历代名画记)", () => {
    expect(isValidStorySource("《乐府诗集·卷三十二·相和歌辞·君子行》(zh.wikisource.org)")).toBe(
      true,
    );
    expect(isValidStorySource("《新序·杂事五》(zh.wikisource.org)")).toBe(true);
    expect(isValidStorySource("《历代名画记·卷七》(zh.wikisource.org)")).toBe(true);
  });

  it("rejects non-KNOWN_WORKS or malformed sources", () => {
    expect(isValidStorySource("《西游记·第一回》(zh.wikisource.org)")).toBe(false);
    expect(isValidStorySource("维基百科：破釜沉舟")).toBe(false);
    expect(isValidStorySource("")).toBe(false);
    expect(isValidStorySource(null)).toBe(false);
  });
});

describe("stripToneMarks / normalizePinyinSyllable", () => {
  it("strips tone marks while preserving ü (nǚ → nü, not nu)", () => {
    expect(stripToneMarks("nǚ")).toBe("nü");
    expect(stripToneMarks("lǜ")).toBe("lü");
    expect(stripToneMarks("mǎ")).toBe("ma");
    expect(stripToneMarks("zhōu")).toBe("zhou");
  });

  it("applies the j/q/x + final u/ue → ü rule (dataset orthography)", () => {
    expect(normalizePinyinSyllable("jū")).toBe("jü");
    expect(normalizePinyinSyllable("xué")).toBe("xüe");
    expect(normalizePinyinSyllable("qù")).toBe("qü");
    // ua/uan stay plain (dataset spells juan/quan/xuan with plain u)
    expect(normalizePinyinSyllable("xuán")).toBe("xuan");
    expect(normalizePinyinSyllable("yuán")).toBe("yuan");
  });

  it("converts CC-CEDICT u: → ü", () => {
    expect(normalizePinyinSyllable("lǜ")).toBe("lü");
  });
});

describe("isValidPinyin (known-syllable check)", () => {
  const known = new Set([
    "po",
    "fu",
    "chen",
    "zhou",
    "jü",
    "xüe",
    "xuan",
    "bu",
    "an",
    "si",
    "wei",
    "ta",
  ]);

  it("accepts a pinyin whose syllables all normalize to known syllables", () => {
    expect(isValidPinyin("pò fǔ chén zhōu", known)).toBe(true);
    expect(isValidPinyin("jū ān sī wēi", known)).toBe(true); // jū → jü
    expect(isValidPinyin("xué bù", known)).toBe(true); // xué → xüe
    expect(isValidPinyin("tā pò fǔ chén zhōu", known)).toBe(true);
  });

  it("rejects a pinyin with an unknown syllable (e.g. weng missing from the dataset)", () => {
    expect(isValidPinyin("sài wēng shī mǎ", known)).toBe(false);
  });

  it("rejects non-string / empty pinyin", () => {
    expect(isValidPinyin("", known)).toBe(false);
    expect(isValidPinyin(null, known)).toBe(false);
  });
});

describe("validateSegments (token schema)", () => {
  it("accepts well-formed tokens (character + word + null)", () => {
    expect(
      validateSegments([
        { text: "破", pinyin: "pò", gloss: "break", entityType: "character", entityId: "ch_7834" },
        {
          text: "釜",
          pinyin: "fǔ",
          gloss: "cauldron",
          entityType: "character",
          entityId: "ch_46225",
        },
        {
          text: "沉",
          pinyin: "chén",
          gloss: "sink",
          entityType: "character",
          entityId: "ch_27785",
        },
        { text: "舟", pinyin: "zhōu", gloss: "boat", entityType: "character", entityId: "ch_8219" },
        { text: "的", pinyin: "de", gloss: "possessive", entityType: null, entityId: null },
        {
          text: "事情",
          pinyin: "shìqing",
          gloss: "matter",
          entityType: "word",
          entityId: "w_00420",
        },
      ]),
    ).toEqual([]);
  });

  it("rejects a token with an entityId but a null entityType", () => {
    const v = validateSegments([
      { text: "的", pinyin: "de", gloss: "possessive", entityType: null, entityId: "ch_30340" },
    ]);
    expect(v.length).toBe(1);
    expect(v[0]).toContain("entityId must be null when entityType is null");
  });

  it("rejects a character entityId that is not ch_-prefixed", () => {
    const v = validateSegments([
      { text: "破", pinyin: "pò", gloss: "break", entityType: "character", entityId: "w_00420" },
    ]);
    expect(v[0]).toContain("must be a ch_XXXXX character content_id");
  });

  it("rejects a word entityId that is not w_-prefixed", () => {
    const v = validateSegments([
      { text: "事情", pinyin: "shìqing", gloss: "matter", entityType: "word", entityId: "ch_1001" },
    ]);
    expect(v[0]).toContain("must be a w_XXXXX word content_id");
  });

  it("rejects missing fields and non-array input", () => {
    expect(validateSegments([{ pinyin: "pò" }]).length).toBeGreaterThanOrEqual(3);
    expect(validateSegments("nope").length).toBe(1);
  });
});

describe("validateChengyuExample", () => {
  it("accepts a well-formed example", () => {
    expect(
      validateChengyuExample(
        {
          content_id: "cy_0001_ex1",
          chinese: "他做事破釜沉舟。",
          pinyin: "tā zuòshì pò fǔ chén zhōu",
          english: "He commits fully, burning his bridges.",
          sortOrder: 1,
          segments: [
            {
              text: "破",
              pinyin: "pò",
              gloss: "break",
              entityType: "character",
              entityId: "ch_7834",
            },
          ],
        },
        "cy_0001",
      ),
    ).toEqual([]);
  });

  it("rejects an example with an empty english and a bad content_id", () => {
    const v = validateChengyuExample(
      {
        content_id: "cy_0001",
        chinese: "测试。",
        pinyin: "cèshì",
        english: "",
        sortOrder: 1,
        segments: [],
      },
      "cy_0001",
    );
    expect(v.some((x) => x.includes("content_id must match"))).toBe(true);
    expect(v.some((x) => x.includes("english must be a non-empty string"))).toBe(true);
  });

  it("rejects an example whose content_id does not start with the parent idiom prefix", () => {
    const v = validateChengyuExample(
      {
        content_id: "cy_0002_ex1",
        chinese: "他做事破釜沉舟。",
        pinyin: "tā zuòshì pò fǔ chén zhōu",
        english: "He commits fully, burning his bridges.",
        sortOrder: 1,
        segments: [],
      },
      "cy_0001",
    );
    expect(v.some((x) => x.includes('content_id must start with "cy_0001_"'))).toBe(true);
  });
});

describe("validateChengyuIdiom", () => {
  const glyphToId = new Map([
    ["破", "ch_7834"],
    ["釜", "ch_46225"],
    ["沉", "ch_27785"],
    ["舟", "ch_8219"],
  ]);
  const knownSyllables = new Set(["po", "fu", "chen", "zhou", "ta"]);
  const ctx = {
    glyphToId,
    knownSyllables,
    validEntityIds: new Set(["ch_7834", "ch_46225", "ch_27785", "ch_8219", "w_00420"]),
  };

  const validIdiom = {
    content_id: "cy_0001",
    chengyu: "破釜沉舟",
    pinyin: "pò fǔ chén zhōu",
    literalMeaning: "Break pots, sink ships",
    figurativeMeaning: "Burning one's bridges",
    story: "Xiang Yu crossed the river and destroyed his own escape route.",
    storySource: "《史记·卷七·项羽本纪》(zh.wikisource.org/wiki/史記/卷007)",
    era: "Qin–Han transition",
    theme: "determination",
    sortOrder: 1,
    metadata: { source: "CC-CEDICT" },
    examples: [
      {
        content_id: "cy_0001_ex1",
        chinese: "他破釜沉舟。",
        pinyin: "tā pò fǔ chén zhōu",
        english: "He burned his bridges.",
        sortOrder: 1,
        segments: [
          {
            text: "破",
            pinyin: "pò",
            gloss: "break",
            entityType: "character",
            entityId: "ch_7834",
          },
        ],
      },
    ],
  };

  it("accepts a fully-valid idiom row", () => {
    expect(validateChengyuIdiom(validIdiom, ctx)).toEqual([]);
  });

  it("rejects an idiom with a missing glyph (glyph→id lookup failure)", () => {
    const bad = { ...validIdiom, chengyu: "破釜沉a" }; // 'a' not a CJK glyph
    const v = validateChengyuIdiom(bad, ctx);
    expect(v.some((x) => x.includes("chengyu must be exactly 4 CJK"))).toBe(true);
  });

  it("rejects an idiom whose glyph does not resolve in characters.json", () => {
    const bad = { ...validIdiom, chengyu: "破釜沉艸" }; // 艸 not in glyphToId
    const v = validateChengyuIdiom(bad, ctx);
    expect(v.some((x) => x.includes('glyph "艸" does not resolve'))).toBe(true);
  });

  it("rejects an idiom with pinyin syllables not in pinyin-syllables.json", () => {
    const bad = { ...validIdiom, pinyin: "wēng fǔ chén zhōu" };
    const v = validateChengyuIdiom(bad, ctx);
    expect(v.some((x) => x.includes("has a syllable not in pinyin-syllables.json"))).toBe(true);
  });

  it("rejects a storySource that does not cite a KNOWN_WORKS work", () => {
    const bad = { ...validIdiom, storySource: "《西游记·第一回》(zh.wikisource.org)" };
    const v = validateChengyuIdiom(bad, ctx);
    expect(v.some((x) => x.includes("storySource must start with 《"))).toBe(true);
  });

  it("rejects an idiom missing story/storySource/era/theme/metadata.source", () => {
    const bad = {
      ...validIdiom,
      story: "",
      storySource: "",
      era: "",
      theme: "",
      metadata: { other: 1 },
    };
    const v = validateChengyuIdiom(bad, ctx);
    expect(v.some((x) => x.includes("story must be a non-empty string"))).toBe(true);
    expect(v.some((x) => x.includes("storySource must be a non-empty string"))).toBe(true);
    expect(v.some((x) => x.includes("era must be present"))).toBe(true);
    expect(v.some((x) => x.includes("theme must be present"))).toBe(true);
    expect(v.some((x) => x.includes("metadata.source must be a non-empty string"))).toBe(true);
  });

  it("rejects an example segment with a dead entityId (no validEntityIds provided)", () => {
    const bad = {
      ...validIdiom,
      examples: [
        {
          content_id: "cy_0001_ex1",
          chinese: "他破釜沉舟。",
          pinyin: "tā pò fǔ chén zhōu",
          english: "He burned his bridges.",
          sortOrder: 1,
          segments: [
            {
              text: "破",
              pinyin: "pò",
              gloss: "break",
              entityType: "character",
              entityId: "ch_00000",
            },
          ],
        },
      ],
    };
    const v = validateChengyuIdiom(bad, ctx);
    expect(v.some((x) => x.includes("does not resolve to an existing character/word"))).toBe(true);
  });
});

describe("validateChengyuRelation", () => {
  const ids = new Set(["cy_0001", "cy_0002"]);

  it("accepts a valid relation", () => {
    expect(
      validateChengyuRelation(
        { fromChengyuContentId: "cy_0001", toChengyuContentId: "cy_0002", relationType: "RELATED" },
        ids,
      ),
    ).toEqual([]);
  });

  it("rejects a self-loop, unknown endpoint, and invalid type", () => {
    const v = validateChengyuRelation(
      { fromChengyuContentId: "cy_0001", toChengyuContentId: "cy_0001", relationType: "FOO" },
      ids,
    );
    expect(v.some((x) => x.includes("same idiom on both ends"))).toBe(true);
    expect(v.some((x) => x.includes("relationType must be RELATED"))).toBe(true);
  });

  it("rejects an unknown endpoint", () => {
    const v = validateChengyuRelation(
      { fromChengyuContentId: "cy_9999", toChengyuContentId: "cy_0002", relationType: "RELATED" },
      ids,
    );
    expect(v.some((x) => x.includes("references an unknown idiom"))).toBe(true);
  });
});

describe("KNOWN_WORKS", () => {
  it("contains the IMP 16-row starter set + the Story 23.1 expansions", () => {
    for (const w of [
      "周易",
      "诗经",
      "论语",
      "左传",
      "楚辞",
      "孟子",
      "庄子",
      "列子",
      "韩非子",
      "吕氏春秋",
      "战国策",
      "史记",
      "淮南子",
      "汉书",
      "三国志",
      "世说新语",
      "新序",
      "乐府诗集",
      "牟子理惑论",
      "历代名画记",
    ]) {
      expect(KNOWN_WORKS).toContain(w);
    }
  });
});
