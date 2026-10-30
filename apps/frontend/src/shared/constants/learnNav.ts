/**
 * learnNav.ts — Single source of truth for the Learn section navigation.
 *
 * The Learn tabs (Foundations / Radicals / Grammar / Phonetic / Readers /
 * Chengyu) live in the sidebar's "Learn" group (Story 22.4, IA Option A).
 * This module is the one place that defines:
 *   - the ordered list of Learn items (label, icon, route),
 *   - each item's `phase` — SEQUENCING METADATA ONLY.
 *
 * A25 / Story 25-3 — `phase` IS NOT A LOCK (BM-1 §3, BM-1 L6):
 * `business-model.md` §3 ratifies "Learn — all content (foundations → chengyu,
 * all 4 stages) | ✅ browse/demo (no lock)", and L6 ratifies the 4-phase
 * roadmap as "a priority scoring layer, not a lock; phase metadata retained for
 * sequencing" — signals, not walls. Every Learn item is reachable by every
 * visitor; scarcity comes from session-local progress and demo quotas (L5),
 * never from a content wall.
 *
 * NOTHING in the shell may compute a lock, redirect, `aria-disabled`, or
 * `tabIndex={-1}` from `phase`. The only sanctioned uses are sequencing,
 * labels, and readiness messaging — e.g. SideNav's child tooltip
 * (`"Grammar · Phase 2 of 4"`). The derived `LEARN_REQUIRED_PHASE` map was
 * deleted with its last consumers precisely because a surviving export named
 * `REQUIRED` is the re-entry point for the wall this epic removed.
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
  /**
   * Recommended study order (1–4) — METADATA ONLY, never a lock (A25; BM-1 §3,
   * L6). Nothing may derive a wall, redirect, or disabled state from it: it
   * exists for sequencing, labels, and readiness messaging ("Radicals · Phase
   * 2 of 4"). Every item navigates for every visitor.
   */
  phase: number;
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
    phase: 1,
  },
  { id: "radicals", label: "Radicals", icon: "radicals", path: learn_radicals, phase: 2 },
  { id: "grammar", label: "Grammar", icon: "grammar", path: learn_grammar, phase: 2 },
  {
    id: "phonetic",
    label: "Phonetic",
    icon: "audio",
    path: learn_phonetic_clusters,
    phase: 3,
  },
  { id: "readers", label: "Readers", icon: "book", path: learn_readers, phase: 3 },
  { id: "chengyu", label: "Chengyu", icon: "chengyu", path: learn_chengyu, phase: 4 },
];
