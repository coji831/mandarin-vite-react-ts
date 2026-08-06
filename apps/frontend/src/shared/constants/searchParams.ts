/**
 * searchParams.ts — Canonical search-param names + URL builders
 *
 * Single source of truth for query-string parameter names used by frontend
 * routes (Story 22.4 follow-up, Issue 4). Route *paths* live in `paths.ts`;
 * this module owns the param *names* plus the URL builders used for
 * deep-links, dashboard/quiz/review entry points, and nav/URL sync
 * (Story 22.5).
 *
 * Conventions (see Architect proposal, Issue 4):
 *   - kebab-case lowercase, single-word, route-scoped (each route owns its params)
 *   - omit-when-default → canonical shareable URLs (e.g. `/learn/radicals`,
 *     not `/learn/radicals?view=browse`)
 *   - enums validate against a whitelist via `parse`; invalid → default
 *   - transient entity params (`radical`) self-clear with `replace`
 *
 * Persistence rule (Story 22.5 — nav/URL sync):
 *   - Params are ROUTE-SCOPED: no cross-route persistence — leaving a route
 *     drops its params (sidebar links land on the canonical bare path).
 *   - Sub-state writes (`tab`/`view`/`mode`/`page`/`q`/`hsk`/`phase`) use
 *     `replace: true` so Back *exits the page* instead of rewinding tabs.
 *   - Session starts (quiz/review/dashboard CTAs) use `push`.
 *   - Same-page sidebar clicks are a no-op that preserves the current
 *     sub-state (see SideNav's same-path guard).
 */

export const SEARCH_PARAMS = {
  tab: "tab",
  view: "view",
  type: "type",
  filter: "filter",
  mode: "mode",
  radical: "radical",
  q: "q",
  hsk: "hsk",
  phase: "phase",
  page: "page",
} as const;

export type SearchParamName = (typeof SEARCH_PARAMS)[keyof typeof SEARCH_PARAMS];

/** Partial map of param name → value. `null`/`undefined`/`""` mean "omit". */
export type SearchParamInput = Partial<
  Record<SearchParamName, string | number | boolean | null | undefined>
>;

export type BuildSearchParamsOptions = {
  /**
   * When true, start from an empty search instead of merging onto `current`.
   * Default false — updates merge onto `current`, preserving sibling params.
   */
  replaceAll?: boolean;
};

/**
 * Pure builder: apply `updates` onto `current` and return a NEW
 * `URLSearchParams`.
 *
 * - `current` is never mutated — pass a fresh `new URLSearchParams()` to
 *   build from scratch.
 * - Merges by default (sibling params survive); `{ replaceAll: true }` drops
 *   everything first.
 * - A `null`/`undefined`/`""` update REMOVES that key from the result —
 *   the "omit-when-default" convention (used for canonical URLs).
 *
 * @example
 * buildSearchParams(new URLSearchParams("?tab=tones&page=2"), { tab: null })
 *   → "?page=2"  (null removes the tab, keeps page)
 */
export function buildSearchParams(
  current: URLSearchParams,
  updates: SearchParamInput | undefined = {},
  opts?: BuildSearchParamsOptions,
): URLSearchParams {
  const search = opts?.replaceAll ? new URLSearchParams() : new URLSearchParams(current);
  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined || value === null || value === "") {
      search.delete(key);
      continue;
    }
    search.set(key, String(value));
  }
  return search;
}

/**
 * Build a shareable URL with query params, omitting empty/undefined values.
 * Delegates to `buildSearchParams` from an empty baseline. `params` is
 * optional so callers can pass a possibly-undefined `defaultParams`.
 *
 * @example
 * withSearchParams(practices_quiz, { type: "ime-simulator" }) → "/practices/quiz?type=ime-simulator"
 * withSearchParams(practices_quiz, {}) → "/practices/quiz"
 */
export function withSearchParams(path: string, params?: SearchParamInput): string {
  const search = buildSearchParams(new URLSearchParams(), params);
  const query = search.toString();
  if (!query) return path;
  return path.includes("?") ? `${path}&${query}` : `${path}?${query}`;
}
