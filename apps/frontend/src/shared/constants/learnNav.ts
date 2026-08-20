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
 *
 * Story 22.5: each item may carry optional `defaultParams` for its landing
 * URL (see SideNav — `to = withSearchParams(path, defaultParams)`).
 */
import {
  learn_foundations,
  learn_radicals,
  learn_grammar,
  learn_phonetic_clusters,
  learn_readers,
  learn_chengyu,
} from "./paths";
import type { SearchParamInput } from "./searchParams";
import type { IconName } from "shared/components";

export type LearnNavItem = {
  id: string;
  label: string;
  /** Sanctioned icon name (ADR-010 / Q8) — rendered via the shared Icon component. */
  icon: IconName;
  path: string;
  requiredPhase: number;
  /**
   * Optional default query params for the item's landing URL.
   *
   * The bare canonical path is the landing rule — NO values today (leaving
   * this undefined is correct). When set in the future, SideNav builds
   * `to = withSearchParams(path, defaultParams)` and the same-path guard
   * becomes: no-op only if the full current URL already equals `to`, else
   * replace-to-`to` (canonical landing).
   */
  defaultParams?: SearchParamInput;
};

export const LEARN_NAV_ITEMS: LearnNavItem[] = [
  {
    id: "foundations",
    label: "Foundations",
    icon: "letters",
    path: learn_foundations,
    requiredPhase: 1,
  },
  { id: "radicals", label: "Radicals", icon: "radicals", path: learn_radicals, requiredPhase: 2 },
  { id: "grammar", label: "Grammar", icon: "grammar", path: learn_grammar, requiredPhase: 2 },
  {
    id: "phonetic",
    label: "Phonetic",
    icon: "audio",
    path: learn_phonetic_clusters,
    requiredPhase: 3,
  },
  { id: "readers", label: "Readers", icon: "book", path: learn_readers, requiredPhase: 3 },
  { id: "chengyu", label: "Chengyu", icon: "chengyu", path: learn_chengyu, requiredPhase: 4 },
];

/**
 * Maps a Learn item id to the phase required to unlock it.
 * A group is locked when `requiredPhase > phaseGate`.
 */
export const LEARN_REQUIRED_PHASE: Record<string, number> = Object.fromEntries(
  LEARN_NAV_ITEMS.map((item) => [item.id, item.requiredPhase]),
);
