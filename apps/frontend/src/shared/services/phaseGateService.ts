/**
 * Phase gate API service
 * Fetches the user's current phase gate status
 */
import { apiClient } from "../api/axiosClient";
import { ROUTE_PATTERNS } from "@mandarin/shared-constants";
import type { PhaseGate } from "@mandarin/shared-types";

export async function fetchPhaseGate(): Promise<PhaseGate> {
  const response = await apiClient.get(ROUTE_PATTERNS.progressionPhaseGate);
  return response.data;
}
