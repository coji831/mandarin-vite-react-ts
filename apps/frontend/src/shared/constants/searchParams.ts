/**
 * searchParams.ts — Canonical search-param names + URL builder
 *
 * Single source of truth for query-string parameter names used by frontend
 * routes (Story 22.4 follow-up, Issue 4). Route *paths* live in `paths.ts`;
 * this module owns the param *names* plus the tiny `withSearchParams` URL
 * builder used for deep-links and dashboard/quiz/review entry points.
 *
 * Conventions (see Architect proposal, Issue 4):
 *   - kebab-case lowercase, single-word, route-scoped (each route owns its params)
 *   - omit-when-default → canonical shareable URLs (e.g. `/learn/radicals`,
 *     not `/learn/radicals?view=browse`)
 *   - enums validate against a whitelist via `parse`; invalid → default
 *   - transient entity params (`radical`) self-clear with `replace`
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

/**
 * Build a shareable URL with query params, omitting empty/undefined values.
 *
 * @example
 * withSearchParams(practices_quiz, { type: "ime-simulator" }) → "/practices/quiz?type=ime-simulator"
 * withSearchParams(practices_quiz, {}) → "/practices/quiz"
 */
export function withSearchParams(
  path: string,
  params: Partial<Record<SearchParamName, string | number | boolean | null | undefined>>,
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const query = search.toString();
  if (!query) return path;
  return path.includes("?") ? `${path}&${query}` : `${path}?${query}`;
}
