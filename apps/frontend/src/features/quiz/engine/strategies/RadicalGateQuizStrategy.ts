/**
 * RadicalGateQuizStrategy.ts
 * Phase 2→3 Gate Quiz — Radical Gate strategy
 *
 * Two tiers (10 questions total):
 *   Tier 1 — Core Component Lockdown (5 Qs): Match radical glyph ↔ meaning.
 *   Tier 2 — The Radical Predictor (5 Qs): Unfamiliar character → predict
 *            meaning category from its radical.
 *
 * Phase machine: LOADING → QUESTION → INPUT → FEEDBACK → RESULTS
 */

import type { QuizStrategy, QuizQuestion, AnswerResult } from "../../types";
import { quizService } from "../../services/quizService";

export const radicalGateQuizStrategy: QuizStrategy = {
  type: "radical-gate",
  label: "Radical Gate Quiz",
  icon: "🚪",
  phase: 2,

  async generateQuestions(count?: number): Promise<QuizQuestion[]> {
    return quizService.fetchQuestions("radical-gate", count ?? 10);
  },

  evaluateAnswer(question: QuizQuestion, pinyin: string, _tone: number): AnswerResult {
    // pinyin contains the selected option ID
    const selectedId = (pinyin ?? "").trim();
    const correctId = question.correctPinyin;
    const correct = selectedId === correctId;

    // Find correct option for feedback
    const correctOption = (question.options || []).find((o) => o.id === correctId);
    const correctMeaning = correctOption?.meaning ?? "?";

    if (question.category === "radical-core-lockdown") {
      const charGlyph = question.character || "?";
      const feedback = correct
        ? `Correct! "${charGlyph}" means "${correctMeaning}".`
        : `The radical "${charGlyph}" means "${correctMeaning}".`;
      return {
        correct,
        userPinyin: pinyin,
        userTone: 0,
        correctPinyin: correctId,
        correctTone: 0,
        feedback,
        toneDescription: "",
      };
    }

    // Radical predictor
    const charGlyph = question.character || "?";
    const charPinyin = question.displayPinyin || "?";
    const charMeaning = question.meaning || "?";
    const feedback = correct
      ? `Correct! "${charGlyph}" (${charPinyin}) belongs to the "${correctMeaning}" category. It means "${charMeaning}".`
      : `"${charGlyph}" (${charPinyin}) belongs to the "${correctMeaning}" category. It means "${charMeaning}".`;

    return {
      correct,
      userPinyin: pinyin,
      userTone: 0,
      correctPinyin: correctId,
      correctTone: 0,
      feedback,
      toneDescription: "",
    };
  },
};
