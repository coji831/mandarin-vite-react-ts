/**
 * @file characterService.ts
 * @description Consolidated service layer for Character Hub API calls
 *
 * Single file with extracted helpers for consistent API patterns.
 * Covers: character detail, radicals, mnemonic stories.
 */

import { ROUTE_PATTERNS } from "@mandarin/shared-constants";
import { apiClient } from "shared/api";
import type { RadicalData } from "features/radicals/types";

// ─── Types ─────────────────────────────────────────────────────────────────

/** Character detail data returned by GET /v1/characters/:glyph */
export type CharacterDetailResponse = {
  glyph: string;
  traditional: string;
  strokeCount: number;
  hskLevel: number;
  readings: Array<{ pinyin: string; tone: number; type: string; core_meaning: string }>;
  etymology?: string;
  frequencyRank?: number;
  commonWords?: string[];
  radicalIds?: string[];
  definition?: string;
};

/** Response shape from the mnemonics API */
export interface MnemonicResponse {
  id: string;
  characterGlyph: string;
  story: string;
  radicalIds: string[];
  isEdited: boolean;
  isPictograph: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

/**
 * GET request that returns null specifically on 404, throws on other errors.
 * Use for fetches where 404 has semantic meaning (e.g. "no mnemonic yet").
 */
async function fetchOptional<T>(url: string): Promise<T | null> {
  try {
    const res = await apiClient.get(url);
    return res.data as T;
  } catch (error: unknown) {
    const httpError = error as { status?: number };
    if (httpError?.status === 404) return null;
    throw error;
  }
}

// ─── Character Detail ──────────────────────────────────────────────────────

/**
 * Load full character detail (readings, etymology, HSK, etc.) from the backend.
 * Throws on network error or non-2xx response.
 */
export async function loadCharacterData(glyph: string): Promise<CharacterDetailResponse> {
  const response = await apiClient.get<{ data: CharacterDetailResponse }>(
    ROUTE_PATTERNS.charactersByGlyph(glyph),
    { timeout: 10000 },
  );
  return response.data.data ?? response.data;
}

// ─── Radicals ──────────────────────────────────────────────────────────────

/**
 * Load radicals associated with a character from the backend database.
 * Returns empty array if the API call fails (fallback behavior).
 */
export async function loadRadicalsByCharacter(character: string): Promise<RadicalData[]> {
  try {
    const response = await apiClient.get(ROUTE_PATTERNS.radicalsByCharacter(character));
    if (Array.isArray(response.data)) {
      return response.data;
    }
  } catch {
    // Silently fail — caller should fall back to client-side matching
  }
  return [];
}

// ─── Mnemonic ──────────────────────────────────────────────────────────────

/**
 * Fetch a mnemonic story for a character.
 * Returns null if no story exists (404).
 */
export async function getMnemonic(character: string): Promise<MnemonicResponse | null> {
  return fetchOptional<MnemonicResponse>(ROUTE_PATTERNS.mnemonicsByChar(character));
}

/**
 * Generate a new mnemonic story for a character via AI.
 */
export async function generateMnemonic(character: string): Promise<MnemonicResponse> {
  const response = await apiClient.post<MnemonicResponse>(
    ROUTE_PATTERNS.mnemonicsByChar(character),
  );
  return response.data;
}

/**
 * Update an existing mnemonic story for a character.
 */
export async function updateMnemonic(character: string, story: string): Promise<MnemonicResponse> {
  const response = await apiClient.put<MnemonicResponse>(
    ROUTE_PATTERNS.mnemonicsByChar(character),
    { story },
  );
  return response.data;
}

/**
 * Delete a mnemonic story for a character.
 */
export async function deleteMnemonic(character: string): Promise<void> {
  await apiClient.delete(ROUTE_PATTERNS.mnemonicsByChar(character));
}
