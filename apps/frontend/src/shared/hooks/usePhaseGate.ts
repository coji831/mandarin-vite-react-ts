/**
 * @file shared/hooks/usePhaseGate.ts
 * @description Hook for accessing the user's current phase gate
 * Story 18.1: Phase gating infrastructure
 * Story 25-2: identity-scoped — the gate in state is dropped when the identity
 * changes, so an in-flight fetch never renders the previous identity's phase.
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
    // The identity just changed: the gate still in state belongs to the
    // PREVIOUS identity (Story 25-2). Drop it before the new fetch starts so
    // an in-flight request never renders another identity's phase — business
    // rule 3 ("a failed or in-flight gate fetch must not unlock"), the same
    // reason `AuthContext` evicts the localStorage buckets on every transition.
    setPhaseGate(null);
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
