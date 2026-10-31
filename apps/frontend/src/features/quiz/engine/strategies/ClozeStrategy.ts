/**
 * ClozeStrategy.ts — Q6 `cloze` (Epic 26 §26.3.2 / §26.4.1).
 *
 * Thin proxy, same shape as `AudioToPinyinAndToneStrategy`: the question pool is
 * the backend's read path (§26.4.3), so the FE only generates from the service
 * and evaluates the optimistic verdict the learner sees first.
 *
 * Answer encoding (§26.4.2): `pinyinInput` = the chosen token, `selectedTone` = 0
 * (the sentinel for "this is not a tone answer"), `category` = `cloze`.
 */
import type { QuizStrategy, QuizQuestion, AnswerResult } from "../../types";
import { quizService } from "../../services/quizService";

export const clozeStrategy: QuizStrategy = {
  type: "cloze",
  label: "Cloze",
  // Display-only and currently unrendered; a text glyph keeps emoji out of the
  // icon surface (ADR-010 / Q8).
  icon: "\u25AD",
  phase: 3,
  // The blanked sentence is the prompt, so the sentence stays visible.
  promptGlyph: "show",

  async generateQuestions(count?: number): Promise<QuizQuestion[]> {
    return quizService.fetchQuestions("cloze", count ?? 10);
  },

  evaluateAnswer(question: QuizQuestion, pinyin: string): AnswerResult {
    const chosen = (pinyin ?? "").trim();
    const answer = question.correctPinyin;
    const correct = chosen === answer;
    const sentence = (question.chinese ?? "").trim();

    return {
      correct,
      userPinyin: chosen,
      userTone: 0,
      correctPinyin: answer,
      correctTone: question.correctTone,
      feedback: correct
        ? sentence
          ? `Correct. ${sentence}`
          : "Correct."
        : `Incorrect. The answer is ${answer}.`,
      toneDescription: "",
    };
  },
};
