/**
 * Phase gate API service
 * Fetches the user's current phase gate status
 * Caches to localStorage so phase gate persists when backend is unavailable.
 */
import { apiClient } from "../api/axiosClient";
import { ROUTE_PATTERNS } from "@mandarin/shared-constants";
import type { PhaseGate } from "@mandarin/shared-types";

/**
 * Single cache key, auth-keyed (calibrated identity lockstep — Story 24-7).
 * The guest gate (`createGuestPhaseGate` → `{currentPhase: 1, isGuest: true}`)
 * and a logged-in user's persisted gate differ, so the localStorage fallback
 * must never serve one identity's gate to the other. Guest vs logged-in
 * buckets are separate; `usePhaseGate` re-fetches on auth change and overwrites
 * the correct bucket on every successful fetch.
 */
function phaseGateCacheKey(): string {
  return localStorage.getItem("accessToken") ? "phaseGate:user" : "phaseGate:guest";
}

export async function fetchPhaseGate(): Promise<PhaseGate> {
  try {
    const response = await apiClient.get(ROUTE_PATTERNS.progressionPhaseGate);
    const data = response.data as PhaseGate;
    // Cache successfully fetched phase gate (auth-keyed — never cross-identity)
    localStorage.setItem(phaseGateCacheKey(), JSON.stringify(data));
    return data;
  } catch {
    // Backend unavailable — try the localStorage cache for THIS identity
    const cached = localStorage.getItem(phaseGateCacheKey());
    if (cached) {
      return JSON.parse(cached) as PhaseGate;
    }
    throw new Error("Phase gate unavailable");
  }
}
