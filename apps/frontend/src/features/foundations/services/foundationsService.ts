/**
 * @file services/foundationsService.ts
 * @description API service layer for foundations feature
 * Story 18.1: Foundations Page Structure
 * Story 18.6: Audio-to-Type Quiz — moved data to backend API
 */

import { apiClient } from "../../../shared/api/axiosClient";
import { ROUTE_PATTERNS } from "@mandarin/shared-constants";
import type { FoundationProgress, PhaseGate } from "@mandarin/shared-types";
import type { PinyinTonesPool } from "../types/pool";

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

/**
 * Fetch the pinyin-tones reference data pool from backend.
 * Story 18.6: Moved from static JSON to backend API.
 */
async function getPinyinTonesPool(): Promise<PinyinTonesPool> {
  const response = await apiClient.get(ROUTE_PATTERNS.foundationsPinyinTones);
  return response.data;
}

export const foundationsService = { getFoundationProgress, getPhaseGate, getPinyinTonesPool };
