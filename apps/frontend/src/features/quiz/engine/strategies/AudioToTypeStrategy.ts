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
  questionCount: 20,
  passThreshold: 0.9,
  timeLimitMinutes: 2.5,

  async generateQuestions(): Promise<QuizQuestion[]> {
    try {
      const response = await apiClient.get(ROUTE_PATTERNS.quizQuestions, {
        params: { type: "audio-to-type", count: 20 },
      });
      return response.data;
    } catch (err) {
      console.warn(
        "[AudioToTypeStrategy] Failed to fetch questions from backend, using fallback:",
        err,
      );
      return generateFallbackQuestions();
    }
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

/** Fallback question pool when backend is unavailable */
function generateFallbackQuestions(): QuizQuestion[] {
  return [
    {
      id: "fb-1",
      audioKey: "mā",
      correctPinyin: "ma",
      correctTone: 1,
      category: "pinyin",
      displayPinyin: "mā",
    },
    {
      id: "fb-2",
      audioKey: "má",
      correctPinyin: "ma",
      correctTone: 2,
      category: "tones",
      displayPinyin: "má",
    },
    {
      id: "fb-3",
      audioKey: "mǎ",
      correctPinyin: "ma",
      correctTone: 3,
      category: "tones",
      displayPinyin: "mǎ",
    },
    {
      id: "fb-4",
      audioKey: "mà",
      correctPinyin: "ma",
      correctTone: 4,
      category: "pinyin",
      displayPinyin: "mà",
    },
    {
      id: "fb-5",
      audioKey: "bō",
      correctPinyin: "bo",
      correctTone: 1,
      category: "pinyin",
      displayPinyin: "bō",
    },
    {
      id: "fb-6",
      audioKey: "pà",
      correctPinyin: "pa",
      correctTone: 4,
      category: "pinyin",
      displayPinyin: "pà",
    },
    {
      id: "fb-7",
      audioKey: "dā",
      correctPinyin: "da",
      correctTone: 1,
      category: "pinyin",
      displayPinyin: "dā",
    },
    {
      id: "fb-8",
      audioKey: "tǐ",
      correctPinyin: "ti",
      correctTone: 3,
      category: "tones",
      displayPinyin: "tǐ",
    },
    {
      id: "fb-9",
      audioKey: "kù",
      correctPinyin: "ku",
      correctTone: 4,
      category: "pinyin",
      displayPinyin: "kù",
    },
    {
      id: "fb-10",
      audioKey: "gē",
      correctPinyin: "ge",
      correctTone: 1,
      category: "pinyin",
      displayPinyin: "gē",
    },
    {
      id: "fb-11",
      audioKey: "hú",
      correctPinyin: "hu",
      correctTone: 2,
      category: "tones",
      displayPinyin: "hú",
    },
    {
      id: "fb-12",
      audioKey: "jī",
      correctPinyin: "ji",
      correctTone: 1,
      category: "pinyin",
      displayPinyin: "jī",
    },
    {
      id: "fb-13",
      audioKey: "qù",
      correctPinyin: "qu",
      correctTone: 4,
      category: "tones",
      displayPinyin: "qù",
    },
    {
      id: "fb-14",
      audioKey: "xū",
      correctPinyin: "xu",
      correctTone: 1,
      category: "pinyin",
      displayPinyin: "xū",
    },
    {
      id: "fb-15",
      audioKey: "zhī",
      correctPinyin: "zhi",
      correctTone: 1,
      category: "pinyin",
      displayPinyin: "zhī",
    },
    {
      id: "fb-16",
      audioKey: "chǐ",
      correctPinyin: "chi",
      correctTone: 3,
      category: "tones",
      displayPinyin: "chǐ",
    },
    {
      id: "fb-17",
      audioKey: "shì",
      correctPinyin: "shi",
      correctTone: 4,
      category: "pinyin",
      displayPinyin: "shì",
    },
    {
      id: "fb-18",
      audioKey: "rì",
      correctPinyin: "ri",
      correctTone: 4,
      category: "pinyin",
      displayPinyin: "rì",
    },
    {
      id: "fb-19",
      audioKey: "zǐ",
      correctPinyin: "zi",
      correctTone: 3,
      category: "tones",
      displayPinyin: "zǐ",
    },
    {
      id: "fb-20",
      audioKey: "ma",
      correctPinyin: "ma",
      correctTone: 0,
      category: "tones",
      displayPinyin: "ma",
    },
  ];
}
