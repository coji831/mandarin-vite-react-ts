import { useState, useEffect } from "react";
import { fetchExamples, getCacheKey, Example } from "../../../services/examplesApi";

type UseExamplesReturn = {
  data: Example[] | undefined;
  isLoading: boolean;
  error: Error | null;
  cacheHit: boolean;
};

// In-memory dedupe for concurrent requests (module-level)
const inFlightPromises = new Map<string, Promise<Example[]>>();

// Exposed for tests to clear module-level in-flight promises between test cases
export function _clearInFlightPromisesForTests(): void {
  inFlightPromises.clear();
}

export default function useExamples(
  word?: string,
  hskLevel?: number,
  language: string = "en",
): UseExamplesReturn {
  const [data, setData] = useState<Example[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [cacheHit, setCacheHit] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (!word || typeof hskLevel === "undefined" || hskLevel === null) return;

    const run = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const cacheKey = await getCacheKey(word, hskLevel, language);
        const sessionKey = `examples_${cacheKey}`;

        const cached = sessionStorage.getItem(sessionKey);
        if (cached) {
          const parsed: Example[] = JSON.parse(cached);
          if (!mounted) return;
          setData(parsed);
          setCacheHit(true);
          setIsLoading(false);
          return;
        }

        let promise = inFlightPromises.get(cacheKey);
        if (!promise) {
          promise = fetchExamples(word, hskLevel, language);
          inFlightPromises.set(cacheKey, promise);
          // remove in-flight dedupe after 60s
          setTimeout(() => inFlightPromises.delete(cacheKey), 60_000);
        }

        const result = await promise;
        if (!mounted) return;
        try {
          sessionStorage.setItem(sessionKey, JSON.stringify(result));
        } catch (e) {
          // ignore storage issues
        }
        setData(result);
        setCacheHit(false);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    run();

    return () => {
      mounted = false;
    };
  }, [word, hskLevel, language]);

  return { data, isLoading, error, cacheHit };
}
