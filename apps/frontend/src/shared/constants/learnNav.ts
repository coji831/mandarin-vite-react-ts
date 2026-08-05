/**
 * learnNav.ts — Single source of truth for the Learn section navigation.
 *
 * The Learn tabs (Foundations / Radicals / Grammar / Phonetic / Readers /
 * Chengyu) live in the sidebar's phase-gated "Learn" group (Story 22.4,
 * IA Option A). This module is the one place that defines:
 *   - the ordered list of Learn items (label, icon, route),
 *   - each item's required phase (for lock states and route gating).
 *
 * `LearnLayout` and any future gating surface consume this same constant so
 * lock logic is never duplicated.
 */
import {
  learn_foundations,
  learn_radicals,
  learn_grammar,
  learn_phonetic_clusters,
  learn_readers,
  learn_chengyu,
} from "./paths";

export type LearnNavItem = {
  id: string;
  label: string;
  icon: string;
  path: string;
  requiredPhase: number;
};

export const LEARN_NAV_ITEMS: LearnNavItem[] = [
  {
    id: "foundations",
    label: "Foundations",
    icon: "🔤",
    path: learn_foundations,
    requiredPhase: 1,
  },
  { id: "radicals", label: "Radicals", icon: "📘", path: learn_radicals, requiredPhase: 2 },
  { id: "grammar", label: "Grammar", icon: "📕", path: learn_grammar, requiredPhase: 2 },
  {
    id: "phonetic",
    label: "Phonetic",
    icon: "🔊",
    path: learn_phonetic_clusters,
    requiredPhase: 3,
  },
  { id: "readers", label: "Readers", icon: "📖", path: learn_readers, requiredPhase: 3 },
  { id: "chengyu", label: "Chengyu", icon: "🏮", path: learn_chengyu, requiredPhase: 4 },
];

/**
 * Maps a Learn item id to the phase required to unlock it.
 * A group is locked when `requiredPhase > phaseGate`.
 */
export const LEARN_REQUIRED_PHASE: Record<string, number> = Object.fromEntries(
  LEARN_NAV_ITEMS.map((item) => [item.id, item.requiredPhase]),
);
