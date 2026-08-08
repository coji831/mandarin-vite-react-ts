/**
 * @file utils/__tests__/chengyuData.test.ts
 * @description Unit tests for pure chengyu data helpers:
 * `mapChengyuApiToData` (happy path + missing optional fields) and
 * `segmentToEntityRef` (linked vs null-entity tokens; the Epic-22 content_id →
 * glyph translation for character/word entity types).
 * Story 23.3: Chengyu UI
 */
import { describe, expect, it } from "vitest";
import { mapChengyuApiToData, segmentToEntityRef } from "../chengyuData";
import type { ChengyuSummary } from "../../types";

const summary: ChengyuSummary = {
  id: "cy_0001",
  chengyu: "破釜沉舟",
  pinyin: "pò fǔ chén zhōu",
  literalMeaning: "Break the pots and sink the boats",
  figurativeMeaning: "To burn one's bridges; to commit totally to a course of action",
  era: "Qin–Han transition",
  theme: "determination",
  sortOrder: 1,
  exampleCount: 1,
  previewExample: "他已经决定要破釜沉舟，全力投入新的工作。",
};

describe("mapChengyuApiToData", () => {
  it("maps a full API summary to the display model", () => {
    expect(mapChengyuApiToData(summary)).toEqual({
      id: "cy_0001",
      chengyu: "破釜沉舟",
      pinyin: "pò fǔ chén zhōu",
      literalMeaning: "Break the pots and sink the boats",
      figurativeMeaning: "To burn one's bridges; to commit totally to a course of action",
      era: "Qin–Han transition",
      theme: "determination",
      exampleCount: 1,
      previewExample: "他已经决定要破釜沉舟，全力投入新的工作。",
    });
  });

  it("drops the optional previewExample when it is absent", () => {
    const mapped = mapChengyuApiToData({ ...summary, previewExample: null });
    // `?? undefined` keeps the key with an undefined value — `toEqual` treats
    // that as absent (matches the grammar mapper's `previewExample` handling).
    expect(mapped.previewExample).toBeUndefined();
    expect(mapped).toEqual(expect.not.objectContaining({ previewExample: expect.any(String) }));
  });

  it("keeps all required summary fields even when optional data is missing", () => {
    const mapped = mapChengyuApiToData({ ...summary, previewExample: null });
    expect(mapped.id).toBe("cy_0001");
    expect(mapped.chengyu).toBe("破釜沉舟");
    expect(mapped.figurativeMeaning).toContain("burn one's bridges");
    expect(mapped.exampleCount).toBe(1);
  });
});

describe("segmentToEntityRef", () => {
  it("translates a character token's content_id to the GLYPH (Epic 22 contract)", () => {
    const ref = segmentToEntityRef({
      text: "破",
      pinyin: "pò",
      gloss: "break",
      entityType: "character",
      entityId: "ch_30772",
    });
    expect(ref).toEqual({ entityType: "character", entityId: "破", label: "pò" });
  });

  it("translates a word token's content_id to the GLYPH", () => {
    const ref = segmentToEntityRef({
      text: "桌子",
      pinyin: "zhuō zi",
      gloss: "table",
      entityType: "word",
      entityId: "w_00487",
    });
    expect(ref).toEqual({ entityType: "word", entityId: "桌子", label: "zhuō zi" });
  });

  it("returns null for a token with no entityId (renders as plain text)", () => {
    const ref = segmentToEntityRef({
      text: "全力",
      pinyin: "quán lì",
      gloss: "with all one's strength",
      entityType: null,
      entityId: null,
    });
    expect(ref).toBeNull();
  });

  it("returns null for a glyph-keyed token with an empty text (never open with a blank entityId)", () => {
    const ref = segmentToEntityRef({
      text: "",
      pinyin: "pò",
      gloss: "break",
      entityType: "character",
      entityId: "ch_30772",
    });
    expect(ref).toBeNull();
  });

  it("falls back to the token text as the label when pinyin is an empty string", () => {
    const ref = segmentToEntityRef({
      text: "破",
      pinyin: "",
      gloss: "break",
      entityType: "character",
      entityId: "ch_30772",
    });
    expect(ref).toEqual({ entityType: "character", entityId: "破", label: "破" });
  });

  it("guards against undefined entityType/entityId", () => {
    expect(
      segmentToEntityRef({
        text: "破",
        pinyin: "pò",
        gloss: "break",
        entityType: null,
        entityId: null,
      }),
    ).toBeNull();
  });
});
