/**
 * @file services/passageService.ts
 * @description API service for graded readers passages.
 * Story 21.4: Reading UI + LexicalHub Phase 1
 * Story 21.4 Fix: Use ROUTE_PATTERNS from shared-constants (C1).
 * Story 21.5: Added fetchPassageAudio.
 *
 * Follows the service layer pattern: every HTTP request goes through a service file.
 * See frontend-api-client.instructions.md.
 */
import { ROUTE_PATTERNS } from "@mandarin/shared-constants";
import { apiClient } from "shared/api";
import type { PassageSummary, PassageDetailApiResponse, PassageAudioResponse } from "../types";

export async function fetchPassages(hskLevel?: number): Promise<PassageSummary[]> {
  const params = hskLevel !== undefined ? { hskLevel } : {};
  const response = await apiClient.get(ROUTE_PATTERNS.readersPassages, { params, timeout: 10000 });
  // API wraps response in { data: [...] }
  return response.data.data ?? response.data;
}

export async function fetchPassageDetail(id: string): Promise<PassageDetailApiResponse> {
  const response = await apiClient.get(ROUTE_PATTERNS.readersPassageById(id), { timeout: 10000 });
  // API wraps response in { data: { ... } }
  return response.data.data ?? response.data;
}

/** POST /v1/readers/generate — trigger passage generation on demand. */
export async function generatePassage(hskLevel?: number): Promise<{ id: string }> {
  const response = await apiClient.post(
    ROUTE_PATTERNS.readersGenerate,
    hskLevel !== undefined ? { hskLevel } : {},
    { timeout: 30000 },
  );
  return response.data.data ?? response.data;
}

/** POST /v1/readers/passages/:id/audio — fetch TTS audio URLs for a passage. */
export async function fetchPassageAudio(passageId: string): Promise<PassageAudioResponse> {
  const response = await apiClient.post(
    ROUTE_PATTERNS.readersPassageAudioById(passageId),
    {},
    { timeout: 30000 },
  );
  return response.data.data ?? response.data;
}
