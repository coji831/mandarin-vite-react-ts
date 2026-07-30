/**
 * @file services/phoneticTreeService.ts
 * @description API service for phonetic tree data (phonetic clusters + character enrichment)
 * Story 21.19: Radical Trees — Phonetic Tree Toggle
 *
 * Uses Phonetic Clusters API (Story 21.6) for cluster membership and
 * Characters Module API (Story 21.10) for character detail (classification).
 */

import { apiClient } from "shared/api";
import { ROUTE_PATTERNS } from "@mandarin/shared-constants";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface PhoneticFamilyMember {
  glyph: string;
  pinyin: string;
  meaning: string;
  hskLevel: number | null;
  /** Enriched from Characters API — null until fetched */
  classification: string | null;
}

export interface PhoneticFamily {
  id: string;
  phoneticPattern: string;
  pinyin: string;
  description: string;
  pronunciationNote: string | null;
  memberCount: number;
  hskLevels: number[];
  members: PhoneticFamilyMember[];
}

// ─── API Functions ─────────────────────────────────────────────────────────

/**
 * Get all phonetic families (from Phonetic Clusters API).
 * Returns basic member data without classification.
 * Response shape: { data: PhoneticClusterDetail[] }
 *
 * NOTE: API members lack `classification` field — it is null until
 * enrichFamilyMembers() is called. Use enrichFamilyMembers() when
 * expanding a family node to populate classification from Characters API.
 */
export async function getPhoneticFamilies(): Promise<PhoneticFamily[]> {
  const response = await apiClient.get(ROUTE_PATTERNS.phoneticClusters, { timeout: 10000 });
  return response.data.data as PhoneticFamily[];
}

/**
 * Enrich a phonetic family's members with classification data from the Characters API.
 * Fetches character detail for each member and merges classification field.
 *
 * @param family - The phonetic family to enrich
 * @returns A new family object with classification filled in on each member
 */
export async function enrichFamilyMembers(family: PhoneticFamily): Promise<PhoneticFamily> {
  const enrichedMembers = await Promise.all(
    family.members.map(async (member) => {
      try {
        // GET /v1/characters/:glyph returns CharacterDetailResponse directly (not wrapped in { data })
        const charResponse = await apiClient.get(ROUTE_PATTERNS.charactersByGlyph(member.glyph), {
          timeout: 10000,
        });
        const charData = charResponse.data as { classification: string | null };
        return {
          ...member,
          classification: charData.classification ?? null,
        };
      } catch {
        // If character detail fails, return member without classification
        return { ...member, classification: null };
      }
    }),
  );

  return { ...family, members: enrichedMembers };
}
