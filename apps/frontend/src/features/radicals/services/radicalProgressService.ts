/**
 * @file services/radicalProgressService.ts
 * @description API service for radical progress tracking
 * Story 19.4: Radical Trees (Phase 3)
 *
 * Fetches user's memorized radical data from the backend progression API.
 * Follows patterns from foundationsService.ts (apiClient + module-level cache).
 */

import { apiClient } from "../../../shared/api/axiosClient";
import { ROUTE_PATTERNS } from "@mandarin/shared-constants";

export interface RadicalProgressItem {
  id: string;
  userId: string;
  radicalId: string;
  memorized: boolean;
  recognitionLevel: number;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Fetch all radical progress records for the current user.
 */
async function getRadicalProgress(): Promise<RadicalProgressItem[]> {
  const response = await apiClient.get(ROUTE_PATTERNS.progressionRadicalProgress);
  return response.data;
}

export const radicalProgressService = {
  getRadicalProgress,
};
