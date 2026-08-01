/**
 * @file apps/backend/src/modules/quiz/api/__tests__/QuizController.test.ts
 * Unit tests for QuizController HTTP handlers.
 *
 * G7: a comprehension attempt created via the API retains its passageId.
 * G2/G9: guest (non-persisted) answers grade neutral tone 0≡5 and accept both
 *        digitless and digit-suffixed pinyin.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { QuizController } from "../QuizController.js";

describe("QuizController", () => {
  let quizController: QuizController;
  let mockQuizService: any;
  let mockReq: any;
  let mockRes: any;

  beforeEach(() => {
    mockQuizService = {
      createQuizAttempt: vi.fn(),
      submitAnswer: vi.fn(),
      completeQuizAttempt: vi.fn(),
      getUserQuizAttempts: vi.fn(),
      generateQuestions: vi.fn(),
      getQuizConfig: vi.fn(),
    };

    quizController = new QuizController(mockQuizService);

    mockReq = {
      userId: "user123",
      params: {},
      body: {},
      query: {},
    };

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
  });

  describe("createQuizAttempt (G7)", () => {
    it("wires passageId from the request body for comprehension attempts", async () => {
      const attempt = {
        id: "att-comp-1",
        userId: "user123",
        quizType: "comprehension",
        phase: 3,
        passageId: "p_00001",
        passed: false,
        createdAt: new Date().toISOString(),
      };
      mockReq.body = { quizType: "comprehension", phase: 3, passageId: "p_00001" };
      mockQuizService.createQuizAttempt.mockResolvedValue(attempt);

      await quizController.createQuizAttempt(mockReq, mockRes);

      expect(mockQuizService.createQuizAttempt).toHaveBeenCalledWith(
        "user123",
        "comprehension",
        3,
        undefined,
        "p_00001",
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(attempt);
    });

    it("returns 500 with convention error message on service failure", async () => {
      mockReq.body = { quizType: "comprehension" };
      mockQuizService.createQuizAttempt.mockRejectedValue(new Error("DB error"));

      await quizController.createQuizAttempt(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Failed to create quiz attempt",
        code: "INTERNAL_ERROR",
      });
    });
  });

  describe("submitAnswer guest mock (G2/G9)", () => {
    it("grades a neutral-tone guest answer correct (selectedTone 0 vs correctTone 5)", async () => {
      mockReq.userId = null;
      mockReq.body = {
        questionIndex: 0,
        pinyinInput: "cuo",
        selectedTone: 0,
        correctPinyin: "cuo5",
        correctTone: 5,
        category: "tones",
      };

      await quizController.submitAnswer(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const body = mockRes.json.mock.calls[0][0];
      expect(body.correct).toBe(true);
    });

    it("grades digitless 'xiang' correct against digit-suffixed 'xiang4'", async () => {
      mockReq.userId = null;
      mockReq.body = {
        questionIndex: 0,
        pinyinInput: "xiang",
        selectedTone: 4,
        correctPinyin: "xiang4",
        correctTone: 4,
        category: "pinyin",
      };

      await quizController.submitAnswer(mockReq, mockRes);

      const body = mockRes.json.mock.calls[0][0];
      expect(body.correct).toBe(true);
    });
  });
});
