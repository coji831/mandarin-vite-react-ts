/**
 * @file features/review/hooks/__tests__/parsePinyinInput.test.ts
 * @description Unit tests for the shared parsePinyinInput parser (Phase 1a).
 *
 * Handles tone-marked, digit-suffixed, and neutral (5→0) pinyin forms via the
 * canonical shared-utils helpers `stripToneAndDigits` + `extractToneNumber`.
 */

import { describe, it, expect } from "vitest";
import { parsePinyinInput } from "../useReview";

describe("parsePinyinInput", () => {
  it("parses digit-suffixed pinyin (hao3 → hao, 3)", () => {
    expect(parsePinyinInput("hao3")).toEqual({ pinyin: "hao", tone: 3 });
  });

  it("parses tone-marked pinyin (mà → ma, 4)", () => {
    expect(parsePinyinInput("mà")).toEqual({ pinyin: "ma", tone: 4 });
  });

  it("maps neutral tone digit 5 → 0 (ma5 → ma, 0)", () => {
    expect(parsePinyinInput("ma5")).toEqual({ pinyin: "ma", tone: 0 });
  });

  it("maps neutral tone digit 0 → 0 (ma0 → ma, 0)", () => {
    expect(parsePinyinInput("ma0")).toEqual({ pinyin: "ma", tone: 0 });
  });

  it("returns tone 0 for plain pinyin (ma → ma, 0)", () => {
    expect(parsePinyinInput("ma")).toEqual({ pinyin: "ma", tone: 0 });
  });

  it("handles ü tone marks and uppercase input (Lǜ4 → lü, 4)", () => {
    expect(parsePinyinInput("Lǜ4")).toEqual({ pinyin: "lü", tone: 4 });
  });

  it("trims surrounding whitespace", () => {
    expect(parsePinyinInput("  hao3  ")).toEqual({ pinyin: "hao", tone: 3 });
  });
});
