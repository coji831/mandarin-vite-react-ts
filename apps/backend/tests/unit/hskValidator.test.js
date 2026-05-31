import { describe, it, expect } from "vitest";

import { getHskSet, validateChineseTokens } from "../../src/services/examples/hskValidator.js";

describe("hskValidator - canonical load", () => {
  it("loads canonical HSK JSON and contains expected tokens", () => {
    const set = getHskSet();
    expect(set.has("有")).toBe(true);
    expect(set.has("一")).toBe(true);
    expect(set.has("个")).toBe(true);
    expect(set.has("书")).toBe(true);
  });

  it("filters punctuation before tokenization", () => {
    const result = validateChineseTokens("有一个书。", "书");
    expect(result.valid).toBe(true);
  });
});
