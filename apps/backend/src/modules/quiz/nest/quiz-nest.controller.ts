/**
 * @file apps/backend/src/modules/quiz/nest/quiz-nest.controller.ts
 * @description NestJS controller for the quiz module (Story 24-13 — Quiz +
 * Progression Port). Mirrors `api/QuizController.ts` (Express) 1:1 plus the
 * AI-feedback handler from `api/aiFeedbackRoutes.ts` — same query/body/path
 * parsing + string coercion, same service delegation, same 2xx JSON (incl. the
 * guest mock attempt/answer/completion shapes), same 4xx/5xx `code`/`message`
 * (the global 24-3 `AppExceptionFilter` serializes thrown `HttpException`s
 * into the `{ code, message, requestId }` envelope; `code`/`message` are
 * byte-for-byte equal to the Express controller's legacy `{ error, code }`
 * body).
 *
 * Routes (verbatim from `api/quizRoutes.ts` + `api/aiFeedbackRoutes.ts` —
 * ROUTE_PATTERNS):
 *   - `GET  /v1/quiz/config`        → `@Get("config")`            → optionalAuth
 *   - `GET  /v1/quiz/questions`     → `@Get("questions")`         → optionalAuth
 *   - `POST /v1/quiz/attempts`      → `@Post("attempts")`         → optionalAuth
 *   - `POST /v1/quiz/attempts/:id/answers`  → `@Post("attempts/:id/answers")`  → optionalAuth
 *   - `PUT  /v1/quiz/attempts/:id/complete` → `@Put("attempts/:id/complete")`  → optionalAuth
 *   - `GET  /v1/quiz/attempts`      → `@Get("attempts")`          → requireAuth
 *   - `POST /v1/quiz/feedback`      → `@Post("feedback")`         → requireAuth
 *
 * (The sandhi-drill route lives on `SandhiDrillNestController` — 1:1 with the
 * Express `SandhiDrillController`.)
 *
 * Guard mapping (verbatim from `api/quizRoutes.ts` + `api/aiFeedbackRoutes.ts`):
 * the guest quiz SUBMIT surface (`config`, `questions`, `attempts` POST,
 * `attempts/:id/answers`, `attempts/:id/complete`) → the CALIBRATED
 * `OptionalAuthGuard` (24-5) — a guest proceeds with `req.userId` UNDEFINED
 * and the controller returns session-local mock shapes (no persistence, no
 * tracking — F6: guest → session-local/empty, never another user's rows, never
 * all-unlocked). `GET /v1/quiz/attempts` → `RequireAuthGuard` (registered
 * users only — a guest never reads persisted attempts) and `POST
 * /v1/quiz/feedback` → `RequireAuthGuard` (AI/vendor-cost generation is
 * registered-only per S11/P11 — guests never incur generation cost).
 *
 * Status-code parity: `@HttpCode(201)` on `createQuizAttempt` (Express
 * `res.status(201)`), `@HttpCode(200)` on `submitAnswer` + `generateFeedback`
 * (Nest's POST default is 201 — Express returns 200).
 */

import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  InternalServerErrorException,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { Request } from "express";
import crypto from "node:crypto";
import { createLogger } from "../../../shared/utils/logger.js";
import { areTonesEquivalent, normalizePinyinForComparison } from "@mandarin/shared-utils";
import { QuizService } from "../services/QuizService.js";
import { GeminiService } from "../../../shared/infrastructure/external/GeminiService.js";
import { OptionalAuthGuard } from "../../../nest/guards/optional-auth.guard.js";
import { RequireAuthGuard } from "../../../nest/guards/require-auth.guard.js";

const logger = createLogger("QuizNestController");

/**
 * Build the AI-feedback prompt — byte-for-byte `buildFeedbackPrompt` from
 * `api/aiFeedbackRoutes.ts`.
 */
function buildFeedbackPrompt(params: {
  wordId: string;
  userAnswer: string;
  correctAnswer: string;
  questionType: string;
}): string {
  return `You are a Mandarin Chinese tutor. The student answered incorrectly.
    Question type: ${params.questionType}
    Student answered: "${params.userAnswer}"
    Correct answer: "${params.correctAnswer}"
    Explain the mistake briefly (2-3 sentences).`;
}

/**
 * NestJS controller for the quiz module (Story 24-13).
 */
@Controller("v1/quiz")
export class QuizNestController {
  constructor(
    @Inject(QuizService) private readonly quizService: QuizService,
    @Inject(GeminiService) private readonly geminiService: GeminiService,
  ) {}

  /**
   * POST /v1/quiz/attempts
   * Create a quiz attempt. optionalAuth — a guest gets a session-local mock
   * attempt (201, no persistence, no tracking); a registered user persists the
   * attempt via QuizService. @HttpCode(201) mirrors the Express
   * `res.status(201).json(...)`.
   */
  @Post("attempts")
  @HttpCode(201)
  @UseGuards(OptionalAuthGuard)
  async createQuizAttempt(
    @Body()
    body: { quizType?: string; phase?: number; metadata?: unknown; passageId?: string },
    @Req() req: Request,
  ): Promise<unknown> {
    const userId = req.userId;
    try {
      if (!userId) {
        // Guest user — return mock attempt (no persistence, no tracking)
        return {
          id: crypto.randomUUID(),
          quizType: body.quizType,
          phase: body.phase ?? 1,
          totalScore: null,
          maxScore: null,
          passed: false,
          completedAt: null,
          createdAt: new Date().toISOString(),
          userId: null,
        };
      }
      const { quizType, phase, metadata, passageId } = body;
      // Mirror the Express any-typed `req.body.quizType` pass-through — the
      // service throws `quizType is required` on an undefined value (caught
      // below → 500 INTERNAL_ERROR, same as Express).
      const attempt = await this.quizService.createQuizAttempt(
        userId,
        quizType as string,
        phase,
        metadata,
        passageId,
      );
      return attempt;
    } catch (error) {
      logger.error("Error creating quiz attempt", error);
      throw new InternalServerErrorException({
        code: "INTERNAL_ERROR",
        message: "Failed to create quiz attempt",
      });
    }
  }

  /**
   * POST /v1/quiz/attempts/:id/answers
   * Submit an answer to a quiz attempt. optionalAuth — a guest gets a
   * session-local mock answer (correctness computed locally, no persistence);
   * a registered user delegates to QuizService.
   */
  @Post("attempts/:id/answers")
  @HttpCode(200)
  @UseGuards(OptionalAuthGuard)
  async submitAnswer(
    @Param("id") idParam: string,
    @Body() body: Record<string, unknown>,
    @Req() req: Request,
  ): Promise<unknown> {
    const userId = req.userId;
    try {
      if (!userId) {
        // Guest user — return mock answer (no persistence)
        return {
          id: crypto.randomUUID(),
          attemptId: String(idParam),
          questionIndex: body.questionIndex,
          pinyinInput: body.pinyinInput,
          selectedTone: body.selectedTone,
          correctPinyin: body.correctPinyin,
          correctTone: body.correctTone,
          correct:
            normalizePinyinForComparison(body.pinyinInput as string) ===
              normalizePinyinForComparison(body.correctPinyin as string) &&
            areTonesEquivalent(body.selectedTone as number, body.correctTone as number),
          category: body.category,
          createdAt: new Date().toISOString(),
        };
      }
      const id = String(idParam);
      const answer = await this.quizService.submitAnswer(id, body as never);
      return answer;
    } catch (error) {
      logger.error("Error submitting answer", error);
      throw new InternalServerErrorException({
        code: "VALIDATION_ERROR",
        message: "Failed to submit answer",
      });
    }
  }

  /**
   * PUT /v1/quiz/attempts/:id/complete
   * Complete a quiz attempt and evaluate it against the strategy's pass
   * threshold. optionalAuth — a guest gets a session-local mock completion (no
   * pass signal, no persistence); a registered user delegates to QuizService
   * (which may advance the PhaseGate via ProgressionService on pass).
   */
  @Put("attempts/:id/complete")
  @UseGuards(OptionalAuthGuard)
  async completeQuizAttempt(@Param("id") idParam: string, @Req() req: Request): Promise<unknown> {
    const userId = req.userId;
    try {
      if (!userId) {
        // Guest user — return mock completion (no persistence)
        return { totalScore: 0, maxScore: 0, passed: false, accuracy: 0 };
      }
      const id = String(idParam);
      const result = await this.quizService.completeQuizAttempt(id);
      return result;
    } catch (error) {
      logger.error("Error completing quiz attempt", error);
      throw new InternalServerErrorException({
        code: "INTERNAL_ERROR",
        message: "Failed to complete quiz attempt",
      });
    }
  }

  /**
   * GET /v1/quiz/attempts
   * Fetch a user's quiz attempts. requireAuth — a guest never reads persisted
   * attempts (rejected 401 AUTH_REQUIRED by the guard before the controller).
   * The `if (!userId)` empty-array branch is defense-in-depth mirroring the
   * Express controller structure (unreachable under the guard).
   */
  @Get("attempts")
  @UseGuards(RequireAuthGuard)
  async getQuizAttempts(@Req() req: Request): Promise<unknown> {
    const userId = req.userId;
    try {
      if (!userId) {
        // Guest user — no tracking data
        return [];
      }
      const attempts = await this.quizService.getUserQuizAttempts(userId);
      return attempts;
    } catch (error) {
      logger.error("Error fetching quiz attempts", error);
      throw new InternalServerErrorException({
        code: "LOAD_ERROR",
        message: "Failed to fetch quiz attempts",
      });
    }
  }

  /**
   * GET /v1/quiz/questions
   * Generate questions for a quiz type by delegating to the registered
   * strategy. optionalAuth — the strategy pool is shared/public content.
   */
  @Get("questions")
  @UseGuards(OptionalAuthGuard)
  async getQuestions(
    @Query("type") typeQuery: unknown,
    @Query("count") countQuery: unknown,
  ): Promise<unknown> {
    try {
      const type = typeQuery === undefined ? "audio-to-pinyin-tone" : String(typeQuery);
      const count = countQuery === undefined ? "20" : String(countQuery);
      const questions = await this.quizService.generateQuestions(type, parseInt(count, 10));
      return questions;
    } catch (err) {
      logger.error("Failed to generate questions", err);
      throw new InternalServerErrorException({
        code: "LOAD_ERROR",
        message: "Failed to generate questions",
      });
    }
  }

  /**
   * GET /v1/quiz/config
   * Fetch the config for one quiz type (or all registered strategies when no
   * type is given). optionalAuth — public strategy metadata.
   */
  @Get("config")
  @UseGuards(OptionalAuthGuard)
  async getConfig(@Query("type") typeQuery: unknown): Promise<unknown> {
    try {
      const type = typeof typeQuery === "string" ? typeQuery : undefined;
      const config = await this.quizService.getQuizConfig(type || undefined);
      return config;
    } catch (err) {
      logger.error("Failed to get quiz config", err);
      throw new InternalServerErrorException({
        code: "LOAD_ERROR",
        message: "Failed to get quiz config",
      });
    }
  }

  /**
   * POST /v1/quiz/feedback
   * Generate an AI-powered explanation for an incorrect quiz answer (1:1 with
   * `api/aiFeedbackRoutes.ts` — GeminiService directly, no intermediate
   * service). requireAuth — AI/vendor-cost generation is registered-only
   * (S11/P11: guests never incur generation cost). @HttpCode(200) mirrors the
   * Express `res.json(...)`.
   */
  @Post("feedback")
  @HttpCode(200)
  @UseGuards(RequireAuthGuard)
  async generateFeedback(
    @Body()
    body: {
      wordId?: string;
      userAnswer?: string;
      correctAnswer?: string;
      questionType?: string;
    },
  ): Promise<unknown> {
    const { wordId, userAnswer, correctAnswer, questionType } = body ?? {};

    if (!wordId || !userAnswer || !correctAnswer || !questionType) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "wordId, userAnswer, correctAnswer, questionType are all required",
      });
    }

    const prompt = buildFeedbackPrompt({ wordId, userAnswer, correctAnswer, questionType });
    const explanation = await this.geminiService.generateText(prompt, { timeout: 5000 });

    return { explanation, errorType: "ai_feedback" };
  }
}
