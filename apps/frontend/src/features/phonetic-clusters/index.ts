/**
 * @file index.ts
 * @description Barrel exports for Phonetic Clusters feature
 * Story 21.6: Phonetic Clusters
 *
 * Only re-exports — no inline definitions.
 */

export { PhoneticClustersContent } from "./components/PhoneticClustersContent";
export { ClusterCard } from "./components/ClusterCard";
export { CharacterChip } from "./components/CharacterChip";
export { usePhoneticClusters } from "./hooks/usePhoneticClusters";
export { phoneticClustersService } from "./services/phoneticClustersService";
export type {
  PhoneticClusterDetail,
  PhoneticClusterMemberDetail,
  PhoneticClustersListResponse,
} from "./types";
