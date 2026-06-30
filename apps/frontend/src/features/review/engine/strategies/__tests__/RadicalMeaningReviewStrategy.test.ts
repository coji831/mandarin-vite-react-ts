import { radicalMeaningReviewStrategy } from "../RadicalMeaningReviewStrategy";
import { characterRadicalReviewStrategy } from "../CharacterRadicalReviewStrategy";
import type { ReviewItem } from "../../../types/review";

describe("RadicalMeaningReviewStrategy", () => {
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
    expect(radicalMeaningReviewStrategy.itemType).toBe("radical");
    expect(radicalMeaningReviewStrategy.initialStep).toBe("option");
    expect(radicalMeaningReviewStrategy.feedbackLabel).toBe("Radical");
  });

  it("shows meaning during review (glyph + meaning visible, user picks from options)", () => {
    expect(radicalMeaningReviewStrategy.showMeaning).toBe(true);
  });

  it("evaluates correct option as correct", () => {
    const result = radicalMeaningReviewStrategy.evaluate(mockItem, {
      type: "option",
      value: "yi",
    });
    expect(result.correct).toBe(true);
  });

  it("evaluates incorrect option as incorrect", () => {
    const result = radicalMeaningReviewStrategy.evaluate(mockItem, {
      type: "option",
      value: "er",
    });
    expect(result.correct).toBe(false);
  });

  it("is case-insensitive", () => {
    const result = radicalMeaningReviewStrategy.evaluate(mockItem, {
      type: "option",
      value: "YI",
    });
    expect(result.correct).toBe(true);
  });

  it("trims whitespace", () => {
    const result = radicalMeaningReviewStrategy.evaluate(mockItem, {
      type: "option",
      value: "  yi  ",
    });
    expect(result.correct).toBe(true);
  });

  it("returns false for non-option input type", () => {
    const result = radicalMeaningReviewStrategy.evaluate(mockItem, { type: "tone", value: 1 });
    expect(result.correct).toBe(false);
  });

  it("handles empty pinyinPlain gracefully", () => {
    const noPlainItem: ReviewItem = { ...mockItem, pinyinPlain: "" };
    const result = radicalMeaningReviewStrategy.evaluate(noPlainItem, {
      type: "option",
      value: "yi",
    });
    expect(result.correct).toBe(false);
  });
});

describe("CharacterRadicalReviewStrategy", () => {
  const mockItem: ReviewItem = {
    id: "char-rad-test",
    itemType: "character-radical",
    itemId: "rad_0018",
    front: "吃",
    back: "eat",
    category: "character-radical",
    character: "吃",
    pinyinPlain: "rad_0018",
    meaning: "eat",
    options: [
      { glyph: "口", meaning: "mouth", id: "rad_0018" },
      { glyph: "氵", meaning: "water", id: "rad_0008" },
      { glyph: "心", meaning: "heart", id: "rad_0061" },
    ],
  };

  it("has correct metadata", () => {
    expect(characterRadicalReviewStrategy.itemType).toBe("character-radical");
    expect(characterRadicalReviewStrategy.initialStep).toBe("pinyin");
    expect(characterRadicalReviewStrategy.feedbackLabel).toBe("Character→Radical");
  });

  it("shows meaning during review", () => {
    expect(characterRadicalReviewStrategy.showMeaning).toBe(true);
  });

  it("evaluates correct meaning match via pinyin input", () => {
    const result = characterRadicalReviewStrategy.evaluate(mockItem, {
      type: "pinyin",
      value: "mouth",
    });
    expect(result.correct).toBe(true);
  });

  it("evaluates incorrect meaning as incorrect", () => {
    const result = characterRadicalReviewStrategy.evaluate(mockItem, {
      type: "pinyin",
      value: "water",
    });
    expect(result.correct).toBe(false);
  });

  it("is case-insensitive", () => {
    const result = characterRadicalReviewStrategy.evaluate(mockItem, {
      type: "pinyin",
      value: "MOUTH",
    });
    expect(result.correct).toBe(true);
  });

  it("evaluates option input correctly", () => {
    const result = characterRadicalReviewStrategy.evaluate(mockItem, {
      type: "option",
      value: "rad_0018",
    });
    expect(result.correct).toBe(true);
  });

  it("evaluates wrong option as incorrect", () => {
    const result = characterRadicalReviewStrategy.evaluate(mockItem, {
      type: "option",
      value: "rad_0008",
    });
    expect(result.correct).toBe(false);
  });

  it("returns false for tone input type", () => {
    const result = characterRadicalReviewStrategy.evaluate(mockItem, { type: "tone", value: 1 });
    expect(result.correct).toBe(false);
  });

  it("handles missing options gracefully", () => {
    const noOptionItem: ReviewItem = { ...mockItem, options: undefined };
    const result = characterRadicalReviewStrategy.evaluate(noOptionItem, {
      type: "pinyin",
      value: "mouth",
    });
    expect(result.correct).toBe(false);
  });
});
