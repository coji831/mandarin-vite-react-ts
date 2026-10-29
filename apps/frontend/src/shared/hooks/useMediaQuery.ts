/**
 * @file shared/hooks/useMediaQuery.ts
 * @description Subscribe to a CSS media query from React. Backs the one place a
 * layout decision genuinely changes BEHAVIOUR rather than paint: the lexical hub
 * sheet is non-modal above 767px and modal at or below it (rework-proposal §0.4),
 * so the component has to know which side of the breakpoint it is on.
 *
 * SSR/test-safe: with no `matchMedia` the hook reports `false`, which is the
 * non-modal (default) branch.
 */
import { useEffect, useState } from "react";

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
    return window.matchMedia(query)?.matches ?? false;
  });

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const list = window.matchMedia(query);
    if (!list) return;
    setMatches(list.matches);

    const handleChange = (event: MediaQueryListEvent) => setMatches(event.matches);
    list.addEventListener("change", handleChange);
    return () => list.removeEventListener("change", handleChange);
  }, [query]);

  return matches;
}
