/**
 * ListeningDictationStrategy.ts — Q9 `listening-dictation` (Epic 26 §26.3.4 / §26.4.1).
 *
 * Thin proxy over the backend read path. The transcription is compared with the
 * same canonicalisation the audio→pinyin strategy uses, so `ni3 hao3`, `nǐ hǎo`
 * and `ni hao` all resolve to the same string — tone digits are accepted.
 *
 * The glyph is never part of the prompt (`promptGlyph: "hide"`): it is the answer.
 */
import { normalizePinyinForComparison } from "@mandarin/shared-utils";
import type { QuizStrategy, QuizQuestion, AnswerResult } from "../../types";
import { quizService } from "../../services/quizService";

/**
 * Canonicalise a transcription syllable by syllable.
 *
 * `normalizePinyinForComparison` strips a tone digit only from the END of the
 * string it is given, so it is applied per syllable: `ni3 hao3`, `nǐ hǎo` and
 * `ni hao` all canonicalise to `ni hao`.
 */
function canonicalTranscription(value: string): string {
  return (value ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((syllable) => normalizePinyinForComparison(syllable))
    .join(" ");
}

export const listeningDictationStrategy: QuizStrategy = {
  type: "listening-dictation",
  label: "Listening Dictation",
  icon: "\u266A",
  phase: 2,
  promptGlyph: "hide",

  async generateQuestions(count?: number): Promise<QuizQuestion[]> {
    return quizService.fetchQuestions("listening-dictation", count ?? 10);
  },

  evaluateAnswer(question: QuizQuestion, pinyin: string): AnswerResult {
    const typed = (pinyin ?? "").trim();
    const expected = (question.displayPinyin ?? question.correctPinyin ?? "").trim();
    const correct = canonicalTranscription(typed) === canonicalTranscription(expected);

    return {
      correct,
      userPinyin: typed,
      userTone: 0,
      correctPinyin: question.correctPinyin,
      correctTone: question.correctTone,
      feedback: correct ? `Correct. ${expected}.` : `Incorrect. It was ${expected}.`,
      toneDescription: "",
    };
  },
};
