/**
 * @file apps/backend/scripts/__tests__/validate-grammar-content.test.ts
 * @description Unit tests for the pure validation helpers in the repo-root
 * authoring-time validator (scripts/validate-grammar-content.ts, Epic 22).
 *
 * The repo-root scripts/ tree has no vitest config of its own, so these tests
 * live under apps/backend/scripts/__tests__/ — the backend vitest config's
 * `scripts/__tests__/**` include — and import the helpers directly from the
 * repo-root script. The script's CLI runner is guarded by an isMain check so
 * importing it for tests has no side effects.
 */

import { describe, it, expect } from "vitest";
import {
  isValidContentId,
  isValidExampleId,
  isValidPhase,
  isValidHskLevel,
  isValidRelationType,
  validateSegments,
  validateExample,
  validatePattern,
  validateRelation,
} from "../../../../scripts/validate-grammar-content.js";

const emptyIds = new Set<string>();

describe("isValidContentId (gr_XXXX regex)", () => {
  it("accepts a well-formed gr_XXXX content_id", () => {
    expect(isValidContentId("gr_0001")).toBe(true);
    expect(isValidContentId("gr_0021")).toBe(true);
  });

  it("rejects malformed content_ids", () => {
    expect(isValidContentId("gr_1")).toBe(false);
    expect(isValidContentId("gr_00001")).toBe(false);
    expect(isValidContentId("gram_001")).toBe(false);
    expect(isValidContentId("ch_25105")).toBe(false);
    expect(isValidContentId(null)).toBe(false);
    expect(isValidContentId(123)).toBe(false);
  });
});

describe("isValidExampleId (gr_XXXX_exN regex)", () => {
  it("accepts a well-formed example id", () => {
    expect(isValidExampleId("gr_0001_ex1")).toBe(true);
    expect(isValidExampleId("gr_0018_ex3")).toBe(true);
  });

  it("rejects malformed example ids", () => {
    expect(isValidExampleId("gr_0001")).toBe(false);
    expect(isValidExampleId("gr_0001_ex")).toBe(false);
    expect(isValidExampleId("gr_0001_ex01")).toBe(false);
  });
});

describe("isValidPhase (2 | 3 | 4)", () => {
  it("accepts only roadmap phases 2, 3, 4", () => {
    expect(isValidPhase(2)).toBe(true);
    expect(isValidPhase(3)).toBe(true);
    expect(isValidPhase(4)).toBe(true);
  });

  it("rejects out-of-domain phases", () => {
    expect(isValidPhase(1)).toBe(false);
    expect(isValidPhase(5)).toBe(false);
    expect(isValidPhase(0)).toBe(false);
    expect(isValidPhase("2")).toBe(false);
    expect(isValidPhase(null)).toBe(false);
  });
});

describe("isValidHskLevel (1–6 | null)", () => {
  it("accepts HSK levels 1–6 and null", () => {
    expect(isValidHskLevel(1)).toBe(true);
    expect(isValidHskLevel(6)).toBe(true);
    expect(isValidHskLevel(null)).toBe(true);
  });

  it("rejects out-of-bounds and non-numeric levels", () => {
    expect(isValidHskLevel(0)).toBe(false);
    expect(isValidHskLevel(7)).toBe(false);
    expect(isValidHskLevel(1.5)).toBe(false);
    expect(isValidHskLevel("1")).toBe(false);
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
    expect(isValidRelationType(null)).toBe(false);
  });
});

describe("validateSegments (token schema)", () => {
  it("accepts a well-formed segments array (character + word + null tokens)", () => {
    const violations = validateSegments([
      { text: "我", pinyin: "wǒ", gloss: "I", entityType: "character", entityId: "ch_25105" },
      { text: "学习", pinyin: "xuéxí", gloss: "study", entityType: "word", entityId: "w_00420" },
      {
        text: "正在",
        pinyin: "zhèngzài",
        gloss: "progressive marker",
        entityType: null,
        entityId: null,
      },
    ]);
    expect(violations).toEqual([]);
  });

  it("rejects a token with an entityId but a null entityType", () => {
    const violations = validateSegments([
      { text: "吗", pinyin: "ma", gloss: "?", entityType: null, entityId: "ch_21527" },
    ]);
    expect(violations.length).toBe(1);
    expect(violations[0]).toContain("entityId must be null when entityType is null");
  });

  it("rejects a character entityId that is not ch_-prefixed", () => {
    const violations = validateSegments([
      { text: "我", pinyin: "wǒ", gloss: "I", entityType: "character", entityId: "w_00420" },
    ]);
    expect(violations.length).toBe(1);
    expect(violations[0]).toContain("must be a ch_XXXXX character content_id");
  });

  it("rejects missing required token fields and non-array input", () => {
    expect(validateSegments([{ pinyin: "wǒ" }]).length).toBeGreaterThanOrEqual(3);
    expect(validateSegments("not-an-array").length).toBe(1);
  });
});

describe("validateExample", () => {
  it("accepts a well-formed example", () => {
    const violations = validateExample(
      {
        content_id: "gr_0001_ex1",
        chinese: "我打人。",
        pinyin: "wǒ dǎ rén",
        english: "I hit the person.",
        sortOrder: 1,
        segments: [
          { text: "我", pinyin: "wǒ", gloss: "I", entityType: "character", entityId: "ch_25105" },
        ],
      },
      "gr_0001",
    );
    expect(violations).toEqual([]);
  });

  it("rejects an example with empty english and a bad content_id", () => {
    const violations = validateExample(
      {
        content_id: "gr_0001",
        chinese: "我打人。",
        pinyin: "wǒ dǎ rén",
        english: "",
        sortOrder: 1,
        segments: [],
      },
      "gr_0001",
    );
    expect(violations.some((v) => v.includes("content_id must match"))).toBe(true);
    expect(violations.some((v) => v.includes("english must be a non-empty string"))).toBe(true);
  });
});

describe("validatePattern", () => {
  const validPattern = {
    content_id: "gr_0001",
    name: "SVO basic word order",
    structure: "Subject + Verb + Object",
    explanation: "Chinese declarative sentences follow Subject-Verb-Object order.",
    phase: 2,
    hskLevel: 1,
    sortOrder: 1,
    metadata: { family: "word-order-tense", hskSource: "HSK 3.0 standard" },
    examples: [
      {
        content_id: "gr_0001_ex1",
        chinese: "我打人。",
        pinyin: "wǒ dǎ rén",
        english: "I hit the person.",
        sortOrder: 1,
        segments: [],
      },
      {
        content_id: "gr_0001_ex2",
        chinese: "他喝茶。",
        pinyin: "tā hē chá",
        english: "He drinks tea.",
        sortOrder: 2,
        segments: [],
      },
      {
        content_id: "gr_0001_ex3",
        chinese: "我爱妈妈。",
        pinyin: "wǒ ài māma",
        english: "I love Mom.",
        sortOrder: 3,
        segments: [],
      },
    ],
  };

  it("accepts a well-formed pattern with 3 examples", () => {
    expect(validatePattern(validPattern, emptyIds)).toEqual([]);
  });

  it("flags fewer than 3 examples, bad phase, and unresolvable segment entityIds", () => {
    const bad = {
      ...validPattern,
      phase: 5,
      examples: [
        {
          content_id: "gr_0001_ex1",
          chinese: "我打人。",
          pinyin: "wǒ dǎ rén",
          english: "I hit the person.",
          sortOrder: 1,
          segments: [
            { text: "我", pinyin: "wǒ", gloss: "I", entityType: "character", entityId: "ch_99999" },
          ],
        },
      ],
    };
    const violations = validatePattern(bad, new Set(["ch_25105"]));
    expect(violations.some((v) => v.includes("phase must be 2 | 3 | 4"))).toBe(true);
    expect(violations.some((v) => v.includes("only 1 examples"))).toBe(true);
    expect(violations.some((v) => v.includes('"ch_99999" does not resolve'))).toBe(true);
  });
});

describe("validateRelation", () => {
  const validPatternIds = new Set(["gr_0005", "gr_0006"]);

  it("accepts a well-formed relation between known patterns", () => {
    expect(
      validateRelation(
        { fromPatternContentId: "gr_0005", toPatternContentId: "gr_0006", relationType: "RELATED" },
        validPatternIds,
      ),
    ).toEqual([]);
  });

  it("rejects unknown endpoints, invalid type, and self-references", () => {
    const violations = validateRelation(
      {
        fromPatternContentId: "gr_9999",
        toPatternContentId: "gr_0006",
        relationType: "DEPENDS_ON",
      },
      validPatternIds,
    );
    expect(violations.some((v) => v.includes('"gr_9999" references an unknown pattern'))).toBe(
      true,
    );
    expect(violations.some((v) => v.includes("relationType must be RELATED"))).toBe(true);

    const selfRef = validateRelation(
      { fromPatternContentId: "gr_0005", toPatternContentId: "gr_0005", relationType: "RELATED" },
      validPatternIds,
    );
    expect(selfRef.some((v) => v.includes("cannot reference the same pattern"))).toBe(true);
  });
});
