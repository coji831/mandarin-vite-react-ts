import { radicalReviewStrategy } from "../RadicalReviewStrategy";
import { pinyinReviewStrategy } from "../PinyinReviewStrategy";
import type { ReviewItem } from "../../../types/review";

describe("RadicalReviewStrategy", () => {
  const mockItem: ReviewItem = {
    id: "radical-rad_0001",
    itemType: "radical",
    itemId: "rad_0001",
    front: "yī",
    back: "一 (yī) — one",
    category: "radicals",
    character: "一",
    pinyinPlain: "yi",
    meaning: "one",
  };

  it("has correct metadata", () => {
    expect(radicalReviewStrategy.itemType).toBe("radical");
    expect(radicalReviewStrategy.initialStep).toBe("pinyin");
    expect(radicalReviewStrategy.feedbackLabel).toBe("Radical");
  });

  it("hides meaning during review", () => {
    expect(radicalReviewStrategy.showMeaning).toBe(false);
  });

  it("shows meaning for pinyin strategy", () => {
    expect(pinyinReviewStrategy.showMeaning).toBe(true);
  });

  it("evaluates correct pinyin as correct", () => {
    const result = radicalReviewStrategy.evaluate(mockItem, { type: "pinyin", value: "yi" });
    expect(result.correct).toBe(true);
  });

  it("evaluates incorrect pinyin as incorrect", () => {
    const result = radicalReviewStrategy.evaluate(mockItem, { type: "pinyin", value: "er" });
    expect(result.correct).toBe(false);
  });

  it("returns false for non-pinyin input type", () => {
    const result = radicalReviewStrategy.evaluate(mockItem, { type: "tone", value: 1 });
    expect(result.correct).toBe(false);
  });

  it("matches pinyin case-sensitively (hook lowercases before calling)", () => {
    const result = radicalReviewStrategy.evaluate(mockItem, { type: "pinyin", value: "yi" });
    expect(result.correct).toBe(true);
  });

  it("handles empty pinyinPlain gracefully", () => {
    const noPinyinItem: ReviewItem = { ...mockItem, pinyinPlain: "" };
    const result = radicalReviewStrategy.evaluate(noPinyinItem, { type: "pinyin", value: "yi" });
    expect(result.correct).toBe(false);
  });
});
