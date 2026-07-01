/**
 * @file services/foundationsService.ts
 * @description API service layer for foundations feature
 * Story 18.1: Foundations Page Structure
 * Story 18.6: Audio-to-Type Quiz — moved data to backend API
 *
 * Cache: Module-level variables shared across all consumers (PinyinTab, TonesTab, etc.).
 * Data is fetched once and reused — eliminates duplicate fetches when switching tabs.
 */

import { apiClient } from "shared/api";
import { ROUTE_PATTERNS } from "@mandarin/shared-constants";
import type { FoundationProgress, PhaseGate } from "@mandarin/shared-types";
import type { PinyinTonesPool } from "../types/pool";
import type { StrokeData } from "../types";

// ─── Module-level cache ────────────────────────────────────────────────
let cachedPool: PinyinTonesPool | null = null;
let cachedCharMap: Record<string, string> | null = null;
let cachedStrokeData: StrokeData | null = null;

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
 * Cached module-level so PinyinTab and TonesTab share same data.
 */
async function getPinyinTonesPool(): Promise<PinyinTonesPool> {
  if (cachedPool) return cachedPool;
  const response = await apiClient.get(ROUTE_PATTERNS.foundationsPinyinTones);
  const data: PinyinTonesPool = response.data;
  cachedPool = data;
  return data;
}

/**
 * Fetch the pinyin-to-character mapping.
 * Used for TTS audio lookup without per-click API calls.
 * Cached module-level so PinyinTab and TonesTab share same map.
 */
async function getPinyinCharacterMap(): Promise<Record<string, string>> {
  if (cachedCharMap) return cachedCharMap;
  const response = await apiClient.get(ROUTE_PATTERNS.foundationsPinyinCharacterMap);
  const data: Record<string, string> = response.data;
  cachedCharMap = data;
  return data;
}

/**
 * Fetch the strokes reference data from backend.
 * Story 18.4: Stroke Order Reference & Animations
 * Cached module-level to prevent redundant network requests.
 */
async function getStrokesReference(): Promise<StrokeData> {
  if (cachedStrokeData) return cachedStrokeData;
  const response = await apiClient.get(ROUTE_PATTERNS.foundationsStrokes);
  const data: StrokeData = response.data;
  cachedStrokeData = data;
  return data;
}

export const foundationsService = {
  getFoundationProgress,
  getPhaseGate,
  getPinyinTonesPool,
  getPinyinCharacterMap,
  getStrokesReference,
};
