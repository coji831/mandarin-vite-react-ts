/**
 * @file services/phoneticClustersService.ts
 * @description API service for phonetic clusters — uses apiClient + ROUTE_PATTERNS
 * Story 21.6: Phonetic Clusters
 *
 * Per frontend-api-client.instructions.md: never import apiClient directly from hooks/components.
 */

import { ROUTE_PATTERNS } from "@mandarin/shared-constants";
import { apiClient } from "shared/api";
import type { PhoneticClusterDetail, PhoneticClustersListResponse } from "../types";

/**
 * Fetch all phonetic clusters, optionally filtered by HSK level.
 * @param hskLevel — optional HSK level to filter by (server-side)
 */
async function getAll(hskLevel?: number): Promise<PhoneticClusterDetail[]> {
  const params: Record<string, string | number> = {};
  if (hskLevel !== undefined) {
    params.hskLevel = hskLevel;
  }
  const response = await apiClient.get<PhoneticClustersListResponse>(
    ROUTE_PATTERNS.phoneticClusters,
    { params, timeout: 10000 },
  );
  return response.data.data;
}

/**
 * Fetch a single phonetic cluster by ID.
 */
async function getById(id: string): Promise<PhoneticClusterDetail> {
  const response = await apiClient.get<{ data: PhoneticClusterDetail }>(
    ROUTE_PATTERNS.phoneticClustersById(id),
    { timeout: 10000 },
  );
  return response.data.data;
}

export const phoneticClustersService = {
  getAll,
  getById,
};
