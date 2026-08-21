/**
 * @file shared/hooks/usePhaseGate.ts
 * @description Hook for accessing the user's current phase gate
 * Story 18.1: Phase gating infrastructure
 */
import { useEffect, useState } from "react";
import { fetchPhaseGate } from "../services/phaseGateService";
import type { PhaseGate } from "@mandarin/shared-types";

export function usePhaseGate() {
  const [phaseGate, setPhaseGate] = useState<PhaseGate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // The gate is identity-specific: guests get `createGuestPhaseGate()`
  // (`{currentPhase: 1, isGuest: true}` — calibrated Story 24-7), while
  // logged-in users get their persisted gate. Re-fetch whenever the auth
  // identity changes (guest ↔ logged-in, keyed by the access token) so the
  // shell never keeps a stale guest/user gate across login/logout.
  const accessToken = localStorage.getItem("accessToken");

  useEffect(() => {
    let isMounted = true; // Prevent state updates after unmount (React Strict Mode)
    setIsLoading(true);
    fetchPhaseGate()
      .then((gate) => {
        if (isMounted) setPhaseGate(gate);
      })
      .catch(() => {
        if (isMounted) setPhaseGate(null);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [accessToken]);

  return { phaseGate, isLoading };
}
