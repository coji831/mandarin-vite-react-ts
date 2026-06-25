/**
 * @file apps/backend/src/modules/progression/repositories/ProgressionRepository.js
 * @description Prisma-based data access for foundation progress and phase gate records
 * Stories: 18.1 (Foundations Page Structure)
 *
 * Clean Architecture: Infrastructure Layer - Data Access
 */

import { prisma } from "../../../shared/infrastructure/database/client.js";

export class ProgressionRepository {
  /**
   * Find all foundation progress records for a user.
   * @param {string} userId
   * @returns {Promise<Array>}
   */
  async findFoundationProgressByUser(userId) {
    return prisma.foundationProgress.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });
  }

  /**
   * Create a foundation progress record.
   * @param {object} params
   * @param {string} params.userId
   * @param {string} params.sectionId
   * @param {boolean} params.completed
   * @returns {Promise<object>}
   */
  async createFoundationProgress({ userId, sectionId, completed }) {
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
   * @param {string} userId
   * @returns {Promise<object|null>}
   */
  async findPhaseGateByUser(userId) {
    return prisma.phaseGate.findUnique({
      where: { userId },
    });
  }

  /**
   * Create a phase gate record.
   * @param {object} params
   * @param {string} params.userId
   * @param {number} params.currentPhase
   * @param {boolean} params.phase1Passed
   * @param {boolean} params.phase2Passed
   * @param {boolean} params.phase3Passed
   * @param {boolean} params.phase4Unlocked
   * @param {string|null} params.gateCriteria
   * @returns {Promise<object>}
   */
  async createPhaseGate({
    userId,
    currentPhase,
    phase1Passed,
    phase2Passed,
    phase3Passed,
    phase4Unlocked,
    gateCriteria,
  }) {
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
   * @param {object} params
   * @param {string} params.userId
   * @param {string} params.sectionId
   * @param {boolean} params.completed
   * @returns {Promise<object>}
   */
  async upsertFoundationProgress({ userId, sectionId, completed }) {
    return prisma.foundationProgress.upsert({
      where: { userId_sectionId: { userId, sectionId } },
      update: { completed, completedAt: completed ? new Date() : null },
      create: { userId, sectionId, completed, completedAt: completed ? new Date() : null },
    });
  }

  /**
   * Update a phase gate record for a user.
   * @param {string} userId
   * @param {object} data
   * @returns {Promise<object>}
   */
  async updatePhaseGate(userId, data) {
    return prisma.phaseGate.update({
      where: { userId },
      data,
    });
  }
}
