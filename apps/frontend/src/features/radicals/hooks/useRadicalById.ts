/**
 * @file hooks/useRadicalById.ts
 * @description Hook for fetching a single radical by id independently.
 * Story 19.2: Radical Detail Card
 * Story 21.x (visual wave): Powers the RadicalHub self-fetch inside the lexical hub.
 *
 * Follows the same pattern as useWordDetail from word-hub.
 * No frontend cache layer — backend Redis caching is sufficient.
 */

import { useEffect, useState } from "react";
import { radicalsService } from "../services/radicalsService";
import type { RadicalData } from "../types";

export type RadicalByIdResult = {
  data: RadicalData | null;
  isLoading: boolean;
  isError: boolean;
};

export function useRadicalById(id: string | null): RadicalByIdResult {
  const [state, setState] = useState<RadicalByIdResult>({
    data: null,
    isLoading: false,
    isError: false,
  });

  useEffect(() => {
    // null id → no-op (Storybook mode bypasses the self-fetch)
    if (!id) {
      setState({ data: null, isLoading: false, isError: false });
      return;
    }

    let cancelled = false;
    setState({ data: null, isLoading: true, isError: false });

    radicalsService
      .loadRadicalById(id)
      .then((data) => {
        if (cancelled) return;
        setState({ data, isLoading: false, isError: false });
      })
      .catch(() => {
        if (cancelled) return;
        setState({ data: null, isLoading: false, isError: true });
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  return state;
}
