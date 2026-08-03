/**
 * @file packages/shared-utils/src/pinyin/__tests__/pinyinToHanzi.test.ts
 * Tests for pinyin → Hanzi glyph resolution.
 * Phase 0: shared-utils pinyin foundation.
 */

import { describe, it, expect } from "vitest";
import { resolveHanzi, type PinyinCharacterMap } from "../pinyinToHanzi";

const MAP: PinyinCharacterMap = {
  ba: "八",
  bā: "八",
  ma: "吗",
  xiang: "想",
};

describe("resolveHanzi", () => {
  it("passes through already-Hanzi input unchanged", () => {
    expect(resolveHanzi("八", MAP)).toBe("八");
    expect(resolveHanzi("八", {})).toBe("八");
  });

  it("resolves exact plain map key", () => {
    expect(resolveHanzi("ba", MAP)).toBe("八");
    expect(resolveHanzi("ma", MAP)).toBe("吗");
  });

  it("resolves exact tone-marked map key", () => {
    expect(resolveHanzi("bā", MAP)).toBe("八");
  });

  it("resolves via normalized key (tone digit → plain)", () => {
    expect(resolveHanzi("ba1", MAP)).toBe("八");
    expect(resolveHanzi("ma4", MAP)).toBe("吗");
  });

  it("resolves case-insensitively via the normalized key", () => {
    expect(resolveHanzi("BA", MAP)).toBe("八");
  });

  it("prefers the tone-marked key over a conflicting plain key (bai1 → 掰 not 伯)", () => {
    // charMap["bai"] → 伯 (reads "bó") while charMap["bāi"] → 掰 (reads "bāi").
    // A digit-suffixed "bai1" must resolve to the marked key 掰.
    expect(resolveHanzi("bai1", { bāi: "掰", bai: "伯" })).toBe("掰");
  });

  it("resolves tone-number input via the derived tone-marked key", () => {
    expect(resolveHanzi("ba1", { bā: "八" })).toBe("八");
    expect(resolveHanzi("ma4", { mà: "骂" })).toBe("骂");
    expect(resolveHanzi("xiang4", { xiàng: "象" })).toBe("象");
  });

  it("handles ü-vowel tone-number input (nü3 → nǚ)", () => {
    expect(resolveHanzi("nü3", { nǚ: "女" })).toBe("女");
  });

  it("keeps the plain fallback for digitless and neutral input", () => {
    // No tone digit → no tone-marked derivation, plain fallback unchanged.
    expect(resolveHanzi("bai", { bai: "伯" })).toBe("伯");
    // Neutral (tone 5 / 0) has no mark → plain fallback.
    expect(resolveHanzi("bai5", { bai: "伯" })).toBe("伯");
  });

  it("returns null when unresolvable", () => {
    expect(resolveHanzi("zzz", MAP)).toBe(null);
  });

  it("returns null when no map is provided", () => {
    expect(resolveHanzi("ba", null)).toBe(null);
    expect(resolveHanzi("ba", undefined)).toBe(null);
  });

  it("returns null for empty or whitespace-only input", () => {
    expect(resolveHanzi("", MAP)).toBe(null);
    expect(resolveHanzi("   ", MAP)).toBe(null);
  });

  it("treats null/empty map values as unresolvable", () => {
    expect(resolveHanzi("ba", { ba: null })).toBe(null);
    expect(resolveHanzi("ba", { ba: "" })).toBe(null);
  });

  it("returns Hanzi input as-is even when it contains pinyin", () => {
    expect(resolveHanzi("nǐ hǎo 八", MAP)).toBe("nǐ hǎo 八");
  });
});
