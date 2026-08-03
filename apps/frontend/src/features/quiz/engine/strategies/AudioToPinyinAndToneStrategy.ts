/**
 * AudioToPinyinAndToneStrategy.ts
 * Phase 1 Gate Quiz — Combined Audio-to-Pinyin-and-Tone strategy
 *
 * Strategy for the Phase 1 gate quiz: user hears audio, types pinyin,
 * and selects tone. BOTH dimensions are evaluated.
 * This replaces the old split AudioToPinyin + AudioToTone strategies.
 *
 * Phase machine: LOADING → QUESTION → INPUT → FEEDBACK → RESULTS
 *
 * Story 21.16: Sandhi-aware scoring — accepts sandhi-compliant tones
 * (e.g., 3→2 in 3-3 sandhi) without penalizing the user.
 */

import type { QuizStrategy, QuizQuestion, AnswerResult } from "../../types";
import { quizService } from "../../services/quizService";
import {
  isSandhiAcceptable,
  normalizePinyinForComparison,
  areTonesEquivalent,
} from "@mandarin/shared-utils";
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
    // Grading parity: the expected pinyin may be digit-suffixed ("ba1") or
    // tone-marked ("bā") while the learner types plain pinyin ("ba"). Canonical
    // compare strips marks + trailing digits on BOTH sides. Phase 3: prefer the
    // typed `expectedPinyin` field, fall back to the wire `correctPinyin`.
    const expectedPinyin = question.expectedPinyin ?? question.correctPinyin;
    const pinyinCorrect =
      normalizePinyinForComparison(pinyin) === normalizePinyinForComparison(expectedPinyin);

    // Sandhi-aware tone evaluation: accept sandhi-compliant tones. Neutral tone
    // is canonically 0 (lexical data may encode 5) — areTonesEquivalent handles 0≡5.
    const sandhiAcceptable = isSandhiAcceptable(
      question.correctTone,
      tone,
      question.isSandhiQuestion,
      question.sandhiRule,
    );
    const toneCorrect = areTonesEquivalent(tone, question.correctTone) || sandhiAcceptable;
    const correct = pinyinCorrect && toneCorrect;
    const toneDescription = TONE_DESCRIPTIONS[question.correctTone] ?? "unknown";

    let feedback: string;
    if (correct) {
      const sandhiNote = sandhiAcceptable
        ? ` (sandhi: tone ${question.correctTone}→${tone} accepted)`
        : "";
      feedback = `Correct! "${question.displayPinyin ?? question.correctPinyin}" (${toneDescription}) — perfect pinyin and tone.${sandhiNote}`;
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
