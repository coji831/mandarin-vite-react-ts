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
    ],
  },
};

export function getPhaseConfig(phaseId: number): PhaseConfig | undefined {
  return PHASE_CONFIGS[phaseId];
}

export function getPhaseQuizzes(phaseId: number): PhaseQuizConfig[] {
  return PHASE_CONFIGS[phaseId]?.quizzes ?? [];
}
