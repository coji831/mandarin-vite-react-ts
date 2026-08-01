/**
 * @file apps/backend/src/modules/quiz/services/__tests__/QuizService.test.ts
 * Unit tests for QuizService grading + persistence.
 *
 * G2: neutral tone (轻声) graded as tone 0 ≡ tone 5.
 * G3: an IME attempt with ≥80% correct persists `passed: true` and advances
 *     the phase gate.
 * G7: comprehension attempts retain their passageId end-to-end.
 * G9: both digitless ("xiang") and digit-suffixed ("xiang4") pinyin grade
 *     correctly against `correctPinyin: "xiang4"`.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// The strategy barrel imports Prisma-backed strategies — mock the Prisma
// client module so importing QuizService never touches a real DB.
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

describe("QuizService", () => {
  let quizService: QuizService;
  let mockRepository: any;
  let mockProgressionService: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockRepository = {
      createQuizAttempt: vi.fn(),
      createQuizAttemptAnswer: vi.fn((data: Record<string, unknown>) => ({ id: "ans-1", ...data })),
      findQuizAttemptAnswers: vi.fn(),
      findQuizAttemptById: vi.fn(),
      completeQuizAttempt: vi.fn(),
      findQuizAttemptsByUser: vi.fn(),
      findQuizAttemptByUserAndType: vi.fn(),
    };

    mockProgressionService = {
      updatePhaseGate: vi.fn().mockResolvedValue({}),
    };

    quizService = new QuizService(mockRepository, mockProgressionService);
  });

  describe("submitAnswer grading", () => {
    it("G2: grades a neutral-tone answer correct when selectedTone=0 and correctTone=5", async () => {
      await quizService.submitAnswer("att-1", {
        questionIndex: 0,
        pinyinInput: "cuo",
        selectedTone: 0,
        correctPinyin: "cuo5",
        correctTone: 5,
        category: "tones",
      });

      const created = mockRepository.createQuizAttemptAnswer.mock.calls[0][0];
      expect(created.correct).toBe(true);
    });

    it("G2: still grades a real tone mismatch as incorrect", async () => {
      await quizService.submitAnswer("att-1", {
        questionIndex: 0,
        pinyinInput: "ni",
        selectedTone: 2,
        correctPinyin: "ni",
        correctTone: 3,
        category: "tones",
      });

      const created = mockRepository.createQuizAttemptAnswer.mock.calls[0][0];
      expect(created.correct).toBe(false);
    });

    it("G9: digitless 'xiang' grades correct against correctPinyin 'xiang4'", async () => {
      await quizService.submitAnswer("att-1", {
        questionIndex: 0,
        pinyinInput: "xiang",
        selectedTone: 4,
        correctPinyin: "xiang4",
        correctTone: 4,
        category: "pinyin",
      });

      const created = mockRepository.createQuizAttemptAnswer.mock.calls[0][0];
      expect(created.correct).toBe(true);
    });

    it("G9: digit-suffixed 'xiang4' also grades correct against 'xiang4'", async () => {
      await quizService.submitAnswer("att-1", {
        questionIndex: 0,
        pinyinInput: "xiang4",
        selectedTone: 4,
        correctPinyin: "xiang4",
        correctTone: 4,
        category: "pinyin",
      });

      const created = mockRepository.createQuizAttemptAnswer.mock.calls[0][0];
      expect(created.correct).toBe(true);
    });

    it("G9: tone-marked input grades correct against digit-suffixed correctPinyin", async () => {
      await quizService.submitAnswer("att-1", {
        questionIndex: 0,
        pinyinInput: "Xiàng",
        selectedTone: 4,
        correctPinyin: "xiang4",
        correctTone: 4,
        category: "pinyin",
      });

      const created = mockRepository.createQuizAttemptAnswer.mock.calls[0][0];
      expect(created.correct).toBe(true);
    });

    it("G3: grades an IME glyph answer correct (input glyph vs correctPinyin glyph)", async () => {
      await quizService.submitAnswer("att-1", {
        questionIndex: 0,
        pinyinInput: "好",
        selectedTone: 0,
        correctPinyin: "好",
        correctTone: 0,
        category: "ime",
      });

      const created = mockRepository.createQuizAttemptAnswer.mock.calls[0][0];
      expect(created.correct).toBe(true);
    });

    it("G3: grades a wrong IME glyph as incorrect", async () => {
      await quizService.submitAnswer("att-1", {
        questionIndex: 0,
        pinyinInput: "人",
        selectedTone: 0,
        correctPinyin: "好",
        correctTone: 0,
        category: "ime",
      });

      const created = mockRepository.createQuizAttemptAnswer.mock.calls[0][0];
      expect(created.correct).toBe(false);
    });
  });

  describe("completeQuizAttempt (G3 gate)", () => {
    it("persists an IME attempt with ≥80% correct as passed and advances the phase gate", async () => {
      const attempt = {
        id: "att-ime-1",
        userId: "u1",
        quizType: "ime-simulator",
        phase: 2,
        totalScore: 0,
        maxScore: 0,
      };

      // 25 IME answers, 20 correct (80% pass threshold for ime-simulator)
      const answers = Array.from({ length: 25 }, (_, i) => ({
        id: `ans-${i}`,
        correct: i < 20,
      }));

      mockRepository.findQuizAttemptAnswers.mockResolvedValue(answers);
      mockRepository.findQuizAttemptById.mockResolvedValue(attempt);
      mockRepository.completeQuizAttempt.mockResolvedValue({
        ...attempt,
        totalScore: 20,
        maxScore: 25,
        passed: true,
      });

      const result = await quizService.completeQuizAttempt("att-ime-1");

      expect(result.passed).toBe(true);
      expect(result.totalScore).toBe(20);
      expect(mockRepository.completeQuizAttempt).toHaveBeenCalledWith("att-ime-1", {
        totalScore: 20,
        maxScore: 25,
        passed: true,
      });
      expect(mockProgressionService.updatePhaseGate).toHaveBeenCalledWith("u1", {
        phase: 2,
        passed: true,
        gateCriteria: "quiz",
      });
    });

    it("does not advance the gate for an IME attempt below 80%", async () => {
      const attempt = {
        id: "att-ime-2",
        userId: "u1",
        quizType: "ime-simulator",
        phase: 2,
        totalScore: 0,
        maxScore: 0,
      };

      const answers = Array.from({ length: 25 }, (_, i) => ({
        id: `ans-${i}`,
        correct: i < 15, // 15/25 = 60% < 80%
      }));

      mockRepository.findQuizAttemptAnswers.mockResolvedValue(answers);
      mockRepository.findQuizAttemptById.mockResolvedValue(attempt);
      mockRepository.completeQuizAttempt.mockResolvedValue({
        ...attempt,
        totalScore: 15,
        maxScore: 25,
        passed: false,
      });

      const result = await quizService.completeQuizAttempt("att-ime-2");

      expect(result.passed).toBe(false);
      expect(mockProgressionService.updatePhaseGate).not.toHaveBeenCalled();
    });
  });

  describe("completeQuizAttempt category breakdown (visual wave fix)", () => {
    it("10/10 audio quiz → breakdown sums to the total (each question attributed to a category)", async () => {
      const attempt = {
        id: "att-audio-1",
        userId: "u1",
        quizType: "audio-to-pinyin-tone",
        phase: 1,
        totalScore: 0,
        maxScore: 0,
      };

      // 10 questions, all correct: 5 pinyin-category + 5 tones-category
      const answers = Array.from({ length: 10 }, (_, i) => ({
        id: `ans-${i}`,
        correct: true,
        category: i < 5 ? "pinyin" : "tones",
      }));

      mockRepository.findQuizAttemptAnswers.mockResolvedValue(answers);
      mockRepository.findQuizAttemptById.mockResolvedValue(attempt);
      mockRepository.completeQuizAttempt.mockResolvedValue({
        ...attempt,
        totalScore: 10,
        maxScore: 10,
        passed: true,
      });

      const result = await quizService.completeQuizAttempt("att-audio-1");

      expect(result.totalScore).toBe(10);
      expect(result.categoryBreakdown.pinyin).toBe(5);
      expect(result.categoryBreakdown.tones).toBe(5);
      expect(result.categoryBreakdown.pairs).toBe(0);
      expect(result.categoryBreakdown.rules).toBe(0);
      const sum = Object.values(result.categoryBreakdown).reduce((a, b) => a + b, 0);
      expect(sum).toBe(10);
    });

    it("mixed categories with some wrong → breakdown sums to totalScore", async () => {
      const attempt = {
        id: "att-audio-2",
        userId: "u1",
        quizType: "audio-to-pinyin-tone",
        phase: 1,
        totalScore: 0,
        maxScore: 0,
      };

      // 10 questions: 6 pinyin-category (4 correct) + 4 tones-category (3 correct) → totalScore 7
      const answers = [
        { id: "a0", correct: true, category: "pinyin" },
        { id: "a1", correct: true, category: "pinyin" },
        { id: "a2", correct: true, category: "pinyin" },
        { id: "a3", correct: false, category: "pinyin" },
        { id: "a4", correct: true, category: "pinyin" },
        { id: "a5", correct: false, category: "pinyin" },
        { id: "a6", correct: true, category: "tones" },
        { id: "a7", correct: true, category: "tones" },
        { id: "a8", correct: true, category: "tones" },
        { id: "a9", correct: false, category: "tones" },
      ];

      mockRepository.findQuizAttemptAnswers.mockResolvedValue(answers);
      mockRepository.findQuizAttemptById.mockResolvedValue(attempt);
      mockRepository.completeQuizAttempt.mockResolvedValue({
        ...attempt,
        totalScore: 7,
        maxScore: 10,
        passed: false,
      });

      const result = await quizService.completeQuizAttempt("att-audio-2");

      expect(result.totalScore).toBe(7);
      expect(result.categoryBreakdown.pinyin).toBe(4);
      expect(result.categoryBreakdown.tones).toBe(3);
      const sum = Object.values(result.categoryBreakdown).reduce((a, b) => a + b, 0);
      expect(sum).toBe(7);
    });
  });

  describe("createQuizAttempt + getComprehensionQuizResult (G7)", () => {
    it("G7: passes passageId through to the repository for comprehension attempts", async () => {
      mockRepository.createQuizAttempt.mockResolvedValue({
        id: "att-comp-1",
        userId: "u1",
        quizType: "comprehension",
        phase: 3,
        passageId: "p_00001",
      });

      await quizService.createQuizAttempt("u1", "comprehension", 3, undefined, "p_00001");

      expect(mockRepository.createQuizAttempt).toHaveBeenCalledWith({
        userId: "u1",
        quizType: "comprehension",
        phase: 3,
        metadata: undefined,
        passageId: "p_00001",
      });
    });

    it("G7: getComprehensionQuizResult returns a score only when passageId matches", async () => {
      mockRepository.findQuizAttemptByUserAndType.mockResolvedValue({
        id: "att-comp-1",
        userId: "u1",
        quizType: "comprehension",
        passageId: "p_00001",
        totalScore: 3,
        maxScore: 5,
      });

      const match = await quizService.getComprehensionQuizResult("u1", "p_00001");
      expect(match).toEqual({ score: 0.6 });

      const noMatch = await quizService.getComprehensionQuizResult("u1", "p_99999");
      expect(noMatch).toBeNull();
    });
  });
});
