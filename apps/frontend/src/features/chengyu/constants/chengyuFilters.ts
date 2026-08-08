/**
 * @file constants/chengyuFilters.ts
 * @description Filter option constants for the Chengyu feature.
 * Story 23.3: Chengyu UI
 *
 * Derived from the seeded idiom dataset (content/seed/phase2/chengyu.json):
 * - `CHENGYU_THEMES` — the 55 theme values. Every idiom carries a UNIQUE theme
 *   (no theme is shared by 2+ idioms), so themes are exposed via the shared
 *   `Dropdown` (55 options) rather than FilterChips (a chip per theme would be
 *   unusable and would select exactly one idiom each).
 * - `CHENGYU_ERAS` — the 7 era values, shown as FilterChips (compact, and eras
 *   have meaningful distributions: Warring States 32, Spring & Autumn 10, …).
 *
 * The backend filters by exact theme/era match (`?theme=` / `?era=`), so these
 * values must equal the seeded values verbatim.
 */

/** All idiom themes (55 — one per idiom). Sorted alphabetically. */
export const CHENGYU_THEMES: string[] = [
  "armchair strategy",
  "blind imitation",
  "borrowed power",
  "caution",
  "complacency",
  "deception",
  "determination",
  "diligence",
  "discipline",
  "distorting truth",
  "do-or-die",
  "empty promise",
  "endurance",
  "erudition",
  "excellence",
  "experience",
  "finishing touch",
  "groundless worry",
  "humility",
  "hypocrisy",
  "inadequacy",
  "indirect strategy",
  "inflexibility",
  "integrity",
  "interdependence",
  "isolation",
  "losing identity",
  "misguided persistence",
  "missing the point",
  "momentum",
  "mutual harm",
  "narrow-mindedness",
  "perseverance",
  "pretension",
  "propriety",
  "reconciliation",
  "remedy",
  "responsibility",
  "review",
  "rigidity",
  "rumor",
  "self-contradiction",
  "self-deception",
  "self-defeating direction",
  "self-defeating excess",
  "self-recommendation",
  "sincerity",
  "standing out",
  "surprise success",
  "trauma",
  "trustworthiness",
  "vigilance",
  "wasted effort",
  "wishful thinking",
  "wrong approach",
];

/** All idiom eras (7). Sorted alphabetically. */
export const CHENGYU_ERAS: string[] = [
  "Han",
  "Qin",
  "Qin–Han transition",
  "Spring & Autumn",
  "Three Kingdoms",
  "Warring States",
  "Wei–Jin",
];

/**
 * Default page size for the idiom list — matches the Story 23.2 backend
 * default (`pageSize` 1–100, default 20). The chengyu UI keeps the backend
 * default so pagination controls only appear once the list exceeds one page.
 */
export const CHENGYU_PAGE_SIZE = 20;
