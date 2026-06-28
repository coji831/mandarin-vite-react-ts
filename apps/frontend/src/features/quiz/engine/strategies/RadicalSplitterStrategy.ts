/**
 * RadicalSplitterStrategy.ts
 * Phase 2 Review — Radical Splitter strategy
 *
 * Strategy for the Radical Splitter review variant:
 * show an HSK character → user picks which radical gives it meaning.
 *
 * This is a Phase 2 review variant (active recall, not a gate quiz).
 * Phase machine: LOADING → QUESTION → INPUT → FEEDBACK → RESULTS
 */

import type { QuizStrategy, QuizQuestion, AnswerResult } from "../../types";
import { quizService } from "../../services/quizService";

export const radicalSplitterStrategy: QuizStrategy = {
  type: "radical-splitter",
  label: "Radical Splitter",
  icon: "🔍",
  phase: 2,
  questionCount: 20,
  passThreshold: 0.7,
  timeLimitMinutes: 10,

  async generateQuestions(): Promise<QuizQuestion[]> {
    return quizService.fetchQuestions("radical-splitter", this.questionCount);
  },

  evaluateAnswer(question: QuizQuestion, pinyin: string, _tone: number): AnswerResult {
    // pinyin contains the selected option ID
    const selectedId = (pinyin ?? "").trim();
    const correctId = question.correctPinyin;
    const correct = selectedId === correctId;

    // Find the correct option for feedback
    const correctOption = (question.options || []).find((o) => o.id === correctId);
    const correctGlyph = correctOption?.glyph ?? "?";
    const correctMeaning = correctOption?.meaning ?? "?";

    const feedback = correct
      ? `Correct! "${question.character}" (${question.displayPinyin}) uses the radical ${correctGlyph} (${correctMeaning}).`
      : `Not quite. "${question.character}" (${question.displayPinyin}) uses the radical ${correctGlyph} (${correctMeaning}) to give it meaning.`;

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
