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

export interface PhoneticHint {
  glyph: string;
  pinyin: string;
  meaning: string;
}

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

/**
 * Fetch the phonetic component of a character.
 * Returns null if the character has no phonetic component or the API fails.
 */
export async function getPhoneticHint(characterGlyph: string): Promise<PhoneticHint | null> {
  try {
    const response = await apiClient.get(ROUTE_PATTERNS.charactersPhonetic(characterGlyph));
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
    const response = await apiClient.get(ROUTE_PATTERNS.charactersByGlyph(characterGlyph));
    return response.data.radical; // radical: { glyph, meaning }
  } catch {
    return null;
  }
}

/**
 * Fetch full character detail including classification.
 * Returns null if the API call fails.
 */
export async function getCharacterDetail(
  characterGlyph: string,
): Promise<CharacterDetail | null> {
  try {
    const response = await apiClient.get(ROUTE_PATTERNS.charactersByGlyph(characterGlyph));
    return response.data;
  } catch {
    return null;
  }
}
