/**
 * @file utils/__tests__/grammarData.test.ts
 * @description Unit tests for the grammar pure helpers.
 * Story 22.3: Grammar UI
 *
 * Covers:
 *  - `mapGrammarApiToData` — API summary → display model (happy path + missing
 *    optional fields, so cards never render `undefined`).
 *  - `isPatternLocked` — phase-lock boundaries (equal → unlocked; greater → locked).
 *  - `segmentToEntityRef` — linked token → hub EntityRef; character/word tokens
 *    translate content_id → glyph (书/桌子); grammar/radical keep content_id;
 *    plain/null-entity tokens → null (skip hub navigation).
 */
import { describe, it, expect } from "vitest";
import { mapGrammarApiToData, isPatternLocked, segmentToEntityRef } from "../grammarData";
import type { GrammarPatternSummary, GrammarSegment } from "../../types";

describe("mapGrammarApiToData", () => {
  it("maps a full API summary into the display model", () => {
    const summary: GrammarPatternSummary = {
      id: "gr_0005",
      name: "吗 yes/no questions",
      structure: "Statement + 吗？",
      phase: 2,
      hskLevel: 1,
      sortOrder: 5,
      exampleCount: 3,
      previewExample: "你好吗？",
    };

    expect(mapGrammarApiToData(summary)).toEqual({
      id: "gr_0005",
      name: "吗 yes/no questions",
      structure: "Statement + 吗？",
      phase: 2,
      hskLevel: 1,
      exampleCount: 3,
      previewExample: "你好吗？",
    });
  });

  it("drops missing optional fields so consumers never read undefined", () => {
    const summary: GrammarPatternSummary = {
      id: "gr_0018",
      name: "把 (bǎ) disposal construction",
      structure: "Subject + 把 + Object + Verb + Complement",
      phase: 4,
      hskLevel: null,
      sortOrder: 18,
      exampleCount: 0,
      previewExample: null,
    };

    const data = mapGrammarApiToData(summary);

    expect(data.hskLevel).toBeNull();
    expect(data.previewExample).toBeUndefined();
    // Reserved fields are never populated by the summary mapping
    expect(data.examples).toBeUndefined();
    expect(data.relatedPatterns).toBeUndefined();
  });
});

describe("isPatternLocked", () => {
  it("returns false when the pattern phase equals the current phase", () => {
    expect(isPatternLocked(2, 2)).toBe(false);
  });

  it("returns false when the pattern phase is below the current phase", () => {
    expect(isPatternLocked(2, 4)).toBe(false);
  });

  it("returns true when the pattern phase is above the current phase", () => {
    expect(isPatternLocked(3, 2)).toBe(true);
    expect(isPatternLocked(4, 2)).toBe(true);
    expect(isPatternLocked(4, 3)).toBe(true);
  });
});

describe("segmentToEntityRef", () => {
  it("maps a linked character segment to the hub using the GLYPH (书) as entityId", () => {
    const segment: GrammarSegment = {
      text: "书",
      pinyin: "shū",
      gloss: "book",
      entityType: "character",
      entityId: "ch_20070",
    };

    expect(segmentToEntityRef(segment)).toEqual({
      entityType: "character",
      entityId: "书",
      label: "shū",
    });
  });

  it("maps a linked word segment to the hub using the GLYPH (桌子) as entityId", () => {
    const segment: GrammarSegment = {
      text: "桌子",
      pinyin: "zhuōzi",
      gloss: "table",
      entityType: "word",
      entityId: "w_00487",
    };

    expect(segmentToEntityRef(segment)).toEqual({
      entityType: "word",
      entityId: "桌子",
      label: "zhuōzi",
    });
  });

  it("falls back to the token text as the label when pinyin is empty", () => {
    const segment: GrammarSegment = {
      text: "桌子",
      pinyin: "",
      gloss: "table",
      entityType: "word",
      entityId: "w_00487",
    };

    expect(segmentToEntityRef(segment)).toEqual({
      entityType: "word",
      entityId: "桌子",
      label: "桌子",
    });
  });

  it("returns null for a glyph-keyed token with an empty text (blank hub id guard)", () => {
    const segment: GrammarSegment = {
      text: "",
      pinyin: "shū",
      gloss: "book",
      entityType: "character",
      entityId: "ch_20070",
    };

    expect(segmentToEntityRef(segment)).toBeNull();
  });

  it("keeps the content_id for non-glyph entity types (grammar/radical are content_id-keyed)", () => {
    // The declared GrammarSegment union is character|word|null today; the glyph
    // translation is scoped to character/word, so any other entity type passes
    // segment.entityId (content_id) through unchanged. Cast documents the
    // future-proofed branch.
    const segment = {
      text: "吗",
      pinyin: "ma",
      gloss: "question particle",
      entityType: "grammar",
      entityId: "gr_0005",
    } as unknown as GrammarSegment;

    expect(segmentToEntityRef(segment)).toEqual({
      entityType: "grammar",
      entityId: "gr_0005",
      label: "ma",
    });
  });

  it("returns null for a token without an entity id (plain text)", () => {
    const segment: GrammarSegment = {
      text: "的",
      pinyin: "de",
      gloss: "possessive",
      entityType: "character",
      entityId: null,
    };

    expect(segmentToEntityRef(segment)).toBeNull();
  });

  it("returns null for a token without an entity type (plain text)", () => {
    const segment: GrammarSegment = {
      text: "。",
      pinyin: "",
      gloss: "period",
      entityType: null,
      entityId: "ch_00000",
    };

    expect(segmentToEntityRef(segment)).toBeNull();
  });
});
