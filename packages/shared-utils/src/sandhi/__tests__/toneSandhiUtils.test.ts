/**
 * @file packages/shared-utils/src/sandhi/__tests__/toneSandhiUtils.test.ts
 * Tests for sandhi-related shared utilities.
 * Story 21.16: Audio-to-Type — Neutral Tone & Sandhi
 * Story 21.17: Tone Sandhi Practice Quiz — added bu/yi rules + applyToneMark
 */

import { describe, it, expect } from "vitest";
import { isSandhiAcceptable, applyToneMark, stripToneMarks } from "../toneSandhiUtils";
import {
  normalizeTone,
  areTonesEquivalent,
  normalizePinyinForComparison,
} from "../../pinyin/pinyinNormalization";

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

  // ── G1: tone mark placement on the correct vowel (Epic 21 E2E) ──────────

  it("marks 'a' in 'bian' (not the 'i')", () => {
    expect(applyToneMark("bian", 1)).toBe("biān");
    expect(applyToneMark("bian", 4)).toBe("biàn");
  });

  it("marks the second vowel in 'shui' (i, not u)", () => {
    expect(applyToneMark("shui", 3)).toBe("shuǐ");
  });

  it("marks 'o' in 'guo' (not the 'u')", () => {
    expect(applyToneMark("guo", 3)).toBe("guǒ");
  });

  it("marks the second vowel in 'iu' diphthongs", () => {
    expect(applyToneMark("xiu", 1)).toBe("xiū");
    expect(applyToneMark("liu", 2)).toBe("liú");
    expect(applyToneMark("qiu", 4)).toBe("qiù");
  });

  it("marks the second vowel in 'ui' diphthongs", () => {
    expect(applyToneMark("hui", 4)).toBe("huì");
    expect(applyToneMark("gui", 3)).toBe("guǐ");
  });

  it("marks 'e' in 'lüe'", () => {
    expect(applyToneMark("lüe", 4)).toBe("lüè");
    expect(applyToneMark("nüe", 4)).toBe("nüè");
  });

  it("marks 'a' in yuán-style finals", () => {
    expect(applyToneMark("yuan", 1)).toBe("yuān");
    expect(applyToneMark("juan", 4)).toBe("juàn");
  });

  it("marks 'o' in 'wo'/'shuo' (not the 'u')", () => {
    expect(applyToneMark("wo", 3)).toBe("wǒ");
    expect(applyToneMark("shuo", 1)).toBe("shuō");
  });

  it("marks 'e' in 'wei'", () => {
    expect(applyToneMark("wei", 4)).toBe("wèi");
  });

  // ── G1 sandhi single-option collapse fix ────────────────────────────────
  // The DB stores BOTH plain and tone-marked primary readings. When the
  // tone-marked row is used, applyToneMark must strip the existing mark and
  // re-apply, so the sandhi form stays distinct from the dictionary form.

  it("strips a pre-existing tone mark before applying a new tone (bù → bú)", () => {
    expect(applyToneMark("bù", 2)).toBe("bú");
  });

  it("strips a pre-existing tone mark before applying a new tone (yī → yí)", () => {
    expect(applyToneMark("yī", 2)).toBe("yí");
  });

  it("strips a pre-existing tone mark before applying a new tone (yī → yì)", () => {
    expect(applyToneMark("yī", 4)).toBe("yì");
  });

  it("re-applying the same tone to a marked syllable is idempotent", () => {
    expect(applyToneMark("yī", 1)).toBe("yī");
    expect(applyToneMark("bù", 4)).toBe("bù");
  });

  it("handles a marked diphthong final (yàng → yáng)", () => {
    expect(applyToneMark("yàng", 2)).toBe("yáng");
    expect(applyToneMark("yàng", 4)).toBe("yàng");
  });

  it("strips the mark for neutral tone input (bù with tone 0 → bu)", () => {
    expect(applyToneMark("bù", 0)).toBe("bu");
  });
});

describe("stripToneMarks", () => {
  it("returns plain ASCII for each tone-marked vowel", () => {
    expect(stripToneMarks("bù")).toBe("bu");
    expect(stripToneMarks("yī")).toBe("yi");
    expect(stripToneMarks("hǎo")).toBe("hao");
    expect(stripToneMarks("shuǐ")).toBe("shui");
    expect(stripToneMarks("lǜ")).toBe("lü");
  });

  it("leaves plain pinyin untouched", () => {
    expect(stripToneMarks("bu")).toBe("bu");
    expect(stripToneMarks("yi")).toBe("yi");
  });

  it("strips marks from a full syllable sequence", () => {
    expect(stripToneMarks("nǐ hǎo")).toBe("ni hao");
  });
});

describe("pinyin/tone normalization (G2/G9 helpers)", () => {
  it("normalizeTone maps 5 to 0 (canonical neutral)", () => {
    expect(normalizeTone(0)).toBe(0);
    expect(normalizeTone(5)).toBe(0);
    expect(normalizeTone(1)).toBe(1);
    expect(normalizeTone(4)).toBe(4);
  });

  it("areTonesEquivalent treats neutral 0 and 5 as equal", () => {
    expect(areTonesEquivalent(0, 5)).toBe(true);
    expect(areTonesEquivalent(5, 0)).toBe(true);
    expect(areTonesEquivalent(0, 0)).toBe(true);
    expect(areTonesEquivalent(5, 5)).toBe(true);
    expect(areTonesEquivalent(1, 5)).toBe(false);
    expect(areTonesEquivalent(0, 3)).toBe(false);
    expect(areTonesEquivalent(1, 1)).toBe(true);
  });

  it("normalizePinyinForComparison strips tone marks and trailing digits", () => {
    expect(normalizePinyinForComparison("xiang4")).toBe("xiang");
    expect(normalizePinyinForComparison("xiang")).toBe("xiang");
    expect(normalizePinyinForComparison("Xiàng")).toBe("xiang");
    expect(normalizePinyinForComparison("ma5")).toBe("ma");
    expect(normalizePinyinForComparison("nǐ hǎo")).toBe("ni hao");
  });
});
