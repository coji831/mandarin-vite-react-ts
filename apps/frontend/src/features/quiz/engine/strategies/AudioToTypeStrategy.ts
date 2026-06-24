/**
 * AudioToTypeStrategy.ts
 * Phase 1 Gate Quiz — Audio-to-Type strategy
 *
 * Strategy for the Phase 1 gate quiz mode: user hears audio of a word
 * and must type the correct pinyin and select the tone.
 *
 * Phase machine: LOADING → QUESTION → INPUT → FEEDBACK → RESULTS
 */

import type { QuizStrategy, QuizQuestion, AnswerResult } from "../../types";
import { apiClient } from "../../../../shared/api/axiosClient";
import { ROUTE_PATTERNS } from "@mandarin/shared-constants";

/** Tone description helper */
export const TONE_DESCRIPTIONS: Record<number, string> = {
  1: "high level",
  2: "rising",
  3: "low dipping",
  4: "falling",
  0: "neutral",
};

export const audioToTypeStrategy: QuizStrategy = {
  type: "audio-to-type",
  label: "Audio-to-Type",
  icon: "📝",
  phase: 1,
  questionCount: 10,
  passThreshold: 0.8,
  timeLimitMinutes: 2.5,

  async generateQuestions(): Promise<QuizQuestion[]> {
    const response = await apiClient.get(ROUTE_PATTERNS.quizQuestions, {
      params: { type: "audio-to-type", count: this.questionCount },
    });
    return response.data;
  },

  evaluateAnswer(question: QuizQuestion, pinyin: string, tone: number): AnswerResult {
    const pinyinCorrect = pinyin.trim().toLowerCase() === question.correctPinyin.toLowerCase();
    const toneCorrect = tone === question.correctTone;
    const correct = pinyinCorrect && toneCorrect;

    const correctToneDesc = TONE_DESCRIPTIONS[question.correctTone] ?? "unknown";

    let feedback: string;
    if (correct) {
      feedback = `Correct! "${question.displayPinyin ?? question.correctPinyin}" (${correctToneDesc}).`;
    } else if (!pinyinCorrect && !toneCorrect) {
      feedback = `Both pinyin and tone were incorrect. The audio was "${question.displayPinyin ?? question.correctPinyin}" (${correctToneDesc}).`;
    } else if (!pinyinCorrect) {
      feedback = `Pinyin was incorrect. The audio was "${question.displayPinyin ?? question.correctPinyin}" (${correctToneDesc}).`;
    } else {
      feedback = `Tone was incorrect. The audio was "${question.displayPinyin ?? question.correctPinyin}" (${correctToneDesc}).`;
    }

    return {
      correct,
      userPinyin: pinyin,
      userTone: tone,
      correctPinyin: question.correctPinyin,
      correctTone: question.correctTone,
      feedback,
      toneDescription: correctToneDesc,
    };
  },
};
