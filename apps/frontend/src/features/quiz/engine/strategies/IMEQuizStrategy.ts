/**
 * IMEQuizStrategy.ts
 * Phase 2 Gate Quiz — IME Simulator strategy
 *
 * Strategy for the Phase 2 gate quiz: user sees a meaning clue,
 * types the Chinese character using IME input.
 *
 * Phase machine: LOADING → QUESTION → INPUT → FEEDBACK → RESULTS
 */

import type { QuizStrategy, QuizQuestion, AnswerResult } from "../../types";
import { quizService } from "../../services/quizService";

export const imeQuizStrategy: QuizStrategy = {
  type: "ime-simulator",
  label: "IME Simulator",
  icon: "\u{2328}\u{FE0F}",
  phase: 2,

  async generateQuestions(count?: number): Promise<QuizQuestion[]> {
    return quizService.fetchQuestions("ime-simulator", count ?? 10);
  },

  evaluateAnswer(question: QuizQuestion, pinyin: string, tone: number): AnswerResult {
    // For IME, "pinyin" param contains the user-typed character glyph
    const userGlyph = (pinyin ?? "").trim().normalize("NFKC");
    // Phase 3: prefer the typed `correctGlyph`; keep `character` (wire) back-compat.
    const correctGlyph = (question.correctGlyph ?? question.character ?? "").normalize("NFKC");
    const correct = userGlyph === correctGlyph;
    const displayPinyin =
      question.displayPinyin ?? question.expectedPinyin ?? question.correctPinyin;

    const feedback = correct
      ? `Correct! ${correctGlyph} (${displayPinyin}${question.meaning ? ` \u2014 ${question.meaning}` : ""})`
      : `Incorrect. The correct answer was: ${correctGlyph} (${displayPinyin}${question.meaning ? ` \u2014 ${question.meaning}` : ""})`;

    return {
      correct,
      userPinyin: pinyin,
      userTone: tone,
      correctPinyin: question.correctPinyin,
      correctTone: question.correctTone,
      feedback,
      toneDescription: "",
    };
  },
};
