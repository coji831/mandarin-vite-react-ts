/**
 * @file shared/hooks/usePhaseGate.ts
 * @description Hook for accessing the user's current phase gate
 * Story 18.1: Phase gating infrastructure
 */
import { useEffect, useState } from "react";
import { apiClient } from "../api/axiosClient";
import { ROUTE_PATTERNS } from "@mandarin/shared-constants";
import type { PhaseGate } from "@mandarin/shared-types";

export function usePhaseGate() {
  const [phaseGate, setPhaseGate] = useState<PhaseGate | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get(ROUTE_PATTERNS.progressionPhaseGate)
      .then((response) => setPhaseGate(response.data))
      .catch(() => setPhaseGate(null))
      .finally(() => setIsLoading(false));
  }, []);

  return { phaseGate, isLoading };
}
