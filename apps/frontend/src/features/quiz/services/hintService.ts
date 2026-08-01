/**
 * hintService.ts
 * Epic 21 (Graded Readers) — Hint system service
 *
 * Provides API calls for fetching phonetic and radical hints
 * for characters in the IME Simulator quiz.
 *
 * Story 21.18: IME Simulator Phonetic Hints
 */

import { apiClient } from "shared/api";
import { ROUTE_PATTERNS } from "@mandarin/shared-constants";
import type { PhoneticHint } from "../types";

export interface RadicalHint {
  glyph: string;
  meaning: string;
}

export interface CharacterDetail {
  glyph: string;
  pinyin: string[];
  meanings: string[];
  strokeCount: number;
  radical: RadicalHint;
  classification: string;
  phoneticComponent: PhoneticHint | null;
  hskLevels: number[];
  frequencyRank: number;
}

/** A single IME candidate character returned by the pinyin search. */
export interface ImeCandidate {
  glyph: string;
  pinyin: string;
  tone: number;
  meaning: string | null;
}

/** Response shape of GET /v1/pinyin/search. */
export interface PinyinSearchResponse {
  query: string;
  totalResults: number;
  page: number;
  pageSize: number;
  results: ImeCandidate[];
}

/**
 * Search characters by pinyin prefix — powers the live IME candidate list.
 * Uses the existing /v1/pinyin/search endpoint (no new endpoint).
 * Returns null on failure so the caller can degrade gracefully.
 */
export async function searchPinyinCandidates(
  q: string,
  pageSize = 30,
): Promise<PinyinSearchResponse | null> {
  try {
    const response = await apiClient.get(ROUTE_PATTERNS.pinyinSearch, {
      params: { q: q.trim(), pageSize },
      timeout: 10000,
    });
    return response.data as PinyinSearchResponse;
  } catch {
    return null;
  }
}

/**
 * Fetch the phonetic component of a character.
 * Returns null if the character has no phonetic component or the API fails.
 */
export async function getPhoneticHint(characterGlyph: string): Promise<PhoneticHint | null> {
  try {
    const response = await apiClient.get(ROUTE_PATTERNS.charactersPhonetic(characterGlyph), {
      timeout: 10000,
    });
    return response.data; // phoneticComponent: { glyph, pinyin, meaning }
  } catch {
    return null; // No phonetic component found
  }
}

/**
 * Fetch radical info for a character.
 * Returns null if the API call fails.
 */
export async function getRadicalHint(characterGlyph: string): Promise<RadicalHint | null> {
  try {
    const response = await apiClient.get(ROUTE_PATTERNS.charactersByGlyph(characterGlyph), {
      timeout: 10000,
    });
    return response.data.radical; // radical: { glyph, meaning }
  } catch {
    return null;
  }
}

/**
 * Fetch full character detail including classification.
 * Returns null if the API call fails.
 */
export async function getCharacterDetail(characterGlyph: string): Promise<CharacterDetail | null> {
  try {
    const response = await apiClient.get(ROUTE_PATTERNS.charactersByGlyph(characterGlyph), {
      timeout: 10000,
    });
    return response.data;
  } catch {
    return null;
  }
}
