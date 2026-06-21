/**
 * @file apps/backend/src/modules/progression/services/ProgressionService.js
 * @description Business logic for foundation progress and phase gate management
 * Stories: 18.1 (Foundations Page Structure)
 */

import { FOUNDATION_SECTIONS } from "@mandarin/shared-constants";

/**
 * ProgressionService
 * Manages foundation section progress and phase gate access control.
 *
 * SOLID: Single Responsibility - progression business logic only.
 */
export class ProgressionService {
  constructor(progressionRepository) {
    if (!progressionRepository) {
      throw new Error("ProgressionService requires progressionRepository");
    }
    this.progressionRepository = progressionRepository;
  }

  /**
   * Get or create foundation progress records for a user.
   * Auto-initializes 4 records (one per FOUNDATION_SECTIONS, completed=false) if none exist.
   *
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of foundation progress records
   */
  async getOrCreateFoundationProgress(userId) {
    let progress = await this.progressionRepository.findFoundationProgressByUser(userId);

    if (!progress || progress.length === 0) {
      // Auto-initialize records for each foundation section
      const created = [];
      for (const sectionId of FOUNDATION_SECTIONS) {
        const record = await this.progressionRepository.createFoundationProgress({
          userId,
          sectionId,
          completed: false,
        });
        created.push(record);
      }
      return created;
    }

    return progress;
  }

  /**
   * Get or create phase gate for a user.
   * Auto-creates with defaults if none exists.
   *
   * @param {string} userId - User ID
   * @returns {Promise<object>} Phase gate record
   */
  async getOrCreatePhaseGate(userId) {
    let phaseGate = await this.progressionRepository.findPhaseGateByUser(userId);

    if (!phaseGate) {
      phaseGate = await this.progressionRepository.createPhaseGate({
        userId,
        currentPhase: 1,
        phase1Passed: false,
        phase2Passed: false,
        phase3Passed: false,
        phase4Unlocked: false,
        gateCriteria: null,
      });
    }

    return phaseGate;
  }

  /**
   * Update phase gate progression based on quiz outcome.
   * Advances currentPhase when a phase is passed.
   * @param {string} userId
   * @param {object} params
   * @param {number} params.phase - Phase being evaluated
   * @param {boolean} params.passed - Whether the phase quiz was passed
   * @param {string} [params.gateCriteria] - Criteria type ("quiz" | "retention" | "both")
   * @returns {Promise<object>} Updated phase gate
   */
  async updatePhaseGate(userId, { phase, passed, gateCriteria }) {
    const updateData = { gateCriteria };
    if (phase === 1) {
      updateData.phase1Passed = passed;
      if (passed) updateData.currentPhase = 2;
    } else if (phase === 2) {
      updateData.phase2Passed = passed;
      if (passed) updateData.currentPhase = 3;
    } else if (phase === 3) {
      updateData.phase3Passed = passed;
      if (passed) updateData.currentPhase = 4;
    } else if (phase === 4) {
      updateData.phase4Unlocked = passed;
    }
    return this.progressionRepository.updatePhaseGate(userId, updateData);
  }

  /**
   * Mark a foundation section as completed.
   * Validates sectionId against FOUNDATION_SECTIONS.
   * @param {string} userId
   * @param {string} sectionId
   * @param {boolean} completed
   * @returns {Promise<object>}
   */
  async upsertFoundationProgress(userId, sectionId, completed) {
    if (!FOUNDATION_SECTIONS.includes(sectionId))
      throw new Error(`Invalid sectionId: ${sectionId}`);
    return this.progressionRepository.upsertFoundationProgress({ userId, sectionId, completed });
  }
}
