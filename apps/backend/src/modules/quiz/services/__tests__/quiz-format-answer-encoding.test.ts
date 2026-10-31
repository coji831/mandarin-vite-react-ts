/**
 * @file apps/backend/src/modules/quiz/services/__tests__/quiz-format-answer-encoding.test.ts
 * Persistence encoding for the four Epic 26 practice formats (AC4, §26.4.2).
 *
 * No migration: `QuizAttemptAnswer`'s five answer columns are already NOT NULL
 * and the FE payload already carries exactly `{ questionIndex, pinyinInput,
 * selectedTone, correctPinyin, correctTone, category }`, so each format is a
 * VALUE CONVENTION on those columns. This suite pins the convention at the
 * service boundary with a fake repository capturing the write.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// The strategy barrel imports Prisma-backed strategies — mock the Prisma client
// module so importing QuizService never touches a real DB.
vi.mock("../../../../shared/infrastructure/database/client.js", () => ({
  prisma: {
    pinyinSyllable: { findMany: vi.fn() },
    pinyinCharacterMapping: { findMany: vi.fn() },
    radical: { findMany: vi.fn() },
    characterRadical: { findMany: vi.fn() },
    passage: { findUnique: vi.fn() },
    character: { findMany: vi.fn() },
  },
}));

import { QuizService } from "../QuizService.js";

interface CapturedAnswer {
  attemptId: string;
  questionIndex: number;
  pinyinInput: string;
  selectedTone: number;
  correctPinyin: string;
  correctTone: number;
  correct: boolean;
  category: string;
}

describe("Epic 26 practice-format answer encoding (§26.4.2)", () => {
  let quizService: QuizService;
  let writes: CapturedAnswer[];

  beforeEach(() => {
    writes = [];
    const repository = {
      createQuizAttempt: vi.fn(),
      createQuizAttemptAnswer: vi.fn(async (data: CapturedAnswer) => {
        writes.push(data);
        return { id: `ans-${writes.length}`, ...data };
      }),
      findQuizAttemptAnswers: vi.fn(),
      findQuizAttemptById: vi.fn(),
      completeQuizAttempt: vi.fn(),
      findQuizAttemptsByUser: vi.fn(),
      findQuizAttemptByUserAndType: vi.fn(),
    };
    const progressionService = { updatePhaseGate: vi.fn() };
    quizService = new QuizService(repository as never, progressionService as never);
  });

  it("cloze → pinyinInput/correctPinyin hold the token, both tones 0, category cloze", async () => {
    await quizService.submitAnswer("att-cloze", {
      questionIndex: 0,
      pinyinInput: "人",
      selectedTone: 0,
      correctPinyin: "人",
      correctTone: 0,
      category: "cloze",
    });

    expect(writes).toHaveLength(1);
    expect(writes[0]).toEqual({
      attemptId: "att-cloze",
      questionIndex: 0,
      pinyinInput: "人",
      selectedTone: 0,
      correctPinyin: "人",
      correctTone: 0,
      correct: true,
      category: "cloze",
    });
  });

  it("sentence-building → ordered tokens with one ASCII space, both tones 0", async () => {
    await quizService.submitAnswer("att-sbo", {
      questionIndex: 1,
      pinyinInput: "我 打 人",
      selectedTone: 0,
      correctPinyin: "我 打 人",
      correctTone: 0,
      category: "sentence-building",
    });

    expect(writes[0]).toEqual({
      attemptId: "att-sbo",
      questionIndex: 1,
      pinyinInput: "我 打 人",
      selectedTone: 0,
      correctPinyin: "我 打 人",
      correctTone: 0,
      correct: true,
      category: "sentence-building",
    });
  });

  it("sentence-building → a wrong token order is graded incorrect", async () => {
    await quizService.submitAnswer("att-sbo", {
      questionIndex: 0,
      pinyinInput: "人 打 我",
      selectedTone: 0,
      correctPinyin: "我 打 人",
      correctTone: 0,
      category: "sentence-building",
    });

    expect(writes[0].correct).toBe(false);
  });

  it("listening-dictation → transcription vs tone-marked expected, both tones 0", async () => {
    // Character-level dictation → a single syllable, so a tone DIGIT is accepted
    // by the existing normalisation ("hao3" → "hao"). (Multi-syllable digit input
    // is NOT normalised by shared-utils — that arrives with word-level dictation,
    // which this story explicitly defers.)
    await quizService.submitAnswer("att-dct", {
      questionIndex: 0,
      pinyinInput: "hao3",
      selectedTone: 0,
      correctPinyin: "hǎo",
      correctTone: 0,
      category: "dictation",
    });

    expect(writes[0]).toEqual({
      attemptId: "att-dct",
      questionIndex: 0,
      pinyinInput: "hao3",
      selectedTone: 0,
      correctPinyin: "hǎo",
      correctTone: 0,
      correct: true,
      category: "dictation",
    });
  });

  it("tone-judgment → the syllable plus chosen vs surface tone 0-4", async () => {
    await quizService.submitAnswer("att-tsj", {
      questionIndex: 0,
      pinyinInput: "nǐ",
      selectedTone: 2,
      correctPinyin: "nǐ",
      correctTone: 2,
      category: "tone-judgment",
    });

    expect(writes[0]).toEqual({
      attemptId: "att-tsj",
      questionIndex: 0,
      pinyinInput: "nǐ",
      selectedTone: 2,
      correctPinyin: "nǐ",
      correctTone: 2,
      correct: true,
      category: "tone-judgment",
    });
  });

  it("tone-judgment → neutral 0 is a real tone answer, and 0 vs 2 is wrong", async () => {
    // `0` (neutral) is a legal value: no reader may infer "not a tone answer"
    // from `tone === 0` — the discriminator is `category`/`quizType`.
    await quizService.submitAnswer("att-tsj", {
      questionIndex: 0,
      pinyinInput: "ma",
      selectedTone: 0,
      correctPinyin: "ma",
      correctTone: 0,
      category: "tone-judgment",
    });
    await quizService.submitAnswer("att-tsj", {
      questionIndex: 1,
      pinyinInput: "nǐ",
      selectedTone: 0,
      correctPinyin: "nǐ",
      correctTone: 2,
      category: "tone-judgment",
    });

    expect(writes[0].correct).toBe(true);
    expect(writes[1].correct).toBe(false);
  });
});
