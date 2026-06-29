/**
 * AudioToPinyinAndToneStrategy.ts
 * Phase 1 Gate Quiz — Combined Audio-to-Pinyin-and-Tone strategy
 *
 * Strategy for the Phase 1 gate quiz: user hears audio, types pinyin,
 * and selects tone. BOTH dimensions are evaluated.
 * This replaces the old split AudioToPinyin + AudioToTone strategies.
 *
 * Phase machine: LOADING → QUESTION → INPUT → FEEDBACK → RESULTS
 */

import type { QuizStrategy, QuizQuestion, AnswerResult } from "../../types";
import { quizService } from "../../services/quizService";
import { TONE_DESCRIPTIONS } from "../constants";

export const audioToPinyinAndToneStrategy: QuizStrategy = {
  type: "audio-to-pinyin-tone",
  label: "Audio to Pinyin & Tone",
  icon: "🔊",
  phase: 1,

  async generateQuestions(count?: number): Promise<QuizQuestion[]> {
    return quizService.fetchQuestions("audio-to-pinyin-tone", count ?? 10);
  },

  evaluateAnswer(question: QuizQuestion, pinyin: string, tone: number): AnswerResult {
    const pinyinCorrect = pinyin.trim().toLowerCase() === question.correctPinyin.toLowerCase();
    const toneCorrect = tone === question.correctTone;
    const correct = pinyinCorrect && toneCorrect;
    const toneDescription = TONE_DESCRIPTIONS[question.correctTone] ?? "unknown";

    let feedback: string;
    if (correct) {
      feedback = `Correct! "${question.displayPinyin ?? question.correctPinyin}" (${toneDescription}) — perfect pinyin and tone.`;
    } else {
      const parts: string[] = [];
      if (!pinyinCorrect) parts.push("pinyin");
      if (!toneCorrect) parts.push("tone");
      feedback = `The correct answer was "${question.displayPinyin ?? question.correctPinyin}" (${toneDescription}). ${parts.join(" and ")} ${parts.length > 1 ? "were" : "was"} incorrect.`;
    }

    return {
      correct,
      userPinyin: pinyin,
      userTone: tone,
      correctPinyin: question.correctPinyin,
      correctTone: question.correctTone,
      feedback,
      toneDescription,
    };
  },
};
