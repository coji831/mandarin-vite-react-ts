/**
 * @file apps/backend/src/modules/phonetic-clusters/repositories/PhoneticClustersRepository.ts
 * @description Repository for PhoneticCluster Prisma queries.
 *
 * Clean Architecture: Repository — abstracts Prisma ORM.
 * Services must never touch Prisma directly.
 */

import { prisma } from "../../../shared/infrastructure/database/client.js";
import type { PhoneticClusterWithMembers } from "../types/phonetic-clusters.js";

/**
 * Repository for phonetic cluster database queries.
 */
export class PhoneticClustersRepository {
  /**
   * Find all phonetic clusters, optionally filtered by HSK level.
   * Ordered by displayOrder ascending.
   *
   * @param hskLevel - Optional HSK level filter
   * @returns Array of clusters with members
   */
  async findAll(hskLevel?: number): Promise<PhoneticClusterWithMembers[]> {
    const whereClause =
      hskLevel !== undefined
        ? {
            members: {
              some: {
                character: {
                  hskLevels: {
                    some: { hskLevel },
                  },
                },
              },
            },
          }
        : undefined;

    const clusters = await prisma.phoneticCluster.findMany({
      where: whereClause,
      orderBy: { displayOrder: "asc" },
      include: {
        component: {
          select: {
            glyph: true,
            meaning: true,
          },
        },
        members: {
          orderBy: { sequenceOrder: "asc" },
          include: {
            character: {
              select: {
                glyph: true,
                definition: true,
                readings: true,
                hskLevel: true,
                hskLevels: {
                  select: { hskLevel: true },
                },
              },
            },
          },
        },
      },
    });

    return clusters as unknown as PhoneticClusterWithMembers[];
  }

  /**
   * Find a single phonetic cluster by ID with all members.
   *
   * @param id - The phonetic cluster ID
   * @returns The cluster with members, or null if not found
   */
  async findById(id: string): Promise<PhoneticClusterWithMembers | null> {
    const cluster = await prisma.phoneticCluster.findUnique({
      where: { id },
      include: {
        component: {
          select: {
            glyph: true,
            meaning: true,
          },
        },
        members: {
          orderBy: { sequenceOrder: "asc" },
          include: {
            character: {
              select: {
                glyph: true,
                definition: true,
                readings: true,
                hskLevel: true,
                hskLevels: {
                  select: { hskLevel: true },
                },
              },
            },
          },
        },
      },
    });

    return cluster as unknown as PhoneticClusterWithMembers | null;
  }
}
