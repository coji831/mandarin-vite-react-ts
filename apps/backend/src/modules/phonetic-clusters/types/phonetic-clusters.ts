/**
 * @file apps/backend/src/modules/phonetic-clusters/types/phonetic-clusters.ts
 * @description Type definitions for the Phonetic Clusters module.
 *
 * Clean Architecture: Domain types (entities, value objects).
 */

/**
 * A phonetic cluster member character with detail fields.
 */
export interface PhoneticClusterMemberDetail {
  glyph: string;
  pinyin: string;
  meaning: string;
  hskLevel: number | null;
}

/**
 * Full phonetic cluster detail returned by the API.
 */
export interface PhoneticClusterDetail {
  id: string;
  phoneticPattern: string;
  pinyin: string;
  description: string;
  pronunciationNote: string | null;
  memberCount: number;
  hskLevels: number[];
  members: PhoneticClusterMemberDetail[];
}

/**
 * Raw Prisma result shape for a phonetic cluster with includes.
 */
export interface PhoneticClusterWithMembers {
  id: string;
  componentId: string;
  displayOrder: number;
  description: string;
  pronunciationNote: string | null;
  phoneticPinyin: string | null;
  component: {
    glyph: string;
    meaning: string | null;
  };
  members: Array<{
    character: {
      glyph: string;
      definition: string | null;
      readings: Array<{ pinyin?: string }>;
      hskLevel: number | null;
      hskLevels: Array<{ hskLevel: number }>;
    };
    sequenceOrder: number;
  }>;
}
