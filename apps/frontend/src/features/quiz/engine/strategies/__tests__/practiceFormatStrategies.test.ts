/**
 * The four Epic 26 practice formats are registered strategies.
 *
 * `getStrategy(id)` returning a strategy is the ONLY thing that turns
 * `?type=<id>` into a session — an unregistered id renders the empty entry
 * surface with no error (the silent-fallback trap, design §26.4.4). And the
 * verdict each strategy authors is what the session announces, so it is pinned
 * here rather than inferred from the feedback card.
 */

import { describe, it, expect } from "vitest";
import { getStrategy } from "../quizStrategyRegistry";
import type { QuizQuestion, StrategyType } from "../../../types";

const CLOZE: QuizQuestion = {
  id: "cloze-1",
  audioKey: "",
  correctPinyin: "把",
  correctTone: 0,
  category: "cloze",
  chinese: "我把人打了。",
};

const SENTENCE: QuizQuestion = {
  id: "sbo-1",
  audioKey: "",
  correctPinyin: "我 打 人",
  correctTone: 0,
  category: "sentence-building",
};

const DICTATION: QuizQuestion = {
  id: "dct-1",
  audioKey: "你好",
  character: "你好",
  correctPinyin: "nǐ hǎo",
  correctTone: 0,
  category: "dictation",
  displayPinyin: "nǐ hǎo",
};

const TONE: QuizQuestion = {
  id: "tsj-1",
  audioKey: "",
  correctPinyin: "nǐ",
  correctTone: 2,
  category: "tone-judgment",
  targetSyllable: "nǐ",
  baseTone: 3,
};

describe("practice format registration (§26.4.4)", () => {
  it.each([
    { id: "cloze" as StrategyType, phase: 3, promptGlyph: "show" as const },
    { id: "sentence-building" as StrategyType, phase: 3, promptGlyph: "show" as const },
    { id: "listening-dictation" as StrategyType, phase: 2, promptGlyph: "hide" as const },
    { id: "tone-judgment" as StrategyType, phase: 1, promptGlyph: "show" as const },
  ])("getStrategy($id) resolves to a real strategy", ({ id, phase, promptGlyph }) => {
    const strategy = getStrategy(id);

    expect(strategy).toBeDefined();
    expect(strategy?.type).toBe(id);
    expect(strategy?.phase).toBe(phase);
    expect(strategy?.promptGlyph).toBe(promptGlyph);
  });
});

describe("cloze verdict", () => {
  const strategy = getStrategy("cloze")!;

  it("states the sentence on a correct token", () => {
    const result = strategy.evaluateAnswer(CLOZE, "把", 0);
    expect(result.correct).toBe(true);
    expect(result.feedback).toBe("Correct. 我把人打了。");
  });

  it("names the answer on a wrong token", () => {
    const result = strategy.evaluateAnswer(CLOZE, "被", 0);
    expect(result.correct).toBe(false);
    expect(result.feedback).toBe("Incorrect. The answer is 把.");
  });
});

describe("sentence-building verdict", () => {
  const strategy = getStrategy("sentence-building")!;

  it("accepts the canonical order however the whitespace was typed", () => {
    const result = strategy.evaluateAnswer(SENTENCE, "  我   打 人 ", 0);
    expect(result.correct).toBe(true);
    expect(result.feedback).toBe("Correct.");
  });

  it("states the canonical order when the tokens are re-ordered", () => {
    const result = strategy.evaluateAnswer(SENTENCE, "人 打 我", 0);
    expect(result.correct).toBe(false);
    expect(result.feedback).toBe("Incorrect. The correct order is 我 打 人.");
  });
});

describe("listening-dictation verdict", () => {
  const strategy = getStrategy("listening-dictation")!;

  it("accepts a tone-number transcription of the tone-marked answer", () => {
    const result = strategy.evaluateAnswer(DICTATION, "ni3 hao3", 0);
    expect(result.correct).toBe(true);
    expect(result.feedback).toBe("Correct. nǐ hǎo.");
  });

  it("states what it was when the transcription is wrong", () => {
    const result = strategy.evaluateAnswer(DICTATION, "ni3 ma3", 0);
    expect(result.correct).toBe(false);
    expect(result.feedback).toBe("Incorrect. It was nǐ hǎo.");
  });
});

describe("tone-judgment verdict", () => {
  const strategy = getStrategy("tone-judgment")!;

  it("grades the surface tone, not the dictionary tone", () => {
    expect(strategy.evaluateAnswer(TONE, "nǐ", 2).correct).toBe(true);
    const wrong = strategy.evaluateAnswer(TONE, "nǐ", 3);
    expect(wrong.correct).toBe(false);
    expect(wrong.feedback).toBe("Incorrect. It is a rising tone.");
  });
});
