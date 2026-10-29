/**
 * @file components/blueprint/blueprintSteps.ts
 * @description The Blueprint's step registry — week 1 as ONE sequential task
 * (rework-proposal §3), not a 409-cell reference with five sibling tabs.
 *
 * Order (ratified): initials → finals → 4 tones → tone pairs → stroke order →
 * first radicals → first 20 characters. Steps 1–4 are Phase 1 proper (pinyin);
 * steps 5–7 are the Phase 1 → Phase 2 seam and run strokes → radicals →
 * characters, because the roadmap opens Phase 2 with "Radicals First, Characters
 * Second" (docs/knowledge-base/learning-theory/adult-mandarin-learning-roadmap.md).
 * Radicals are therefore never last, and they never precede pinyin.
 *
 * Every step names the reference view it summarises — the dense 409-cell index
 * survives one ghost link away (`/learn/foundations/reference`).
 */

export type BlueprintStepId =
  "initials" | "finals" | "tones" | "tone-pairs" | "stroke-order" | "radicals" | "characters";

export type BlueprintStep = {
  id: BlueprintStepId;
  /** Short label for the stepper. */
  label: string;
  /** The step's h1 line — one task per screen. */
  title: string;
  /** What the learner does, in one sentence. */
  description: string;
};

export const BLUEPRINT_STEPS: BlueprintStep[] = [
  {
    id: "initials",
    label: "Initials",
    title: "Start with the initials",
    description: "Tap each initial to hear it. These are the sounds a syllable can begin with.",
  },
  {
    id: "finals",
    label: "Finals",
    title: "Then the finals",
    description: "The vowel part of every syllable — simple, compound, then nasal.",
  },
  {
    id: "tones",
    label: "4 tones",
    title: "The four tones",
    description: "The same syllable changes meaning with its tone. Listen to each contour once.",
  },
  {
    id: "tone-pairs",
    label: "Tone pairs",
    title: "Tones in pairs",
    description: "Real words are tone sequences. These pairs are where sandhi starts.",
  },
  {
    id: "stroke-order",
    label: "Stroke order",
    title: "How strokes are ordered",
    description: "Five basic strokes and the rules that order them — no writing required yet.",
  },
  {
    id: "radicals",
    label: "Radicals",
    title: "Your first radicals",
    description: "Components that carry meaning. Recognise these and characters stop being shapes.",
  },
  {
    id: "characters",
    label: "Characters",
    title: "Your first 20 characters",
    description: "Syllables you already know, wearing their characters.",
  },
];

/** 0-based index of a step id inside the registry (for the stepper). */
export function blueprintStepIndex(id: BlueprintStepId): number {
  return BLUEPRINT_STEPS.findIndex((step) => step.id === id);
}
