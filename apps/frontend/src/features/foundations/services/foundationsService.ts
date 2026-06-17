/**
 * @file services/foundationsService.ts
 * @description API service layer for foundations feature
 * Story 18.1: Foundations Page Structure
 */

import { apiClient } from "../../../shared/api/axiosClient";
import { ROUTE_PATTERNS } from "@mandarin/shared-constants";
import type { FoundationProgress, PhaseGate } from "@mandarin/shared-types";

/**
 * Fetch the current user's foundation progress.
 * Auto-initializes 4 records if none exist for this user.
 */
async function getFoundationProgress(): Promise<FoundationProgress[]> {
  const response = await apiClient.get(ROUTE_PATTERNS.progressionFoundationProgress);
  return response.data;
}

/**
 * Fetch the current user's phase gate status.
 * Auto-creates with defaults if none exists.
 */
async function getPhaseGate(): Promise<PhaseGate> {
  const response = await apiClient.get(ROUTE_PATTERNS.progressionPhaseGate);
  return response.data;
}

export const foundationsService = { getFoundationProgress, getPhaseGate };
