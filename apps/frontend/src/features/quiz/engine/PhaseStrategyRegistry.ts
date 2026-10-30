/**
 * PhaseStrategyRegistry.ts
 * Phase 1 Gate Quiz — Phase → strategy configuration registry
 *
 * Maps phase IDs to their review, quiz, and practice configurations.
 * Used by PracticesPage to render phase-appropriate action buttons.
 *
 * All numeric config (passThreshold, tierRules, questionCount, timeLimitMinutes)
 * comes from the backend at runtime — not hardcoded here.
 */

/**
 * Configuration for a phase's review section.
 * @property itemTypes - Backend item type strings (e.g., "pinyin-syllable", "radical").
 * @property strategies - Frontend strategy registry keys (e.g., "pinyin", "tone", "character-radical").
 */
export interface PhaseReviewConfig {
  itemTypes: string[];
  strategies: string[];
}

export interface PhaseQuizConfig {
  strategies: string[];
  contentScope: string[];
  quizType: string;
  /**
   * Difficulty tier within a format. Absent means 1.
   * Phase 4 re-runs the Phase-2 formats at tier 2, which is what makes its
   * `quizzes` payload distinct rather than a duplicate of phase 2's.
   */
  tier?: number;
}

export interface PhaseConfig {
  phaseId: number;
  label: string;
  review: PhaseReviewConfig;
  quizzes: PhaseQuizConfig[];
}

export const PHASE_CONFIGS: Record<number, PhaseConfig> = {
  1: {
    phaseId: 1,
    label: "The Blueprint",
    review: {
      itemTypes: ["pinyin-syllable", "tone-syllable"],
      strategies: ["pinyin", "tone"],
    },
    quizzes: [
      {
        strategies: ["audio-to-pinyin-tone"],
        contentScope: ["pinyin", "tone"],
        quizType: "audio-to-pinyin-tone",
      },
      {
        strategies: ["tone-judgment"],
        contentScope: ["tone"],
        quizType: "tone-judgment",
      },
    ],
  },
  2: {
    phaseId: 2,
    label: "The Core 300",
    review: {
      itemTypes: ["radical", "character-radical"],
      strategies: ["radical", "character-radical"],
    },
    quizzes: [
      {
        strategies: ["ime-simulator"],
        contentScope: ["character"],
        quizType: "ime-simulator",
      },
      {
        strategies: ["radical-gate"],
        contentScope: ["radical"],
        quizType: "radical-gate",
      },
      {
        strategies: ["listening-dictation"],
        contentScope: ["character"],
        quizType: "listening-dictation",
      },
    ],
  },
  3: {
    phaseId: 3,
    label: "The Network",
    review: {
      itemTypes: [],
      strategies: [],
    },
    quizzes: [
      {
        strategies: ["cloze"],
        contentScope: ["grammar", "character"],
        quizType: "cloze",
      },
      {
        strategies: ["sentence-building"],
        contentScope: ["grammar"],
        quizType: "sentence-building",
      },
    ],
  },
  4: {
    phaseId: 4,
    label: "Advanced Fluidity",
    review: {
      itemTypes: [],
      strategies: [],
    },
    quizzes: [
      {
        strategies: ["ime-simulator"],
        contentScope: ["character"],
        quizType: "ime-simulator",
        tier: 2,
      },
      {
        strategies: ["radical-gate"],
        contentScope: ["radical"],
        quizType: "radical-gate",
        tier: 2,
      },
    ],
  },
};

export function getPhaseConfig(phaseId: number): PhaseConfig | undefined {
  return PHASE_CONFIGS[phaseId];
}

export function getPhaseQuizzes(phaseId: number): PhaseQuizConfig[] {
  return PHASE_CONFIGS[phaseId]?.quizzes ?? [];
}

/** A quiz config flattened with its owning phase, for the Practices card. */
export interface PhaseQuizEntry extends PhaseQuizConfig {
  phase: number;
  tier: number;
}

/**
 * Every quiz a learner may sit at their current phase: all phases <= current,
 * in phase order then config order. A passed phase keeps its quizzes listed —
 * optional practice, not a lock.
 */
export function getQuizzesUpToPhase(currentPhase: number): PhaseQuizEntry[] {
  return [1, 2, 3, 4]
    .filter((phase) => phase <= currentPhase)
    .flatMap((phase) =>
      getPhaseQuizzes(phase).map((quiz) => ({
        ...quiz,
        phase,
        tier: quiz.tier ?? 1,
      })),
    );
}
