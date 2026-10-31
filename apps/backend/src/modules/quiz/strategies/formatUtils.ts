/**
 * @file apps/backend/src/modules/quiz/strategies/formatUtils.ts
 * @description Deterministic helpers for the four Epic 26 practice formats
 * (`cloze`, `sentence-building`, `listening-dictation`, `tone-judgment`).
 *
 * These generators must be *reproducible*: the same corpus row has to yield the
 * same question, the same option order and the same word-bank order on every
 * call (design.md §26.4). `shuffleArray` is Math.random-backed, so it cannot be
 * used for anything a test asserts on — the helpers here are seeded instead.
 */

import type { QuizStrategy } from "../types/quiz.js";
import { GATE_THRESHOLDS } from "../../../config/gate-thresholds.js";

/**
 * Count / pass-threshold / time-limit defaults shared by the four practice
 * formats.
 *
 * Epic 27 owns the real Phase-1 calibration (90% / 10 questions); until then
 * these formats reuse the closest existing gate constants rather than
 * inventing new numbers in strategy code:
 *   - `questionCount`  ← `GATE_THRESHOLDS.COMPREHENSION_QUESTION_COUNT` (5)
 *   - `passThreshold`  ← `GATE_THRESHOLDS.COMPREHENSION_QUIZ_MIN_SCORE` (0.6)
 *   - `timeLimitMinutes` mirrors `comprehensionQuizStrategy` (10).
 */
export const FORMAT_QUIZ_DEFAULTS: Pick<
  QuizStrategy,
  "questionCount" | "passThreshold" | "timeLimitMinutes"
> = {
  questionCount: GATE_THRESHOLDS.COMPREHENSION_QUESTION_COUNT,
  passThreshold: GATE_THRESHOLDS.COMPREHENSION_QUIZ_MIN_SCORE,
  timeLimitMinutes: 10,
};

/** FNV-1a 32-bit hash — stable across runs, platforms and processes. */
export function stableHash(input: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

/** Mulberry32 PRNG seeded from a string; returns floats in [0, 1). */
function seededRandom(seed: string): () => number {
  let state = stableHash(seed) || 0x9e3779b9;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Deterministic Fisher–Yates shuffle: same items + same seed → same order.
 * Returns a new array; the input is never mutated.
 */
export function seededShuffle<T>(items: readonly T[], seed: string): T[] {
  const random = seededRandom(seed);
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

/** Unicode-aware length (code points, not UTF-16 units). */
export function tokenLength(text: string): number {
  return [...text].length;
}

/** One element of `GrammarExample.segments` (`Json` — validated at read time). */
export interface GrammarSegment {
  text: string;
  pinyin: string;
  gloss: string;
}

/**
 * Read `GrammarExample.segments` (a Prisma `Json` column) as typed segments.
 * Rows that carry no `text` are dropped — a blank segment can neither be the
 * cloze answer nor a word-bank token.
 */
export function parseGrammarSegments(value: unknown): GrammarSegment[] {
  if (!Array.isArray(value)) return [];
  const segments: GrammarSegment[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object") continue;
    const record = entry as Record<string, unknown>;
    const text = typeof record.text === "string" ? record.text.trim() : "";
    if (!text) continue;
    segments.push({
      text,
      pinyin: typeof record.pinyin === "string" ? record.pinyin : "",
      gloss: typeof record.gloss === "string" ? record.gloss : "",
    });
  }
  return segments;
}
