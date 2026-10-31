/**
 * ToneJudgmentStrategy.ts — Q10 `tone-judgment` (Epic 26 §26.3.5 / §26.4.1).
 *
 * A DISTINCT Phase-1 format, not an `audio-to-tone` sub-mode: the stimulus is
 * WRITTEN (no audio at all), the learner states the SURFACE tone of one marked
 * syllable, so the exercise tests the sandhi rule rather than the ear.
 *
 * Answer encoding (§26.4.2): `pinyinInput` = the judged syllable,
 * `selectedTone` = the chosen tone 0–4 (a real value, not the `0` sentinel — the
 * discriminator is `category`/`quizType`).
 */
import type { QuizStrategy, QuizQuestion, AnswerResult } from "../../types";
import { quizService } from "../../services/quizService";
import { TONE_DESCRIPTIONS } from "../constants";

export const toneJudgmentStrategy: QuizStrategy = {
  type: "tone-judgment",
  label: "Tone Judgment",
  icon: "\u00AF",
  phase: 1,
  // The written phrase IS the prompt — there is no audio to listen to.
  promptGlyph: "show",

  async generateQuestions(count?: number): Promise<QuizQuestion[]> {
    return quizService.fetchQuestions("tone-judgment", count ?? 10);
  },

  evaluateAnswer(question: QuizQuestion, pinyin: string, tone: number): AnswerResult {
    const judged = (pinyin ?? "").trim() || (question.targetSyllable ?? question.correctPinyin);
    const correct = tone === question.correctTone;
    const description = TONE_DESCRIPTIONS[question.correctTone] ?? "unknown";

    return {
      correct,
      userPinyin: judged,
      userTone: tone,
      correctPinyin: question.correctPinyin,
      correctTone: question.correctTone,
      feedback: correct
        ? `Correct. A ${description} tone.`
        : `Incorrect. It is a ${description} tone.`,
      toneDescription: description,
    };
  },
};
