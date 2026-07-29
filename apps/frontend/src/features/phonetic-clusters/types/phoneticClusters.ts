/**
 * @file types/phoneticClusters.ts
 * @description Type definitions for the Phonetic Clusters feature
 * Story 21.6: Phonetic Clusters
 */

export interface PhoneticClusterMemberDetail {
  glyph: string;
  pinyin: string;
  meaning: string;
  hskLevel: number | null;
}

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

export interface PhoneticClustersListResponse {
  data: PhoneticClusterDetail[];
}
