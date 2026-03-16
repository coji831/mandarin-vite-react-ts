/**
 * Pinyin Converter Utility Tests
 * Tests for tone mark conversion functions
 */

import { describe, it, expect } from "vitest";
import { convertToneMarks, removeToneMarks } from "../pinyinConverter";

describe("convertToneMarks", () => {
  it("converts single syllable with tone", () => {
    expect(convertToneMarks("ma1")).toBe("mā");
    expect(convertToneMarks("ma2")).toBe("má");
    expect(convertToneMarks("ma3")).toBe("mǎ");
    expect(convertToneMarks("ma4")).toBe("mà");
  });

  it("converts multiple syllables", () => {
    expect(convertToneMarks("ni3hao3")).toBe("nǐhǎo");
    expect(convertToneMarks("xie4xie")).toBe("xièxie");
  });

  it("handles nasal finals correctly", () => {
    expect(convertToneMarks("ban1")).toBe("bān");
    expect(convertToneMarks("fen1")).toBe("fēn");
    expect(convertToneMarks("ming2")).toBe("míng");
    expect(convertToneMarks("zhong1")).toBe("zhōng");
  });

  it("handles longer patterns before shorter ones", () => {
    expect(convertToneMarks("ang1")).toBe("āng");
    expect(convertToneMarks("an1g")).toBe("āng");
  });

  it("handles neutral tone (no number)", () => {
    expect(convertToneMarks("ma")).toBe("ma");
    expect(convertToneMarks("de")).toBe("de");
  });

  it("removes remaining numbers after conversion", () => {
    expect(convertToneMarks("ma0")).toBe("ma");
    expect(convertToneMarks("ma5")).toBe("ma");
  });

  it("handles empty input", () => {
    expect(convertToneMarks("")).toBe("");
  });

  it("handles mixed case (converts to lowercase)", () => {
    expect(convertToneMarks("MA3")).toBe("mǎ");
    expect(convertToneMarks("NI3HAO3")).toBe("nǐhǎo");
  });

  it("handles complex pinyin", () => {
    expect(convertToneMarks("liu2")).toBe("liú");
    expect(convertToneMarks("hao3")).toBe("hǎo");
    expect(convertToneMarks("qing3")).toBe("qǐng");
  });
});

describe("removeToneMarks", () => {
  it("removes tone marks from single syllable", () => {
    expect(removeToneMarks("mā")).toBe("ma");
    expect(removeToneMarks("má")).toBe("ma");
    expect(removeToneMarks("mǎ")).toBe("ma");
    expect(removeToneMarks("mà")).toBe("ma");
  });

  it("removes tone marks from multiple syllables", () => {
    expect(removeToneMarks("nǐhǎo")).toBe("nihao");
    expect(removeToneMarks("xièxie")).toBe("xiexie");
  });

  it("handles all vowel tone marks", () => {
    expect(removeToneMarks("ā")).toBe("a");
    expect(removeToneMarks("ē")).toBe("e");
    expect(removeToneMarks("ī")).toBe("i");
    expect(removeToneMarks("ō")).toBe("o");
    expect(removeToneMarks("ū")).toBe("u");
    expect(removeToneMarks("ǖ")).toBe("ü");
  });

  it("handles empty input", () => {
    expect(removeToneMarks("")).toBe("");
  });

  it("handles mixed case", () => {
    expect(removeToneMarks("MǍ")).toBe("ma");
    expect(removeToneMarks("NǏ HǍO")).toBe("ni hao");
  });

  it("preserves non-tone characters", () => {
    expect(removeToneMarks("zhōng guó")).toBe("zhong guo");
  });
});
