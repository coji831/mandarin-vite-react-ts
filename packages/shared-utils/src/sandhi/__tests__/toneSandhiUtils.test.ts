/**
 * @file packages/shared-utils/src/sandhi/__tests__/toneSandhiUtils.test.ts
 * Tests for sandhi-related shared utilities.
 * Story 21.16: Audio-to-Type — Neutral Tone & Sandhi
 * Story 21.17: Tone Sandhi Practice Quiz — added bu/yi rules + applyToneMark
 */

import { describe, it, expect } from "vitest";
import { isSandhiAcceptable, applyToneMark } from "../toneSandhiUtils";

describe("isSandhiAcceptable", () => {
  describe("3-3 Sandhi Rule", () => {
    it("accepts tone 2 when correct tone is 3 under 3-3 sandhi", () => {
      expect(isSandhiAcceptable(3, 2, true, "3-3")).toBe(true);
    });

    it("exact match still works under 3-3 sandhi", () => {
      expect(isSandhiAcceptable(3, 3, true, "3-3")).toBe(true);
    });

    it("rejects tone 1 when correct tone is 3 under 3-3 sandhi", () => {
      expect(isSandhiAcceptable(3, 1, true, "3-3")).toBe(false);
    });
  });

  describe("bù-before-4th Sandhi Rule", () => {
    it("accepts tone 2 when correct tone is 4 under bu-before-4th", () => {
      expect(isSandhiAcceptable(4, 2, true, "bu-before-4th")).toBe(true);
    });

    it("exact match still works under bu-before-4th", () => {
      expect(isSandhiAcceptable(4, 4, true, "bu-before-4th")).toBe(true);
    });

    it("rejects tone 3 when correct tone is 4 under bu-before-4th", () => {
      expect(isSandhiAcceptable(4, 3, true, "bu-before-4th")).toBe(false);
    });

    it("rejects bu-before-4th when correct tone is 1 (not 4)", () => {
      expect(isSandhiAcceptable(1, 2, true, "bu-before-4th")).toBe(false);
    });
  });

  describe("yī-before-4th Sandhi Rule", () => {
    it("accepts tone 2 when correct tone is 1 under yi-before-4th", () => {
      expect(isSandhiAcceptable(1, 2, true, "yi-before-4th")).toBe(true);
    });

    it("exact match still works under yi-before-4th", () => {
      expect(isSandhiAcceptable(1, 1, true, "yi-before-4th")).toBe(true);
    });

    it("rejects tone 4 when correct tone is 1 under yi-before-4th", () => {
      expect(isSandhiAcceptable(1, 4, true, "yi-before-4th")).toBe(false);
    });
  });

  describe("yī-before-non4th Sandhi Rule", () => {
    it("accepts tone 4 when correct tone is 1 under yi-before-non4th", () => {
      expect(isSandhiAcceptable(1, 4, true, "yi-before-non4th")).toBe(true);
    });

    it("exact match still works under yi-before-non4th", () => {
      expect(isSandhiAcceptable(1, 1, true, "yi-before-non4th")).toBe(true);
    });

    it("rejects tone 2 when correct tone is 1 under yi-before-non4th", () => {
      expect(isSandhiAcceptable(1, 2, true, "yi-before-non4th")).toBe(false);
    });

    it("rejects yi-before-non4th when correct tone is 4 (wrong rule)", () => {
      expect(isSandhiAcceptable(4, 1, true, "yi-before-non4th")).toBe(false);
    });
  });

  describe("Non-sandhi questions", () => {
    it("returns false when isSandhiQuestion is false", () => {
      expect(isSandhiAcceptable(3, 2, false, "3-3")).toBe(false);
    });

    it("returns false when isSandhiQuestion is undefined", () => {
      expect(isSandhiAcceptable(3, 2, undefined, "3-3")).toBe(false);
    });
  });

  describe("Unknown rules", () => {
    it("returns false for unrecognized sandhi rule", () => {
      expect(isSandhiAcceptable(2, 3, true, "2-3")).toBe(false);
    });
  });

  describe("Exact match edge cases", () => {
    it("returns true when tones match regardless of sandhi rule", () => {
      expect(isSandhiAcceptable(2, 2, true, "3-3")).toBe(true);
    });

    it("returns true when tones match and isSandhiQuestion is false", () => {
      expect(isSandhiAcceptable(3, 3, false, "3-3")).toBe(true);
    });

    it("returns true when tones match and sandhiRule is undefined", () => {
      expect(isSandhiAcceptable(4, 4, true, undefined)).toBe(true);
    });
  });

  describe("Reverse direction", () => {
    it("does not accept reverse 3-3 sandhi (tone 2 becoming tone 3)", () => {
      expect(isSandhiAcceptable(2, 3, true, "3-3")).toBe(false);
    });
  });

  describe("Neutral tone (tone 0)", () => {
    it("returns true when both tones are 0", () => {
      expect(isSandhiAcceptable(0, 0, true, "3-3")).toBe(true);
    });
  });
});

describe("applyToneMark", () => {
  it("applies tone 1 mark to 'a'", () => {
    expect(applyToneMark("a", 1)).toBe("ā");
  });

  it("applies tone 2 mark to 'ni'", () => {
    expect(applyToneMark("ni", 2)).toBe("ní");
  });

  it("applies tone 3 mark to 'hao'", () => {
    expect(applyToneMark("hao", 3)).toBe("hǎo");
  });

  it("applies tone 4 mark to 'shi'", () => {
    expect(applyToneMark("shi", 4)).toBe("shì");
  });

  it("returns plain pinyin for neutral tone 0", () => {
    expect(applyToneMark("ma", 0)).toBe("ma");
  });

  it("returns plain pinyin for tone 5", () => {
    expect(applyToneMark("ma", 5)).toBe("ma");
  });

  it("applies tone to compound final with 'e' priority", () => {
    expect(applyToneMark("xue", 1)).toBe("xuē");
  });

  it("applies tone mark to 'ü'", () => {
    expect(applyToneMark("nü", 3)).toBe("nǚ");
  });

  it("handles empty string", () => {
    expect(applyToneMark("", 1)).toBe("");
  });
});
