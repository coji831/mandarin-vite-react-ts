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
 */
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";

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
        setSearchParams(
          (current) => {
            const params = new URLSearchParams(current);
            if (shouldOmit) {
              params.delete(key);
            } else {
              params.set(key, serialize(resolved));
            }
            return params;
          },
          { replace },
        );
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
