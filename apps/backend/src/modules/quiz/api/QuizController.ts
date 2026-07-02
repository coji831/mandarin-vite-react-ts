/**
 * @file apps/backend/src/modules/quiz/api/QuizController.js
 * Generic HTTP controller for quiz endpoints.
 * Delegates to the registered strategy via QuizService.
 */
import { createLogger } from "../../../shared/utils/logger.js";
import type { Request, Response } from "express";

const logger = createLogger("QuizController");

export class QuizController {
  quizService: any;

  constructor(quizService: any) {
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
      const userId = req.userId;
      const { quizType, phase } = req.body;
      const attempt = await this.quizService.createQuizAttempt(userId, quizType, phase);
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
      const { id } = req.params;
      const answer = await this.quizService.submitAnswer(id, req.body);
      return res.status(200).json(answer);
    } catch (error) {
      logger.error("Error submitting answer", error);
      return res.status(500).json({ error: "Failed to submit answer", code: "VALIDATION_ERROR" });
    }
  }

  async completeQuizAttempt(req: Request, res: Response) {
    try {
      const { id } = req.params;
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
      const userId = req.userId;
      const attempts = await this.quizService.getUserQuizAttempts(userId);
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
      const config = await this.quizService.getQuizConfig(type || null);
      res.json(config);
    } catch (err) {
      logger.error("Failed to get quiz config", err);
      res.status(500).json({ error: "Failed to get quiz config", code: "LOAD_ERROR" });
    }
  }
}
