/**
 * useSearchParamState — typed, validated search-param ↔ URL sync hook.
 *
 * Story 22.4 follow-up (Issue 4): one convention for reading/writing a URL
 * search param so pages stay URL-agnostic and sibling params are never
 * clobbered:
 *   - `value = parse(searchParams.get(key)) ?? defaultValue`
 *   - writes use the *functional* `setSearchParams(prev => …)` updater so
 *     sibling params survive
 *   - omit-when-default keeps canonical shareable URLs
 *   - `replace: true` by default (tab/view/filter changes don't pollute the
 *     back stack — Back exits the page); pass `replace: false` for session
 *     starts
 *   - `debounceMs` applies to writes only (free-text params, per
 *     frontend-input-handling)
 *
 * Story 22.5: also exports `useSearchParamsBatch()` — an atomic multi-param
 * writer for a single logical event that changes several params at once
 * (e.g. tab + page reset). React Router's functional `setSearchParams`
 * baseline is the *rendered* search, so N separate same-tick writes clobber
 * each other; the batch does ONE write. `replaceParams` → replace (sub-state,
 * Back exits page); `pushParams` → push (session starts).
 */
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useSearchParams, type SetURLSearchParams } from "react-router-dom";
import { buildSearchParams, type SearchParamInput } from "shared/constants";

export type UseSearchParamStateOptions<T> = {
  /** Value when the param is absent. Also the omit-from-URL baseline. */
  defaultValue: T;
  /** Coerce the raw string → T. Return null to fall back to defaultValue. */
  parse?: (raw: string | null) => T | null;
  /** Serialize T → URL string. Defaults to String(value). */
  serialize?: (value: T) => string;
  /** replace (default true) vs push. */
  replace?: boolean;
  /** Omit the param when value === defaultValue. Default true. */
  omitWhenDefault?: boolean;
  /** Debounce setValue writes (free-text params only). */
  debounceMs?: number;
};

export type SetSearchParamState<T> = (next: T | ((prev: T) => T)) => void;

/**
 * Single atomic functional URL writer shared by `useSearchParamState` and
 * `useSearchParamsBatch` — one code path for every sub-state write. Builds the
 * next search from the *current* search (functional updater) so sibling
 * params survive, then applies the history action.
 */
function writeSearchParams(
  setSearchParams: SetURLSearchParams,
  updates: SearchParamInput,
  replace: boolean,
): void {
  setSearchParams((current) => buildSearchParams(current, updates), { replace });
}

export type SearchParamsBatch = {
  /** Atomic multi-param write with `replace: true` (sub-state — Back exits page). */
  replaceParams: (updates: SearchParamInput) => void;
  /** Atomic multi-param write with `push` (session starts keep a back entry). */
  pushParams: (updates: SearchParamInput) => void;
};

/**
 * Atomic multi-param URL writer (Story 22.5). One logical event that changes
 * several params at once should be a SINGLE navigation — otherwise React
 * Router's same-tick stale baseline clobbers sibling writes. Both functions
 * merge onto the current search (functional updater) and differ only in the
 * history action.
 */
export function useSearchParamsBatch(): SearchParamsBatch {
  const [, setSearchParams] = useSearchParams();

  const replaceParams = useCallback<SearchParamsBatch["replaceParams"]>(
    (updates) => writeSearchParams(setSearchParams, updates, true),
    [setSearchParams],
  );

  const pushParams = useCallback<SearchParamsBatch["pushParams"]>(
    (updates) => writeSearchParams(setSearchParams, updates, false),
    [setSearchParams],
  );

  return { replaceParams, pushParams };
}

export function useSearchParamState<T>(
  key: string,
  options: UseSearchParamStateOptions<T>,
): [T, SetSearchParamState<T>] {
  const {
    defaultValue,
    parse,
    serialize = (value: T) => String(value),
    replace = true,
    omitWhenDefault = true,
    debounceMs,
  } = options;

  const [searchParams, setSearchParams] = useSearchParams();

  // Validation always runs: an invalid param degrades to defaultValue, never crashes.
  const value = useMemo<T>(() => {
    const raw = searchParams.get(key);
    if (raw === null) return defaultValue;
    if (parse) return parse(raw) ?? defaultValue;
    return raw as unknown as T;
  }, [searchParams, key, defaultValue, parse]);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear any pending debounced write on unmount.
  useEffect(
    () => () => {
      if (debounceRef.current !== null) clearTimeout(debounceRef.current);
    },
    [],
  );

  const setValue = useCallback<SetSearchParamState<T>>(
    (next) => {
      const resolved = typeof next === "function" ? (next as (prev: T) => T)(value) : next;
      const shouldOmit = omitWhenDefault && resolved === defaultValue;

      const write = () => {
        // Shared writer: omit-on-default is expressed as a `null` update
        // (buildSearchParams drops null), preserving sibling params.
        const updates = (shouldOmit
          ? { [key]: null }
          : { [key]: serialize(resolved) }) as SearchParamInput;
        writeSearchParams(setSearchParams, updates, replace);
      };

      if (debounceMs !== undefined) {
        if (debounceRef.current !== null) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(write, debounceMs);
      } else {
        write();
      }
    },
    [key, defaultValue, serialize, replace, omitWhenDefault, debounceMs, value, setSearchParams],
  );

  return [value, setValue];
}
