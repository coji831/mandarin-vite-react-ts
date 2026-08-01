/**
 * @file apps/backend/src/modules/quiz/api/QuizController.js
 * Generic HTTP controller for quiz endpoints.
 * Delegates to the registered strategy via QuizService.
 */
import { createLogger } from "../../../shared/utils/logger.js";
import crypto from "node:crypto";
import type { Request, Response } from "express";
import { areTonesEquivalent, normalizePinyinForComparison } from "@mandarin/shared-utils";

const logger = createLogger("QuizController");

export class QuizController {
  quizService: import("../services/QuizService.js").QuizService;

  constructor(quizService: import("../services/QuizService.js").QuizService) {
    this.quizService = quizService;
    this.createQuizAttempt = this.createQuizAttempt.bind(this);
    this.submitAnswer = this.submitAnswer.bind(this);
    this.completeQuizAttempt = this.completeQuizAttempt.bind(this);
    this.getQuizAttempts = this.getQuizAttempts.bind(this);
    this.getQuestions = this.getQuestions.bind(this);
    this.getConfig = this.getConfig.bind(this);
  }

  async createQuizAttempt(req: Request, res: Response) {
    try {
      if (!req.userId) {
        // Guest user — return mock attempt (no persistence, no tracking)
        return res.status(201).json({
          id: crypto.randomUUID(),
          quizType: req.body.quizType,
          phase: req.body.phase ?? 1,
          totalScore: null,
          maxScore: null,
          passed: false,
          completedAt: null,
          createdAt: new Date().toISOString(),
          userId: null,
        });
      }
      const { quizType, phase, metadata, passageId } = req.body;
      const attempt = await this.quizService.createQuizAttempt(
        req.userId,
        quizType,
        phase,
        metadata,
        passageId,
      );
      return res.status(201).json(attempt);
    } catch (error) {
      logger.error("Error creating quiz attempt", error);
      return res
        .status(500)
        .json({ error: "Failed to create quiz attempt", code: "INTERNAL_ERROR" });
    }
  }

  async submitAnswer(req: Request, res: Response) {
    try {
      if (!req.userId) {
        // Guest user — return mock answer (no persistence)
        return res.status(200).json({
          id: crypto.randomUUID(),
          attemptId: String(req.params.id),
          questionIndex: req.body.questionIndex,
          pinyinInput: req.body.pinyinInput,
          selectedTone: req.body.selectedTone,
          correctPinyin: req.body.correctPinyin,
          correctTone: req.body.correctTone,
          correct:
            normalizePinyinForComparison(req.body.pinyinInput) ===
              normalizePinyinForComparison(req.body.correctPinyin) &&
            areTonesEquivalent(req.body.selectedTone, req.body.correctTone),
          category: req.body.category,
          createdAt: new Date().toISOString(),
        });
      }
      const id = String(req.params.id);
      const answer = await this.quizService.submitAnswer(id, req.body);
      return res.status(200).json(answer);
    } catch (error) {
      logger.error("Error submitting answer", error);
      return res.status(500).json({ error: "Failed to submit answer", code: "VALIDATION_ERROR" });
    }
  }

  async completeQuizAttempt(req: Request, res: Response) {
    try {
      if (!req.userId) {
        // Guest user — return mock completion (no persistence)
        return res.status(200).json({
          totalScore: 0,
          maxScore: 0,
          passed: false,
          accuracy: 0,
        });
      }
      const id = String(req.params.id);
      const result = await this.quizService.completeQuizAttempt(id);
      return res.status(200).json(result);
    } catch (error) {
      logger.error("Error completing quiz attempt", error);
      return res
        .status(500)
        .json({ error: "Failed to complete quiz attempt", code: "INTERNAL_ERROR" });
    }
  }

  async getQuizAttempts(req: Request, res: Response) {
    try {
      if (!req.userId) {
        // Guest user — no tracking data
        return res.status(200).json([]);
      }
      const attempts = await this.quizService.getUserQuizAttempts(req.userId);
      return res.status(200).json(attempts);
    } catch (error) {
      logger.error("Error fetching quiz attempts", error);
      return res.status(500).json({ error: "Failed to fetch quiz attempts", code: "LOAD_ERROR" });
    }
  }

  async getQuestions(req: Request, res: Response) {
    try {
      const { type = "audio-to-pinyin-tone", count = "20" } = req.query as Record<string, string>;
      const questions = await this.quizService.generateQuestions(type, parseInt(count, 10));
      res.json(questions);
    } catch (err) {
      logger.error("Failed to generate questions", err);
      res.status(500).json({ error: "Failed to generate questions", code: "LOAD_ERROR" });
    }
  }

  async getConfig(req: Request, res: Response) {
    try {
      const { type } = req.query as Record<string, string>;
      const config = await this.quizService.getQuizConfig(type || undefined);
      res.json(config);
    } catch (err) {
      logger.error("Failed to get quiz config", err);
      res.status(500).json({ error: "Failed to get quiz config", code: "LOAD_ERROR" });
    }
  }
}
