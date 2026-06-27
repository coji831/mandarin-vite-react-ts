/**
 * Phase gate API service
 * Fetches the user's current phase gate status
 * Caches to localStorage so phase gate persists when backend is unavailable.
 */
import { apiClient } from "../api/axiosClient";
import { ROUTE_PATTERNS } from "@mandarin/shared-constants";
import type { PhaseGate } from "@mandarin/shared-types";

const CACHE_KEY = "phaseGate";

export async function fetchPhaseGate(): Promise<PhaseGate> {
  try {
    const response = await apiClient.get(ROUTE_PATTERNS.progressionPhaseGate);
    const data = response.data as PhaseGate;
    // Cache successfully fetched phase gate
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    return data;
  } catch {
    // Backend unavailable — try localStorage cache
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      return JSON.parse(cached) as PhaseGate;
    }
    throw new Error("Phase gate unavailable");
  }
}
