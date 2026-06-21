/**
 * QuizEngine.ts
 * Phase 1 Gate Quiz — State machine shell
 *
 * Manages the lifecycle of a strategy-based quiz session:
 * 1. Load questions via the active strategy
 * 2. Present questions one at a time (QUESTION → INPUT)
 * 3. Evaluate answers via the active strategy (→ FEEDBACK)
 * 4. Advance to next question or RESULTS
 *
 * Phase machine: LOADING → QUESTION → INPUT → FEEDBACK → RESULTS
 */

import type { QuizStrategy, QuizQuestion, AnswerResult, QuizPhase } from "./types";

/** State machine for a single quiz session */
export class QuizEngine {
  private strategy: QuizStrategy;
  private questions: QuizQuestion[] = [];
  private currentIndex = 0;
  private results: AnswerResult[] = [];
  private score = 0;
  private phase: QuizPhase = "LOADING";

  constructor(strategy: QuizStrategy) {
    this.strategy = strategy;
  }

  get currentPhase(): QuizPhase {
    return this.phase;
  }

  get currentQuestion(): QuizQuestion | null {
    return this.phase === "QUESTION" || this.phase === "INPUT" || this.phase === "FEEDBACK"
      ? (this.questions[this.currentIndex] ?? null)
      : null;
  }

  get allResults(): AnswerResult[] {
    return [...this.results];
  }

  get totalScore(): number {
    return this.score;
  }

  get progress(): { current: number; total: number } {
    return { current: this.currentIndex + 1, total: this.questions.length };
  }

  /** Initialize the engine by loading questions */
  async initialize(): Promise<void> {
    this.phase = "LOADING";
    try {
      this.questions = await this.strategy.generateQuestions();
      this.currentIndex = 0;
      this.results = [];
      this.score = 0;
      this.phase = this.questions.length > 0 ? "QUESTION" : "RESULTS";
    } catch (err) {
      this.phase = "ERROR";
      throw err;
    }
  }

  /** Submit an answer for the current question */
  submitAnswer(pinyin: string, tone: number): AnswerResult {
    if (!this.currentQuestion) {
      throw new Error("No active question to answer");
    }

    const result = this.strategy.evaluateAnswer(this.currentQuestion, pinyin, tone);
    this.results.push(result);
    if (result.correct) this.score++;

    this.phase = "FEEDBACK";
    return result;
  }

  /** Advance to the next question (or RESULTS if done) */
  nextQuestion(): void {
    if (this.currentIndex + 1 < this.questions.length) {
      this.currentIndex++;
      this.phase = "QUESTION";
    } else {
      this.phase = "RESULTS";
    }
  }

  /** Reset the engine to initial state */
  reset(): void {
    this.questions = [];
    this.currentIndex = 0;
    this.results = [];
    this.score = 0;
    this.phase = "LOADING";
  }
}
