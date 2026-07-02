/**
 * @file apps/backend/src/modules/progression/services/ProgressionService.ts
 * @description Business logic for foundation progress and phase gate management
 * Stories: 18.1 (Foundations Page Structure)
 */

import type { FoundationProgress, RadicalProgress, PhaseGate } from "@prisma/client";
import { FOUNDATION_SECTIONS } from "@mandarin/shared-constants";
import fs from "fs";
import path from "path";
import { CONTENT_DIR } from "../../../shared/utils/contentUtils.js";

/**
 * Update phase gate parameters.
 */
interface PhaseGateUpdateParams {
  phase: number;
  passed: boolean;
  gateCriteria?: string;
}

/**
 * Radical progress upsert data.
 */
interface RadicalProgressData {
  memorized?: boolean;
  recognitionLevel?: number;
}

/**
 * Repository interface consumed by ProgressionService.
 */
interface IProgressionRepository {
  findFoundationProgressByUser(userId: string): Promise<FoundationProgress[]>;
  createFoundationProgress(data: {
    userId: string;
    sectionId: string;
    completed: boolean;
  }): Promise<FoundationProgress>;
  findPhaseGateByUser(userId: string): Promise<PhaseGate | null>;
  createPhaseGate(data: {
    userId: string;
    currentPhase: number;
    phase1Passed: boolean;
    phase2Passed: boolean;
    phase3Passed: boolean;
    phase4Unlocked: boolean;
    gateCriteria: string | null;
  }): Promise<PhaseGate>;
  updatePhaseGate(userId: string, data: Record<string, unknown>): Promise<PhaseGate>;
  upsertFoundationProgress(data: {
    userId: string;
    sectionId: string;
    completed: boolean;
  }): Promise<FoundationProgress>;
  findRadicalProgressByUser(userId: string): Promise<RadicalProgress[]>;
  findRadicalProgressByUserAndRadicalId(
    userId: string,
    radicalId: string,
  ): Promise<RadicalProgress | null>;
  upsertRadicalProgress(data: {
    userId: string;
    radicalId: string;
    memorized: boolean;
    recognitionLevel: number;
  }): Promise<RadicalProgress>;
}

/**
 * ProgressionService
 * Manages foundation section progress, phase gate access control, and radical progress.
 *
 * SOLID: Single Responsibility - progression business logic only.
 */
export class ProgressionService {
  private progressionRepository: IProgressionRepository;

  constructor(progressionRepository: IProgressionRepository) {
    if (!progressionRepository) {
      throw new Error("ProgressionService requires progressionRepository");
    }
    this.progressionRepository = progressionRepository;
  }

  /**
   * Get or create foundation progress records for a user.
   * Auto-initializes 4 records (one per FOUNDATION_SECTIONS, completed=false) if none exist.
   *
   * @param userId - User ID
   * @returns Array of foundation progress records
   */
  async getOrCreateFoundationProgress(userId: string): Promise<FoundationProgress[]> {
    const progress = await this.progressionRepository.findFoundationProgressByUser(userId);

    if (!progress || progress.length === 0) {
      // Auto-initialize records for each foundation section
      const created: FoundationProgress[] = [];
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
   * @param userId - User ID
   * @returns Phase gate record
   */
  async getOrCreatePhaseGate(userId: string): Promise<PhaseGate> {
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
   * @param userId
   * @param params.phase - Phase being evaluated
   * @param params.passed - Whether the phase quiz was passed
   * @param params.gateCriteria - Criteria type ("quiz" | "retention" | "both")
   * @returns Updated phase gate
   */
  async updatePhaseGate(
    userId: string,
    { phase, passed, gateCriteria }: PhaseGateUpdateParams,
  ): Promise<PhaseGate> {
    const updateData: Record<string, unknown> = { gateCriteria };
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
   * @param userId
   * @param sectionId
   * @param completed
   */
  async upsertFoundationProgress(
    userId: string,
    sectionId: string,
    completed: boolean,
  ): Promise<FoundationProgress> {
    if (!FOUNDATION_SECTIONS.includes(sectionId as (typeof FOUNDATION_SECTIONS)[number]))
      throw new Error(`Invalid sectionId: ${sectionId}`);
    return this.progressionRepository.upsertFoundationProgress({ userId, sectionId, completed });
  }

  // ── Radical Progress ─────────────────────────────────────────────────────

  /**
   * Get all radical progress records for a user.
   * @param userId
   */
  async getRadicalProgress(userId: string): Promise<RadicalProgress[]> {
    return this.progressionRepository.findRadicalProgressByUser(userId);
  }

  /**
   * Get radical progress for a specific radical by ID.
   * @param userId
   * @param radicalId
   */
  async getRadicalProgressById(userId: string, radicalId: string): Promise<RadicalProgress | null> {
    return this.progressionRepository.findRadicalProgressByUserAndRadicalId(userId, radicalId);
  }

  /**
   * Upsert a radical progress record.
   * Validates radicalId against content data, then upserts.
   *
   * @param userId
   * @param radicalId - e.g. "rad_0001"
   * @param data
   */
  async upsertRadicalProgress(
    userId: string,
    radicalId: string,
    { memorized = false, recognitionLevel = 0 }: RadicalProgressData,
  ): Promise<RadicalProgress> {
    // Validate radicalId exists in content data
    const radicalPath = path.join(CONTENT_DIR, "radicals", `${radicalId}.json`);
    if (!fs.existsSync(radicalPath)) {
      throw new Error(`Invalid radicalId: ${radicalId}`);
    }

    const record = await this.progressionRepository.upsertRadicalProgress({
      userId,
      radicalId,
      memorized,
      recognitionLevel,
    });

    return record;
  }
}
