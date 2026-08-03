/**
 * @file packages/shared-utils/src/pinyin/__tests__/pinyinNormalization.test.ts
 * Tests for the canonical pinyin/tone normalization helpers.
 * Phase 0: shared-utils pinyin foundation.
 */

import { describe, it, expect } from "vitest";
import {
  stripToneAndDigits,
  extractToneNumber,
  isHanziText,
  toneMarkToPlain,
  normalizePinyinForComparison,
} from "../pinyinNormalization";

describe("stripToneAndDigits", () => {
  it("strips a trailing tone digit", () => {
    expect(stripToneAndDigits("ba1")).toBe("ba");
    expect(stripToneAndDigits("ma5")).toBe("ma");
    expect(stripToneAndDigits("xiang4")).toBe("xiang");
    expect(stripToneAndDigits("ma0")).toBe("ma");
  });

  it("strips tone marks", () => {
    expect(stripToneAndDigits("bā")).toBe("ba");
    expect(stripToneAndDigits("nǐ")).toBe("ni");
    expect(stripToneAndDigits("lǜ")).toBe("lü");
  });

  it("strips marks AND trailing digit together", () => {
    expect(stripToneAndDigits("mà4")).toBe("ma");
  });

  it("handles multi-syllable space-separated input (whole-string)", () => {
    expect(stripToneAndDigits("nǐ hǎo")).toBe("ni hao");
  });

  it("is case-insensitive", () => {
    expect(stripToneAndDigits("Xiàng")).toBe("xiang");
  });

  it("leaves plain pinyin untouched", () => {
    expect(stripToneAndDigits("ba")).toBe("ba");
    expect(stripToneAndDigits("ni hao")).toBe("ni hao");
  });

  it("matches normalizePinyinForComparison semantics", () => {
    const cases = ["xiang4", "xiang", "Xiàng", "ma5", "nǐ hǎo", "ba1", "bā"];
    for (const c of cases) {
      expect(stripToneAndDigits(c)).toBe(normalizePinyinForComparison(c));
    }
  });
});

describe("extractToneNumber", () => {
  it("extracts tone from marked pinyin", () => {
    expect(extractToneNumber("mā")).toBe(1);
    expect(extractToneNumber("má")).toBe(2);
    expect(extractToneNumber("mǎ")).toBe(3);
    expect(extractToneNumber("mà")).toBe(4);
    expect(extractToneNumber("nǐ")).toBe(3);
  });

  it("extracts tone from ü-marked vowels", () => {
    expect(extractToneNumber("lǜ")).toBe(4);
    expect(extractToneNumber("lǚ")).toBe(3);
  });

  it("extracts tone from digit-suffixed pinyin", () => {
    expect(extractToneNumber("ma1")).toBe(1);
    expect(extractToneNumber("ma4")).toBe(4);
  });

  it("returns 0 for neutral tone", () => {
    expect(extractToneNumber("ma")).toBe(0);
    expect(extractToneNumber("ma5")).toBe(0);
    expect(extractToneNumber("ma0")).toBe(0);
  });

  it("returns 0 for empty input", () => {
    expect(extractToneNumber("")).toBe(0);
  });
});

describe("isHanziText", () => {
  it("detects Hanzi", () => {
    expect(isHanziText("八")).toBe(true);
    expect(isHanziText("你好")).toBe(true);
    expect(isHanziText("ni hào 八")).toBe(true);
  });

  it("returns false for pinyin and empty input", () => {
    expect(isHanziText("ba1")).toBe(false);
    expect(isHanziText("bā")).toBe(false);
    expect(isHanziText("")).toBe(false);
  });
});

describe("toneMarkToPlain", () => {
  it("exposes the canonical mark → plain mapping", () => {
    expect(toneMarkToPlain["ā"]).toBe("a");
    expect(toneMarkToPlain["à"]).toBe("a");
    expect(toneMarkToPlain["ǜ"]).toBe("ü");
    expect(toneMarkToPlain["ē"]).toBe("e");
  });
});

describe("normalizePinyinForComparison (delegates to stripToneAndDigits)", () => {
  it("still strips marks and trailing digits", () => {
    expect(normalizePinyinForComparison("xiang4")).toBe("xiang");
    expect(normalizePinyinForComparison("Xiàng")).toBe("xiang");
    expect(normalizePinyinForComparison("nǐ hǎo")).toBe("ni hao");
    expect(normalizePinyinForComparison("ba1")).toBe("ba");
  });
});
