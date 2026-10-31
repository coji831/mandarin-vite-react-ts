/**
 * SentenceBuildingStrategy.ts — Q7 `sentence-building` (Epic 26 §26.3.3 / §26.4.1).
 *
 * Thin proxy over the backend read path. The answer is the ordered tokens joined
 * by a single ASCII space on BOTH sides of the comparison (§26.4.2), so a
 * re-ordered sentence is wrong and a re-spaced one is still right.
 */
import type { QuizStrategy, QuizQuestion, AnswerResult } from "../../types";
import { quizService } from "../../services/quizService";

/** Collapse runs of whitespace to one space and trim — the wire convention. */
function canonicalOrder(value: string): string {
  return (value ?? "").trim().split(/\s+/).filter(Boolean).join(" ");
}

export const sentenceBuildingStrategy: QuizStrategy = {
  type: "sentence-building",
  label: "Sentence Building",
  icon: "\u21C4",
  phase: 3,
  // The gloss is the clue; the sentence itself is what the learner assembles.
  promptGlyph: "show",

  async generateQuestions(count?: number): Promise<QuizQuestion[]> {
    return quizService.fetchQuestions("sentence-building", count ?? 10);
  },

  evaluateAnswer(question: QuizQuestion, pinyin: string): AnswerResult {
    const chosen = canonicalOrder(pinyin);
    const answer = canonicalOrder(question.correctPinyin);
    const correct = chosen === answer;

    return {
      correct,
      userPinyin: chosen,
      userTone: 0,
      correctPinyin: answer,
      correctTone: question.correctTone,
      feedback: correct ? "Correct." : `Incorrect. The correct order is ${answer}.`,
      toneDescription: "",
    };
  },
};
