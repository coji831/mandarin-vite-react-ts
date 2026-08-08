/**
 * @file apps/backend/scripts/__tests__/extract-chengyu-candidates.test.ts
 * @description Unit tests for the phase-2 chengyu candidate extractor
 * (scripts/enrich/extract-chengyu-candidates.ts, Epic 23 — Story 23.1).
 *
 * Covers: is4Han, lit./fig.-or-idiom detection (including the untagged
 * idioms 光明正大 / 自相矛盾 / 卧薪尝胆 / 瓜田李下 — surfaced via the curated
 * shortlist bypass), variant/abbr-stub rejection, shortlist coverage
 * (found/not-found reporting), and numbered→tone-mark conversion
 * (u:→ü, tone digits→marks, neutral unmarked).
 */

import { describe, it, expect } from "vitest";
import {
  is4Han,
  isIdiomCandidate,
  isVariantOrAbbrStub,
  hasLitOrFigGloss,
  extractLitFig,
  buildDraft,
  CURATED_SHORTLIST,
} from "../../scripts/enrich/extract-chengyu-candidates.js";
import { numberedToToneMark } from "../../src/shared/utils/pinyinFormatUtils.js";

// ── is4Han ─────────────────────────────────────────────────────────────────

describe("is4Han (exactly-4-CJK filter)", () => {
  it("accepts exactly 4 CJK characters", () => {
    expect(is4Han("破釜沉舟")).toBe(true);
    expect(is4Han("光明正大")).toBe(true);
    expect(is4Han("自相矛盾")).toBe(true);
  });

  it("rejects non-4-char and non-CJK strings", () => {
    expect(is4Han("守株待兔的")).toBe(false); // 5 chars
    expect(is4Han("成语")).toBe(false); // 2 chars
    expect(is4Han("abc")).toBe(false);
    expect(is4Han("3D打印")).toBe(false); // contains digits
    expect(is4Han("")).toBe(false);
  });
});

// ── idiom-marker detection ─────────────────────────────────────────────────

describe("isIdiomCandidate (lit./fig.-or-idiom marker)", () => {
  it("accepts a 4-char entry carrying the (idiom) tag", () => {
    expect(
      isIdiomCandidate({
        simplified: "守株待兔",
        definitions: ["to guard a tree-stump, waiting for a rabbit (idiom)"],
      }),
    ).toBe(true);
  });

  it("accepts a 4-char entry carrying lit./fig. markers (widened beyond the tag)", () => {
    expect(
      isIdiomCandidate({
        simplified: "卧薪尝胆",
        definitions: [
          "(lit.) to sleep on brushwood and taste gall (idiom)",
          "(fig.) to maintain one's resolve for revenge",
        ],
      }),
    ).toBe(true);
  });

  it("rejects a 4-char entry with no idiom/lit./fig. marker", () => {
    // 光明正大 and 自相矛盾 are untagged in CC-CEDICT — NOT marker candidates.
    expect(
      isIdiomCandidate({
        simplified: "光明正大",
        definitions: ["(of a person) honorable; not devious"],
      }),
    ).toBe(false);
    expect(
      isIdiomCandidate({ simplified: "自相矛盾", definitions: ["to contradict oneself"] }),
    ).toBe(false);
  });

  it("rejects a non-4-char entry even with a marker", () => {
    expect(
      isIdiomCandidate({
        simplified: "守株待兔的",
        definitions: ["something (idiom)"],
      }),
    ).toBe(false);
  });
});

// ── variant/abbr-stub rejection ────────────────────────────────────────────

describe("isVariantOrAbbrStub / hasLitOrFigGloss", () => {
  it("rejects a pure abbr. stub with no gloss (瓜田李下 style)", () => {
    expect(isVariantOrAbbrStub(["abbr. for 瓜田不納履，李下不整冠[gua1 tian2 bu4 na4 lu:3]"])).toBe(
      true,
    );
    expect(hasLitOrFigGloss(["abbr. for 瓜田不納履，李下不整冠"])).toBe(false);
  });

  it("rejects a variant stub with no gloss (揠苗助长 style)", () => {
    expect(isVariantOrAbbrStub(["see 拔苗助長|拔苗助长[ba2 miao2 zhu4 zhang3]"])).toBe(true);
  });

  it("keeps a variant/abbr row that still carries a lit./fig. gloss", () => {
    expect(
      isVariantOrAbbrStub([
        "(lit.) to sleep on brushwood and taste gall",
        "(fig.) to maintain one's resolve for revenge",
      ]),
    ).toBe(false);
  });

  it("keeps ordinary gloss rows", () => {
    expect(isVariantOrAbbrStub(["to contradict oneself", "self-contradictory"])).toBe(false);
  });
});

// ── extractLitFig ──────────────────────────────────────────────────────────

describe("extractLitFig", () => {
  it("extracts the lit. and fig. glosses", () => {
    const { literalMeaning, figurativeMeaning } = extractLitFig([
      "lit. break the cauldrons and sink the boats (idiom); fig. to burn one's boats",
    ]);
    expect(literalMeaning).toContain("break the cauldrons and sink the boats");
    expect(figurativeMeaning).toContain("to burn one's boats");
  });

  it("falls back to the second definition line for the figurative meaning", () => {
    const { literalMeaning, figurativeMeaning } = extractLitFig([
      "to guard a tree-stump, waiting for a rabbit (idiom)",
      "to wait idly for opportunities",
    ]);
    expect(figurativeMeaning).toContain("to wait idly for opportunities");
    void literalMeaning;
  });
});

// ── shortlist coverage + draft scaffolding ─────────────────────────────────

describe("buildDraft (shortlist coverage + draft rows)", () => {
  const mkEntry = (simplified: string, defs: string[] = []): Record<string, unknown> => ({
    traditional: simplified,
    simplified,
    pinyinRaw: "po4 fu3 chen2 zhou1",
    pinyinNumbered: "po4 fu3 chen2 zhou1",
    definitions: defs,
  });

  it("reports poolCount from the marker-filtered candidate pool", () => {
    const entries = [
      mkEntry("破釜沉舟", ["lit. break the cauldrons and sink the boats (idiom)"]),
      mkEntry("自相矛盾", ["to contradict oneself"]), // markerless — not in pool
    ];
    const { poolCount } = buildDraft(entries as never, ["破釜沉舟", "自相矛盾"]);
    expect(poolCount).toBe(1);
  });

  it("surfaces untagged shortlist members (自相矛盾 / 光明正大 style) via the curation bypass", () => {
    const entries = [
      mkEntry("自相矛盾", ["to contradict oneself", "self-contradictory"]),
      mkEntry("光明正大", ["(of a person) honorable"]),
    ];
    const { found, notFound, rows } = buildDraft(entries as never, ["自相矛盾", "光明正大"]);
    expect(found).toEqual(["自相矛盾", "光明正大"]);
    expect(notFound).toEqual([]);
    expect(rows.map((r) => r.chengyu)).toEqual(["自相矛盾", "光明正大"]);
    // Draft rows are scaffolded with empty authoring fields.
    expect(rows[0].story).toBe("");
    expect(rows[0].storySource).toBe("");
    expect(rows[0].examples).toEqual([]);
    expect(rows[0].metadata.source).toBe("CC-CEDICT");
  });

  it("drafts the mandatory KB §6.2 family member 瓜田李下 despite its abbr. stub", () => {
    const entries = [
      mkEntry("瓜田李下", ["abbr. for 瓜田不納履，李下不整冠[gua1 tian2 bu4 na4 lu:3]"]),
    ];
    const { found, rows } = buildDraft(entries as never, ["瓜田李下"]);
    expect(found).toEqual(["瓜田李下"]);
    expect(rows[0].chengyu).toBe("瓜田李下");
    // No lit./fig. gloss to pre-fill — author fills from KB/Wiktionary.
    expect(rows[0].literalMeaning).toBeNull();
  });

  it("assigns sequential cy_XXXX content_ids in list order and reports not-found members", () => {
    const entries = [mkEntry("守株待兔", ["(idiom)"])];
    const { rows, found, notFound } = buildDraft(entries as never, [
      "守株待兔",
      "叶公好龙",
      "亡羊补牢",
    ]);
    expect(found).toEqual(["守株待兔"]);
    expect(notFound).toEqual(["叶公好龙", "亡羊补牢"]);
    expect(rows[0].content_id).toBe("cy_0001");
    expect(rows[0].sortOrder).toBe(1);
  });

  it("converts numbered pinyin to tone marks (digits→marks)", () => {
    const entries = [
      {
        traditional: "破釜沉舟",
        simplified: "破釜沉舟",
        pinyinRaw: "po4 fu3 chen2 zhou1",
        pinyinNumbered: "po4 fu3 chen2 zhou1",
        definitions: ["(idiom)"],
      },
    ];
    const { rows } = buildDraft(entries as never, ["破釜沉舟"]);
    expect(rows[0].pinyin).toBe("pò fǔ chén zhōu");
  });

  it("CURATED_SHORTLIST sizes 60–80 and includes the mandatory KB §6.2 family", () => {
    expect(CURATED_SHORTLIST.length).toBeGreaterThanOrEqual(60);
    expect(CURATED_SHORTLIST.length).toBeLessThanOrEqual(80);
    for (const fam of ["破釜沉舟", "画蛇添足", "瓜田李下"]) {
      expect(CURATED_SHORTLIST).toContain(fam);
    }
  });
});

// ── numberedToToneMark (CC-CEDICT conversion) ──────────────────────────────

describe("numberedToToneMark", () => {
  it("converts u: → ü", () => {
    expect(numberedToToneMark("nu:3")).toBe("nǚ");
    expect(numberedToToneMark("lu:4")).toBe("lǜ");
  });

  it("converts tone digits to marks", () => {
    expect(numberedToToneMark("ma1")).toBe("mā");
    expect(numberedToToneMark("ma2")).toBe("má");
    expect(numberedToToneMark("ma3")).toBe("mǎ");
    expect(numberedToToneMark("ma4")).toBe("mà");
  });

  it("leaves neutral tone unmarked", () => {
    expect(numberedToToneMark("ma5")).toBe("ma");
    expect(numberedToToneMark("de5")).toBe("de");
  });
});
