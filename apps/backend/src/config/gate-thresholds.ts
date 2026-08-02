/**
 * @file apps/backend/src/config/gate-thresholds.ts
 * @description Centralized phase gate threshold constants for progression gating.
 * All threshold values live here — no magic numbers in service code.
 * Story 21.9: Phase Gate Calibration
 */

export const GATE_THRESHOLDS = {
  /** Phase 2 → 3: IME Simulator minimum correct answers (out of 25) */
  IME_SIMULATOR_MIN_SCORE: 20, // 80% (was 18 = 70%)

  /** Phase 2 → 3: Minimum characters LEARNED (CharacterProgress) before unlocking Phase 3 */
  CHARACTER_COUNT_MINIMUM: 500,

  /** Phase 3 → 4: Comprehension gate — minimum passage quiz score */
  COMPREHENSION_QUIZ_MIN_SCORE: 0.6, // 60%

  /** Phase 3 → 4: Comprehension gate — minimum known word ratio in passage */
  COMPREHENSION_KNOWN_WORD_RATIO: 0.9, // 90%

  /** Comprehension gate: number of passage questions */
  COMPREHENSION_QUESTION_COUNT: 5,

  /** Qualification quiz: number of questions */
  QUALIFICATION_QUIZ_QUESTION_COUNT: 5,
} as const;
