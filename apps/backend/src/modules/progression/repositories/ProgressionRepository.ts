/**
 * @file apps/backend/src/modules/progression/repositories/ProgressionRepository.js
 * @description Prisma-based data access for foundation progress and phase gate records
 * Stories: 18.1 (Foundations Page Structure)
 *
 * Clean Architecture: Infrastructure Layer - Data Access
 */

import { prisma } from "../../../shared/infrastructure/database/client.js";
import type { FoundationProgress, PhaseGate, RadicalProgress, Prisma } from "@prisma/client";

export class ProgressionRepository {
  /**
   * Find all foundation progress records for a user.
   */
  async findFoundationProgressByUser(userId: string): Promise<FoundationProgress[]> {
    return prisma.foundationProgress.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });
  }

  /**
   * Create a foundation progress record.
   */
  async createFoundationProgress({
    userId,
    sectionId,
    completed,
  }: {
    userId: string;
    sectionId: string;
    completed: boolean;
  }): Promise<FoundationProgress> {
    return prisma.foundationProgress.create({
      data: {
        userId,
        sectionId,
        completed,
      },
    });
  }

  /**
   * Find phase gate for a user.
   */
  async findPhaseGateByUser(userId: string): Promise<PhaseGate | null> {
    return prisma.phaseGate.findUnique({
      where: { userId },
    });
  }

  /**
   * Create a phase gate record.
   */
  async createPhaseGate({
    userId,
    currentPhase,
    phase1Passed,
    phase2Passed,
    phase3Passed,
    phase4Unlocked,
    gateCriteria,
  }: {
    userId: string;
    currentPhase: number;
    phase1Passed: boolean;
    phase2Passed: boolean;
    phase3Passed: boolean;
    phase4Unlocked: boolean;
    gateCriteria: string | null;
  }): Promise<PhaseGate> {
    return prisma.phaseGate.create({
      data: {
        userId,
        currentPhase,
        phase1Passed,
        phase2Passed,
        phase3Passed,
        phase4Unlocked,
        gateCriteria,
      },
    });
  }

  /**
   * Upsert a foundation progress record (create or update).
   */
  async upsertFoundationProgress({
    userId,
    sectionId,
    completed,
  }: {
    userId: string;
    sectionId: string;
    completed: boolean;
  }): Promise<FoundationProgress> {
    return prisma.foundationProgress.upsert({
      where: { userId_sectionId: { userId, sectionId } },
      update: { completed, completedAt: completed ? new Date() : null },
      create: { userId, sectionId, completed, completedAt: completed ? new Date() : null },
    });
  }

  /**
   * Update a phase gate record for a user.
   */
  async updatePhaseGate(userId: string, data: Prisma.PhaseGateUpdateInput): Promise<PhaseGate> {
    return prisma.phaseGate.update({
      where: { userId },
      data,
    });
  }

  // ── Radical Progress ─────────────────────────────────────────────────────

  /**
   * Find all radical progress records for a user.
   */
  async findRadicalProgressByUser(userId: string): Promise<RadicalProgress[]> {
    return prisma.radicalProgress.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });
  }

  /**
   * Find radical progress by user and radical ID (composite unique).
   */
  async findRadicalProgressByUserAndRadicalId(
    userId: string,
    radicalId: string,
  ): Promise<RadicalProgress | null> {
    return prisma.radicalProgress.findUnique({
      where: { userId_radicalId: { userId, radicalId } },
    });
  }

  /**
   * Upsert a radical progress record (create or update).
   */
  async upsertRadicalProgress({
    userId,
    radicalId,
    memorized,
    recognitionLevel,
  }: {
    userId: string;
    radicalId: string;
    memorized: boolean;
    recognitionLevel: number;
  }): Promise<RadicalProgress> {
    return prisma.radicalProgress.upsert({
      where: { userId_radicalId: { userId, radicalId } },
      update: { memorized, recognitionLevel, reviewedAt: new Date() },
      create: { userId, radicalId, memorized, recognitionLevel, reviewedAt: new Date() },
    });
  }
}
