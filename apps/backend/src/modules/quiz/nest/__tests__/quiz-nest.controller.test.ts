/**
 * @file apps/backend/src/modules/quiz/nest/__tests__/quiz-nest.controller.test.ts
 * @description Unit tests for `QuizNestController` (Story 24-13 — Quiz +
 * Progression Port). Adapts the Express `QuizController` test surface to the
 * Nest controller shape — same guest mock shapes, same service delegation,
 * same 4xx/5xx codes, with the AI-feedback route (1:1 with
 * `api/aiFeedbackRoutes.ts`) throwing the calibrated envelope exceptions the
 * global 24-3 `AppExceptionFilter` serializes.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { BadRequestException, InternalServerErrorException } from "@nestjs/common";
import type { Request } from "express";
import { QuizNestController } from "../quiz-nest.controller.js";

vi.mock("../../../../shared/utils/logger.js", () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}));

function makeReq(overrides: Record<string, unknown> = {}) {
  return {
    userId: "user123",
    query: {},
    body: {},
    params: {},
    ...overrides,
  } as unknown as Request;
}

describe("QuizNestController (Story 24-13)", () => {
  let controller: QuizNestController;
  let mockQuizService: {
    createQuizAttempt: ReturnType<typeof vi.fn>;
    submitAnswer: ReturnType<typeof vi.fn>;
    completeQuizAttempt: ReturnType<typeof vi.fn>;
    getUserQuizAttempts: ReturnType<typeof vi.fn>;
    generateQuestions: ReturnType<typeof vi.fn>;
    getQuizConfig: ReturnType<typeof vi.fn>;
  };
  let mockGeminiService: { generateText: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockQuizService = {
      createQuizAttempt: vi.fn(),
      submitAnswer: vi.fn(),
      completeQuizAttempt: vi.fn(),
      getUserQuizAttempts: vi.fn(),
      generateQuestions: vi.fn(),
      getQuizConfig: vi.fn(),
    };
    mockGeminiService = {
      generateText: vi.fn(async () => "mock explanation"),
    };
    controller = new QuizNestController(mockQuizService as never, mockGeminiService as never);
  });

  describe("createQuizAttempt (POST /v1/quiz/attempts, optionalAuth)", () => {
    it("guest → 201 mock attempt (no persistence, no service call)", async () => {
      const req = makeReq({
        userId: undefined,
        body: { quizType: "audio-to-pinyin-tone", phase: 2 },
      });

      const result = (await controller.createQuizAttempt(
        { quizType: "audio-to-pinyin-tone", phase: 2 },
        req,
      )) as Record<string, unknown>;

      expect(mockQuizService.createQuizAttempt).not.toHaveBeenCalled();
      expect(result.quizType).toBe("audio-to-pinyin-tone");
      expect(result.phase).toBe(2);
      expect(result.userId).toBeNull();
      expect(result.passed).toBe(false);
      expect(typeof result.id).toBe("string");
      expect(typeof result.createdAt).toBe("string");
    });

    it("guest mock defaults phase to 1 when not supplied", async () => {
      const req = makeReq({ userId: undefined, body: { quizType: "x" } });

      const result = (await controller.createQuizAttempt({ quizType: "x" }, req)) as {
        phase: number;
      };

      expect(result.phase).toBe(1);
    });

    it("registered user → delegates to the service with req.userId", async () => {
      const req = makeReq({ body: { quizType: "ime-simulator", phase: 2 } });
      mockQuizService.createQuizAttempt.mockResolvedValue({ id: "attempt-1" });

      const result = await controller.createQuizAttempt(
        { quizType: "ime-simulator", phase: 2 },
        req,
      );

      expect(mockQuizService.createQuizAttempt).toHaveBeenCalledWith(
        "user123",
        "ime-simulator",
        2,
        undefined,
        undefined,
      );
      expect(result).toEqual({ id: "attempt-1" });
    });

    it("service error → 500 INTERNAL_ERROR envelope", async () => {
      const req = makeReq({ body: { quizType: "x" } });
      mockQuizService.createQuizAttempt.mockRejectedValue(new Error("boom"));

      const err = await controller.createQuizAttempt({ quizType: "x" }, req).then(
        () => {
          throw new Error("expected rejection");
        },
        (e: unknown) => e,
      );

      expect(err).toBeInstanceOf(InternalServerErrorException);
      expect((err as InternalServerErrorException).getResponse()).toEqual({
        code: "INTERNAL_ERROR",
        message: "Failed to create quiz attempt",
      });
    });
  });

  describe("submitAnswer (POST /v1/quiz/attempts/:id/answers, optionalAuth)", () => {
    it("guest → 200 mock answer computed locally (no persistence)", async () => {
      const req = makeReq({
        userId: undefined,
        params: { id: "attempt-1" },
        body: {
          questionIndex: 0,
          pinyinInput: "ma",
          selectedTone: 3,
          correctPinyin: "ma",
          correctTone: 3,
          category: "pinyin",
        },
      });

      const result = (await controller.submitAnswer(
        "attempt-1",
        req.body as Record<string, unknown>,
        req,
      )) as Record<string, unknown>;

      expect(mockQuizService.submitAnswer).not.toHaveBeenCalled();
      expect(result.attemptId).toBe("attempt-1");
      expect(result.correct).toBe(true);
    });

    it("guest mock marks a wrong answer false", async () => {
      const req = makeReq({
        userId: undefined,
        params: { id: "attempt-1" },
        body: {
          questionIndex: 0,
          pinyinInput: "ma",
          selectedTone: 3,
          correctPinyin: "ma",
          correctTone: 4,
          category: "tones",
        },
      });

      const result = (await controller.submitAnswer(
        "attempt-1",
        req.body as Record<string, unknown>,
        req,
      )) as { correct: boolean };

      expect(result.correct).toBe(false);
    });

    it("registered user → delegates to the service", async () => {
      const req = makeReq({
        params: { id: "attempt-1" },
        body: { questionIndex: 0, pinyinInput: "ma", selectedTone: 3 },
      });
      mockQuizService.submitAnswer.mockResolvedValue({ id: "answer-1" });

      const result = await controller.submitAnswer(
        "attempt-1",
        req.body as Record<string, unknown>,
        req,
      );

      expect(mockQuizService.submitAnswer).toHaveBeenCalledWith("attempt-1", req.body);
      expect(result).toEqual({ id: "answer-1" });
    });
  });

  describe("completeQuizAttempt (PUT /v1/quiz/attempts/:id/complete, optionalAuth)", () => {
    it("guest → 200 mock completion (no pass signal, no persistence)", async () => {
      const req = makeReq({ userId: undefined, params: { id: "attempt-1" } });

      const result = await controller.completeQuizAttempt("attempt-1", req);

      expect(mockQuizService.completeQuizAttempt).not.toHaveBeenCalled();
      expect(result).toEqual({ totalScore: 0, maxScore: 0, passed: false, accuracy: 0 });
    });

    it("registered user → delegates to the service", async () => {
      const req = makeReq({ params: { id: "attempt-1" } });
      mockQuizService.completeQuizAttempt.mockResolvedValue({
        passed: true,
        totalScore: 9,
        maxScore: 10,
        accuracy: 0.9,
      });

      const result = await controller.completeQuizAttempt("attempt-1", req);

      expect(mockQuizService.completeQuizAttempt).toHaveBeenCalledWith("attempt-1");
      expect(result).toEqual({ passed: true, totalScore: 9, maxScore: 10, accuracy: 0.9 });
    });
  });

  describe("getQuizAttempts (GET /v1/quiz/attempts, requireAuth)", () => {
    it("guest → [] (defense-in-depth; unreachable under RequireAuthGuard)", async () => {
      const req = makeReq({ userId: undefined });

      const result = await controller.getQuizAttempts(req);

      expect(mockQuizService.getUserQuizAttempts).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it("registered user → delegates to the service", async () => {
      const req = makeReq();
      mockQuizService.getUserQuizAttempts.mockResolvedValue([{ id: "a1" }]);

      const result = await controller.getQuizAttempts(req);

      expect(mockQuizService.getUserQuizAttempts).toHaveBeenCalledWith("user123");
      expect(result).toEqual([{ id: "a1" }]);
    });
  });

  describe("getQuestions (GET /v1/quiz/questions, optionalAuth)", () => {
    it("delegates with defaults (type=audio-to-pinyin-tone, count=20) when absent", async () => {
      mockQuizService.generateQuestions.mockResolvedValue([{ id: "q1" }]);

      const result = await controller.getQuestions(undefined, undefined);

      expect(mockQuizService.generateQuestions).toHaveBeenCalledWith("audio-to-pinyin-tone", 20);
      expect(result).toEqual([{ id: "q1" }]);
    });

    it("passes explicit type/count through", async () => {
      mockQuizService.generateQuestions.mockResolvedValue([]);

      await controller.getQuestions("ime-simulator", "25");

      expect(mockQuizService.generateQuestions).toHaveBeenCalledWith("ime-simulator", 25);
    });

    it("strategy error → 500 LOAD_ERROR envelope", async () => {
      mockQuizService.generateQuestions.mockRejectedValue(new Error("boom"));

      const err = await controller.getQuestions("x", "10").then(
        () => {
          throw new Error("expected rejection");
        },
        (e: unknown) => e,
      );

      expect(err).toBeInstanceOf(InternalServerErrorException);
      expect((err as InternalServerErrorException).getResponse()).toEqual({
        code: "LOAD_ERROR",
        message: "Failed to generate questions",
      });
    });
  });

  describe("getConfig (GET /v1/quiz/config, optionalAuth)", () => {
    it("delegates with the type when given", async () => {
      mockQuizService.getQuizConfig.mockResolvedValue({ type: "ime-simulator" });

      const result = await controller.getConfig("ime-simulator");

      expect(mockQuizService.getQuizConfig).toHaveBeenCalledWith("ime-simulator");
      expect(result).toEqual({ type: "ime-simulator" });
    });

    it("delegates with undefined (all configs) when no type", async () => {
      mockQuizService.getQuizConfig.mockResolvedValue([]);

      const result = await controller.getConfig(undefined);

      expect(mockQuizService.getQuizConfig).toHaveBeenCalledWith(undefined);
      expect(result).toEqual([]);
    });
  });

  describe("generateFeedback (POST /v1/quiz/feedback, requireAuth)", () => {
    it("missing fields → 400 VALIDATION_ERROR envelope (no Gemini call)", async () => {
      const err = await controller.generateFeedback({ wordId: "w1", userAnswer: "x" }).then(
        () => {
          throw new Error("expected rejection");
        },
        (e: unknown) => e,
      );

      expect(err).toBeInstanceOf(BadRequestException);
      expect((err as BadRequestException).getResponse()).toEqual({
        code: "VALIDATION_ERROR",
        message: "wordId, userAnswer, correctAnswer, questionType are all required",
      });
      expect(mockGeminiService.generateText).not.toHaveBeenCalled();
    });

    it("valid input → GeminiService.generateText + { explanation, errorType }", async () => {
      const result = await controller.generateFeedback({
        wordId: "w1",
        userAnswer: "ma",
        correctAnswer: "mǎ",
        questionType: "audio-to-pinyin-tone",
      });

      expect(mockGeminiService.generateText).toHaveBeenCalledWith(
        expect.stringContaining("Mandarin Chinese tutor"),
        { timeout: 5000 },
      );
      expect(result).toEqual({ explanation: "mock explanation", errorType: "ai_feedback" });
    });
  });
});
