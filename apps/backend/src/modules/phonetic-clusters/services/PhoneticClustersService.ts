/**
 * @file apps/backend/src/modules/phonetic-clusters/services/PhoneticClustersService.ts
 * @description Business logic for phonetic cluster lookups.
 *
 * Clean Architecture: Application Service / Use Case.
 * Maps Prisma data to the PhoneticClusterDetail domain type.
 */

import { createLogger } from "../../../shared/utils/logger.js";
import { PhoneticClustersRepository } from "../repositories/PhoneticClustersRepository.js";
import { PhoneticClusterNotFoundError } from "../types/phonetic-clusters-errors.js";
import type {
  PhoneticClusterDetail,
  PhoneticClusterMemberDetail,
  PhoneticClusterWithMembers,
} from "../types/phonetic-clusters.js";

const logger = createLogger("PhoneticClustersService");

/**
 * Service for phonetic cluster business logic.
 */
export class PhoneticClustersService {
  private readonly repository: PhoneticClustersRepository;

  constructor(repository: PhoneticClustersRepository) {
    this.repository = repository;
    logger.info("Initialized Phonetic Clusters Service");
  }

  /**
   * List all phonetic clusters, optionally filtered by HSK level.
   *
   * @param hskLevel - Optional HSK level filter (1-6)
   * @returns Array of phonetic cluster details
   */
  async listClusters(hskLevel?: number): Promise<PhoneticClusterDetail[]> {
    const clusters = await this.repository.findAll(hskLevel);
    return clusters.map((cluster) => this.mapToDetail(cluster));
  }

  /**
   * Get a single phonetic cluster by ID.
   *
   * @param id - The phonetic cluster ID
   * @returns The cluster detail
   * @throws PhoneticClusterNotFoundError if not found
   */
  async getCluster(id: string): Promise<PhoneticClusterDetail> {
    const cluster = await this.repository.findById(id);

    if (!cluster) {
      throw new PhoneticClusterNotFoundError(id);
    }

    return this.mapToDetail(cluster);
  }

  /**
   * Map a raw Prisma result to the API response shape.
   */
  private mapToDetail(cluster: PhoneticClusterWithMembers): PhoneticClusterDetail {
    const members: PhoneticClusterMemberDetail[] = cluster.members.map((m) => {
      const firstReading =
        Array.isArray(m.character.readings) && m.character.readings.length > 0
          ? (m.character.readings as Array<{ pinyin?: string }>)[0]
          : null;

      return {
        glyph: m.character.glyph,
        pinyin: firstReading?.pinyin ?? "",
        meaning: m.character.definition ?? "",
        hskLevel: m.character.hskLevel,
      };
    });

    // Collect unique HSK levels across all members
    const hskLevelSet = new Set<number>();
    for (const m of cluster.members) {
      for (const hl of m.character.hskLevels) {
        hskLevelSet.add(hl.hskLevel);
      }
    }
    const hskLevels = Array.from(hskLevelSet).sort((a, b) => a - b);

    return {
      id: cluster.id,
      phoneticPattern: cluster.component.glyph,
      pinyin: cluster.phoneticPinyin ?? "",
      description: cluster.description,
      pronunciationNote: cluster.pronunciationNote,
      memberCount: members.length,
      hskLevels,
      members,
    };
  }
}
