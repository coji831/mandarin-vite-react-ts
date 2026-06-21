/**
 * @file apps/backend/src/modules/quiz/api/QuizController.js
 * Generic HTTP controller for quiz endpoints.
 * Delegates to the registered strategy via QuizService.
 */
import { createLogger } from "../../../shared/utils/logger.js";

const logger = createLogger("QuizController");

export class QuizController {
  constructor(quizService) {
    this.quizService = quizService;
    this.createQuizAttempt = this.createQuizAttempt.bind(this);
    this.submitAnswer = this.submitAnswer.bind(this);
    this.completeQuizAttempt = this.completeQuizAttempt.bind(this);
    this.getQuizAttempts = this.getQuizAttempts.bind(this);
    this.getQuestions = this.getQuestions.bind(this);
  }

  async createQuizAttempt(req, res) {
    try {
      const userId = req.userId;
      const { quizType, phase } = req.body;
      const attempt = await this.quizService.createQuizAttempt(userId, quizType, phase);
      return res.status(201).json(attempt);
    } catch (error) {
      logger.error("Error creating quiz attempt", error);
      return res.status(500).json({ error: "Failed to create quiz attempt" });
    }
  }

  async submitAnswer(req, res) {
    try {
      const { id } = req.params;
      const answer = await this.quizService.submitAnswer(id, req.body);
      return res.status(200).json(answer);
    } catch (error) {
      logger.error("Error submitting answer", error);
      return res.status(500).json({ error: "Failed to submit answer" });
    }
  }

  async completeQuizAttempt(req, res) {
    try {
      const { id } = req.params;
      const result = await this.quizService.completeQuizAttempt(id);
      return res.status(200).json(result);
    } catch (error) {
      logger.error("Error completing quiz attempt", error);
      return res.status(500).json({ error: "Failed to complete quiz attempt" });
    }
  }

  async getQuizAttempts(req, res) {
    try {
      const userId = req.userId;
      const attempts = await this.quizService.getUserQuizAttempts(userId);
      return res.status(200).json(attempts);
    } catch (error) {
      logger.error("Error fetching quiz attempts", error);
      return res.status(500).json({ error: "Failed to fetch quiz attempts" });
    }
  }

  async getQuestions(req, res) {
    try {
      const { type = "audio-to-type", count = 20 } = req.query;
      const questions = await this.quizService.generateQuestions(type, parseInt(count, 10));
      res.json(questions);
    } catch (err) {
      logger.error("Failed to generate questions", err);
      res.status(500).json({ error: "Failed to generate questions" });
    }
  }
}
